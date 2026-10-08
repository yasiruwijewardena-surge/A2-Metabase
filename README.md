# Metabase.com replica — Astro + Strapi

L1 → L2 promotion assignment 2. A content-driven replication of
[metabase.com](https://www.metabase.com), with the content modelled in Strapi
and the front end built in Astro.

| | |
|---|---|
| **Replicating** | https://www.metabase.com (open-source BI platform) |
| **CMS** | Strapi 5 → Railway, with Postgres |
| **Front end** | Astro → Railway |
| **Live CMS** | https://a2-metabase-production.up.railway.app/admin |
| **Live site** | https://a2-metabase.up.railway.app |

## Repository layout

```
.
├── apps/
│   ├── cms/              Strapi 5 — content model, admin, REST API
│   │   └── seed/         Idempotent seeder + the pipeline that produced its data
│   │       └── assets/   Images the seed uploads that have no source URL
│   └── web/              Astro front end — 310 static routes
│       ├── src/components/demos/   The homepage's interactive islands
│       ├── src/lib/      Strapi client, Cloudinary helpers
│       └── src/styles/   Design tokens and component layers
├── SITE-ANALYSIS.md      Analysis of the original: stack, IA, content model,
│                         user journeys, PageSpeed baseline, improvements
├── DEPLOYMENT.md         Railway runbook for both services
├── psi-baseline.json     Measured PSI scores for the original
└── psi-results.json      The same pages on this replica, for comparison
```

## Getting started

```bash
# CMS
cd apps/cms
cp .env.example .env      # fill in the secrets
npm install
npm run develop           # http://localhost:1337/admin
npm run seed              # content: taxonomies, posts, case studies, testimonials

# Front end, in a second shell
cd apps/web
cp .env.example .env      # STRAPI_URL, SITE_URL
npm install
npm run dev               # http://localhost:4321
```

The front end reads Strapi at build time and emits static HTML, so the CMS has
to be reachable when `npm run build` runs — there is no runtime dependency on
it afterwards.

See [`apps/cms/README.md`](apps/cms/README.md) for the full content model and
[`DEPLOYMENT.md`](DEPLOYMENT.md) for the Railway runbook.

## Why this site

Metabase is a good replication target for a headless build: it has a real blog
with categories, a customer-stories section that already filters on two
dimensions (use case × industry), testimonials in two distinct shapes, and a
glossary — which maps cleanly onto the assignment's requirements for blogs,
filters and testimonials.

It is also, usefully, **already built in Astro**. Replicating it in Astro means
the static-first, islands-light architecture the assignment asks for is the
natural way to build it.

## How the design was matched

Screenshots are not good enough to replicate a layout from — they show that
something is off without saying what. Every section here was built by reading
computed styles off metabase.com with devtools and diffing them against the
same selectors on this build, until the numbers agreed:

```js
getComputedStyle(el)   // font size, line height, weight, tracking, colour,
el.getBoundingClientRect()   // margins, padding, radius, border, gap, measured box
```

That is how the panels, cards and grids here end up on the original's exact
figures — the hero product panel at 1264×684, the BI panels' 5-of-12 and
7-of-12 columns, the blog post's 322/644/620 measure, the footer's
150/204/160/150/167 columns. It also caught things a screenshot never would:
the hero h1 tracks at -0.04em and nothing else on the site does; the section
standfirsts carry an inline `max-width: 840px` that never binds because they
sit in an 8-of-12 column and actually render 692 wide.

Where the original fails WCAG AA, this build steps one stop down the same
colour ramp rather than copying the failure — the tertiary ink, the category
pills, the panel CTAs. Each departure is commented at the rule. The one
exception is the brand CTA button: white on `#509ee3` is 2.86:1, and that is
Metabase's own brand colour on their most prominent control, so it stays.

## Content model

The brief asks for the design to match the original, so the judgement is shown
in the content model rather than the visuals. `SITE-ANALYSIS.md` §6 documents
nine specific places where the original's model can be improved without
changing how a page looks. The ones acted on so far:

- **Industry is a relation, not free text.** The original has 17 free-text
  industry strings with near-duplicates (`Financial Services` vs
  `Banking & Finance`) and one value that isn't an industry at all
  (`Transport Management System`). Measured against their real 44 case studies,
  **11 of those 17 buttons return exactly one result**. Mapped to a curated
  8-value vocabulary attached to `company`, only one does.
- **Testimonials are one entity, not duplicated content.** The original renders
  the same quotes in three shapes across the homepage, case studies and
  `/love`, with nothing linking them. Here one `testimonial` type with a
  `variant` discriminator covers all three.
- **Category and tag are separate.** The original's single free-text category
  caps the blog at one filter dimension. Both are filterable here:
  `/blog/category/[slug]` and `/blog/tag/[slug]`. The original has neither —
  its pills toggle DOM visibility with no URL change — so these are real
  routes on purpose, because a filtered view that is shareable and indexable
  beats one that is neither. Tags sit in the sidebar rather than the header,
  which was measured against the original and is left as it was.
- **SEO metadata is separate from the card excerpt.** The original reuses one
  `description` field for the listing card, the meta description and
  `og:description`.
- **Outcomes are structured.** A `shared.metric` component surfaces the numbers
  the original buries in prose.

## What an editor controls

Nothing about the site's chrome is in the code any more. Each of these falls
back to what the site shipped with, so an empty database still renders.

| Entry | Holds |
|---|---|
| **Navigation** | the logo, all four menus, both header buttons, the GitHub link and its star count |
| **Footer** | the logo, six link columns, the social links, the small print |
| **Site Settings** | site name, favicon, default meta description, default share image, scripts injected into every page |
| **Icon Library** | 58 SVGs across five sets — upload one and it appears in the picker |

The header and the foot are separate entries rather than one Site Settings
form: they are separate jobs, and publishing one should not rebuild the other.

Icons were four hardcoded maps across four components. They are now uploads,
grouped into sets because the same word means different artwork in different
places — `cloud` is a cloud in the menus and a cube on a product pillar. A nav
link picks one from a list rather than an editor typing a key nobody has
written down.

Uploaded SVG is cleaned before it is stored: script, `foreignObject`, `on*`
handlers and `javascript:` URLs are stripped by the CMS, and again by the front
end before the markup is inlined. One guards the file, the other the page, and
neither depends on the other being right. Draw with `currentColor` on the paths
— the component supplies the root `<svg>`, so artwork carrying its colour there
renders invisible.

Publishing triggers a rebuild on its own. The trigger listens for publish,
unpublish and delete rather than every write, so a draft autosave costs
nothing.

## The navigation

The original's information architecture is part of what is being replicated, so
the nav and footer carry its full link set. What is built:

| Section | Routes |
|---|---|
| Home | `/` |
| Blog | listing, posts, by category, by tag, by author |
| Case studies | listing, studies, by industry, by use case, use case × industry |
| Events | `/events` — upcoming, recordings, filterable by series |
| Testimonials | `/love` |
| Glossary | `/glossary` — 176 terms |
| Pricing | `/pricing` |
| Product | business intelligence, embedded analytics, data studio |
| Features | index, Metabase AI, models, semantic layer, data segregation |
| Roadmap | `/roadmap` |

The remaining 75 paths resolve to a page that says it is part of the replicated
navigation and not part of this build, and links to what is.

A 404 would have said the build was broken and an invented page would have said
it was complete. `npm run audit:links` regenerates that list from `dist/`, and
`--check` fails if it has drifted.

## Pricing, without JavaScript

`/pricing` has three independent axes: use case, deployment and billing period.
The original holds them as data attributes on `<main>` and flips them with
JavaScript. Here they are radio inputs and the filtering is `:has()`, so the
page works with JavaScript off, ships nothing for the interaction, and keeps the
browser's own keyboard and screen-reader handling of a radio group.

One exception, and it is small. The header links here with `?use_case=bi` and
`?use_case=ea`, and a URL cannot reach a radio on its own — without a few lines
of script both Pricing menu items landed on whichever tab came first, showing
the same page twice. The script selects the tab on arrival and rewrites the URL
when someone switches, so a copied address is still true. Everything else on
the page still works with JavaScript off.

The content model follows from the same observation: a plan declares which
deployments and use cases it belongs to, so five records cover a matrix that
would otherwise need twenty near-duplicates. Use cases are the relation the case
studies already filter on, not a second copy of the same vocabulary.

## Browser support

Filtering across this build — pricing, case studies, events, the blog
categories, the FAQ accordions — is done with `:has()` over radio and checkbox
inputs rather than JavaScript. There are 64 such rules and **no `@supports`
fallback**, which is a deliberate choice, not an oversight:

- `:has()` is in every current browser — Chrome 105+, Safari 15.4+, Firefox 121+.
- A fallback would mean shipping the JavaScript the approach exists to avoid,
  for browsers that are themselves two or more years out of support.
- The failure mode is benign and not a blank page. The inputs are real form
  controls, so without `:has()` every item simply stays visible: the listing
  still renders in full and every link still works. The filter stops narrowing;
  nothing disappears.

Exercised in Chrome 155 — every filter on the site driven through a headless
browser and asserted on rendered geometry, not on the stylesheet. `:has()` has
been Baseline since December 2023, so Safari 26 and current Firefox are covered
by support tables rather than by a run here; the degradation above is what
bounds the risk either way.

## Performance

Measured with the PageSpeed Insights API against the deployed site, 2026-10-08,
each page in both strategies. Each cell is *original → this replica*.

| Page | Mobile | Desktop | LCP (mobile) | CLS | TBT |
|---|---|---|---|---|---|
| `/` | 54 → **96** | 73 → **100** | 2.1 s | 0 | 10 ms |
| `/pricing` | 80 → **100** | 74 → **100** | 1.8 s | 0 | 0 ms |
| `/blog` | 47 → **98** | 80 → **100** | 2.0 s | 0 | 0 ms |
| `/case-studies` | 58 → **99** | 65 → **100** | 2.0 s | 0 | 0 ms |
| `/events` | 68 → **99** | 79 → **100** | 2.0 s | 0 | 0 ms |
| `/glossary` | 45 → **99** | 86 → **100** | 2.1 s | 0 | 0 ms |
| `/product/business-intelligence` | 44 → **92** | 56 → **100** | 3.3 s | 0 | 0 ms |
| `/features/metabase-ai` | 44 → **98** | 86 → **100** | 2.3 s | 0 | 0 ms |
| `/roadmap` | 49 → **100** | 86 → **100** | 1.8 s | 0 | 0 ms |

Desktop is **100 on all nine**. Mobile ranges 92–100. Accessibility is 94–96,
Best Practices and SEO are 100 everywhere. CLS is 0 on every page and total
blocking time is 0 on all but the homepage (10 ms).

The brief asks for 90+ desktop and 80+ mobile. Raw numbers are in
`psi-results.json`; the original's baseline and the reasoning are in
`SITE-ANALYSIS.md` §2.

The gap is not cleverness. The original carries 78% of its homepage payload as
third-party script — 679 KB of Google Tag Manager across five containers, plus
Hotjar and five ad pixels — lazy-loads its own LCP image, and ships images
without dimensions. Its mobile LCP reaches 52.5 s on `/features/metabase-ai`
and 21.7 s on `/product/business-intelligence`. This replica ships no
third-party JavaScript, 23 KB of CSS over the wire, and preloads the LCP image
with a matching `imagesrcset`.

Three things were added after the first round of measurements, each verified
rather than assumed:

- **HTML is cached at the edge.** Railway's CDN serves it with
  `s-maxage=600, stale-while-revalidate=86400`; a deploy purges it, so publish
  → live is unchanged. TTFB went from ~0.32 s to ~0.16 s.
- **Cloudinary is preconnected.** Every image is delivered from there, and the
  first request paid a full DNS, TCP and TLS handshake. On `/events`, which has
  no LCP preload to absorb it, the first image's TTFB went from 579 ms to 70 ms.
- **Postgres was moved into the CMS's region.** Each query had been crossing
  regions at ~200 ms a round trip, which is what made publishing a page take
  91 seconds. It is now ~1 s, and the site build dropped from 161 s to 98 s.

## Status

- [x] Analyse the original — stack, IA, content model, user journeys
- [x] Measure the PageSpeed baseline
- [x] Scaffold Strapi and define the content model
- [x] Deploy Strapi + Postgres to Railway
- [x] Seed content (`npm run seed`, idempotent — safe to re-run)
- [x] Scaffold Astro with the design tokens
- [x] Build the pages (309 static routes)
- [x] Deploy the front end
- [x] Match the homepage, blog and case studies against measured values
- [x] Build `/pricing` and model its plans in Strapi
- [x] Give the rest of the replicated navigation somewhere to land
- [x] Glossary — 176 terms against the original's 166
- [x] Build the product and feature pages against measured values
- [x] Model events in Strapi and build `/events` with its series filter
- [x] Move the header, footer, icons and site-wide metadata into the CMS
- [x] Rebuild the site automatically when content is published
- [x] Record PageSpeed against the deployed site — 9 pages, both strategies

Known gaps, in the order they are worth closing:

- [ ] `/pricing` carries a use-case tab row the original does not have — it
      switches through the header links alone. Ours is a superset rather than a
      mismatch, and it is the one place the replica adds a control. Worth a
      decision if strict URL-for-URL fidelity matters.
- [ ] `/features/models` and `/features/semantic-layer` are real pages here and
      301 on the original.
- [ ] The bespoke middles of the marketing pages — a tabbed panel, a support
      marquee, a comparison table — are still in the Astro components. Their
      heroes and closing CTAs are in Strapi, and Business Intelligence is
      modelled end to end. Each of those middles is one-of-one, so a component
      apiece would clutter the admin for no reuse.
- [ ] 75 of the replicated navigation's paths have no page behind them.
- [ ] 26 blog authors have no search metadata of their own. They carry a bio,
      which the page uses, so the fallback is real content rather than a
      generated string.
