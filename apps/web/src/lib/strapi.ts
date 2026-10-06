import { preloadFor, preloadStatic, preloadAt } from './image';
import type {
  Author,
  CaseStudy,
  Category,
  EventCategory,
  Faq,
  Page,
  GlossaryTerm,
  Industry,
  Plan,
  Post,
  PricingAddon,
  SiteEvent,
  Tag,
  Testimonial,
  UseCase,
} from './types';

const BASE = (import.meta.env.STRAPI_URL ?? process.env.STRAPI_URL ?? 'http://localhost:1337')
  .replace(/\/+$/, '');

/**
 * Everything here runs at build time, so results are cached per process: a
 * module imported by six pages fetches once, not six times.
 */
const cache = new Map<string, unknown>();

interface Paged<T> { data: T[]; meta: { pagination: { page: number; pageCount: number; total: number } } }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A response the server answered clearly: retrying will not change it. */
class HardError extends Error {}

/** 502/503/504 mean the CMS is restarting rather than wrong; those are worth retrying. */
const TRANSIENT = new Set([408, 429, 500, 502, 503, 504]);

async function fetchPage<T>(path: string, params: URLSearchParams, attempt = 1): Promise<Paged<T>> {
  const url = `${BASE}/api/${path}?${params}`;
  const MAX = 4;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      if (TRANSIENT.has(res.status) && attempt < MAX) {
        console.warn(`  Strapi ${res.status} for ${path}, retrying (${attempt}/${MAX - 1})`);
        await sleep(attempt * 3000);
        return fetchPage<T>(path, params, attempt + 1);
      }
      throw new HardError(
        `Strapi ${res.status} ${res.statusText} for ${path}\n` +
        `  ${url}\n` +
        `  Is STRAPI_URL correct and the content published?`
      );
    }

    // Reading the body has to sit inside the retry too. A dropped connection
    // after the headers arrive resolves fetch() successfully and then throws
    // `TypeError: terminated` here — which is how a build died mid-render
    // despite the retry above.
    return (await res.json()) as Paged<T>;
  } catch (err) {
    if (err instanceof HardError) throw err;
    if (attempt < MAX) {
      console.warn(`  Strapi request failed for ${path} (${(err as Error).message}), retrying (${attempt}/${MAX - 1})`);
      await sleep(attempt * 2000);
      return fetchPage<T>(path, params, attempt + 1);
    }
    throw new Error(
      `Strapi unreachable at ${BASE} after ${MAX} attempts\n  ${(err as Error).message}`
    );
  }
}

/** Fetches every page of a collection, following Strapi's pagination. */
async function all<T>(path: string, query: Record<string, string> = {}): Promise<T[]> {
  const key = path + JSON.stringify(query);
  if (cache.has(key)) return cache.get(key) as T[];

  const out: T[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const params = new URLSearchParams({ ...query, 'pagination[page]': String(page), 'pagination[pageSize]': '100' });
    const res = await fetchPage<T>(path, params);
    out.push(...res.data);
    pageCount = res.meta.pagination.pageCount;
    page += 1;
  } while (page <= pageCount);

  cache.set(key, out);
  return out;
}

const POST_POPULATE = {
  'populate[category]': 'true',
  'populate[tags]': 'true',
  'populate[author][populate][avatar]': 'true',
  'populate[coverImage]': 'true',
  'populate[seo]': 'true',
  sort: 'publishedDate:desc',
};

export const getPosts = () => all<Post>('posts', POST_POPULATE);

/**
 * Every post, with related content populated.
 *
 * Fetched as one paged collection rather than one request per slug: the detail
 * pages previously cost a round trip each, which was ~2.9s per page against a
 * remote Strapi and dominated the build.
 */
const getPostsDeep = () =>
  all<Post>('posts', {
    ...POST_POPULATE,
    'populate[relatedPosts][populate][coverImage]': 'true',
    'populate[relatedPosts][populate][category]': 'true',
    'populate[relatedPosts][populate][author]': 'true',
  });

export const getPost = async (slug: string): Promise<Post | undefined> =>
  (await getPostsDeep()).find((p) => p.slug === slug);

export const getCategories = () => all<Category>('categories', { sort: 'name:asc' });
export const getTags = () => all<Tag>('tags', { sort: 'name:asc' });
export const getAuthors = () => all<Author>('authors', { 'populate[avatar]': 'true', sort: 'name:asc' });

