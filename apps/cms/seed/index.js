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
const { uploadFromUrl, uploadFromPath, mediaStats } = require('./media');

const read = (f) => JSON.parse(readFileSync(join(__dirname, 'data', f), 'utf8'));

const FRESH = process.argv.includes('--fresh');
const NO_MEDIA = process.argv.includes('--no-media');

const stats = { created: 0, updated: 0, unchanged: 0, skipped: 0, linked: 0 };

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
/**
 * True when every field the seed is about to write already holds that value,
 * so the write can be skipped.
 *
 * Relations arrive here as documentIds (or a media file's numeric id) while the
 * stored side is a populated object, so each shape is compared on its id rather
 * than structurally. Anything this cannot confidently compare returns false and
 * the document is written as before — the cost of a redundant write is seconds,
 * the cost of a skipped necessary one is silent drift.
 */
function sameAsStored(existing, data) {
  const idOf = (v) => (v && typeof v === 'object' ? (v.documentId ?? v.id) : v);

  for (const [key, next] of Object.entries(data)) {
    if (next === undefined) continue;
    const current = existing[key];

    if (Array.isArray(next)) {
      /* Blocks and components are compared whole; relation arrays by id. */
      const a = next.map(idOf);
      const b = Array.isArray(current) ? current.map(idOf) : [];
      if (a.length !== b.length) return false;
      if (a.every((x) => typeof x !== 'object')) {
        if ([...a].sort().join() !== [...b].sort().join()) return false;
      } else if (JSON.stringify(next) !== JSON.stringify(current)) return false;
      continue;
    }

    if (next !== null && typeof next === 'object') {
      if (JSON.stringify(next) !== JSON.stringify(current)) return false;
      continue;
    }

    /* Scalars, plus a relation or media passed as a bare id. */
    if (next !== current && next !== idOf(current)) {
      /* Dates round-trip as ISO strings with a different precision. */
      const bothDates = typeof next === 'string' && typeof current === 'string'
        && !Number.isNaN(Date.parse(next)) && !Number.isNaN(Date.parse(current));
      if (!(bothDates && Date.parse(next) === Date.parse(current))) return false;
    }
  }
  return true;
}

/* Which of the keys being written are relations or media, so only those get
 * populated for the comparison. `populate: '*'` costs twice as much on a
 * glossary term and three times as much on a company. */
const relCache = new Map();
function relationKeys(app, uid, data) {
  let attrs = relCache.get(uid);
  if (!attrs) {
    const schema = app.contentType(uid)?.attributes ?? {};
    attrs = new Set(Object.entries(schema)
      .filter(([, a]) => a.type === 'relation' || a.type === 'media')
      .map(([k]) => k));
    relCache.set(uid, attrs);
  }
  return Object.keys(data).filter((k) => attrs.has(k));
}

