/**
 * Seeds the CMS with sample content.
 *
 * Boots Strapi in-process and writes through the Document Service, so it needs
 * no API token and runs against whatever database the environment points at:
 * SQLite locally, Railway Postgres when DATABASE_URL is set.
 *
 *   npm run seed
 *
 * CommonJS on purpose: @strapi/strapi's ESM build directory-imports lodash/fp,
 * which Node's ESM resolver rejects. The CJS entry point resolves cleanly.
 *
 * Idempotent. Entries are matched on their natural key (slug, or quote for
 * testimonials) and skipped if already present, so re-running is safe.
 * Pass --fresh to delete existing seeded content first.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { toBlocks, slugify } = require('./blocks');
const { uploadFromUrl, mediaStats } = require('./media');

const read = (f) => JSON.parse(readFileSync(join(__dirname, 'data', f), 'utf8'));

const FRESH = process.argv.includes('--fresh');
const NO_MEDIA = process.argv.includes('--no-media');

const stats = { created: 0, updated: 0, linked: 0 };

/*
 * Create, or update in place when the entry already exists.
 *
 * This used to return the existing document untouched, which made the seeder
 * create-only: re-running it could add new content but could never correct
 * content already there. That is how 44 company logos got uploaded to
 * Cloudinary and then linked to nothing — the upload happens here, the
 * relation is written by the document call, and the document call was being
 * skipped. Anything seeded is owned by seed/data, so overwriting is the right
 * behaviour and the one the name promises.
 */
async function upsert(app, uid, where, data) {
  const existing = await app.documents(uid).findFirst({ filters: where });
  if (existing) {
    const doc = await app.documents(uid).update({
      documentId: existing.documentId, data, status: 'published',
    });
    stats.updated++;
    return doc ?? existing;
  }
  const doc = await app.documents(uid).create({ data, status: 'published' });
  stats.created++;
  return doc;
}

async function wipe(app, uid) {
  const all = await app.documents(uid).findMany({ limit: -1, status: 'draft' });
  for (const d of all) await app.documents(uid).delete({ documentId: d.documentId });
  return all.length;
}

