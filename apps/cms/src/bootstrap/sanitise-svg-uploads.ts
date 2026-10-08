import type { Core } from '@strapi/strapi';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Strips anything executable out of an uploaded SVG, before it is stored.
 *
 * SVG is not an image format in the way PNG is: it is a document that can
 * carry <script>, event handler attributes and javascript: urls, and the media
 * library hands it back to whoever asks for it. That is why `image/svg+xml`
 * sat in the upload plugin's deniedTypes, and why it could not simply be
 * deleted from that list -- the Icon collection needs SVG uploads to work, but
 * not at the cost of hosting someone's script.
 *
 * Cleaning at the point of upload means what is stored is already safe, so the
 * media library, the CMS and anything else that reads the file get the same
 * guarantee rather than each having to re-derive it. The front end sanitises
 * again before inlining, which is deliberate: this protects the stored file,
 * that protects the page, and neither depends on the other being right.
 */

const SVG_MIME = 'image/svg+xml';

/** Mirrors `apps/web/src/lib/icons.ts`; the two run in different packages. */
export function sanitiseSvg(svg: string): string {
  return svg
    /* Anything that executes, including its content. */
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    /* on* handlers: quoted, single-quoted, or bare. */
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

const isSvg = (file: { mime?: string; name?: string }) =>
  file?.mime === SVG_MIME || /\.svg$/i.test(file?.name ?? '');

/**
 * Rewrites the temporary file in place.
 *
 * The provider -- Cloudinary in production, local disk in development -- reads
 * from this path afterwards, so cleaning it here is enough for both without
 * either needing to know.
 */
async function cleanInPlace(strapi: Core.Strapi, file: { filepath?: string; name?: string }) {
  if (!file?.filepath) return;

  try {
    const original = await readFile(file.filepath, 'utf8');
    const cleaned = sanitiseSvg(original);

    if (cleaned !== original) {
      await writeFile(file.filepath, cleaned, 'utf8');
      strapi.log.info(`[svg] stripped executable content from ${file.name ?? file.filepath}`);
    }
  } catch (err) {
    /* Refuse rather than store something unread: an SVG that cannot be
       cleaned is exactly the one not to keep. */
    throw new Error(
      `Could not sanitise ${file.name ?? 'the SVG'}: ${(err as Error).message}`
    );
  }
}

export function sanitiseSvgUploads(strapi: Core.Strapi) {
  const service = strapi.plugin('upload').service('upload') as {
    upload: (args: { data?: unknown; files?: unknown }) => Promise<unknown>;
  };

  const original = service.upload.bind(service);

  service.upload = async (args) => {
    const files = args?.files;
    const list = Array.isArray(files) ? files : files ? [files] : [];

    for (const file of list) {
      if (isSvg(file as { mime?: string; name?: string })) {
        await cleanInPlace(strapi, file as { filepath?: string; name?: string });
      }
    }

    return original(args);
  };

  strapi.log.info('[svg] uploads are sanitised before they are stored');
}