const CASE_POPULATE = {
  'populate[company][populate][industry]': 'true',
  'populate[company][populate][logo]': 'true',
  'populate[useCases]': 'true',
  'populate[metrics]': 'true',
  'populate[heroImage]': 'true',
  'populate[seo]': 'true',
  sort: 'publishedDate:desc',
};

export const getCaseStudies = () => all<CaseStudy>('case-studies', CASE_POPULATE);

const getCaseStudiesDeep = () =>
  all<CaseStudy>('case-studies', {
    ...CASE_POPULATE,
    'populate[relatedCaseStudies][populate][company]': 'true',
    'populate[relatedCaseStudies][populate][heroImage]': 'true',
  });

export const getCaseStudy = async (slug: string): Promise<CaseStudy | undefined> =>
  (await getCaseStudiesDeep()).find((c) => c.slug === slug);

export const getIndustries = () => all<Industry>('industries', { sort: 'displayOrder:asc' });
export const getUseCases = () => all<UseCase>('use-cases', { sort: 'displayOrder:asc' });

export const getTestimonials = () =>
  all<Testimonial>('testimonials', {
    'populate[person][populate][avatar]': 'true',
    'populate[person][populate][company]': 'true',
    'populate[company]': 'true',
    sort: 'displayOrder:asc',
  });

export const getGlossary = () => all<GlossaryTerm>('glossary-terms', { sort: 'term:asc' });

/** Soonest first. The page splits on `startsAt` rather than a flag, so an
 *  event moves from upcoming to past on its own. */
export const getEvents = () =>
  all<SiteEvent>('events', {
    /* The artwork hangs off the category, so the card needs it two levels
       down rather than on the event itself. */
    'populate[category][populate][artwork]': 'true',
    'populate[category][populate][poster]': 'true',
    'populate[seo]': 'true',
    /* The guests are people, and each carries an avatar and a company. */
    'populate[guests][populate]': '*',
    sort: 'startsAt:desc',
  });

export const getEventCategories = () =>
  all<EventCategory>('event-categories', {
    'populate[artwork]': 'true',
    'populate[poster]': 'true',
    sort: 'displayOrder:asc',
  });

export const getPlans = () =>
  all<Plan>('plans', {
    'populate[useCases]': 'true',
    'populate[cta]': 'true',
    sort: 'displayOrder:asc',
  });

export const getFaqs = (page = 'pricing') =>
  all<Faq>('faqs', { 'filters[page][$eq]': page, sort: 'displayOrder:asc' });

export const getPricingAddons = () =>
  all<PricingAddon>('pricing-addons', { sort: 'displayOrder:asc' });

/* ---------------------------------------------------------------------------
 * Marketing pages
 *
 * A dynamic zone has to say what to populate for each component it may hold --
 * `populate=*` stops at the zone itself and returns only the scalar fields, so
 * the media, pillars, bullets and quote relations come back empty. Hence the
 * `[on][page.x]` form, one entry per component in the zone.
 * ------------------------------------------------------------------------ */

/*
 * What to populate under each component the zone may hold.
 *
 * `*` is one level deep: it returns a component's own fields and media, but a
 * repeatable component nested inside one comes back without *its* media or
 * relations. Those components spell their inner fields out instead -- and must
 * not also ask for `*`, because asking for both is a 400.
 */
