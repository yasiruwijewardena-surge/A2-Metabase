/**
 * Lists every internal link in dist/ that resolves to nothing, and refreshes
 * src/data/ia-paths.json — the set the catch-all route builds a page for.
 *
 * Run after a build. Paths that gain a real page drop out of the list on the
 * next run; `--check` fails instead of writing, for use in CI.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(web, 'dist');
const listFile = join(web, 'src', 'data', 'ia-paths.json');

/** Built for real, so never stubbed even while its links outnumber the rest. */
const NEVER_STUB = new Set(['/pricing']);

const walk = (dir) => readdirSync(dir).flatMap((e) => {
  const p = join(dir, e);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

if (!existsSync(dist)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}

const hrefs = new Map();
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    hrefs.set(href, (hrefs.get(href) ?? 0) + 1);
  }
}

/*
 * A stub page exists in dist/ but is not a real page. Without this the audit
 * is self-defeating: once the catch-all has built a page for every missing
 * path, every link "resolves" and the list empties itself on the next run.
 */
const isStub = (file) => readFileSync(file, 'utf8').includes('data-replica-stub');

const resolves = (href) => {
  const clean = href.replace(/\/$/, '');
  if (clean === '') return true;
  const p = join(dist, clean);
  for (const candidate of [p, `${p}.html`, join(p, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return !isStub(candidate);
  }
  return false;
};

/*
 * `href` is not only navigation: a preload carries one too, and those point at
 * assets Strapi serves rather than pages in dist/. Counting them turned every
 * preloaded image into a "missing page", which would have had the catch-all
 * build a stub per image. Anything under an asset root, or ending in a file
 * extension, is not a page.
 */
const ASSET_ROOTS = ['/uploads/', '/_astro/', '/images/', '/fonts/'];
const isAsset = (h) => ASSET_ROOTS.some((r) => h.startsWith(r)) || /\.[a-z0-9]{2,5}$/i.test(h);

const missing = [...hrefs.keys()]
  .filter((h) => !isAsset(h) && !resolves(h) && !NEVER_STUB.has(h))
  .sort();
const previous = existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : [];
const changed = JSON.stringify(previous) !== JSON.stringify(missing);

console.log(`${hrefs.size} distinct internal links, ${missing.length} without a page`);
for (const h of missing) console.log(`  ${String(hrefs.get(h)).padStart(5)}x  ${h}`);

if (process.argv.includes('--check')) {
  if (changed) {
    console.error('\nia-paths.json is stale — run `npm run audit:links` and commit the result.');
    process.exit(1);
  }
  console.log('\nia-paths.json is up to date.');
} else if (changed) {
  writeFileSync(listFile, `${JSON.stringify(missing, null, 1)}\n`);
  console.log(`\nwrote ${listFile}`);
}
