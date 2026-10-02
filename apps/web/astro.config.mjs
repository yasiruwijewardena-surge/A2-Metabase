// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,

  // Static-first, per the brief. Every page is generated at build time; the
  // only client JS is the filter islands.
  output: 'static',

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
