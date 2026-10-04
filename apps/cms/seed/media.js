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
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

const cache = new Map();
/* Source urls answered from a previous run's upload rather than re-fetched,
   so the summary can tell attaching apart from uploading. */
const reused = new Set();
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
  if (existing) { cache.set(url, existing.id); reused.add(url); return existing.id; }

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

/**
 * The same thing for a file the repository already carries, used for the event
 * category artwork. Those images are the one case where fetching from the
 * original's CDN would be the wrong source: it serves them under four different
 * extensions and two naming conventions (`Meetabase-tall.webp`,
 * `Conference-tall.png`, `ai-analytics-week-tall-v2.webp`), so the converted
 * webp copies in `seed/assets` are both tidier and not a seed-time dependency
 * on someone else's CDN.
 *
 * Dedupe is by name against the upload library, exactly as above, so re-seeding
 * attaches the existing file rather than uploading a second copy.
 */
async function uploadFromPath(app, filepath) {
  const key = `file://${filepath}`;
  if (cache.has(key)) return cache.get(key);

  const ext = extname(filepath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) { cache.set(key, undefined); return undefined; }

  // Named from the path below `images/`, not the basename, for the same reason
  // `uploadFromUrl` does it: `hero.webp` and `poster.webp` exist under several
  // directories, and deduping on the basename alone silently attaches whichever
  // one reached the library first.
  const marker = ['/images/', '/assets/'].find((m) => filepath.includes(m));
  const rel = marker ? filepath.slice(filepath.lastIndexOf(marker) + marker.length)
                     : basename(filepath);
  const name = rel.slice(0, rel.length - ext.length)
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') + ext;

  const [existing] = await app.db.query('plugin::upload.file').findMany({
    where: { name }, limit: 1,
  });
  if (existing) { cache.set(key, existing.id); reused.add(key); return existing.id; }

  let size;
  try {
    size = statSync(filepath).size;
  } catch (err) {
    console.log(`      image missing (${err.code}): ${name}`);
    cache.set(key, undefined);
    return undefined;
  }

  const [file] = await app.plugin('upload').service('upload').upload({
    data: {},
    files: { filepath, originalFilename: name, mimetype: mime, size },
  });

  cache.set(key, file.id);
  return file.id;
}

const mediaStats = () => ({
  unique: cache.size,
  attached: [...cache.values()].filter(Boolean).length,
  reused: reused.size,
  uploaded: [...cache.values()].filter(Boolean).length - reused.size,
});

module.exports = { uploadFromUrl, uploadFromPath, mediaStats };
