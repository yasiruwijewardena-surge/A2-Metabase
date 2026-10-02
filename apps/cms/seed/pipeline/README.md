# Seed data pipeline

How `seed/data/*.json` is produced. Committed so the content is reproducible
and so the provenance of every field is auditable.

```
scrape.py     fetches metadata from metabase.com -> real-*.json  (scratch)
transform.py  merges that metadata with the original copy below -> seed/data/
```

## What comes from metabase.com

Factual metadata only, never article text:

- Post titles, slugs, excerpts, categories, publication dates, read times,
  cover image URLs, author names and avatars
- Case study titles, company names, industries, employee counts, headquarters,
  cover image URLs and the company logo shown in the fact panel

The cover is deliberately not `og:image`. That asset is the social card, with
the claim text baked into the artwork, and using it put a second copy of the
headline inside the page's own hero. The page uses two other images: a 142px
logo in the fact panel (the only `img` carrying `max-h-20`) and a 3:1 cover
above the body (the first `h-full w-full object-cover`). `scrape.py` takes
both, and keeps `og:image` separately for the social card it is.
- The six blog category names

## What is written here

- `bodies.json` — original article bodies, one per post, keyed by real slug
- `case-bodies.json` — original challenge / solution / results / narrative
- `real-metrics.json` — figures hand-verified against Metabase's own published
  claims. An automated extraction pass was discarded because it picked up
  company statistics (customer counts, vendor counts) that are not outcomes.
- `fictional.json` — the companies and people attached to testimonials
- `industry-map.json` — the original's 17 free-text industry strings mapped to
  the 8-value curated vocabulary (SITE-ANALYSIS.md 6.1)

## Why bodies are original

Article bodies are substantial creative works and this deploys to a public URL.
Metadata is factual and reproducing it is reporting; republishing the prose
would not be. The same reasoning applies to testimonials: real companies keep
their real facts, but quotes are original and attributed to fictional people,
because putting invented words in a named person's mouth would be fabricating a
record.
