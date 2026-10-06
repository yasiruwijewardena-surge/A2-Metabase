/*
 * The scroll-driven carousel the original pins on Business Intelligence and on
 * Metabase AI: the section sticks to the top of the viewport and its items
 * advance as you scroll a fixed distance, the open item's rail filling by the
 * fraction of its own step you have covered.
 *
 * The original does it with GSAP ScrollTrigger (pin + 3000px). This is a
 * sticky element inside a track of the same height, which needs no library and
 * degrades to a plain click accordion when script is unavailable -- the radios
 * underneath work either way.
 *
 * Both callers pass their own class names because their markup differs; the
 * mechanism is identical and lived in two places before this.
 */
export interface CarouselParts {
  /** The radio per item; the count sets how many steps the scroll has. */
  radio: string;
  /** The bar inside each rail whose height tracks progress through its step. */
  fill: string;
  /** Optional: one shot per item, only the active one shown. */
  shot?: string;
  /** Where the original starts pinning: 769 on Business Intelligence, 992 on
   *  Metabase AI. Below it the section is a plain list. */
  minWidth?: number;
}

const SCRUB = 3000;

export function initScrollCarousel(parts: CarouselParts, scrub = SCRUB) {
  const minWidth = parts.minWidth ?? 992;
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
    const track = root.closest<HTMLElement>('[data-track]');
    const radios = [...root.querySelectorAll<HTMLInputElement>(parts.radio)];
    const fills = [...root.querySelectorAll<HTMLElement>(parts.fill)];
    const shots = parts.shot ? [...root.querySelectorAll<HTMLElement>(parts.shot)] : [];
    if (!track || radios.length < 2) return;

    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);

    const showShot = (i: number) =>
      shots.forEach((el, n) => (el.style.display = n === i ? 'block' : 'none'));

    const arm = () => {
      const on = wide.matches;
      track.toggleAttribute('data-pinned', on);
      if (!on) {
        fills.forEach((f) => (f.style.height = ''));
        showShot(radios.findIndex((r) => r.checked));
      }
      return on;
    };

    const update = () => {
      if (!track.hasAttribute('data-pinned')) return;
      const top = track.getBoundingClientRect().top;
      const progress = Math.min(Math.max(-top / scrub, 0), 1);

      const raw = progress * radios.length;
      const active = Math.min(Math.floor(raw), radios.length - 1);
      const within = raw - active;

      if (!radios[active].checked) radios[active].checked = true;
      showShot(active);
      fills.forEach((f, i) => {
        f.style.height = i < active ? '100%' : i > active ? '0%' : `${within * 100}%`;
      });
    };

    /* A click still picks an item; the next scroll takes over again. */
    radios.forEach((r) => r.addEventListener('change', () => showShot(radios.indexOf(r))));

    arm();
    showShot(radios.findIndex((r) => r.checked));
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', () => { arm(); update(); }, { passive: true });
  });
}
