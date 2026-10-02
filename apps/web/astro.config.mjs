// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL ?? 'http://localhost:4321';

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
