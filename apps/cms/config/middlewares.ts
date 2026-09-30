import type { Core } from '@strapi/strapi';

// Cloudinary serves media from res.cloudinary.com, so the default
// Content-Security-Policy (which only allows 'self' and the Strapi host) has to
// be widened or the admin panel renders broken thumbnails.
const mediaSrc = ["'self'", 'data:', 'blob:', 'market-assets.strapi.io', 'res.cloudinary.com'];

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': mediaSrc,
          'media-src': mediaSrc,
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      // The Astro front end fetches this API at build time and, for previews,
      // from the browser. Set FRONTEND_URL in each environment.
      origin: (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '*')
        .split(',')
        .map((s) => s.trim()),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