async function upsert(app, uid, where, data) {
  /* A key held as `undefined` is not the same as an absent one. On create
     Strapi ignores it; on update it reaches updateOrCreateComponent, which
     does `'id' in value` and throws on undefined. A page with no `seo` was
     therefore fine the first time and failed on every run after. */
  data = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));

  if (!want(phase)) {
    /* Lookup only: the caller needs the documentId for its relation map. */
    const doc = await app.documents(uid).findFirst({ filters: where });
    if (doc) { stats.skipped++; return doc; }
    /* Nothing to skip over — create it, or a later relation would dangle. */
  }

  const populate = relationKeys(app, uid, data);
  const existing = await app.documents(uid).findFirst({
    filters: where,
    ...(populate.length ? { populate } : {}),
  });
  if (existing) {
    if (sameAsStored(existing, data)) {
      stats.unchanged++;
      return existing;
    }
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

/*
 * `npm run seed -- --only events` runs one phase.
 *
 * A full run is upwards of 500 documents, and an update costs about four
 * seconds through the document service (nearly eight on a company), so a
 * whole-corpus write is the better part of an hour whether or not anything
 * changed. Most edits touch one section.
 */
const PHASES = ['taxonomies', 'events', 'companies', 'posts', 'case-studies', 'testimonials', 'related', 'pages'];
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg > -1 ? process.argv[onlyArg + 1]?.split(',').map((x) => x.trim()) : null;
const want = (phase) => !ONLY || !PHASES.includes(phase) || ONLY.includes(phase);

/*
 * Set before each section. Skipping a phase cannot simply skip its code: the
 * later phases look up companies, posts and case studies by name to wire their
 * relations, so the maps still have to be built. A skipped phase therefore
 * still reads — enough to return the document and keep every relation intact —
 * and only the write is dropped.
 */
let phase = null;

const ORDER = [
  'api::product-page.product-page',
  'api::marketing-page.marketing-page',
  'api::page.page',
  'api::event.event',
  'api::event-category.event-category',
  'api::faq.faq',
  'api::pricing-addon.pricing-addon',
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
    const faqs = read('faqs.json');
    const addons = read('pricing-addons.json');
    const eventsData = read('events.json');
    const pagesData = read('pages.json');

    phase = 'taxonomies';
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

    // The pricing page's prose sections, so the copy is editable rather than
    // compiled into the page.
    for (const f of faqs) {
      await upsert(app, 'api::faq.faq', { slug: f.slug }, f);
    }
    for (const a of addons) {
      await upsert(app, 'api::pricing-addon.pricing-addon', { slug: a.slug }, a);
    }

    for (const g of glossary) {
      await upsert(app, 'api::glossary-term.glossary-term', { slug: slugify(g.term) },
        { ...g, slug: slugify(g.term), body: toBlocks(g.body) });
    }

    phase = 'events';
    // ---- events ---------------------------------------------------------
    // Dates are stored relative to the seed run, so the upcoming/past split on
    // /events stays meaningful however long after seeding the site is built.
    const seriesMap = {};
    /* The artwork is keyed by strand, not by event: the square goes on every
       card in the series and the tall poster is what the carousel scrolls.
       Two strands have a poster but no square -- the original never made one,
       because neither has run an event yet -- so `artwork` stays optional and
       the front end falls back to the poster. */
    const ART = join(__dirname, 'assets', 'event-categories');
    for (const s of eventsData.series) {
      /* `want` as well as NO_MEDIA: these uploads sit outside `upsert`, so
         without it a run scoped to another phase would still push 18 images at
         Cloudinary to build a record it then skips. */
      const [artwork, poster] = NO_MEDIA || !want('events') ? [] : await Promise.all([
        uploadFromPath(app, join(ART, `${s.slug}.webp`)),
        uploadFromPath(app, join(ART, `${s.slug}-tall.webp`)),
      ]);
      seriesMap[s.slug] = await upsert(app, 'api::event-category.event-category', { slug: s.slug },
        { ...s, ...(artwork ? { artwork } : {}), ...(poster ? { poster } : {}) });
    }
    const dayMs = 24 * 60 * 60 * 1000;
    for (const e of eventsData.events) {
      const { inDays, series, ...rest } = e;
      const startsAt = new Date(Date.now() + inDays * dayMs);
      /* Sessions run in the evening; without this they all land at the minute
         the seed happened to run. */
      startsAt.setUTCHours(16, 0, 0, 0);
      await upsert(app, 'api::event.event', { slug: slugify(e.title) }, {
        ...rest,
        slug: slugify(e.title),
        startsAt: startsAt.toISOString(),
        category: seriesMap[series]?.documentId,
      });
    }

    phase = 'companies';
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

    phase = 'posts';
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

    phase = 'case-studies';
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

    phase = 'testimonials';
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

    phase = 'related';
    // ---- 6. second pass: related content --------------------------------
    // This one writes directly rather than through upsert, so it carries its
    // own guard. It is also last, so nothing downstream needs its maps.
    if (want('related')) {
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

    }

    phase = 'pages';
    // ---- 7. product and feature pages ------------------------------------
    // The marketing pages' copy, which used to live in the Astro components.
    // Product pages are a dynamic zone, so the whole `sections` array is
    // written as one value and the order in the JSON is the order on the page.
    if (want('pages')) {
      /* The same three pull quotes the page used to pick itself, in the same
         order, so the rebuilt page reads identically to the one it replaces. */
      const pullQuotes = (await app.documents('api::testimonial.testimonial').findMany({
        filters: { variant: 'pull-quote' },
        sort: ['featured:desc', 'displayOrder:asc'],
        limit: 50,
        status: 'published',
      }));

      /* Media is referenced by path. `seed:` points inside seed/assets; anything
         else is relative to this file, which for now reaches into the front
         end's public folder -- those copies go away once every page is
         converted and nothing but Cloudinary serves them. */
      const upload = async (ref, alt) => {
        if (!ref) return undefined;
        const abs = ref.startsWith('seed:')
          ? join(__dirname, 'assets', ref.slice(5))
          : join(__dirname, ref);
        return uploadFromPath(app, abs, alt);
      };

      /* A standfirst that carries an inline link, which `toBlocks` does not
         parse. Spelled out as data rather than guessed at from markup. */
      const richParagraph = (parts) => [{
        type: 'paragraph',
        children: parts.map((p) => (p.href
          ? { type: 'link', url: p.href, children: [{ type: 'text', text: p.t }] }
          : { type: 'text', text: p.t })),
      }];

      /* Media fields that hold a list of paths rather than one. The alt text
         for each sits in a parallel `<field>Alts` array, because a file's
         alternativeText belongs to the file and these are uploaded here. */
      const MEDIA_LISTS = { logos: 'logoAlts', tourMedia: null, badges: null };

      const buildSection = async (raw) => {
        const s = { ...raw };
        if ('__quote' in s) {
          const t = pullQuotes[s.__quote];
          delete s.__quote;
          return t ? { ...s, testimonial: t.documentId } : null;
        }
        /* A panel carries its pull quote by position in the same list, so the
           rebuilt home page quotes the same three people in the same places. */
        if ('__quoteIndex' in s) {
          const t = pullQuotes[s.__quoteIndex];
          delete s.__quoteIndex;
          if (t) s.quote = t.documentId;
        }
        if (s.__subRich) {
          /* The band holds its standfirst in `sub`; the hero keeps `sub` plain
             and puts the rich version in `subRich`, so the two are not the
             same field under different names. */
          const field = s.__component === 'page.hero' ? 'subRich' : 'sub';
          s[field] = richParagraph(s.__subRich);
          delete s.__subRich;
        }
        for (const k of ['media', 'mediaMobile', 'mediaPoster', 'illustration', 'embedMedia']) {
          if (s[k]) s[k] = await upload(s[k]);
        }
        for (const [field, altField] of Object.entries(MEDIA_LISTS)) {
          if (!Array.isArray(s[field])) continue;
          const alts = altField ? s[altField] ?? [] : [];
          const ids = [];
          for (const [i, ref] of s[field].entries()) {
            const id = await upload(ref, alts[i]);
            if (id) ids.push(id);
          }
          s[field] = ids;
          if (altField) delete s[altField];
        }
        /* Nested repeatables carry media and quotes of their own. */
        for (const k of ['items', 'panels', 'cards', 'groups']) {
          if (!Array.isArray(s[k])) continue;
          const built = [];
          for (const child of s[k]) built.push(await buildSection(child));
          s[k] = built.filter(Boolean);
        }
        return s;
      };

      for (const page of pagesData.productPages ?? []) {
        const sections = [];
        for (const raw of page.sections) {
          const built = await buildSection(raw);
          if (built) sections.push(built);
        }
        await upsert(app, 'api::product-page.product-page', { slug: page.slug },
          { title: page.title, slug: page.slug, seo: page.seo, sections });
      }

      for (const page of pagesData.marketingPages ?? []) {
        const data = { title: page.title, slug: page.slug, seo: page.seo };
        if (page.hero) data.hero = await buildSection(page.hero);
        if (page.closing) data.closing = await buildSection(page.closing);
        if (page.sections) {
          data.sections = [];
          for (const raw of page.sections) data.sections.push(await buildSection(raw));
        }
        await upsert(app, 'api::marketing-page.marketing-page', { slug: page.slug }, data);
      }

      for (const page of pagesData.pages ?? []) {
        const sections = [];
        for (const raw of page.sections ?? []) {
          const built = await buildSection(raw);
          if (built) sections.push(built);
        }
        await upsert(app, 'api::page.page', { slug: page.slug },
          { title: page.title, slug: page.slug, seo: page.seo, sections });
      }
    }

    // ---- summary ---------------------------------------------------------
    console.log('\n  Seed complete\n');
    for (const uid of [...ORDER].reverse()) {
      const n = await app.documents(uid).count({ status: 'published' });
      console.log(`    ${String(n).padStart(3)}  ${uid.split('.').pop()}`);
    }
    const m = mediaStats();
    console.log(`\n    created ${stats.created}, updated ${stats.updated}, `
      + `unchanged ${stats.unchanged}, skipped ${stats.skipped}, relation passes ${stats.linked}`);
    if (ONLY) console.log(`    phases run: ${ONLY.join(', ')} (of ${PHASES.join(', ')})`);
    console.log(`    media: ${m.attached} attached from ${m.unique} source urls `
      + `(${m.uploaded} uploaded, ${m.reused} already in the library)\n`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error('\n  Seed failed:', err.message, '\n');
  console.error(err);
  process.exit(1);
});
