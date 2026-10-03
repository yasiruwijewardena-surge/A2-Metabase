/*
 * Removes taxonomy records that the seed no longer defines.
 *
 * `upsert` in seed/index.js creates and updates but never deletes, so renaming
 * or retiring a taxonomy entry leaves the old record behind. After the
 * industries were refiled against the original's 17, three of the previous
 * eight were left with nothing pointing at them — invisible on the site, since
 * the listing only offers an industry that has stories, but still real rows in
 * the CMS and still in the API response.
 *
 *   npm run prune           # report what would go, change nothing
 *   npm run prune -- --apply
 *
 * Anything still referenced is reported and kept. The guard matters more than
 * the convenience here: a taxonomy row that still has relations is either in
 * use or a sign the seed did not finish, and deleting it would silently strip
 * the relation from everything on the other side.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const fs = require('node:fs');
const path = require('node:path');

const TAXONOMIES = [
  { uid: 'api::industry.industry', key: 'industries', backrefs: ['companies'] },
  { uid: 'api::category.category', key: 'categories', backrefs: ['posts'] },
  { uid: 'api::tag.tag', key: 'tags', backrefs: ['posts'] },
  { uid: 'api::use-case.use-case', key: 'useCases', backrefs: ['caseStudies', 'plans'] },
];

const apply = process.argv.includes('--apply');

(async () => {
  const app = await createStrapi({ appDir: process.cwd(), distDir: path.join(process.cwd(), 'dist') }).load();
  const tax = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'taxonomies.json'), 'utf8'));

  let removed = 0, kept = 0;
  try {
    for (const { uid, key, backrefs } of TAXONOMIES) {
      const defined = new Set((tax[key] ?? []).map((t) => (typeof t === 'string' ? t : t.name)));
      const rows = await app.documents(uid).findMany({
        populate: Object.fromEntries(backrefs.map((b) => [b, true])),
        status: 'published',
        pagination: { limit: 500 },
      });

      for (const row of rows) {
        if (defined.has(row.name)) continue;
        const refs = backrefs.reduce((n, b) => n + (row[b]?.length ?? 0), 0);
        if (refs > 0) {
          console.log(`  keep    ${key}/${row.name} — still referenced by ${refs}`);
          kept++;
          continue;
        }
        console.log(`  ${apply ? 'DELETE ' : 'would  '} ${key}/${row.name}`);
        if (apply) await app.documents(uid).delete({ documentId: row.documentId });
        removed++;
      }
    }
    console.log(`\n  ${apply ? 'removed' : 'would remove'} ${removed}, kept ${kept}`);
    if (!apply && removed) console.log('  re-run with --apply to delete them\n');
  } finally {
    await app.destroy();
  }
})().catch((e) => { console.error('\n  Prune failed:', e.message, '\n'); process.exit(1); });
