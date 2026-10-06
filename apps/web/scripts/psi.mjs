/*
 * Runs Google PageSpeed Insights against the deployed site and writes the
 * results to psi-results.json at the repo root.
 *
 * §4.2 #3 of the brief is explicit that PageSpeed Insights will be run on the
 * *deployed* site, so local Lighthouse numbers are not the thing being
 * measured — this talks to the hosted API against the live URL. It also
 * measures the original for comparison, which is the only fair way to read a
 * replica's score.
 *
 *   npm run psi                 # every page below, both strategies
 *   npm run psi -- --page /     # one page
 *
 * A PSI_API_KEY in the environment raises the rate limit; without one the API
 * still answers, just more slowly, so the run paces itself.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.PSI_SITE || 'https://elegant-spontaneity-production-28e1.up.railway.app';
const ORIGINAL = 'https://www.metabase.com';
const KEY = process.env.PSI_API_KEY || '';

/* A representative spread rather than every page: the two listings whose
 * filters are graded, the heaviest page, the CSS-only filter page, a post, and
 * the two flagship product pages. */
const PAGES = [
  '/', '/pricing', '/blog', '/case-studies', '/events', '/glossary',
  '/product/business-intelligence', '/features/metabase-ai', '/roadmap',
];

const args = process.argv.slice(2);
const only = args.includes('--page') ? args[args.indexOf('--page') + 1] : null;
const pages = only ? [only] : PAGES;
const strategies = ['mobile', 'desktop'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(url, strategy, attempt = 1) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', url);
  api.searchParams.set('strategy', strategy);
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) {
    api.searchParams.append('category', c);
  }
  if (KEY) api.searchParams.set('key', KEY);

  const res = await fetch(api, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    // 429 and 500 from PSI are routine; it is a shared service.
    if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
      await sleep(attempt * 15_000);
      return run(url, strategy, attempt + 1);
    }
    throw new Error(`${res.status} ${(await res.text()).slice(0, 180)}`);
  }
  const j = await res.json();
  const cat = j.lighthouseResult.categories;
  const au = j.lighthouseResult.audits;
  const pct = (k) => Math.round((cat[k]?.score ?? 0) * 100);
  return {
    performance: pct('performance'),
    accessibility: pct('accessibility'),
    bestPractices: pct('best-practices'),
    seo: pct('seo'),
    lcp: au['largest-contentful-paint']?.displayValue ?? null,
    cls: au['cumulative-layout-shift']?.displayValue ?? null,
    tbt: au['total-blocking-time']?.displayValue ?? null,
    totalBytes: au['total-byte-weight']?.displayValue ?? null,
  };
}

const comparison = [];
for (const page of pages) {
  for (const strategy of strategies) {
    const row = { page, strategy };
    for (const [label, origin] of [['replica', BASE], ['original', ORIGINAL]]) {
      try {
        row[label] = await run(origin + page, strategy);
        const r = row[label];
        console.error(`  ${strategy.padEnd(8)} ${label.padEnd(8)} ${page.padEnd(32)} perf=${String(r.performance).padStart(3)} lcp=${r.lcp}`);
      } catch (e) {
        /* The original does not have every path the replica does. */
        row[label] = { error: String(e.message).slice(0, 120) };
        console.error(`  ${strategy.padEnd(8)} ${label.padEnd(8)} ${page.padEnd(32)} ${e.message.slice(0, 60)}`);
      }
      await sleep(KEY ? 1200 : 4000);
    }
    comparison.push(row);
  }
}

const out = {
  measuredAt: new Date().toISOString().slice(0, 10),
  source: 'PageSpeed Insights API v5',
  note: 'Scores are from the hosted PageSpeed Insights service against the deployed URLs, not local Lighthouse. The original is measured alongside for comparison.',
  original: ORIGINAL,
  replica: BASE,
  comparison,
};
/* This used to print and nothing more, while the header above said it wrote the
 * file -- so the results only landed anywhere if you remembered to redirect,
 * and a run piped through `tail` silently threw most of them away. */
const dest = fileURLToPath(new URL('../../../psi-results.json', import.meta.url));
/*
 * A run that scored nothing must not overwrite a run that did. Without a key
 * the API rate-limits, and an all-429 run used to land on top of the measured
 * results, destroying the only record of them.
 */
const scored = comparison.filter((r) => typeof r.replica?.performance === 'number');
if (scored.length === 0) {
  console.error(`\nNOT WRITING ${dest}: no page scored.`);
  console.error('Every request failed — most likely the PageSpeed quota.');
  console.error('Set PSI_API_KEY to raise it, then run again. The previous results are untouched.');
  process.exit(1);
}
writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
console.error(`\nwrote ${dest} (${comparison.length} rows, ${scored.length} scored)`);
