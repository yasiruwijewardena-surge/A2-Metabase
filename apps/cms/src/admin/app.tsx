import type { StrapiApp } from '@strapi/strapi/admin';

/*
 * The Content Manager draws a marker beside every content type in its left
 * list -- an empty `aria-hidden` span inside each nav link, which reads as a
 * bullet. It carries no information, so it is hidden here.
 *
 * Targeted by shape rather than by class: those classes are styled-components
 * hashes (`sc-kHxSrM`) that change whenever the admin is rebuilt. An empty,
 * aria-hidden span inside a Content Manager nav link is stable, and hiding
 * something already hidden from assistive tech costs nothing.
 */
const HIDE_NAV_MARKERS = `
  a[href*="/admin/content-manager/"] span[aria-hidden="true"]:empty {
    display: none;
  }
`;

export default {
  config: {},

  bootstrap() {
    if (typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.setAttribute('data-source', 'site-admin-tweaks');
    style.textContent = HIDE_NAV_MARKERS;
    document.head.appendChild(style);
  },
};
