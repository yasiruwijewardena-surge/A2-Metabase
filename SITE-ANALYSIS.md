# Metabase.com — Site Analysis

Reference for Assignment 2 (Astro + Strapi replication). Covers the original's stack,
information architecture, content model, user journeys, and the places where the content
model can be improved without changing the design.

Analysed: 30 Sep 2026, against the live site. Includes measured PageSpeed Insights
baselines (§2).

---

## 1. The original's stack

The single most useful finding: **metabase.com is already built with Astro.**

| Evidence | Detail |
|---|---|
| `/_astro/global.BGsGu-Iy.css`, `/_astro/Navbar.DPqDoE2Z.css` | Astro's hashed asset pipeline |
| Tailwind v4 tokens (`oklch()`, `--color-*`, `@theme`-style vars) | 162 CSS custom properties in `global.css` |
| `data-filter` / `data-industry-filter` buttons + vanilla JS | Filtering is plain DOM show/hide, no framework |
| `/love` uses Bootstrap + Masonry + List.js from cdnjs | Legacy pages not yet migrated |

So the site is **mid-migration**: newer pages are Astro + Tailwind (`class="page-scope tw-scope"`),
older pages are still Bootstrap 5 + jQuery-era plugins (`class="bootstrap"`). Both shapes are
live simultaneously.

This is good news for us — replicating an Astro site in Astro means the static-first,
islands-light architecture the assignment asks for is the *natural* way to build it, not a
compromise.

### Design tokens (lifted from `global.css`)

```
Brand
  --base-color-blue-60   #509EE3   brand
  --base-color-blue-40   #1C6BB0   brand hover / link
  --base-color-blue-25   #12436E   brand strong
  --base-color-blue-95   #E4ECFB   brand muted
  --base-color-blue-105  #FAFBFE   brand faint (page bg gradient)

Neutrals
  --base-color-neutral-15  #22242B  text primary
  --base-color-neutral-40  #5A6072  text secondary
  --base-color-neutral-60  #8D93A5  text tertiary
  --base-color-neutral-80  #C6C9D2  text faint
  --base-color-neutral-90  #E2E4E9
  --base-color-neutral-95  #F1F2F4
  --base-color-neutral-99  #FCFCFD

Success  #80B946 / faint #F5F9F0 / strong #236D00

Type
  --font-lato          lato, "Helvetica Neue", helvetica, sans-serif   (UI/body)
  --font-merriweather  merriweather, georgia, serif                    (editorial)
  --font-roboto-mono   "Roboto Mono", monospace                        (code)
  weights: 400 / 500 / 600 / 700 / 900 (headings use 900 "black")

Radii  sm .25 / md .375 / lg .5 / xl .75 / 2xl 1 / 3xl 1.5 rem
```

Copy these verbatim into our Tailwind theme. Matching the palette and the Lato/Merriweather
pairing gets ~70% of the "looks like the original" impression for almost no effort.

---

## 2. Measured baseline — PageSpeed Insights

> This section is the **baseline**, taken before any of the replica existed, and
> is kept at its original date deliberately — it is what the comparison is
> against. The original was re-measured on 8 Oct 2026 alongside the finished
> replica; those figures, and the replica's own, are in `psi-results.json` and
> summarised in the README. The original's mobile scores had drifted further
> down by then (44–80 across the nine pages), so the gap below is, if anything,
> conservative.

Run 30 Sep 2026 via the PSI API v5. Lab = Lighthouse on throttled emulated mobile /
desktop; Field = real Chrome user data (CrUX, 28-day p75).

### Scores

| Page | Strategy | Perf | A11y | Best Prac. | SEO |
|---|---|---:|---:|---:|---:|
| `/` | mobile | **56** | 95 | 92 | 100 |
| `/` | desktop | **81** | 92 | 92 | 100 |
| `/blog` | mobile | **47** | 86 | 96 | 92 |
| `/case-studies` | mobile | **56** | 96 | 96 | 100 |
| `/love` | mobile | **55** | 92 | 96 | 100 |

### Lab vs field — read this before drawing conclusions

| Page | Lab LCP (mobile) | Field LCP | Field INP | Field CLS | Field verdict |
|---|---:|---:|---:|---:|---|
| `/` | 14.7 s | 2.29 s | 138 ms | 0.00 | AVERAGE |
| `/blog` | 16.4 s | 2.13 s | 137 ms | 0.00 | AVERAGE |
| `/case-studies` | 15.3 s | 2.13 s | 137 ms | 0.00 | AVERAGE |
| `/love` | 19.0 s | 2.13 s | 137 ms | 0.00 | AVERAGE |

