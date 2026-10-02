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
│   └── web/              Astro front end (not started)
├── SITE-ANALYSIS.md      Analysis of the original: stack, IA, content model,
│                         user journeys, PageSpeed baseline, improvements
├── psi-baseline.json     Measured PSI scores for the original, for later
│                         before/after comparison
└── README.md
```

## Getting started

```bash
# CMS
cd apps/cms
cp .env.example .env      # fill in the secrets
npm install
npm run develop           # http://localhost:1337/admin
```

See [`apps/cms/README.md`](apps/cms/README.md) for the full content model and
deployment notes.

## Why this site

Metabase is a good replication target for a headless build: it has a real blog
with categories, a customer-stories section that already filters on two
dimensions (use case × industry), testimonials in two distinct shapes, and a
glossary — which maps cleanly onto the assignment's requirements for blogs,
filters and testimonials.

It is also, usefully, **already built in Astro**. Replicating it in Astro means
the static-first, islands-light architecture the assignment asks for is the
natural way to build it.

## Approach

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

## Performance

Measured with the PageSpeed Insights API, same pages, same day.

| Page | Device | Original | This replica |
|---|---|---:|---:|
| `/` | mobile | 56 | **99** |
| `/` | desktop | 81 | **100** |
| `/blog` | mobile | 47 | **98** |
| `/case-studies` | mobile | 56 | **98** |

Accessibility, Best Practices and SEO are 100 across all four. CLS is 0 and
total blocking time is 0 ms.

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
- [x] Seed content (279 entries + 136 images, `npm run seed`)
- [x] Scaffold Astro with the design tokens
- [x] Build the pages (180 static routes)
- [x] Deploy the front end
- [x] Optimise and record PageSpeed results
