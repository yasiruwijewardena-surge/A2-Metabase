/**
 * Downloads an image once and uploads it through Strapi's upload service, so it
 * lands wherever the upload provider points - local disk in development,
 * Cloudinary in production. Results are cached by source URL within a run, and
 * existing files are matched by name so re-seeding does not re-upload.
 */
const { writeFileSync, mkdtempSync, statSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, basename, extname } = require('node:path');

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

const cache = new Map();
let dir;

async function uploadFromUrl(app, url, { skip = false } = {}) {
  if (!url || skip) return undefined;
  if (cache.has(url)) return cache.get(url);

  // Name from the whole path, not just the basename: the CDN reuses names like
  // header-image.jpg under different directories, and deduping on basename
  // alone would collapse genuinely different images into one.
  const path = new URL(url).pathname.replace(/^\/images\//, '').replace(/^\//, '');
  const ext = extname(path).toLowerCase();
  const mime = MIME[ext];
  if (!mime) { cache.set(url, undefined); return undefined; }
  const name = path.slice(0, -ext.length).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') + ext;

  // already uploaded in a previous run?
  const [existing] = await app.db.query('plugin::upload.file').findMany({
    where: { name }, limit: 1,
  });
  if (existing) { cache.set(url, existing.id); return existing.id; }

  let buf;
  try {
    // Bounded: a CDN that accepts the connection and then never sends a body
    // will hang the whole run, and an unattended seed looks identical to a
    // slow one. 30s is far more than any of these assets needs.
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.log(`      image skipped (${err.message}): ${name}`);
    cache.set(url, undefined);
    return undefined;
  }

  dir ??= mkdtempSync(join(tmpdir(), 'seed-media-'));
  const filepath = join(dir, name);
  writeFileSync(filepath, buf);

  const [file] = await app.plugin('upload').service('upload').upload({
    data: {},
    files: { filepath, originalFilename: name, mimetype: mime, size: statSync(filepath).size },
  });

  cache.set(url, file.id);
  return file.id;
}

const mediaStats = () => ({ unique: cache.size, uploaded: [...cache.values()].filter(Boolean).length });

module.exports = { uploadFromUrl, mediaStats };
