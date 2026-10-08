/**
 * Re-links nav icons after the field became a relation.
 *
 *   set -a && . ./.env.seed && set +a && node seed/link-nav-icons.js
 *
 * `nav.link.icon` used to be a typed-in key. Turning it into a relation to the
 * Icon collection drops the old column, so every menu entry in an existing
 * database comes out of the migration with no icon at all.
 *
 * The full seeder would fix that by rewriting site settings from
 * seed/data/site-settings.json, but that also discards whatever an editor has
 * changed since -- including an unpublished draft. This touches the icon field
 * and nothing else: it matches each live menu entry to the seed data by group
 * and label, and links the icon that entry was always meant to have. Entries
 * that are not in the seed data, or that already have an icon, are left alone.
 *
 * Runs over the draft and the published version, because they are separate
 * rows and a publish would otherwise put the empty icons straight back.
 *
 * Idempotent, and safe to run once the icons are already linked.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const UID = 'api::site-setting.site-setting';

/* group key + label is what identifies a menu entry across the two versions;
   the label alone is not unique (Business Intelligence is in two menus). */
const at = (groupKey, label) => `${groupKey}\u0000${label}`;

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'warn';

  try {
    const seed = JSON.parse(
      readFileSync(join(__dirname, 'data', 'site-settings.json'), 'utf8')
    );

    const wanted = new Map();
    for (const group of seed.navGroups ?? []) {
      for (const item of group.items ?? []) {
        if (typeof item.icon === 'string' && item.icon) {
          wanted.set(at(group.key, item.label), item.icon);
        }
      }
    }

    const icons = await app.documents('api::icon.icon').findMany({
      filters: { set: 'nav' }, status: 'published', limit: -1,
    });
    const iconByKey = new Map(icons.map((i) => [i.key, i.documentId]));
    console.log(`\n  ${iconByKey.size} icons in the nav set, ${wanted.size} menu entries in the seed data\n`);

    for (const status of ['draft', 'published']) {
      const doc = await app.documents(UID).findFirst({
        status,
        populate: { navGroups: { populate: { items: { populate: ['icon'] } } } },
      });

      if (!doc) {
        console.log(`  ${status}: no site settings, skipped`);
        continue;
      }

      let linked = 0, already = 0, unknown = 0;

      /*
       * Written back without the component ids the fetch returned. The draft
       * and the published version are separate rows with separate components,
       * so handing the published write a draft's ids fails with "some of the
       * provided components are not related to the entity". Every field is
       * supplied, so letting Strapi rebuild them loses nothing.
       */
      const strip = ({ id, documentId, ...rest }) => rest;

      const navGroups = (doc.navGroups ?? []).map((group) => ({
        ...strip(group),
        items: (group.items ?? []).map((item) => {
          const rest = strip(item);

          if (item.icon) { already += 1; return { ...rest, icon: item.icon.documentId }; }

          const key = wanted.get(at(group.key, item.label));
          const iconId = key && iconByKey.get(key);

          if (!iconId) {
            if (key) console.log(`    ! no "${key}" icon for ${item.label}`);
            unknown += 1;
            return { ...rest, icon: null };
          }

          linked += 1;
          return { ...rest, icon: iconId };
        }),
      }));

      if (linked > 0) {
        await app.documents(UID).update({
          documentId: doc.documentId, status, data: { navGroups },
        });
      }

      console.log(`  ${status.padEnd(9)} linked ${linked}, already set ${already}, left alone ${unknown}`);
    }

    console.log('');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error('\n  Failed:', err.message, '\n');
  process.exit(1);
});
