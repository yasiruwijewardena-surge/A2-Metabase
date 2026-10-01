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
  hero image URLs
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
