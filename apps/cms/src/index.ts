import type { Core } from '@strapi/strapi';
import { grantPublicReadPermissions } from './bootstrap/public-permissions';

export default {
  /**
   * Runs before the application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

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
