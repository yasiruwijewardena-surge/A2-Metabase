/**
 * The site's icon set, resolved from the CMS at build time.
 *
 * These used to be a hardcoded map inside NavIcon.astro, which meant an editor
 * could only use artwork a developer had already pasted into the component and
 * had to guess the key for it from nothing. The artwork now lives in the Icon
 * collection, so adding one is an upload.
 *
 * The markup is inlined rather than pointed at with <img src>, because every
 * icon draws itself in `currentColor`: that is what lets a nav row's hover
 * colour carry into the icon sitting inside it. An <img> cannot inherit colour
 * and would sit there in fixed black while its neighbours changed.
 *
 * Everything here runs during the build, so the fetches cost nothing at
 * runtime and the result is baked into the HTML.
 */
import { BASE, getIcons } from './strapi';
import type { IconSet } from './types';

export interface ResolvedIcon {
  /** The root element's own viewBox, kept because they are not all 24x24. */
  box: string;
  /** Everything inside <svg>, ready to inline. */
  body: string;
}

/*
 * SVG is an executable document format: it can carry <script>, event handler
 * attributes and javascript: urls, and inlining it puts all of that in the
 * page as if we had written it. The admin is trusted, but "trusted" is not a
 * security model -- and the whole point of this change is that people other
 * than developers now supply these files.
 */
function sanitise(svg: string): string {
  return svg
    /* Anything that executes, including its content. */
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    /* on* handlers, quoted or bare. */
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '')
    /* The value class excludes `/` so a self-closing tag survives:
       `onclick=alert(1)/>` must lose the handler, not the slash that
       closes the element. */
    .replace(/\s+on[a-z]+\s*=\s*[^\s"'>\/]+/gi, '')
    /* javascript: in href/xlink:href. */
    .replace(/(href\s*=\s*")\s*javascript:[^"]*"/gi, '$1#"')
    .replace(/(href\s*=\s*')\s*javascript:[^']*'/gi, "$1#'");
}

/*
 * Several icons reference their own <filter> and <clipPath> by id. Ids are
 * document-global, so two icons that both call theirs "a" collide the moment
 * they appear on the same page and the second one renders with the first one's
 * filter. Namespacing by key keeps each icon's internals to itself.
 */
function namespaceIds(svg: string, key: string): string {
  const seen = new Set<string>();
  const prefix = `i-${key.replace(/[^a-zA-Z0-9]+/g, '-')}-`;

  for (const m of svg.matchAll(/\sid\s*=\s*"([^"]+)"/g)) seen.add(m[1]);
  if (seen.size === 0) return svg;

  let out = svg;
  for (const id of seen) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out
      .replace(new RegExp(`(\\sid\\s*=\\s*")${esc}(")`, 'g'), `$1${prefix}${id}$2`)
      .replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#${prefix}${id})`)
      .replace(new RegExp(`((?:xlink:)?href\\s*=\\s*")#${esc}(")`, 'g'), `$1#${prefix}${id}$2`);
  }
  return out;
}

/** Splits a document into its viewBox and its contents. */
function parse(svg: string, key: string): ResolvedIcon | null {
  const open = svg.match(/<svg\b[^>]*>/i);
  const close = svg.lastIndexOf('</svg>');
  if (!open || close === -1) return null;

  const box = open[0].match(/viewBox\s*=\s*"([^"]+)"/i)?.[1] ?? '0 0 24 24';
  const body = svg.slice(open.index! + open[0].length, close).trim();

  return { box, body: namespaceIds(body, key) };
}

/* The same word is different artwork in different places -- `cloud` is a cloud
   in the menus and a cube on a product pillar -- so a lookup is a set and a
   key, never a key alone. */
const at = (set: IconSet, key: string) => `${set}:${key}`;

let registry: Promise<Map<string, ResolvedIcon>> | undefined;

async function build(): Promise<Map<string, ResolvedIcon>> {
  const out = new Map<string, ResolvedIcon>();

  /* The CMS is deployed before the site is built, but if the two ever get out
     of step the collection will not exist yet. Losing the icons is bad; failing
     the whole build over it is worse. */
  let icons: Awaited<ReturnType<typeof getIcons>>;
  try {
    icons = await getIcons();
  } catch (err) {
    console.warn(`[icons] could not read the Icon collection: ${(err as Error).message}`);
    return out;
  }

  if (icons.length === 0) {
    console.warn(
      '[icons] the Icon collection is empty, so nothing will render an icon. '
      + 'Run `npm run seed --workspace apps/cms` to load the set.'
    );
    return out;
  }

  await Promise.all(
    icons.map(async (icon) => {
      if (!icon.svg?.url) return;

      /* Cloudinary hands back an absolute url; a local upload is site-relative. */
      const url = icon.svg.url.startsWith('http') ? icon.svg.url : BASE + icon.svg.url;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const parsed = parse(sanitise(await res.text()), icon.key);
        if (parsed) out.set(at(icon.set, icon.key), parsed);
        else console.warn(`[icons] ${icon.set}/${icon.key} is not an SVG document, skipped`);
      } catch (err) {
        console.warn(`[icons] could not read ${icon.set}/${icon.key}: ${(err as Error).message}`);
      }
    })
  );

  return out;
}

/** The whole set, fetched once per build. */
export function iconRegistry(): Promise<Map<string, ResolvedIcon>> {
  registry ??= build();
  return registry;
}

/*
 * A key that resolves to nothing used to render nothing at all, silently, so a
 * typo looked like a styling bug rather than a mistake. Say so once per key.
 */
const warned = new Set<string>();

export async function resolveIcon(
  name: string,
  set: IconSet = 'nav'
): Promise<ResolvedIcon | undefined> {
  const reg = await iconRegistry();
  const found = reg.get(at(set, name));

  if (!found && !warned.has(at(set, name))) {
    warned.add(at(set, name));
    const known = [...reg.keys()]
      .filter((k) => k.startsWith(`${set}:`))
      .map((k) => k.slice(set.length + 1))
      .sort()
      .join(', ');
    console.warn(`[icons] no "${name}" in the ${set} set. Available: ${known || '(none)'}`);
  }

  return found;
}