The gap is enormous and it matters for us. Real users get a fast site — Core Web Vitals
are all in the good range, and the only reason the field verdict isn't FAST is FCP
(2.07–2.33 s, "average"). Lighthouse's throttled mobile emulation, though, drags LCP to
14–19 s because it forces the whole third-party analytics payload through a simulated
slow connection before the page settles.

**The brief grades us on the lab score** (§4.2.3: "We will run Google PageSpeed Insights
on your deployed site"), so the lab column is the bar we have to clear — and it's the
column where the original does badly. That's good news: hitting 90+/80+ isn't about
out-engineering Metabase, it's about not importing their tag stack.

### Why the lab scores are what they are

**78% of the homepage payload is third-party.** 148 requests across **35 distinct
origins**; 334 KB first-party vs **1,167 KB third-party**.

| Origin | Homepage weight | Requests |
|---|---:|---:|
| `googletagmanager.com` | **679 KB** | 5 |
| `www.metabase.com` | 195 KB | 36 |
| `fonts.gstatic.com` | 115 KB | 8 |
| `cdn.metabase.com` | 113 KB | 29 |
| `dka575ofm4ao0.cloudfront.net` (StatusPage) | 104 KB | 6 |
| `script.hotjar.com` | 57 KB | 1 |
| + 29 more | | |

Those 679 KB are **five separate Google tag containers** (`GTM-KHLBGV9`,
`GTM-PVKWSPWD`, `G-KX5S0VDFVE`, `AW-10819137912`, plus a gtag loader), of which
Lighthouse reports ~270 KB unused. Also present: Hotjar, Reddit pixel, LinkedIn Insight
(`snap.licdn.com`), Bing UET (`bat.bing.com`), DoubleClick, Sentry, video.js, geojs.io,
jsdelivr, cdnjs, unpkg.

Recurring diagnostics across all four pages: "Reduce unused JavaScript ~330 KiB",
"Render-blocking requests ~1.5–2.4 s", "Legacy JavaScript", "Use efficient cache
lifetimes", "Image elements do not have explicit width and height".

### Three concrete first-party defects (these are ours to beat)

**1. The blog's LCP image is lazy-loaded.** The largest element on `/blog` is the first
post card's hero image, and it ships as:

```html
<img class="mb-8 w-full rounded-md"
     src="https://cdn.metabase.com/images/posts/august-2026-vulnerability-what-happened.webp"
     alt="…" loading="lazy">
```

No `preload`, no `fetchpriority="high"`, and `loading="lazy"` on the LCP element itself —
the page contains zero `rel="preload"` and zero `fetchpriority` attributes. PSI's
`lcp-discovery-insight` scores this **0/1** and attributes **1,394 ms of "resource load
delay"** to it. The file is **410 KB**. This is the single clearest own-goal on the site.

**2. `/love` ships 1.8 MB of avatars.** 86 requests to `cdn.metabase.com` totalling
**1,817 KB**, to fill 36×36 slots:

```html
<img class="circle me-3" src="…/maria-grazia-longu.jpg"
     srcset="…/maria-grazia-longu.jpg 1x" width="36" height="36">
```

The `srcset` offers `1x` pointing at the same file — so there are no responsive variants
at all. `abdulazeez.jpeg` is **42 KB for a 36×36 render**; ~2 KB would do. Multiply by 79
cards. (Note the `width`/`height` *are* set here, which is why `/love` holds CLS at 0.)

**3. `/blog` is the only page with real CLS — 0.122.** Its card images have no `width`/
`height`, unlike `/love`'s. Cheap to fix, and it's the one page where the original fails
a Core Web Vital in the lab.

### What this sets as our target

We're building the same pages without a tag manager, with Astro's `<Image>` doing
responsive variants, with the hero image preloaded rather than lazied, and with
dimensions on everything. 90+ desktop / 80+ mobile should be comfortably reachable —
and the README gets a genuinely interesting comparison: *same design, same content
shape, a fraction of the payload, because the content model and the asset pipeline were
built for it.*

Raw PSI JSON for all five runs is in the scratchpad; `psi-baseline.json` in this folder
holds the summary for later before/after comparison.

---

## 3. Information architecture

1,432 URLs in the marketing sitemap (plus a separate docs sitemap). By section:

| Section | Pages | Nature |
|---|---|---|
| `/integrations/*` | 261 | Programmatic SEO — one page per third-party tool |
| `/dashboards/*` | 177 | Programmatic SEO — dashboard templates |
| `/glossary/*` | 167 | Editorial — BI term definitions |
| `/metrics/*` | 155 | Programmatic SEO — one page per business metric |
| `/blog/*` | 137 | Editorial |
| `/learn/*` | 132 | Editorial — courses & tutorials, nested |
| `/releases/*` | 52 | Generated from release notes |
| `/community-posts/*` | 51 | Guest/community editorial |
| `/events/*` | 48 | Events, upcoming + on-demand |
| `/partners/*` | 45 | Directory |
| `/case-studies/*` | 45 | Editorial — customer stories |
| `/data-sources/*` | 30 | Programmatic — one per database |
| `/analytics/*` | 20 | Use-case landing pages |
| `/product/*`, `/features/*` | 29 | Product marketing |
| singles | ~30 | pricing, security, jobs, love, demo, roadmap… |

**Scoping note.** We obviously don't replicate 1,432 pages. The ~620 programmatic pages
(integrations / dashboards / metrics / data-sources) are all one template each — worth
replicating *one* of them to show the pattern, not the whole set.

### Navigation IA (from the header)

```
Product
  ├ Business Intelligence · Embedded Analytics          (two product pillars)
  ├ Platform: Data Sources · Security · Cloud · Demo
  └ Features: Metabase AI · Data Studio (New) · Dashboards and reporting ·
              Query builder · Data segregation · Usage analytics ·
              Embedded analytics SDK · White-label analytics · Drill-through ·
              SQL editor · Permissions · CSV upload
  └ What's new · Roadmap
Docs
  ├ Documentation · Learn
  ├ Getting Started · Querying and Dashboards · Embedding · Administration
  └ Guides: Installing · Adding a database · Asking questions ·
            Creating a dashboard · Solving common problems
Resources
  ├ Blog · Events · Customers · Discussion · Professional Services · Metabase Experts
  └ Recent Blog Posts  (live, 5 latest — a content-driven megamenu)
Pricing
  └ BI pricing · Embedded Analytics pricing
[GitHub star count: 49.5k] · Log in · Get started
```

The footer carries a second, flatter IA: Product / Pricing / Use cases / Metabase plans /
Features / Company / Support / Resources / **Comparisons** (vs Tableau, Looker, Looker Studio,
PowerBI, Superset, Omni).

Two things worth copying: the **live "Recent Blog Posts" column inside the megamenu** (a nice
CMS-driven touch) and the **GitHub star count** in the nav.

---

## 4. Content model (as it exists today)

### 4.1 Blog post — `/blog/[slug]`

| Field | Example | Notes |
|---|---|---|
| title | "Avoiding analyst burnout: how to streamline ad hoc requests" | |
| slug | `ad-hoc-analysis-tips` | often differs from the title |
| description | used as excerpt + meta description + `og:description` | one field, three jobs |
| coverImage | `cdn.metabase.com/images/posts/*.webp` | 16:9 |
| datePublished / dateModified | `2022-02-01` | both present in JSON-LD |
| category | "Analytics and BI" | **single value**, free-text string |
| author | name + avatar + `/blog/authors/[slug]` | half-modeled (see §5) |
| readTime | "5 min read" | computed from body |
| body | rich text, H2 sections, inline links, images | |
| related | "You might also enjoy" — 2 posts | |

Categories (exactly 6): `News`, `Engineering`, `Analytics and BI`, `Product`,
`Data explorations`, `Using Metabase`.

**Listing layout** (`/blog`): H1 + category pills on one row → 3 large featured cards
(image, `date in Category`, title, excerpt, author avatar + name, read time) → "Previous posts",
a compact list **grouped by year** (title, `date in Category`, read time, no image).

### 4.2 Case study — `/case-studies/[slug]`

The richest type on the site, and the one that matters most for us.

| Field | Example (Alto) |
|---|---|
| headline | "Alto uses Metabase for easy and effective company-wide data analysis." |
| company.name / .logo / .description | "Alto is an investment platform that…" |
| industry | "Financial Services" |
| employees | "50+" |
| headquarters | "Nashville, The United States" |
| keyUseCases | "Business Intelligence" |
| challenge | "The Challenge: …" |
| solution | "The Solution: …" |
| results | "The Results: …" |
| pullQuote | quote + person name + role + company → **this is a testimonial** |
| body | rich text: Why Metabase? / The data / How the team uses it / The results |
| related | "Explore more customer stories" — 5 cards |

**Listing layout** (`/case-studies`): centered H1 + intro → a bordered panel containing a
3-up segmented control (`All` / `Business Intelligence` / `Embedded Analytics`) that overlaps
the panel's top border → a wrapped row of industry pills → card grid.

This is **already a two-dimension filter**, which is exactly what §4.2 of the brief requires.
Markup is good: `role="group"`, `aria-label="Filter by use case"`, `aria-pressed` toggled per
button.

Industries (17, as literal strings): Education, Financial Services, Venture Capital,
B2B Software / Financial Technology, IT & Software, B2B SaaS, Developer Tools, Manufacturing,
Healthcare, Logistics & Transportation, Nonprofit, Travel & Hospitality, eCommerce,
Banking & Finance, Transport Management System, Retail, Internet of Things.

### 4.3 Testimonials — two distinct shapes

**(a) Pull quote** — inline in homepage product sections and inside case studies:
> quote · person name · role, company

e.g. *Peer Richelsen, Co-founder, Cal.com* / *Derrick Mar, CTO, Pathrise* /
*Dave Holmes-Kinsella, Head of Data Science, Synctera*

**(b) Social wall** — `/love`, plus a condensed strip on the homepage
("Analytics that people straight up love"):
> avatar · name · company-or-handle · short quote

79 cards in a masonry grid, Bootstrap + Masonry.js + List.js, with a confetti "love button"
that increments a counter.

These are the same underlying thing rendered two ways — see §6.2.

### 4.4 Glossary term — `/glossary/[slug]`

`term`, `definition` (1–2 paragraphs), `letter` (derived). Listing = search box
(`type="search"`, "Search the glossary") + A–Z jump nav + all 166 terms rendered inline,
grouped by letter. Client-side search only.

### 4.5 Event — `/events/[slug]`

`title`, `description`, `series`, `date`, `location`, `type` (live / on-demand),
`recordingUrl`, `registerUrl`. Listing splits **Upcoming** (with a genuine empty state —
"Oh, it seems like there are no upcoming events") from **Watch now** (on-demand), with a
"Pick a series" filter: AI Week, practitioner stories, real-world conversations, release
updates, hands-on sessions, workshops, integrations, code-alongs, meetups, conference.

### 4.6 Programmatic pages — `/metrics/[slug]` (representative)

Heavily structured, with a sticky "On this page" TOC:
`Example → What it measures → Data needed → SQL patterns → Pitfalls → Where it applies →
Related → FAQ`, plus a `Metric · Marketing` category eyebrow, a TL;DR callout, an illustrative
chart, and an FAQ block (almost certainly for FAQ schema).

`/integrations/*`, `/dashboards/*`, `/data-sources/*` follow the same idea with different
section sets.

---

## 5. User journeys

**J1 — Evaluator (primary).** Home → hero "Try Metabase Cloud free" / "Deploy Open Source"
→ the split at "Business Intelligence" vs "Embedded Analytics" recurs everywhere (nav, pricing,
case-study filter) → feature page → pricing → trial. The whole site is organised around this
one fork; get it right and the replication reads as faithful.

**J2 — Trust-building.** Home → pull quotes inline in product sections → "Trusted by 100,000+
companies" → `/love` social wall → `/case-studies` → filter by *my* industry → read a story →
related stories. This is the journey the assignment's testimonials + filters requirements sit in.

**J3 — Organic → content → product.** Search lands on `/glossary/*`, `/metrics/*`, or
`/blog/*` → in-content links to product features → CTA. Every content page carries a sidebar
or inline "Try Metabase free" card.

**J4 — Learning / retention.** `/learn` nested courses → tutorials → docs. Mostly out of scope
for us.

**J5 — Blog reader.** `/blog` → category pill → post → author link → author archive → related
posts → newsletter subscribe.

For the replica, **J1, J2 and J5 are the ones to build end to end.** They cover every
requirement in §4.2 of the brief (blog, filters, testimonials) and they're where a reviewer
will actually click.

---

## 6. Improvement opportunities

The brief says the *design* must match, which leaves the content model as the place to show
judgement. Each of these keeps the visual output identical (or nearly) while making the model
better. Ordered by how much they're worth talking about in the README.

### 6.1 The industry taxonomy is uncontrolled free text — collapse it into a relation

17 industry strings, several of which are the same concept spelled differently:

- `Financial Services` vs `Banking & Finance` vs `B2B Software / Financial Technology`
- `IT & Software` vs `B2B SaaS` vs `Developer Tools`
- `Logistics & Transportation` vs `Transport Management System`

`Transport Management System` isn't an industry at all — it's a product category, and it
exists as a filter button because someone typed it into a free-text field. The result is a
pill row with 17 buttons where several return a single result.

**Fix:** `industry` becomes a Strapi collection type (`name`, `slug`, `description`) with a
many-to-one relation from `case-study`. Curate to ~8: Financial Services, SaaS & Developer
Tools, Education, Healthcare, eCommerce & Retail, Logistics & Transport, Manufacturing,
Nonprofit. Render the pills from the industry collection with result counts
(`Healthcare (3)`), and hide any industry with zero published stories. Same design, a filter
row that's actually navigable, and editors can no longer invent a new industry by typo.

### 6.2 Testimonials are duplicated content, not an entity — model them once

The same quotes appear in up to three places in three different shapes (homepage pull quote,
case-study pull quote, `/love` card). Peer Richelsen appears on the homepage as a formal pull
quote *and* on `/love` as "metabase is love". Nothing links them.

**Fix:** one `testimonial` collection type —

```
testimonial
  quote            text
  variant          enum: pull-quote | social
  featured         boolean
  person           relation → person (name, role, avatar, social handle)
  company          relation → company (name, logo, industry)
  caseStudy        relation → case-study   (optional)
  sourceUrl        string                  (optional)
```

Write a quote once; surface it on the homepage, on the product section, inside the case study,
and on `/love` by querying `variant` + `featured`. This is a genuinely better model than the
original's and it's a strong README talking point. It also satisfies "testimonials managed in
Strapi" with real relations rather than a flat repeatable component.

### 6.3 Blog has one filter dimension; add tags for a real second

`articleSection` is a single free-text string — one category per post, six values, no tag
concept. So the blog can only ever filter on one axis, and the brief asks for filtering to be
"functional and driven by Strapi data" across the site.

**Fix:** `category` (many-to-one, the existing 6, keeps the design identical) **plus** `tags`
(many-to-many: `AI`, `Security`, `Open Source`, `Embedding`, `Performance`, `SQL`…). The
category pills stay exactly as they look now; tags become a secondary row or post-page chips.
Gives the blog the same two-dimension filtering the case studies already have.

### 6.4 Filter state never reaches the URL — the biggest UX win available

Both the blog and case-study filters are pure client-side DOM toggling:

```html
<button class="category-filter" data-filter="News">News</button>
<div class="mb-8" data-post-category="News">…</div>
```

Consequences on the live site: you can't share "case studies in Healthcare", the back button
doesn't undo a filter, refreshing resets to All, and there are zero indexable landing pages for
17 industries × 2 use cases or for 6 blog categories.

Worth noting the original scores 100 on SEO for `/case-studies` while having zero indexable
pages for any of its 17 industries - the filter is invisible to crawlers entirely.

**Fix:** two layers.
1. Static routes generated at build time — `/case-studies/industry/[slug]`,
   `/blog/category/[slug]` — via `getStaticPaths()`. Shareable, indexable, zero JS, and each
   one is a legitimately fast static page.
2. A small island that syncs clicks to `?industry=…&useCase=…` with `history.pushState`, so
   in-page filtering stays instant but is linkable and back-button-correct.

This is cheap in Astro, visually identical, and it's exactly the kind of "sensible technical
decision + explain the trade-off" the brief is grading.

### 6.5 The blog listing ships every post in one document

`/blog` renders **109 post cards in 178 KB of HTML**, then filters by hiding them. `/glossary`
renders all 166 terms. `/love` renders 79 cards. Filtering never fetches anything — it just
sets `display: none`.

At 137 posts it's survivable; the pattern doesn't scale, and it costs us directly on the
PageSpeed target in §4.2.3. **Measured:** `/blog` is the worst-scoring page on the site
(mobile Perf **47**), carries 2,358 KiB total, and is the only page with meaningful CLS
(**0.122**) because those card images ship without `width`/`height` — see §2.

**Fix:** paginate (`paginate()` in `getStaticPaths`) or use the static category routes from
5.4, and reserve image dimensions to keep CLS at zero. Fewer nodes, smaller HTML, better LCP —
and it's a measurable before/after to put in the README next to the PageSpeed screenshots.

### 6.6 Authors are half-modeled

Author archive pages exist (`/blog/authors/sameer-al-sakran`), but the post itself carries the
author as a name string plus a hardcoded avatar path
(`cdn.metabase.com/images/posts/blog-authors/sameer-al-sakran.png`) — the slug is derived from
the name rather than stored.

**Fix:** `author` collection type (`name`, `slug`, `avatar`, `role`, `bio`, `social`) with a
relation from `post`. Author pages, author cards and the megamenu all come free, and renaming
a person doesn't break their URL.

### 6.7 Case-study outcomes are buried in prose

Every case study has hard numbers — Alto's "nearly 90% decrease in monthly cost", Aula's "cuts
support tickets by 87%", Insocial's "saves 1,100+ engineering hours" — but they only exist
inside paragraphs and headline strings. The listing cards show a sentence; the numbers can't
be surfaced, sorted, or reused.

**Fix:** a repeatable `metric` component on `case-study`:

```
metric
  value   "87%"
  label   "fewer support tickets"
```

Render as a small stat row on the detail page and optionally on the card. This is an *addition*
to the design rather than a change to it, it makes the listing far more scannable, and it gives
the filters something meaningful to sort by.

### 6.8 `/love` still loads Bootstrap + Masonry + List.js from a CDN

Three render-blocking third-party requests (`cdnjs.cloudflare.com`) to lay out a static grid of
79 cards and do client-side search:

```html
<script src="…/masonry-layout@4/dist/masonry.pkgd.min.js"></script>
<script src="…/list.js/2.3.1/list.min.js"></script>
```

**Fix:** CSS `columns` (or grid) for the masonry effect and a ~20-line vanilla filter. Zero
third-party JS, zero extra DNS lookups, identical appearance.

**Measured, and the bigger problem is images, not the JS:** `/love` pulls **1,817 KiB over
86 requests** from `cdn.metabase.com` — 3,203 KiB total, the heaviest page measured — to
fill 36x36 avatar slots with full-size JPEGs (`abdulazeez.jpeg` is 42 KB for a 36x36
render, and `srcset` offers only `1x` of the same file). Astro's `<Image>` with real
responsive variants takes that from ~1.8 MB to well under 100 KB on its own. Together with
dropping the three cdnjs scripts, this is the most dramatic before/after on the site.

### 6.9 Smaller ones

- **`description` does triple duty** as excerpt, meta description and `og:description`. Split
  `excerpt` from `seo.metaDescription` so editors can write a good card blurb without wrecking
  the SERP snippet.
- **Glossary has no category dimension** — 166 terms filtered only by search and first letter.
  Adding `category` (Querying, Visualisation, Data Modelling, Administration…) would make it
  browsable, not just searchable.
- **Related content looks hand-picked or naive.** Model it explicitly: a `relatedPosts`
  relation with a shared-tag fallback, so the slot is never empty and editors can override.
- **Two CSS frameworks ship on the same site.** Standardising on Tailwind v4 from the start
  avoids the split we can see mid-flight in the original.

---

## 7. Proposed scope for the replica

Eight templates, roughly 50–60 Strapi entries. Enough to read as a faithful replication,
small enough to actually finish and polish.

| Page | Why |
|---|---|
| `/` | The hero, the BI/Embedded fork, inline pull quotes, social wall strip, final CTA |
| `/blog` + `/blog/[slug]` + `/blog/category/[slug]` + `/blog/authors/[slug]` | Brief requirement: blog + filters |
| `/case-studies` + `/case-studies/[slug]` | Brief requirement: two-dimension filters |
| `/love` | Brief requirement: testimonials, as a dedicated page |
| `/glossary` | Cheap, and demonstrates a third filter pattern (search + A–Z) |
| `/product/business-intelligence` | One product page to prove the marketing template |
| `/pricing` | Completes journey J1 |
| Nav + footer, full IA | Where "faithful replication" is most visible |

Content types: `post`, `category`, `tag`, `author`, `case-study`, `industry`, `use-case`,
`company`, `person`, `testimonial`, `glossary-term`. Shared components: `seo`, `metric`,
`cta`, `rich-section`.

---

## 8. Open question for the reviewer

§4.2 item 6 of the brief says to deploy the Astro front end to "Netlify, Vercel, or
Cloudways", while §4.4 says "Astro → Railway. Deploy the Astro frontend to the Railway Project
we provide." Since the Railway project is already provisioned, §4.4 is the assumption we're
proceeding on — both services plus Postgres in `L2-Promotion-Assignment-Yasiru`. Worth
confirming in writing.
