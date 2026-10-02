// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * Canonical origin for canonical links and the sitemap.
 *
 * Railway's `RAILWAY_PUBLIC_DOMAIN` is only populated at runtime, so a variable
 * set to `https://${{RAILWAY_PUBLIC_DOMAIN}}` arrives here as the bare string
 * "https://" during the build and Astro rejects it with just "Invalid URL".
 * Resolve it explicitly instead, and say which source was used.
 */
function resolveSite() {
  const candidates = [
    ['SITE_URL', process.env.SITE_URL],
    ['RAILWAY_PUBLIC_DOMAIN', process.env.RAILWAY_PUBLIC_DOMAIN],
  ];

  for (const [name, raw] of candidates) {
    const value = raw?.trim();
    if (!value || value === 'https://' || value === 'http://') continue;
    const withScheme = /^https?:\/\//.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      console.warn(`[config] ${name} is not a valid URL ("${value}"), ignoring it.`);
    }
  }

  console.warn(
    '[config] No usable SITE_URL. Falling back to http://localhost:4321, so ' +
    'canonical links and the sitemap will be wrong in a deployed build. Set ' +
    'SITE_URL to the literal site origin.'
  );
  return 'http://localhost:4321';
}

const site = resolveSite();

export default defineConfig({
  site,

  // Static-first, per the brief. Every page is generated at build time; the
  // only client JS is the filter islands.
  output: 'static',

  integrations: [
    sitemap({
      // Empty filter combinations are noindex'd in the page head; keep them out
      // of the sitemap too.
      filter: (page) => !page.includes('/404'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    // Media lives on Cloudinary. Astro still processes it, so we get responsive
    // variants and correct width/height rather than the original's unsized,
    // full-resolution delivery.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },

  build: {
    inlineStylesheets: 'auto',
  },
});
