/** Shapes returned by the Strapi REST API, narrowed to what the pages use. */

export interface StrapiImage {
  url: string;
  width: number;
  height: number;
  alternativeText: string | null;
  formats?: Record<string, { url: string; width: number; height: number }> | null;
}

export type IconSet = 'nav' | 'pillar' | 'scale' | 'feature';

export interface Icon {
  key: string;
  set: IconSet;
  name: string;
  svg: StrapiImage | null;
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

export interface EventCategory {
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number;
  /** The square shown on every card in the series. Two strands have none. */
  artwork?: StrapiImage | null;
  /** The 280x350 the carousel scrolls. Every strand has one. */
  poster?: StrapiImage | null;
}

export interface SiteEvent {
  title: string;
  slug: string;
  description?: string | null;
  /** ISO. Decides which band the event appears in, so nothing needs re-flagging as it ages. */
  startsAt: string;
  location?: string | null;
  registrationUrl?: string | null;
  recordingUrl?: string | null;
  featured?: boolean;
  durationMinutes?: number | null;
  category?: EventCategory | null;
  guests?: Person[];
  seo?: Seo | null;
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
  footnoteSecondary?: string | null;
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

/* ---------------------------------------------------------------------------
 * Marketing pages
 *
 * The product pages are a dynamic zone: `__component` says which shape each
 * entry is, and the order in the array is the order down the page.
 * ------------------------------------------------------------------------ */

export interface Cta { label: string; url: string; style?: string | null }
export interface Bullet { title: string; body?: string | null }
export interface Pillar { icon?: string | null; title: string; body?: string | null }

export interface AccordionItem {
  icon?: string | null;
  badge?: string | null;
  title: string;
  body?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
}

interface SectionBase { id: number; __component: string }

export interface HeroSection extends SectionBase {
  __component: 'page.hero';
  eyebrowIcon?: string | null;
  eyebrow?: string | null;
  heading: string;
  sub?: string | null;
  ctas?: Cta[];
  media?: StrapiImage | null;
  mediaMobile?: StrapiImage | null;
  mediaPoster?: StrapiImage | null;
  mediaLabel?: string | null;
  framed?: boolean;
  pillars?: Pillar[];
  trustLine?: string | null;
}

export interface SplitSection extends SectionBase {
  __component: 'page.split';
  heading: string;
  lede?: string | null;
  bullets?: Bullet[];
  media?: StrapiImage | null;
  mediaPoster?: StrapiImage | null;
  mediaLabel?: string | null;
  frameTheme?: 'blue' | 'grey' | 'none';
  caption?: string | null;
  reverse?: boolean;
}

export interface BandSection extends SectionBase {
  __component: 'page.band';
  heading: string;
  /** Rich text: these standfirsts carry inline links. */
  sub?: Block[];
  media?: StrapiImage | null;
  mediaLabel?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
  centred?: boolean;
}

export interface AccordionSection extends SectionBase {
  __component: 'page.accordion';
  heading: string;
  sub?: string | null;
  media?: StrapiImage | null;
  mediaLabel?: string | null;
  items?: AccordionItem[];
}

export interface QuoteSection extends SectionBase {
  __component: 'page.quote';
  testimonial?: Testimonial | null;
}

export interface ClosingSection extends SectionBase {
  __component: 'page.closing';
  heading: string;
  sub?: string | null;
  ctas?: Cta[];
  media?: StrapiImage | null;
  mediaLabel?: string | null;
}


/** One of the interactive islands, named by the CMS. See components/page/Demo.astro. */
export type DemoName =
  | 'hero-dashboard' | 'hero-chat' | 'metabot-chat' | 'payments-dashboard'
  | 'data-studio-account' | 'embedded-dashboard' | 'data-source-marquee'
  | 'copy-command' | 'compliance-badges';

export interface PillarCard {
  id: number;
  icon?: string | null;
  heading?: string | null;
  body?: string | null;
  visual?: DemoName | 'badges' | 'image' | null;
  media?: StrapiImage | null;
  caption?: string | null;
}

export interface HomeHeroSection extends SectionBase {
  __component: 'page.home-hero';
  heading: string;
  /** The second line. `<br>` ends the line but adds no whitespace, so the two halves are held apart. */
  headingBreakAfter?: string | null;
  sub?: string | null;
  ctas?: Cta[];
  demo?: DemoName | null;
  trustLabel?: string | null;
  logos?: StrapiImage[];
  tourLabel?: string | null;
  tourUrl?: string | null;
  tourMedia?: StrapiImage[];
}

export interface PillarsSection extends SectionBase {
  __component: 'page.pillars';
  heading: string;
  standfirst?: string | null;
  items?: PillarCard[];
}

export interface Panel {
  id: number;
  heading: string;
  body?: string | null;
  bullets?: Bullet[];
  linkLabel?: string | null;
  linkUrl?: string | null;
  demo?: DemoName | null;
  frame?: 'query' | 'share' | 'guide' | null;
  reverse?: boolean | null;
  quote?: Testimonial | null;
}

export interface PanelGroupSection extends SectionBase {
  __component: 'page.panel-group';
  eyebrow?: string | null;
  eyebrowUrl?: string | null;
  heading: string;
  standfirst?: string | null;
  panels?: Panel[];
}

export interface FeatureGridSection extends SectionBase {
  __component: 'page.feature-grid';
  eyebrow?: string | null;
  eyebrowUrl?: string | null;
  heading: string;
  standfirst?: string | null;
  demo?: DemoName | null;
  items?: PillarCard[];
}

export interface ScaleCard {
  id: number;
  icon?: string | null;
  heading?: string | null;
  /** The body is split so a feature link can sit mid-sentence. */
  lead?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
  tail?: string | null;
}

export interface ScaleCardsSection extends SectionBase {
  __component: 'page.scale-cards';
  heading: string;
  standfirst?: string | null;
  cards?: ScaleCard[];
}

export interface CollectionListSection extends SectionBase {
  __component: 'page.collection-list';
  heading?: string | null;
  standfirst?: string | null;
  source?: 'posts' | 'case-studies' | 'testimonials' | 'glossary'
         | 'events-upcoming' | 'events-on-demand' | 'plans' | null;
  layout?: string | null;
  limit?: number | null;
  showFilters?: boolean | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
}

export interface EventsIndexSection extends SectionBase {
  __component: 'page.events-index';
  heading?: string | null;
  standfirst?: string | null;
  noUpcoming?: string | null;
  upcomingCta?: string | null;
  watchHeading?: string | null;
  watchStandfirst?: string | null;
  pickLabel?: string | null;
  noRecordings?: string | null;
  watchCta?: string | null;
}

export interface PricingIndexSection extends SectionBase {
  __component: 'page.pricing-index';
  titleSuffix?: string | null;
  deploymentLabel?: string | null;
  plansLabel?: string | null;
  usersLabel?: string | null;
  taxNote?: string | null;
  optionalHeading?: string | null;
  optionalBody?: string | null;
  usageLabel?: string | null;
  usagePill?: string | null;
  faqHeading?: string | null;
  faqBody?: string | null;
  faqCtaLabel?: string | null;
  faqCtaUrl?: string | null;
  complianceHeading?: string | null;
  complianceBody?: string | null;
  embedLabel?: string | null;
  embedHeading?: string | null;
  embedPrice?: string | null;
  embedPriceUnit?: string | null;
  embedNote?: string | null;
  embedLinkLabel?: string | null;
  embedLinkUrl?: string | null;
  embedMedia?: StrapiImage | null;
  badges?: StrapiImage[];
  footNote?: string | null;
}

export interface FeatureCardItem {
  id: number; icon?: string | null; title?: string | null; body?: string | null;
  links?: { id: number; label?: string | null; url?: string | null }[];
  trailingLabel?: string | null; trailingUrl?: string | null;
}

export interface FeatureDetailSection extends SectionBase {
  __component: 'page.feature-detail';
  badge?: string | null;
  eyebrow?: string | null;
  h1?: string | null;
  standfirst?: string | null;
  showCtas?: boolean | null;
  /** A filename stem under /images/features, not an upload. */
  mediaName?: string | null;
  mediaHeight?: number | null;
  h2?: string | null;
  sub?: string | null;
  cards?: FeatureCardItem[];
  h2b?: string | null;
  linkCards?: { id: number; pill?: string | null; title?: string | null; url?: string | null }[];
  howtoTitle?: string | null;
  howtoSteps?: { id: number; text?: string | null }[];
  readDocs?: string | null;
  faqs?: { id: number; question?: string | null; answer?: string | null }[];
  ctaTitle?: string | null;
  ctaBody?: string | null;
  ctaLinkLabel?: string | null;
  ctaLinkUrl?: string | null;
}

export interface LinkGridSection extends SectionBase {
  __component: 'page.link-grid';
  eyebrow?: string | null;
  heading?: string | null;
  standfirst?: string | null;
  items?: { id: number; icon?: string | null; title?: string | null; body?: string | null; url?: string | null }[];
}

export interface CompareGridSection extends SectionBase {
  __component: 'page.compare-grid';
  eyebrow?: string | null;
  heading?: string | null;
  standfirst?: string | null;
  tabs?: { id: number; anchor?: string | null; label?: string | null; image?: string | null;
           lede?: string | null; linkLabel?: string | null; linkUrl?: string | null }[];
  columns?: { id: number; text?: string | null }[];
  rows?: { id: number; name?: string | null; sub?: string | null; mean?: string | null;
           when?: { id: number; text?: string | null }[]; example?: string | null;
           tradeoffs?: { id: number; text?: string | null }[] }[];
  ctaHeading?: string | null;
  ctaBody?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

export interface AiCard {
  id: number; wide?: boolean | null; heading?: string | null; body?: string | null;
  linkLabel?: string | null; linkUrl?: string | null;
  mediaSrc?: string | null; mediaW?: number | null; mediaH?: number | null; mediaAlt?: string | null;
}

export interface AiSection {
  id: number; anchor?: string | null; heading?: string | null; lede?: string | null;
  ledeLinkLabel?: string | null; ledeLinkUrl?: string | null;
  rows?: { id: number; cards?: AiCard[] }[];
}

export interface MetabaseAiSection extends SectionBase {
  __component: 'page.metabase-ai';
  heading?: string | null;
  sub?: string | null;
  heroCtas?: Cta[];
  logos?: { id: number; src?: string | null; alt?: string | null; width?: number | null }[];
  trustLine?: string | null;
  sections?: AiSection[];
  accessHeading?: string | null; accessLede?: string | null;
  accessImage?: string | null; accessImageAlt?: string | null;
  accessSteps?: { id: number; anchor?: string | null; heading?: string | null; body?: string | null }[];
  pricingHeading?: string | null; pricingLedeBefore?: string | null;
  pricingLedeLinkLabel?: string | null; pricingLedeLinkUrl?: string | null;
  pricingLedeAfter?: string | null;
  pricingLinkLabel?: string | null; pricingLinkUrl?: string | null;
  auditHeading?: string | null; auditLede?: string | null;
  auditImage?: string | null; auditImageAlt?: string | null;
  auditStats?: { id: number; value?: string | null; label?: string | null }[];
  chatHeading?: string | null; chatLede?: string | null;
  chatCardHeading?: string | null; chatCardBody?: string | null;
  chatPrompts?: { id: number; text?: string | null }[];
  chatPanelHeading?: string | null; chatPanelImage?: string | null;
  chatPanelImageAlt?: string | null; chatPanelW?: number | null; chatPanelH?: number | null;
  laterSections?: AiSection[];
  faqHeading?: string | null;
  faqs?: { id: number; question?: string | null; answer?: string | null }[];
  closingHeading?: string | null; closingSub?: string | null; closingCtas?: Cta[];
}

export interface DataStudioSection extends SectionBase {
  __component: 'page.data-studio';
  eyebrow?: string | null; badgeImage?: string | null; heading?: string | null;
  ledeBefore?: string | null; ledeLinkLabel?: string | null; ledeLinkUrl?: string | null;
  ledeAfter?: string | null;
  heroCtas?: Cta[];
  ticks?: { id: number; text?: string | null }[];
  shotImage?: string | null; shotAlt?: string | null;
  trustLine?: string | null;
  logos?: { id: number; src?: string | null; alt?: string | null; width?: number | null }[];
  featsHeading?: string | null; featsLede?: string | null;
  cards?: FeatureCardItem[];
  faqHeading?: string | null;
  faqs?: { id: number; question?: string | null; answer?: string | null }[];
  faqMoreText?: string | null; faqMoreLabel?: string | null; faqMoreUrl?: string | null;
  closingHeading?: string | null; closingSub?: string | null; closingCtas?: Cta[];
}

/* 70-odd fields, because this page is a run of one-off bands rather than
   repeats of a shape. Worth re-modelling onto the generic band/split
   components, which would make it reorderable and far easier to edit. */
export interface EmbeddedAnalyticsSection extends SectionBase {
  __component: 'page.embedded-analytics';
  [key: string]: any;
}

export interface ProseSection extends SectionBase {
  __component: 'page.prose';
  heading?: string | null;
  body?: Block[];
  narrow?: boolean | null;
}

export interface DemoSection extends SectionBase {
  __component: 'page.demo';
  demo?: DemoName | null;
  caption?: string | null;
}

export interface FinalCtaSection extends SectionBase {
  __component: 'page.final-cta';
  heading: string;
  sub?: string | null;
  ctas?: Cta[];
  points?: Bullet[];
  illustration?: StrapiImage | null;
}

export interface FaqListSection extends SectionBase {
  __component: 'page.faq-list';
  heading?: string | null;
  standfirst?: string | null;
  faqs?: Faq[];
}

export interface RoadmapCard {
  id: number; heading?: string | null; strong?: string | null;
  body?: string | null; linkLabel?: string | null; linkUrl?: string | null;
}

export interface RoadmapGroup {
  id: number;
  anchor?: string | null;
  navLabel?: string | null;
  heading?: string | null;
  tone?: 'green' | 'amber' | 'blue' | null;
  items?: Bullet[];
}

export interface RoadmapGroupsSection extends SectionBase {
  __component: 'page.roadmap-groups';
  heading?: string | null;
  tabs?: Cta[];
  groups?: RoadmapGroup[];
  footLead?: string | null;
  footLinkLabel?: string | null;
  footLinkUrl?: string | null;
  note?: string | null;
  cards?: RoadmapCard[];
}

export type PageSection =
  | HomeHeroSection | HeroSection | PillarsSection | PanelGroupSection
  | FeatureGridSection | SplitSection | BandSection | AccordionSection
  | ScaleCardsSection | CollectionListSection | ProseSection | DemoSection
  | FinalCtaSection | FaqListSection | RoadmapGroupsSection | EventsIndexSection | PricingIndexSection | FeatureDetailSection | LinkGridSection | CompareGridSection | MetabaseAiSection | DataStudioSection | EmbeddedAnalyticsSection
  | QuoteSection | ClosingSection;

/** A composed page: one row per URL, its shape held in the zone. */
export interface Page {
  title: string;
  slug: string;
  sections?: PageSection[];
  seo?: Seo | null;
}




/* --- site settings ------------------------------------------------------- */

/** One destination in the header or the footer. */
export interface NavLink {
  label: string;
  url: string;
  icon?: string | null;
  description?: string | null;
  badge?: string | null;
}

/** One header menu. `key` picks the panel that renders it. */
export interface NavGroup {
  key: 'product' | 'features' | 'resources' | 'pricing';
  label: string;
  items?: NavLink[];
}

/** A titled block of footer links; blocks sharing a column stack together. */
export interface FooterColumn {
  title: string;
  column: number;
  links?: NavLink[];
}

export interface SiteSettings {
  navGroups?: NavGroup[];
  footerColumns?: FooterColumn[];
  headScripts?: string | null;
  bodyScripts?: string | null;
  favicon?: StrapiImage | null;
}
