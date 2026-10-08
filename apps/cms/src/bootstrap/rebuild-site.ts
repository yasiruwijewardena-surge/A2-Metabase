import type { Core } from '@strapi/strapi';

/*
 * The web app is a static Astro build: content is fetched once, at build time,
 * and baked into HTML. So a content change is only visible after the site is
 * rebuilt -- a plain redeploy would serve the same stale pages.
 *
 * This asks Railway to rebuild the web service from source whenever content
 * changes, debounced so a burst of edits costs one build rather than twenty.
 *
 * It does nothing unless all three variables are set, which keeps local
 * development and a fresh clone from trying to deploy anything.
 */

const TOKEN = process.env.RAILWAY_API_TOKEN;
const SERVICE_ID = process.env.RAILWAY_WEB_SERVICE_ID;
const ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;

/*
 * How long to wait before asking for the build. Publishing is a deliberate,
 * one-at-a-time act rather than a stream of keystrokes, so this only needs to
 * be long enough to collect someone publishing a handful of entries in a row.
 */
const QUIET_MS = Number(process.env.REBUILD_DEBOUNCE_MS ?? 5_000);

/* Overridable so the trigger can be pointed at a stub and asserted on. */
const ENDPOINT = process.env.RAILWAY_API_URL ?? 'https://backboard.railway.com/graphql/v2';

/* `serviceInstanceDeployV2` builds the service's latest commit. Its sibling,
 * `redeploy`, re-runs the existing image -- which for this site would put the
 * same already-built HTML back up. */
const MUTATION = `
  mutation RebuildSite($serviceId: String!, $environmentId: String!) {
    serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
  }
`;

async function askRailwayToRebuild(strapi: Core.Strapi, reason: string) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        query: MUTATION,
        variables: { serviceId: SERVICE_ID, environmentId: ENVIRONMENT_ID },
      }),
    });

    const body = (await res.json()) as { errors?: { message: string }[] };

    if (!res.ok || body.errors?.length) {
      const why = body.errors?.map((e) => e.message).join('; ') ?? `HTTP ${res.status}`;
      strapi.log.error(`[rebuild] Railway refused the build: ${why}`);
      return;
    }

    strapi.log.info(`[rebuild] asked Railway to rebuild the site (${reason})`);
  } catch (err) {
    /* A failed build request must never take the CMS down with it: the admin
     * stays usable and the next content change tries again. */
    strapi.log.error(`[rebuild] could not reach Railway: ${(err as Error).message}`);
  }
}

export function rebuildSiteOnContentChange(strapi: Core.Strapi) {
  if (!TOKEN || !SERVICE_ID || !ENVIRONMENT_ID) {
    strapi.log.info(
      '[rebuild] not configured, so content changes will not trigger a build. '
      + 'Set RAILWAY_API_TOKEN, RAILWAY_WEB_SERVICE_ID and RAILWAY_ENVIRONMENT_ID to turn it on.'
    );
    return;
  }

  /*
   * Only these change what a visitor sees. Saving a draft does not: the site
   * reads published content, so rebuilding on every keystroke-driven autosave
   * spent a minute of build time to publish nothing. That is what the
   * entity-level lifecycle hooks did before.
   */
  const PUBLISHES = new Set(['publish', 'unpublish', 'delete']);

  let timer: NodeJS.Timeout | undefined;
  let reasons: string[] = [];

  const bump = (what: string) => {
    reasons.push(what);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const n = reasons.length;
      const first = reasons[0];
      reasons = [];
      timer = undefined;
      void askRailwayToRebuild(strapi, n === 1 ? first : `${first} and ${n - 1} more`);
    }, QUIET_MS);
    /* Node should not stay alive just to fire this. */
    timer.unref?.();
  };

  /*
   * Document Service middleware rather than database lifecycles, because only
   * this layer knows the difference between saving a draft and publishing it.
   */
  strapi.documents.use(async (context, next) => {
    const result = await next();

    if (context.uid?.startsWith('api::') && PUBLISHES.has(context.action)) {
      bump(`${context.action} ${context.uid.split('.').pop()}`);
    }

    return result;
  });

  strapi.log.info(
    `[rebuild] watching publish, unpublish and delete; `
    + `a build follows ${QUIET_MS / 1000}s after the last one`
  );
}
