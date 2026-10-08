import type { Core } from '@strapi/strapi';

/**
 * Content types the Astro front end reads at build time.
 *
 * The public role needs `find` and `findOne` on each. Doing this in code rather
 * than through the admin UI means a fresh clone (or a fresh Railway database)
 * comes up with a working read API without anyone having to remember a
 * checklist of checkboxes.
 */
const PUBLIC_READ_APIS = [
  'api::author.author',
  'api::case-study.case-study',
  'api::category.category',
  'api::company.company',
  'api::event.event',
  'api::event-category.event-category',
  'api::glossary-term.glossary-term',
  'api::faq.faq',
  'api::icon.icon',
  'api::industry.industry',
  'api::page.page',
  'api::person.person',
  'api::plan.plan',
  'api::pricing-addon.pricing-addon',
  'api::post.post',
  'api::tag.tag',
  'api::testimonial.testimonial',
  'api::use-case.use-case',
  'api::site-setting.site-setting',
] as const;

const READ_ACTIONS = ['find', 'findOne'] as const;

export async function grantPublicReadPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[permissions] no public role found; skipping');
    return;
  }

  const wanted = PUBLIC_READ_APIS.flatMap((uid) =>
    READ_ACTIONS.map((action) => `${uid}.${action}`)
  );

  const existing = await strapi.query('plugin::users-permissions.permission').findMany({
    where: { role: publicRole.id, action: { $in: wanted } },
  });
  const have = new Set(existing.map((p: { action: string }) => p.action));

  const missing = wanted.filter((action) => !have.has(action));
  if (missing.length === 0) {
    strapi.log.info(`[permissions] public read already granted (${wanted.length} actions)`);
    return;
  }

  await Promise.all(
    missing.map((action) =>
      strapi.query('plugin::users-permissions.permission').create({
        data: { action, role: publicRole.id },
      })
    )
  );

  strapi.log.info(`[permissions] granted ${missing.length} public read actions`);
}
