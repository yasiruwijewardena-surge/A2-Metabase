/**
 * Static file server for the built site.
 *
 * Astro's static output needs something to serve it on Railway. Written here
 * rather than pulled from a CLI so the cache headers are explicit: Astro
 * fingerprints everything under /_astro, so those can be immutable for a year,
 * while HTML must revalidate or a deploy would not reach anyone. "Use efficient
 * cache lifetimes" is one of the diagnostics the original site fails
 * (SITE-ANALYSIS.md §2).
 *
 * HTML splits the browser and the edge deliberately. max-age=0 keeps browsers
 * revalidating, so a publish is never hidden behind a local copy, while
 * s-maxage lets Railway's CDN serve the page from the edge instead of waking
 * this origin for every visitor. Staleness is not the risk it looks like:
 * Railway purges cached HTML on each successful deploy, and a deploy is the
 * only way the HTML changes, so s-maxage is really a ceiling for the case
 * where a purge is missed rather than the freshness window.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sirv from 'sirv';

const DIR = join(import.meta.dirname, 'dist');
const PORT = Number(process.env.PORT ?? 4321);
const YEAR = 60 * 60 * 24 * 365;
const DAY = 60 * 60 * 24;
// How long the edge may serve a page without checking back. Short, because it
// only matters when a deploy purge does not land.
const EDGE = 600;

if (!existsSync(DIR)) {
  console.error(`No build found at ${DIR}. Run \`npm run build\` first.`);
  process.exit(1);
}

const notFound = existsSync(join(DIR, '404.html'))
  ? readFileSync(join(DIR, '404.html'))
  : Buffer.from('Not found');

const serve = sirv(DIR, {
  etag: true,
  gzip: true,
  brotli: true,
  setHeaders(res, pathname) {
    if (pathname.startsWith('/_astro/')) {
      // Fingerprinted by the build: safe to cache forever.
      res.setHeader('Cache-Control', `public, max-age=${YEAR}, immutable`);
      return;
    }
    // A clean URL such as /blog arrives here with no extension, so testing for
    // ".html" alone misses every page on the site and caches HTML for an hour -
    // long enough that a deploy would not reach anyone who had visited.
    const last = pathname.split('/').pop() ?? '';
    const isDocument = last === '' || !last.includes('.') || last.endsWith('.html');
    res.setHeader(
      'Cache-Control',
      isDocument
        ? `public, max-age=0, s-maxage=${EDGE}, stale-while-revalidate=${DAY}`
        : 'public, max-age=3600',
    );
  },
});

createServer((req, res) =>
  serve(req, res, () => {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(notFound);
  }),
).listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ${DIR} on http://0.0.0.0:${PORT}`);
});
