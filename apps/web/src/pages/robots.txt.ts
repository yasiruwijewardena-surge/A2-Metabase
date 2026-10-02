import type { APIRoute } from 'astro';

/**
 * Generated rather than static: the sitemap reference has to be an absolute
 * URL. A relative one is what PSI reports as "robots.txt is not valid".
 */
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