const ZONE: Record<string, Record<string, string>> = {
  'page.home-hero': { '': '*' },
  'page.hero': { '': '*' },
  'page.pillars': { '[items][populate]': '*' },
  'page.panel-group': {
    '[panels][populate][bullets]': 'true',
    /* The quote names a person, who names a company. `*` on the testimonial
       stops at the person, so the byline loses ", Northwind Lending". */
    '[panels][populate][quote][populate][person][populate]': '*',
  },
  'page.feature-grid': { '[items][populate]': '*' },
  'page.split': { '': '*' },
  'page.band': { '': '*' },
  'page.accordion': { '[items][populate]': '*' },
  'page.quote': { '[testimonial][populate][person][populate]': '*' },
  'page.scale-cards': { '': '*' },
  'page.collection-list': { '': '*' },
  'page.prose': { '': '*' },
  'page.events-index': { '': '*' },
  'page.pricing-index': { '': '*' },
  'page.link-grid': { '[items]': 'true' },
  /* Each comparison row holds two lists of its own. */
  'page.compare-grid': {
    '[tabs]': 'true',
    '[columns]': 'true',
    '[rows][populate]': '*',
  },
  /* Cards sit two levels down -- section, row, card -- so the path is spelled
     all the way rather than stopping at `*`. */
  'page.embedded-analytics': {
    '[heroCtas]': 'true',
    '[logos]': 'true',
    '[securityPillars]': 'true',
    '[stackPillars]': 'true',
    '[stories]': 'true',
    '[implementations][populate][points]': 'true',
    '[tabs]': 'true',
    '[usagePoints]': 'true',
    '[supportPoints]': 'true',
    '[presets]': 'true',
    '[vsGroups][populate][lines]': 'true',
    '[faqs]': 'true',
    '[closingCtas]': 'true',
  },
  'page.data-studio': {
    '[heroCtas]': 'true',
    '[ticks]': 'true',
    '[logos]': 'true',
    '[cards][populate]': '*',
    '[faqs]': 'true',
    '[closingCtas]': 'true',
  },
  'page.metabase-ai': {
    '[heroCtas]': 'true',
    '[logos]': 'true',
    '[sections][populate][rows][populate][cards]': 'true',
    '[accessSteps]': 'true',
    '[auditStats]': 'true',
    '[chatPrompts]': 'true',
    '[laterSections][populate][rows][populate][cards]': 'true',
    '[faqs]': 'true',
    '[closingCtas]': 'true',
  },
  /* Cards hold their own repeatable links, which `*` would stop short of. */
  'page.feature-detail': {
    '[cards][populate][links]': 'true',
    '[linkCards]': 'true',
    '[howtoSteps]': 'true',
    '[faqs]': 'true',
  },
  'page.demo': { '': '*' },
  'page.faq-list': { '[faqs]': 'true' },
  'page.roadmap-groups': {
    '[groups][populate]': '*',
    '[tabs]': 'true',
    '[cards]': 'true',
  },
  'page.final-cta': { '': '*' },
  'page.closing': { '': '*' },
};

const zonePopulate = (field: string, components: string[] = Object.keys(ZONE)) =>
  Object.fromEntries(
    components.flatMap((c) =>
      Object.entries(ZONE[c] ?? { '': '*' }).map(([path, value]) =>
        [`populate[${field}][on][${c}][populate]${path}`, value] as const
      )
    )
  );

/* ---------------------------------------------------------------------------
 * Pages
 *
 * One row per URL, its shape held in the zone. `slug` is a full path
 * ("product/data-studio"), which the catch-all route splits on "/".
 * ------------------------------------------------------------------------ */

export const getPages = () =>
  all<Page>('pages', { ...zonePopulate('sections'), 'populate[seo]': 'true' });

/* The LCP image of a listing page belongs to its first row, which lives in a
   collection rather than in the page. The route needs it for <head>, so the
   lookup is here rather than inside the section that renders the list. */
export async function pagePreload(page: Page | null) {
  const layouts = new Set((page?.sections ?? [])
    .map((s) => ('layout' in s ? s.layout : null))
    .filter(Boolean) as string[]);
  if (layouts.has('blog-index')) {
    const [first] = await getPosts();
    return preloadFor(first?.coverImage?.url);
  }
  if (layouts.has('case-study-index')) {
    const [first] = await getCaseStudies();
    return preloadFor(first?.heroImage?.url, [300, 480, 760], '(max-width: 768px) 100vw, 360px');
  }
  /* The Metabase AI page leads with a clip, so its poster is the LCP image. */
  const ai = (page?.sections ?? []).find((s) => s.__component === 'page.metabase-ai');
  if (ai) return preloadStatic('/images/features/metabot-ai/hero-section-ai-poster.webp');
  /* Otherwise the LCP image is the hero's own artwork, when it has one. */
  const hero = (page?.sections ?? []).find((s) => s.__component === 'page.hero');
  /* The product hero fills a fixed 998 slot at 1x/2x, so its preload has to
     carry the same density descriptors the <img> does or the browser fetches
     a second copy. */
  return preloadAt(hero && 'media' in hero ? hero.media?.url : undefined, 998);
}

export const getPage = async (slug: string) =>
  (await all<Page>('pages', {
    'filters[slug][$eq]': slug, ...zonePopulate('sections'), 'populate[seo]': 'true',
  }))[0] ?? null;
