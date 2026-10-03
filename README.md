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
| **Live site** | https://elegant-spontaneity-production-28e1.up.railway.app |

## Repository layout

```
.
├── apps/
│   ├── cms/              Strapi 5 — content model, admin, REST API
│   │   └── seed/         Idempotent seeder + the pipeline that produced its data
│   │       └── assets/   Images the seed uploads that have no source URL
│   └── web/              Astro front end — 299 static routes
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
  caps the blog at one filter dimension.
- **SEO metadata is separate from the card excerpt.** The original reuses one
  `description` field for the listing card, the meta description and
  `og:description`.
- **Outcomes are structured.** A `shared.metric` component surfaces the numbers
  the original buries in prose.

## The navigation

The original's information architecture is part of what is being replicated, so
the nav and footer carry its full link set. What is built:

| Section | Routes |
|---|---|
| Home | `/` |
| Blog | listing, posts, by category, by author |
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

Tested in current Chrome, Firefox and Safari.

## Performance

Measured with the PageSpeed Insights API, same pages, same day.

| Page | Mobile | Desktop | LCP (mobile) | CLS | TBT |
|---|---|---|---|---|---|
| `/` | 50 → **98** | 64 → **100** | 1.6 s | 0 | 0 ms |
| `/pricing` | 56 → **100** | 98 → **100** | 1.4 s | 0 | 0 ms |
| `/blog` | 44 → **98** | 66 → **100** | 1.8 s | 0 | 0 ms |
| `/case-studies` | 56 → **98** | 88 → **100** | 1.9 s | 0 | 0 ms |
| `/glossary` | 49 → **100** | 80 → **100** | 1.4 s | 0 | 0 ms |
| `/product/business-intelligence` | 48 → **98** | 92 → **100** | 1.8 s | 0 | 0 ms |
| `/features/metabase-ai` | 55 → **98** | 46 → **100** | 1.8 s | 0 | 0 ms |
| `/roadmap` | 64 → **100** | 73 → **100** | 1.4 s | 0 | 0 ms |

Eight pages, both strategies, measured the same day (2026-10-03). Each cell is
*original → this replica*. Desktop is 100 on all eight; mobile is 98-100.
Accessibility is 95-97, Best Practices and SEO 100. CLS is 0 and total blocking
time 0 ms on every page.

The brief asks for 90+ desktop and 80+ mobile. Raw numbers in
`psi-results.json`, the original's baseline and the reasoning in
`SITE-ANALYSIS.md` §2.

The gap is not cleverness. The original carries 78% of its homepage payload as
third-party script — 679 KB of Google Tag Manager across five containers, plus
Hotjar and five ad pixels — lazy-loads its own LCP image, and ships images
without dimensions. This replica ships no third-party JavaScript at all, no
external JavaScript files of any kind, 28 KB of CSS, and preloads the LCP image
with a matching `imagesrcset`.

## Status

- [x] Analyse the original — stack, IA, content model, user journeys
- [x] Measure the PageSpeed baseline
- [x] Scaffold Strapi and define the content model
- [x] Deploy Strapi + Postgres to Railway
- [x] Seed content (`npm run seed`, idempotent — safe to re-run)
- [x] Scaffold Astro with the design tokens
- [x] Build the pages (299 static routes)
- [x] Deploy the front end
- [x] Optimise and record PageSpeed results — 8 pages, both strategies
- [x] Match the homepage, blog and case studies against measured values
- [x] Build `/pricing` and model its plans in Strapi
- [x] Give the rest of the replicated navigation somewhere to land
- [x] Glossary — 176 terms against the original's 166
- [x] Build the product and feature pages against measured values
- [x] Model events in Strapi and build `/events` with its series filter

Known gaps, in the order they are worth closing:

- [ ] `tag` is modelled with 11 records and a relation to `post`, but there is
      no `/blog/tag/[slug]` route, so it cannot be filtered on. Either build the
      route or drop the field — a relation nothing can reach reads as unfinished.
- [ ] Marketing copy on the product, features and roadmap pages is held in the
      Astro components rather than Strapi. The brief requires the blog, filters
      and testimonials to be CMS-driven and those are; this is the next step up
      in content modelling, not an unmet requirement.
- [ ] 75 of the replicated navigation's paths have no page behind them.