const ORDER = [
  'api::plan.plan',
  'api::testimonial.testimonial',
  'api::case-study.case-study',
  'api::post.post',
  'api::person.person',
  'api::company.company',
  'api::glossary-term.glossary-term',
  'api::author.author',
  'api::use-case.use-case',
  'api::industry.industry',
  'api::tag.tag',
  'api::category.category',
];

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'warn';

  try {
    if (FRESH) {
      console.log('\n  --fresh: clearing existing content');
      for (const uid of ORDER) {
        const n = await wipe(app, uid);
        if (n) console.log(`    cleared ${n.toString().padStart(3)}  ${uid.split('.').pop()}`);
      }
    }

    const tax = read('taxonomies.json');
    const { companies, people } = read('companies.json');
    const posts = read('posts.json');
    const caseStudies = read('case-studies.json');
    const testimonials = read('testimonials.json').filter((x) => x.quote);
    const glossary = read('glossary.json');
    const plans = read('plans.json');

    // ---- 1. independent taxonomies -------------------------------------
    const byName = (list) => Object.fromEntries(list.map((d) => [d.name, d]));

    const categories = byName(await Promise.all(tax.categories.map((c) =>
      upsert(app, 'api::category.category', { slug: slugify(c.name) },
        { ...c, slug: slugify(c.name) }))));

    const tags = byName(await Promise.all(tax.tags.map((t) =>
      upsert(app, 'api::tag.tag', { slug: slugify(t.name) },
        { ...t, slug: slugify(t.name) }))));

    const industries = byName(await Promise.all(tax.industries.map((i) =>
      upsert(app, 'api::industry.industry', { slug: slugify(i.name) },
        { ...i, slug: slugify(i.name) }))));

    const useCases = byName(await Promise.all(tax.useCases.map((u) =>
      upsert(app, 'api::use-case.use-case', { slug: slugify(u.name) },
        { ...u, slug: slugify(u.name) }))));

    const authors = {};
    for (const a of tax.authors) {
      const { avatarUrl, ...rest } = a;
      const avatar = await uploadFromUrl(app, avatarUrl, { skip: NO_MEDIA });
      authors[a.name] = await upsert(app, 'api::author.author',
        { slug: a.slug || slugify(a.name) },
        { ...rest, slug: a.slug || slugify(a.name), avatar });
    }

    /*
     * Pricing tiers. The original's page is three independent axes — use case,
     * deployment and billing period — so a plan declares which combinations it
     * belongs to and the page filters, rather than storing one row per
     * combination. Use cases are the same vocabulary the case studies filter
     * on, not a parallel enum.
     */
    for (const p of plans) {
      await upsert(app, 'api::plan.plan', { slug: p.slug }, {
        ...p,
        useCases: (p.useCases ?? []).map((n) => useCases[n]?.documentId).filter(Boolean),
      });
    }

    for (const g of glossary) {
      await upsert(app, 'api::glossary-term.glossary-term', { slug: slugify(g.term) },
        { ...g, slug: slugify(g.term), body: toBlocks(g.body) });
    }

    // ---- 2. companies, then people --------------------------------------
    // Sequential rather than Promise.all: each company may upload a logo, and
    // firing 54 uploads at Cloudinary at once is how the earlier runs timed out.
    const companyList = [];
    for (const c of companies) {
      const { logoUrl, ...rest } = c;
      const logo = await uploadFromUrl(app, logoUrl, { skip: NO_MEDIA });
      companyList.push(await upsert(app, 'api::company.company', { slug: slugify(c.name) }, {
        ...rest,
        slug: slugify(c.name),
        industry: industries[c.industry]?.documentId,
        ...(logo ? { logo } : {}),
      }));
    }
    const companyMap = byName(companyList);

    const personMap = byName(await Promise.all(people.map((p) =>
      upsert(app, 'api::person.person', { slug: slugify(p.name) }, {
        ...p,
        slug: slugify(p.name),
        company: companyMap[p.company]?.documentId,
      }))));

    // ---- 3. posts --------------------------------------------------------
    const postMap = {};
    for (const p of posts) {
      const slug = p.slug || slugify(p.title);
      const coverImage = await uploadFromUrl(app, p.coverImageUrl, { skip: NO_MEDIA });
      const doc = await upsert(app, 'api::post.post', { slug }, {
        title: p.title,
        slug,
        coverImage,
        excerpt: p.excerpt,
        body: toBlocks(p.body),
        publishedDate: p.publishedDate,
        readTimeMinutes: p.readTimeMinutes,
        featured: Boolean(p.featured),
        category: categories[p.category]?.documentId,
        tags: (p.tags ?? []).map((t) => tags[t]?.documentId).filter(Boolean),
        author: authors[p.author]?.documentId,
        seo: { metaTitle: (p.title || '').slice(0, 70), metaDescription: (p.excerpt || '').slice(0, 170) },
      });
      postMap[slug] = doc;
    }

    // ---- 4. case studies -------------------------------------------------
    const csMap = {};
    for (const c of caseStudies) {
      const slug = c.slug || slugify(c.title);
      const heroImage = await uploadFromUrl(app, c.heroImageUrl, { skip: NO_MEDIA });
      const doc = await upsert(app, 'api::case-study.case-study', { slug }, {
        title: c.title,
        slug,
        heroImage,
        headline: c.headline,
        challenge: c.challenge,
        solution: c.solution,
        results: c.results,
        body: toBlocks(c.body),
        metrics: c.metrics ?? [],
        publishedDate: c.publishedDate,
        featured: Boolean(c.featured),
        company: companyMap[c.company]?.documentId,
        useCases: (c.useCases ?? []).map((u) => useCases[u]?.documentId).filter(Boolean),
        seo: { metaTitle: (c.title || '').slice(0, 70), metaDescription: (c.headline || '').slice(0, 170) },
      });
      csMap[slug] = doc;
    }

    // ---- 5. testimonials -------------------------------------------------
    for (const t of testimonials) {
      const person = personMap[t.person];
      const personCompany = people.find((p) => p.name === t.person)?.company;

      // Reconcile a relation that was not resolvable when the entry was first
      // seeded. Two testimonials pointed at people who only became `person`
      // records later, leaving the quotes on the page with no attribution.
      const existing = await app.documents('api::testimonial.testimonial').findFirst({
        filters: { quote: t.quote }, populate: ['person'],
      });
      if (existing && person && !existing.person) {
        await app.documents('api::testimonial.testimonial').update({
          documentId: existing.documentId,
          data: { person: person.documentId, company: companyMap[personCompany]?.documentId },
          status: 'published',
        });
        console.log(`    linked ${t.person} to an existing testimonial`);
        stats.linked++;
        continue;
      }

      await upsert(app, 'api::testimonial.testimonial', { quote: t.quote }, {
        quote: t.quote,
        variant: t.variant,
        featured: Boolean(t.featured),
        displayOrder: t.displayOrder ?? 0,
        sourceNetwork: t.sourceNetwork,
        person: person?.documentId,
        company: companyMap[personCompany]?.documentId,
        caseStudy: t.caseStudy ? (csMap[t.caseStudy] ?? Object.values(csMap).find((d) => d.title === t.caseStudy))?.documentId : undefined,
      });
    }

    // ---- 6. second pass: related content --------------------------------
    // Needs every document to exist first, so it cannot happen inline above.
    const postKey = (x) => x.slug || slugify(x.title);
    for (const p of posts) {
      const self = postMap[postKey(p)];
      if (!self) continue;
      const siblings = posts
        .filter((o) => o.category === p.category && o.title !== p.title)
        .slice(0, 2)
        .map((o) => postMap[postKey(o)]?.documentId)
        .filter(Boolean);
      if (!siblings.length) continue;
      await app.documents('api::post.post').update({
        documentId: self.documentId,
        data: { relatedPosts: siblings },
        status: 'published',
      });
      stats.linked++;
    }

    const csKey = (x) => x.slug || slugify(x.title);
    for (const c of caseStudies) {
      const self = csMap[csKey(c)];
      if (!self) continue;
      const siblings = caseStudies
        .filter((o) => o.useCases.some((u) => c.useCases.includes(u)) && o.title !== c.title)
        .slice(0, 3)
        .map((o) => csMap[csKey(o)]?.documentId)
        .filter(Boolean);
      if (!siblings.length) continue;
      await app.documents('api::case-study.case-study').update({
        documentId: self.documentId,
        data: { relatedCaseStudies: siblings },
        status: 'published',
      });
      stats.linked++;
    }

    // ---- summary ---------------------------------------------------------
    console.log('\n  Seed complete\n');
    for (const uid of [...ORDER].reverse()) {
      const n = await app.documents(uid).count({ status: 'published' });
      console.log(`    ${String(n).padStart(3)}  ${uid.split('.').pop()}`);
    }
    const m = mediaStats();
    console.log(`\n    created ${stats.created}, updated ${stats.updated}, relation passes ${stats.linked}`);
    console.log(`    media: ${m.uploaded} files attached from ${m.unique} source urls\n`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error('\n  Seed failed:', err.message, '\n');
  console.error(err);
  process.exit(1);
});
