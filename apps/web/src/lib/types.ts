/** Shapes returned by the Strapi REST API, narrowed to what the pages use. */

export interface StrapiImage {
  url: string;
  width: number;
  height: number;
  alternativeText: string | null;
  formats?: Record<string, { url: string; width: number; height: number }> | null;
}

export interface Seo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: StrapiImage | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
}

export interface Category { name: string; slug: string; description?: string | null }
export interface Tag { name: string; slug: string }

export interface Author {
  name: string;
  slug: string;
  role?: string | null;
  bio?: string | null;
  avatar?: StrapiImage | null;
}

/** Strapi's rich-text `blocks` field. */
export type Block =
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'heading'; level: number; children: Inline[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: { type: 'list-item'; children: Inline[] }[] }
  | { type: string; children?: unknown[] };

export interface Inline { type: 'text'; text: string; bold?: boolean; italic?: boolean; code?: boolean }

export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  body: Block[];
  publishedDate: string;
  readTimeMinutes: number | null;
  featured: boolean;
  coverImage: StrapiImage | null;
  category: Category | null;
  tags: Tag[];
  author: Author | null;
  relatedPosts?: Post[];
  seo?: Seo | null;
}

export interface Industry { name: string; slug: string; description?: string | null; displayOrder?: number }
export interface UseCase { name: string; slug: string; description?: string | null; displayOrder?: number }

export interface Company {
  name: string;
  slug: string;
  description?: string | null;
  employees?: string | null;
  headquarters?: string | null;
  website?: string | null;
  logo?: StrapiImage | null;
  industry?: Industry | null;
}

export interface Metric { value: string; label: string }

export interface CaseStudy {
  title: string;
  slug: string;
  headline: string;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  body: Block[];
  metrics: Metric[];
  publishedDate?: string | null;
  featured: boolean;
  heroImage: StrapiImage | null;
  company: Company | null;
  useCases: UseCase[];
  relatedCaseStudies?: CaseStudy[];
  seo?: Seo | null;
}

export interface Person {
  name: string;
  slug: string;
  role?: string | null;
  avatar?: StrapiImage | null;
  company?: Company | null;
}

export interface Testimonial {
  quote: string;
  variant: 'pull-quote' | 'social';
  featured: boolean;
  displayOrder: number;
  sourceNetwork?: string | null;
  person?: Person | null;
  company?: Company | null;
}

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  topic: string;
  body?: Block[];
}

export interface Plan {
  name: string;
  slug: string;
  tagline?: string | null;
  priceMonthly?: number | null;
  priceYearly?: number | null;
  priceNote?: string | null;
  /** ["cloud"], ["self-hosted"] or both. */
  deployments: string[];
  featuresLead?: string | null;
  features: string[];
  footnote?: string | null;
  cta?: { label: string; url: string; style?: string } | null;
  highlighted?: boolean;
  displayOrder: number;
  useCases?: UseCase[];
}

export interface Faq {
  question: string;
  slug: string;
  answer: string;
  page: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
  displayOrder: number;
}

export interface PricingAddon {
  name: string;
  slug: string;
  body: string;
  rate?: string | null;
  included?: string | null;
  displayOrder: number;
}
