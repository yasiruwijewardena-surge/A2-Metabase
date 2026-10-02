/**
 * Cloudinary delivery helpers.
 *
 * Media already lives on Cloudinary, so transformation happens there rather
 * than in the Astro build. Three reasons that is the better trade here:
 *
 *  - SVG. Astro cannot resize vector images, so running them through its
 *    responsive pipeline emits one identical copy per requested width. Seven
 *    SVG covers became 6.7 MB of duplicated assets, one of them 1.3 MB copied
 *    four times. `f_auto` rasterises them instead.
 *  - Build time. 136 source images no longer go through sharp.
 *  - Delivery. `f_auto` negotiates AVIF/WebP per browser; `q_auto` picks a
 *    quality per image rather than a fixed guess.
 *
 * The original site does none of this: it serves one full-size original to
 * every viewport, which is why a 36x36 avatar costs 42 KB there. See
 * SITE-ANALYSIS.md §2.
 */

const UPLOAD = '/image/upload/';

/** Inserts transformations into a Cloudinary delivery URL. */
export function cld(url: string, transform: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes(UPLOAD)) return url;
  const [head, tail] = url.split(UPLOAD);
  return `${head}${UPLOAD}${transform}/${tail}`;
}

/** `c_limit` never upscales, so a small source stays small. */
const at = (url: string, w: number, extra = '') =>
  cld(url, `f_auto,q_auto,c_limit,w_${w}${extra}`);

export function srcset(url: string, widths: number[], extra = ''): string {
  return widths.map((w) => `${at(url, w, extra)} ${w}w`).join(', ');
}

export const src = at;

/** Fixed-size assets such as avatars: 1x and 2x, cropped to a square. */
export function avatarSet(url: string, size: number): { src: string; srcset: string } {
  const t = (w: number) => cld(url, `f_auto,q_auto,c_fill,g_face,w_${w},h_${w}`);
  return { src: t(size), srcset: `${t(size)} 1x, ${t(size * 2)} 2x` };
}
