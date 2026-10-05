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

/** Fixed-size landscape crops, such as the 84x50 portraits beside the BI pull quotes. */
export function thumbSet(url: string, w: number, h: number): { src: string; srcset: string } {
  const t = (s: number) => cld(url, `f_auto,q_auto,c_fill,g_face,w_${w * s},h_${h * s}`);
  return { src: t(1), srcset: `${t(1)} 1x, ${t(2)} 2x` };
}

export interface PreloadAttrs { href: string; imagesrcset?: string; imagesizes?: string }

/**
 * Preload descriptor for a plain local image — a hero still or a video
 * poster that carries no srcset. The srcset trap `preloadFor` guards against
 * cannot happen here, because there is only one candidate to pick.
 */
export function preloadStatic(href: string | null | undefined): PreloadAttrs | null {
  return href ? { href } : null;
}

/**
 * Preload descriptor for an LCP image.
 *
 * A bare `href` preload is a trap when the <img> carries a srcset: the browser
 * preloads one candidate and then picks a different one from the srcset,
 * downloading the image twice. `imagesrcset`/`imagesizes` must mirror the <img>
 * exactly, so both come from the same helpers CldImage uses.
 */
/** A preload for a fixed-size slot served at 1x/2x, matching a density srcset. */
export function preloadAt(url: string | null | undefined, w: number): PreloadAttrs | null {
  if (!url) return null;
  return { href: at(url, w), imagesrcset: `${at(url, w)} 1x, ${at(url, w * 2)} 2x` };
}

export function preloadFor(
  url: string | null | undefined,
  widths: number[] = [400, 760, 1140],
  sizes = '(max-width: 992px) 100vw, 760px',
): PreloadAttrs | null {
  if (!url) return null;
  return {
    href: at(url, widths[widths.length - 1]),
    imagesrcset: srcset(url, widths),
    imagesizes: sizes,
  };
}
