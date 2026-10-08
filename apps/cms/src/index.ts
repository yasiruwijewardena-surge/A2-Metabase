import type { Core } from '@strapi/strapi';
import { grantPublicReadPermissions } from './bootstrap/public-permissions';

export default {
  /**
   * Runs before the application is initialized.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    /*
     * The users-permissions plugin ships a `User` collection for people who
     * authenticate against the API. This site has no such people -- it is a
     * public, read-only build -- so the entry is always empty and reads as an
     * unfinished feature next to the real content types. Hidden here rather
     * than by disabling the plugin, which also owns the public role that
     * grants the Astro build its read access.
     */
    const user = strapi.contentType('plugin::users-permissions.user');
    user.pluginOptions = {
      ...(user.pluginOptions ?? {}),
      'content-manager': { visible: false },
    };
  },

  /**
   * Runs before the application starts serving requests.
   *
   * Grants the public role read access to the content types the Astro build
   * consumes, so a fresh database is immediately usable.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicReadPermissions(strapi);
  },
};
