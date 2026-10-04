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

export interface PageHero extends Struct.ComponentSchema {
  collectionName: 'components_page_heros';
  info: {
    description: 'The top band: eyebrow, headline, standfirst, buttons, artwork and the cards beneath it. `mediaMobile` is the squarer crop the original serves under 992px, which is also what keeps mobile LCP inside budget. The trust logos are template chrome rather than fields: they are the same brand strip on every product page, and the upload provider refuses SVG.';
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
    trustLine: Schema.Attribute.String;
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
        maxLength: 170;
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
      'page.hero': PageHero;
      'page.pillar': PagePillar;
      'page.quote': PageQuote;
      'page.section': PageSection;
      'page.split': PageSplit;
      'shared.cta': SharedCta;
      'shared.metric': SharedMetric;
      'shared.seo': SharedSeo;
    }
  }
}
