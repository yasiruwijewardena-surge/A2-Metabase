# CMS — Strapi 5

Headless CMS for the Metabase replica. Models the content the Astro front end
renders, and exposes it over the REST API.

- Strapi **5.56.0**, TypeScript
- SQLite locally, Postgres on Railway
- Cloudinary for media in production (Railway's filesystem is ephemeral)

## Run locally

```bash
cp .env.example .env     # then fill in the secrets
npm install
npm run develop
```

Admin: http://localhost:1337/admin — the first visit asks you to create an
administrator. API: http://localhost:1337/api

Public read permissions are granted automatically on boot by
`src/bootstrap/public-permissions.ts`, so a fresh database serves content
immediately. There is no checklist of admin checkboxes to remember.

## Generating secrets

```bash
openssl rand -base64 32
```

`APP_KEYS` takes at least two, comma-separated.

## Seeding

```bash
npm run seed          # idempotent: existing entries are skipped
npm run seed:fresh    # delete seeded content first, then re-create
```

Seeds 121 entries: 14 posts, 10 case studies, 22 testimonials, 24 glossary
terms, plus the taxonomies, companies and people they relate to.

The script boots Strapi in-process and writes through the Document Service, so
it needs no API token, runs the same validation the admin does, and works
against whatever database the environment points at. Entries are matched on
their natural key (slug, or the quote text for testimonials), so re-running is
safe.

Relations are wired in two passes, because `relatedPosts` and
`relatedCaseStudies` reference documents that do not exist until the first pass
finishes.

Content lives in `seed/data/*.json` as plain JSON with markdown-ish `body`
strings; `seed/blocks.js` converts those to Strapi's `blocks` format. Companies
and people are fictional — inventing quotes and outcomes and attributing them
to real organisations would be fabricating records.

### Seeding the Railway database

Point the same script at production using the **public** proxy URL from the
Postgres service (the private `.railway.internal` host is not reachable from
your machine):

```bash
DATABASE_CLIENT=postgres \
DATABASE_URL='<DATABASE_PUBLIC_URL from Railway>' \
DATABASE_SSL=true \
DATABASE_SSL_REJECT_UNAUTHORIZED=false \
npm run seed
```

## Content model

Eleven collection types. The shape deliberately differs from metabase.com in a
few places — see `../../SITE-ANALYSIS.md` §6 for the reasoning behind each.

### Blog

| Type | Key fields | Relations |
|---|---|---|
| `post` | title, slug, excerpt, body (blocks), coverImage, publishedDate, readTimeMinutes, featured | → category (M:1), tags (M:N), author (M:1), relatedPosts (self M:N), seo |
| `category` | name, slug, description | ← posts |
| `tag` | name, slug | ← posts |
| `author` | name, slug, role, bio, avatar, socialX, socialLinkedIn | ← posts |

`category` and `tag` are separate on purpose. The original has a single
free-text category per post and no tag concept, which caps the blog at one
filter dimension; splitting them gives the two-dimension filtering the
assignment asks for without changing how the page looks.

### Customer stories

| Type | Key fields | Relations |
|---|---|---|
| `case-study` | title, slug, headline, heroImage, challenge, solution, results, body, metrics[], publishedDate, featured | → company (M:1), useCases (M:N), testimonials (1:M), relatedCaseStudies (self M:N), seo |
| `company` | name, slug, description, logo, website, employees, headquarters | → industry (M:1), ← caseStudies, people, testimonials |
| `industry` | name, slug, description, displayOrder | ← companies |
| `use-case` | name, slug, description, displayOrder | ↔ caseStudies |
| `person` | name, slug, role, avatar, socialHandle, socialUrl | → company (M:1), ← testimonials |

**`industry` hangs off `company`, not `case-study`.** An industry describes an
organisation, not a story, and a company may have more than one story over
time. Filtering case studies by industry therefore traverses the relation
(`filters[company][industry][slug][$eq]=healthcare`), which costs nothing
because Astro resolves it at build time. The original stores industry as free
text on the story itself, which is how it ends up with 17 values including
near-duplicates like `Financial Services` / `Banking & Finance` and one entry,
`Transport Management System`, that is not an industry at all.

### Testimonials

| Type | Key fields | Relations |
|---|---|---|
| `testimonial` | quote, variant (`pull-quote` \| `social`), featured, displayOrder, sourceUrl, sourceNetwork | → person, company, caseStudy (all M:1) |

One type covers both shapes the original renders separately — the formal pull
quote inside product sections and case studies, and the short social card on
`/love`. Write a quote once, surface it anywhere by querying `variant` and
`featured`.

### Reference

| Type | Key fields |
|---|---|
| `glossary-term` | term, slug, definition, body, topic (enum), relatedTerms, seo |

### Shared components

| Component | Fields |
|---|---|
| `shared.seo` | metaTitle, metaDescription, ogImage, canonicalUrl, noIndex |
| `shared.metric` | value, label — e.g. `87%` / `fewer support tickets` |
| `shared.cta` | label, url, style |

`shared.seo` exists so the card excerpt and the meta description are separate
fields. The original reuses one `description` for the listing card, the meta
description and `og:description`, which forces a compromise between a good card
blurb and a good search snippet.

`shared.metric` surfaces outcomes the original buries in prose — Alto's ~90%
cost reduction, Aula's 87% fewer support tickets — so they can be rendered as
stats and used for sorting.

## Deployment (Railway)

`railway.json` sets the build and start commands. In the Railway service:

1. Set **Root Directory** to `apps/cms`.
2. Attach a **Postgres** database in the same project.
3. Set the environment variables below.

| Variable | Value |
|---|---|
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_URL` | reference the Postgres service's `DATABASE_URL` |
| `DATABASE_SSL` | `true` |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | freshly generated, not the local ones |
| `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` | from the Cloudinary dashboard |
| `FRONTEND_URL` | the deployed Astro URL, for CORS |

### Why Cloudinary

Railway containers get a fresh filesystem on every deploy, so anything Strapi
writes to `public/uploads` is gone the next time the service restarts — images
in published content would 404 after any redeploy. `config/plugins.ts` switches
to the Cloudinary provider whenever `CLOUDINARY_NAME` is set and falls back to
local disk when it isn't, so local development needs no third-party account.
