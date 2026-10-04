import type { Schema, Struct } from '@strapi/strapi';

export interface PageAccordion extends Struct.ComponentSchema {
  collectionName: 'components_page_accordions';
  info: {
    description: 'A heading and standfirst over an image and a list of features, one open at a time. Built with radio inputs and `:has()`, so it needs no JavaScript.';
    displayName: 'Accordion';
    icon: 'filter';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    items: Schema.Attribute.Component<'page.accordion-item', true>;
    media: Schema.Attribute.Media<'images'>;
    mediaLabel: Schema.Attribute.String;
    sub: Schema.Attribute.Text;
  };
}

export interface PageAccordionItem extends Struct.ComponentSchema {
  collectionName: 'components_page_accordion_items';
  info: {
    description: 'One row of the feature accordion. `icon` names an entry in the icon set the nav uses.';
    displayName: 'Accordion item';
    icon: 'bulletList';
  };
  attributes: {
    badge: Schema.Attribute.String;
    body: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageBand extends Struct.ComponentSchema {
  collectionName: 'components_page_bands';
  info: {
    description: 'A heading and standfirst, optionally over an image with a link beneath it. The standfirst is rich text because these carry inline links.';
    displayName: 'Band';
    icon: 'bold';
  };
  attributes: {
    centred: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images'>;
    mediaLabel: Schema.Attribute.String;
    sub: Schema.Attribute.Blocks;
  };
}

export interface PageBullet extends Struct.ComponentSchema {
  collectionName: 'components_page_bullets';
  info: {
    description: 'One item in a split section list: a bold lead-in and its sentence.';
    displayName: 'Bullet';
    icon: 'list';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PageClosing extends Struct.ComponentSchema {
  collectionName: 'components_page_closings';
  info: {
    description: 'The last band on the page: heading, standfirst, buttons and a wide image.';
    displayName: 'Closing CTA';
    icon: 'arrowRight';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    media: Schema.Attribute.Media<'images'>;
    mediaLabel: Schema.Attribute.String;
    sub: Schema.Attribute.Text;
  };
}

export interface PageCollectionList extends Struct.ComponentSchema {
  collectionName: 'components_page_collection_lists';
  info: {
    displayName: 'Collection list';
    icon: 'bulletList';
  };
  attributes: {
    badge: Schema.Attribute.String;
    emptyText: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    headingLead: Schema.Attribute.String;
    layout: Schema.Attribute.Enumeration<
      [
        'testimonial-wall',
        'testimonial-masonry',
        'blog-index',
        'case-study-index',
        'glossary',
        'events-upcoming',
        'events-on-demand',
        'pricing-table',
      ]
    >;
    limit: Schema.Attribute.Integer;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    note: Schema.Attribute.Text;
    searchPlaceholder: Schema.Attribute.String;
    showFilters: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    source: Schema.Attribute.Enumeration<
      [
        'posts',
        'case-studies',
        'testimonials',
        'glossary',
        'events-upcoming',
        'events-on-demand',
        'plans',
      ]
    >;
    standfirst: Schema.Attribute.Text;
  };
}

export interface PageDemo extends Struct.ComponentSchema {
  collectionName: 'components_page_demos';
  info: {
    displayName: 'Demo';
    icon: 'cube';
  };
  attributes: {
    caption: Schema.Attribute.String;
    demo: Schema.Attribute.Enumeration<
      [
        'hero-dashboard',
        'hero-chat',
        'metabot-chat',
        'payments-dashboard',
        'data-studio-account',
        'embedded-dashboard',
        'data-source-marquee',
        'copy-command',
        'compliance-badges',
      ]
    >;
  };
}

export interface PageEventsIndex extends Struct.ComponentSchema {
  collectionName: 'components_page_events_indexes';
  info: {
    description: 'The /events page. The events themselves are their own type; what is editable here is the copy around them.';
    displayName: 'Events index';
    icon: 'calendar';
  };
  attributes: {
    heading: Schema.Attribute.String;
    noRecordings: Schema.Attribute.Text;
    noUpcoming: Schema.Attribute.Text;
    pickLabel: Schema.Attribute.String;
    standfirst: Schema.Attribute.Text;
    upcomingCta: Schema.Attribute.String;
    watchCta: Schema.Attribute.String;
    watchHeading: Schema.Attribute.String;
    watchStandfirst: Schema.Attribute.Text;
  };
}

export interface PageFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_page_faq_items';
  info: {
    displayName: 'FAQ item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text;
    question: Schema.Attribute.String;
  };
}

export interface PageFaqList extends Struct.ComponentSchema {
  collectionName: 'components_page_faq_lists';
  info: {
    displayName: 'FAQ list';
    icon: 'question';
  };
  attributes: {
    faqs: Schema.Attribute.Relation<'oneToMany', 'api::faq.faq'>;
    heading: Schema.Attribute.String;
    standfirst: Schema.Attribute.Text;
  };
}

export interface PageFeatureCard extends Struct.ComponentSchema {
  collectionName: 'components_page_feature_cards';
  info: {
    displayName: 'Feature card';
    icon: 'layer';
  };
  attributes: {
    body: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    links: Schema.Attribute.Component<'page.feature-link', true>;
    title: Schema.Attribute.String;
    trailingLabel: Schema.Attribute.String;
    trailingUrl: Schema.Attribute.String;
  };
}

export interface PageFeatureDetail extends Struct.ComponentSchema {
  collectionName: 'components_page_feature_details';
  info: {
    displayName: 'Feature detail';
    icon: 'puzzle';
  };
  attributes: {
    badge: Schema.Attribute.String;
    cards: Schema.Attribute.Component<'page.feature-card', true>;
    ctaBody: Schema.Attribute.Text;
    ctaLinkLabel: Schema.Attribute.String;
    ctaLinkUrl: Schema.Attribute.String;
    ctaTitle: Schema.Attribute.String;
    eyebrow: Schema.Attribute.String;
    faqs: Schema.Attribute.Component<'page.faq-item', true>;
    h1: Schema.Attribute.String;
    h2: Schema.Attribute.String;
    h2b: Schema.Attribute.String;
    howtoSteps: Schema.Attribute.Component<'page.howto-step', true>;
    howtoTitle: Schema.Attribute.String;
    linkCards: Schema.Attribute.Component<'page.feature-link-card', true>;
    mediaHeight: Schema.Attribute.Integer;
    mediaName: Schema.Attribute.String;
    readDocs: Schema.Attribute.String;
    showCtas: Schema.Attribute.Boolean;
    standfirst: Schema.Attribute.Text;
    sub: Schema.Attribute.Text;
  };
}

export interface PageFeatureGrid extends Struct.ComponentSchema {
  collectionName: 'components_page_feature_grids';
  info: {
    displayName: 'Feature grid';
    icon: 'grid';
  };
  attributes: {
    demo: Schema.Attribute.Enumeration<
      [
        'hero-dashboard',
        'hero-chat',
        'metabot-chat',
        'payments-dashboard',
        'data-studio-account',
        'embedded-dashboard',
        'data-source-marquee',
        'copy-command',
        'compliance-badges',
      ]
    >;
    eyebrow: Schema.Attribute.String;
    eyebrowUrl: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'page.pillar-card', true>;
    standfirst: Schema.Attribute.Text;
  };
}

export interface PageFeatureLink extends Struct.ComponentSchema {
  collectionName: 'components_page_feature_links';
  info: {
    displayName: 'Feature link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface PageFeatureLinkCard extends Struct.ComponentSchema {
  collectionName: 'components_page_feature_link_cards';
  info: {
    displayName: 'Feature link card';
    icon: 'link';
  };
  attributes: {
    pill: Schema.Attribute.String;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface PageFinalCta extends Struct.ComponentSchema {
  collectionName: 'components_page_final_ctas';
  info: {
    displayName: 'Final CTA';
    icon: 'star';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    heading: Schema.Attribute.String;
    illustration: Schema.Attribute.Media<'images'>;
    points: Schema.Attribute.Component<'page.bullet', true>;
    sub: Schema.Attribute.Text;
  };
}

export interface PageHero extends Struct.ComponentSchema {
  collectionName: 'components_page_heros';
  info: {
    description: "The top band: eyebrow, headline, standfirst, buttons, artwork and the cards beneath it. `mediaMobile` is the squarer crop the original serves under 992px, which is also what keeps mobile LCP inside budget. The trust logos are template chrome rather than fields: they are the same brand strip on every product page, and the upload provider refuses SVG. `subRich` is used instead of `sub` where the standfirst carries an inline link, which a plain text field cannot hold; it stays a separate optional field rather than changing `sub`'s type, because that would be a migration on live data for the sake of one page.";
    displayName: 'Hero';
    icon: 'star';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    eyebrow: Schema.Attribute.String;
    eyebrowIcon: Schema.Attribute.String;
    framed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    media: Schema.Attribute.Media<'images' | 'videos'>;
    mediaLabel: Schema.Attribute.String;
    mediaMobile: Schema.Attribute.Media<'images'>;
    mediaPoster: Schema.Attribute.Media<'images'>;
    pillars: Schema.Attribute.Component<'page.pillar', true>;
    sub: Schema.Attribute.Text;
    subRich: Schema.Attribute.Blocks;
    trustLine: Schema.Attribute.String;
  };
}

export interface PageHomeHero extends Struct.ComponentSchema {
  collectionName: 'components_page_home_heros';
  info: {
    displayName: 'Home hero';
    icon: 'rocket';
  };
  attributes: {
    ctas: Schema.Attribute.Component<'shared.cta', true>;
    demo: Schema.Attribute.Enumeration<
      [
        'hero-dashboard',
        'hero-chat',
        'metabot-chat',
        'payments-dashboard',
        'data-studio-account',
        'embedded-dashboard',
        'data-source-marquee',
        'copy-command',
        'compliance-badges',
      ]
    > &
      Schema.Attribute.DefaultTo<'hero-dashboard'>;
    heading: Schema.Attribute.String;
    headingBreakAfter: Schema.Attribute.String;
    logos: Schema.Attribute.Media<'images', true>;
    sub: Schema.Attribute.Text;
    tourLabel: Schema.Attribute.String;
    tourMedia: Schema.Attribute.Media<'images', true>;
    tourUrl: Schema.Attribute.String;
    trustLabel: Schema.Attribute.String;
  };
}

export interface PageHowtoStep extends Struct.ComponentSchema {
  collectionName: 'components_page_howto_steps';
  info: {
    displayName: 'How-to step';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface PagePanel extends Struct.ComponentSchema {
  collectionName: 'components_page_panels';
  info: {
    displayName: 'Panel';
    icon: 'layer';
  };
  attributes: {
    body: Schema.Attribute.Text;
    bullets: Schema.Attribute.Component<'page.bullet', true>;
    demo: Schema.Attribute.Enumeration<
      [
        'hero-dashboard',
        'hero-chat',
        'metabot-chat',
        'payments-dashboard',
        'data-studio-account',
        'embedded-dashboard',
        'data-source-marquee',
        'copy-command',
        'compliance-badges',
      ]
    >;
    frame: Schema.Attribute.Enumeration<['query', 'share', 'guide']>;
    heading: Schema.Attribute.String;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    quote: Schema.Attribute.Relation<
      'oneToOne',
      'api::testimonial.testimonial'
    >;
    reverse: Schema.Attribute.Boolean;
  };
}

export interface PagePanelGroup extends Struct.ComponentSchema {
  collectionName: 'components_page_panel_groups';
  info: {
    displayName: 'Panel group';
    icon: 'layout';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    eyebrowUrl: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    panels: Schema.Attribute.Component<'page.panel', true>;
    standfirst: Schema.Attribute.Text;
  };
}

export interface PagePillar extends Struct.ComponentSchema {
  collectionName: 'components_page_pillars';
  info: {
    description: 'One of the cards under a hero. `icon` names an entry in the icon set the nav uses; it is a key, not an upload, because these are chrome rather than content.';
    displayName: 'Pillar';
    icon: 'grid';
  };
  attributes: {
    body: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PagePillarCard extends Struct.ComponentSchema {
  collectionName: 'components_page_pillar_cards';
  info: {
    displayName: 'Pillar card';
    icon: 'layer';
  };
  attributes: {
    body: Schema.Attribute.Text;
    caption: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images' | 'videos'>;
    visual: Schema.Attribute.Enumeration<
      [
        'hero-dashboard',
        'hero-chat',
        'metabot-chat',
        'payments-dashboard',
        'data-studio-account',
        'embedded-dashboard',
        'data-source-marquee',
        'copy-command',
        'compliance-badges',
        'badges',
        'image',
      ]
    >;
  };
}

export interface PagePillars extends Struct.ComponentSchema {
  collectionName: 'components_page_pillarss';
  info: {
    displayName: 'Pillar grid';
    icon: 'grid';
  };
  attributes: {
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'page.pillar-card', true>;
    standfirst: Schema.Attribute.Text;
  };
}

export interface PagePricingIndex extends Struct.ComponentSchema {
  collectionName: 'components_page_pricing_indexes';
  info: {
    description: 'The /pricing page. Plans, add-ons and FAQs are their own types; this holds the copy around them. One section rather than several because the :has() filtering spans the whole page.';
    displayName: 'Pricing index';
    icon: 'priceTag';
  };
  attributes: {
    badges: Schema.Attribute.Media<'images', true>;
    complianceBody: Schema.Attribute.Text;
    complianceHeading: Schema.Attribute.String;
    deploymentLabel: Schema.Attribute.String;
    embedHeading: Schema.Attribute.String;
    embedLabel: Schema.Attribute.String;
    embedLinkLabel: Schema.Attribute.String;
    embedLinkUrl: Schema.Attribute.String;
    embedMedia: Schema.Attribute.Media<'images'>;
    embedNote: Schema.Attribute.Text;
    embedPrice: Schema.Attribute.String;
    embedPriceUnit: Schema.Attribute.String;
    faqBody: Schema.Attribute.Text;
    faqCtaLabel: Schema.Attribute.String;
    faqCtaUrl: Schema.Attribute.String;
    faqHeading: Schema.Attribute.String;
    footNote: Schema.Attribute.Text;
    optionalBody: Schema.Attribute.Text;
    optionalHeading: Schema.Attribute.String;
    plansLabel: Schema.Attribute.String;
    taxNote: Schema.Attribute.Text;
    titleSuffix: Schema.Attribute.String;
    usageLabel: Schema.Attribute.String;
    usagePill: Schema.Attribute.String;
    usersLabel: Schema.Attribute.String;
  };
}

export interface PageProse extends Struct.ComponentSchema {
  collectionName: 'components_page_proses';
  info: {
    displayName: 'Prose';
    icon: 'alignLeft';
  };
  attributes: {
    body: Schema.Attribute.Blocks;
    heading: Schema.Attribute.String;
    narrow: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface PageQuote extends Struct.ComponentSchema {
  collectionName: 'components_page_quotes';
  info: {
    description: 'Places one of the testimonials between sections. The quote itself stays in `testimonial` so it is written once and reused across the homepage, the case studies and /love.';
    displayName: 'Quote';
    icon: 'quote';
  };
  attributes: {
    testimonial: Schema.Attribute.Relation<
      'oneToOne',
      'api::testimonial.testimonial'
    >;
  };
}

export interface PageRoadmapCard extends Struct.ComponentSchema {
  collectionName: 'components_page_roadmap_cards';
  info: {
    displayName: 'Roadmap card';
    icon: 'file';
  };
  attributes: {
    body: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    strong: Schema.Attribute.String;
  };
}

export interface PageRoadmapGroup extends Struct.ComponentSchema {
  collectionName: 'components_page_roadmap_groups';
  info: {
    displayName: 'Roadmap group';
    icon: 'calendar';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    items: Schema.Attribute.Component<'page.bullet', true>;
    navLabel: Schema.Attribute.String;
    tone: Schema.Attribute.Enumeration<['green', 'amber', 'blue']>;
  };
}

export interface PageRoadmapGroups extends Struct.ComponentSchema {
  collectionName: 'components_page_roadmap_groupss';
  info: {
    displayName: 'Roadmap groups';
    icon: 'calendar';
  };
  attributes: {
    cards: Schema.Attribute.Component<'page.roadmap-card', true>;
    footLead: Schema.Attribute.String;
    footLinkLabel: Schema.Attribute.String;
    footLinkUrl: Schema.Attribute.String;
    groups: Schema.Attribute.Component<'page.roadmap-group', true>;
    heading: Schema.Attribute.String;
    note: Schema.Attribute.Text;
    tabs: Schema.Attribute.Component<'shared.cta', true>;
  };
}

export interface PageScaleCard extends Struct.ComponentSchema {
  collectionName: 'components_page_scale_cards';
  info: {
    displayName: 'Scale card';
    icon: 'layer';
  };
  attributes: {
    heading: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    lead: Schema.Attribute.Text;
    linkLabel: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    tail: Schema.Attribute.Text;
  };
}

export interface PageScaleCards extends Struct.ComponentSchema {
  collectionName: 'components_page_scale_cardss';
  info: {
    displayName: 'Scale cards';
    icon: 'chartBubble';
  };
  attributes: {
    cards: Schema.Attribute.Component<'page.scale-card', true>;
    heading: Schema.Attribute.String;
    standfirst: Schema.Attribute.Text;
  };
}

export interface PageSection extends Struct.ComponentSchema {
  collectionName: 'components_page_sections';
  info: {
    description: 'A plain heading-body-artwork section, used by the feature pages where the shapes are one-offs rather than a shared vocabulary.';
    displayName: 'Section';
    icon: 'file';
  };
  attributes: {
    body: Schema.Attribute.Text;
    bullets: Schema.Attribute.Component<'page.bullet', true>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    media: Schema.Attribute.Media<'images' | 'videos'>;
    mediaLabel: Schema.Attribute.String;
    mediaPoster: Schema.Attribute.Media<'images'>;
    reverse: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface PageSplit extends Struct.ComponentSchema {
  collectionName: 'components_page_splits';
  info: {
    description: 'Artwork one side, copy the other. `reverse` puts the artwork on the right; `frameTheme` is the tint behind it.';
    displayName: 'Split';
    icon: 'layout';
  };
  attributes: {
    bullets: Schema.Attribute.Component<'page.bullet', true>;
    caption: Schema.Attribute.String;
    frameTheme: Schema.Attribute.Enumeration<['blue', 'grey', 'none']> &
      Schema.Attribute.DefaultTo<'blue'>;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    lede: Schema.Attribute.Text;
    media: Schema.Attribute.Media<'images' | 'videos'>;
    mediaLabel: Schema.Attribute.String;
    mediaPoster: Schema.Attribute.Media<'images'>;
    reverse: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_ctas';
  info: {
    description: 'Call-to-action button.';
    displayName: 'CTA';
    icon: 'cursor';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    style: Schema.Attribute.Enumeration<['primary', 'secondary', 'text']> &
      Schema.Attribute.DefaultTo<'primary'>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMetric extends Struct.ComponentSchema {
  collectionName: 'components_shared_metrics';
  info: {
    description: 'A headline outcome, e.g. 87% / fewer support tickets.';
    displayName: 'Metric';
    icon: 'chartBubble';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Per-entry SEO overrides; separate from the card excerpt.';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 320;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'page.accordion': PageAccordion;
      'page.accordion-item': PageAccordionItem;
      'page.band': PageBand;
      'page.bullet': PageBullet;
      'page.closing': PageClosing;
      'page.collection-list': PageCollectionList;
      'page.demo': PageDemo;
      'page.events-index': PageEventsIndex;
      'page.faq-item': PageFaqItem;
      'page.faq-list': PageFaqList;
      'page.feature-card': PageFeatureCard;
      'page.feature-detail': PageFeatureDetail;
      'page.feature-grid': PageFeatureGrid;
      'page.feature-link': PageFeatureLink;
      'page.feature-link-card': PageFeatureLinkCard;
      'page.final-cta': PageFinalCta;
      'page.hero': PageHero;
      'page.home-hero': PageHomeHero;
      'page.howto-step': PageHowtoStep;
      'page.panel': PagePanel;
      'page.panel-group': PagePanelGroup;
      'page.pillar': PagePillar;
      'page.pillar-card': PagePillarCard;
      'page.pillars': PagePillars;
      'page.pricing-index': PagePricingIndex;
      'page.prose': PageProse;
      'page.quote': PageQuote;
      'page.roadmap-card': PageRoadmapCard;
      'page.roadmap-group': PageRoadmapGroup;
      'page.roadmap-groups': PageRoadmapGroups;
      'page.scale-card': PageScaleCard;
      'page.scale-cards': PageScaleCards;
      'page.section': PageSection;
      'page.split': PageSplit;
      'shared.cta': SharedCta;
      'shared.metric': SharedMetric;
      'shared.seo': SharedSeo;
    }
  }
}
