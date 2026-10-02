/**
 * One-off: correct company names that were derived from the claim sentence.
 *
 * The original seed took the leading capitalised words out of each case
 * study's headline, which produced "How Metabase" for Bdeo, "Billing" for a
 * billing platform and "How CaseWhen" for Buena — and wrong slugs to match.
 * The case-study slug is metabase.com's own identifier for the customer, so
 * seed/data now derives the name from that.
 *
 * Companies are located through the case-study relation rather than by
 * guessing the old slug, so this is safe to re-run and does not depend on what
 * the bad name happened to be.
 *
 *   set -a && . ./.env.seed && set +a && node seed/fix-company-names.js
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { slugify } = require('./blocks');

const cases = JSON.parse(readFileSync(join(__dirname, 'data', 'case-studies.json'), 'utf8'));

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'warn';
  let fixed = 0, ok = 0, missing = 0;

  try {
    for (const c of cases) {
      const [cs] = await app.documents('api::case-study.case-study').findMany({
        filters: { slug: c.slug }, populate: ['company'], status: 'published', limit: 1,
      });
      if (!cs?.company) { missing++; console.log(`  no company linked: ${c.slug}`); continue; }

      const wantName = c.company;
      const wantSlug = slugify(wantName);
      if (cs.company.name === wantName && cs.company.slug === wantSlug) { ok++; continue; }

      await app.documents('api::company.company').update({
        documentId: cs.company.documentId,
        data: { name: wantName, slug: wantSlug },
        status: 'published',
      });
      console.log(`  ${cs.company.name}  ->  ${wantName}`);
      fixed++;
    }
    console.log(`\n  fixed ${fixed}, already correct ${ok}, unlinked ${missing}\n`);
  } finally {
    await app.destroy();
  }
}

main().catch((e) => { console.error('\n  failed:', e.message, '\n'); process.exit(1); });
