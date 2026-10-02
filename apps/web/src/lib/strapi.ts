import type {
  Author, CaseStudy, Category, GlossaryTerm, Industry, Post, Tag, Testimonial, UseCase,
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
