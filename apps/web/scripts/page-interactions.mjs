/*
 * Extracts interaction state from a live page: what changes on hover, and the
 * transition/animation that carries the change.
 *
 * page-metrics.mjs captures a page at rest, which is why the nav's resting
 * geometry matched while every hover, easing and timing was invented. This
 * drives the real element, samples computed style before and after, and
 * reports the delta plus the transition shorthand that animates it.
 *
 *   node scripts/page-interactions.mjs <url> --hover "<selector>" [--within "<sel>"]
 *   node scripts/page-interactions.mjs <url> --menu "<trigger-sel>"
 *
 * --menu additionally opens each trigger in turn and records the panel's box,
 * which is how you find out whether panels are anchored to their trigger or
 * to the bar.
 */
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const url = args[0];
const get = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const hoverSel = get('--hover');
const menuSel = get('--menu');
const within = get('--within');

const WATCH = [
  'backgroundColor', 'color', 'borderRadius', 'opacity', 'transform', 'boxShadow',
  'borderColor', 'fill', 'stroke', 'scale', 'translate', 'rotate', 'filter',
  'transitionProperty', 'transitionDuration', 'transitionTimingFunction', 'transitionDelay',
  'animationName', 'animationDuration', 'animationTimingFunction',
];

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1512, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

const snap = (sel, idx) =>
  page.evaluate(({ sel, idx, WATCH }) => {
    const el = document.querySelectorAll(sel)[idx];
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const out = { box: `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)},${Math.round(r.top + scrollY)}` };
    for (const p of WATCH) out[p] = cs[p];
    /* The pseudo-elements are where sliding indicators usually live. */
    for (const pe of ['::before', '::after']) {
      const pcs = getComputedStyle(el, pe);
      if (pcs.content && pcs.content !== 'none') {
        out[`${pe}`] = [pcs.content, pcs.backgroundColor, pcs.transform, pcs.transitionProperty, pcs.transitionDuration, pcs.width, pcs.height].join(' | ');
      }
    }
    return out;
  }, { sel, idx, WATCH });

const diff = (a, b) => {
  const out = [];
  for (const k of Object.keys(b || {})) if (String(a?.[k]) !== String(b[k])) out.push([k, a?.[k], b[k]]);
  return out;
};

if (hoverSel) {
  const n = await page.evaluate((s) => document.querySelectorAll(s).length, hoverSel);
  console.log(`${n} element(s) match ${hoverSel}\n`);
  for (let i = 0; i < n; i++) {
    const before = await snap(hoverSel, i);
    if (!before) continue;
    const label = await page.evaluate(({ s, i }) => (document.querySelectorAll(s)[i].innerText || '').replace(/\s+/g, ' ').trim().slice(0, 34), { s: hoverSel, i });
    await page.evaluate(({ s, i }) => document.querySelectorAll(s)[i].dispatchEvent(new MouseEvent('mouseover', { bubbles: true })), { s: hoverSel, i });
    await page.hover(`${hoverSel}:nth-of-type(${i + 1})`).catch(() => {});
    await new Promise((r) => setTimeout(r, 450));
    const after = await snap(hoverSel, i);
    const d = diff(before, after);
    console.log(`[${i}] ${label || '(no text)'}`);
    if (!d.length) console.log('    no computed change on hover');
    for (const [k, x, y] of d) console.log(`    ${k}: ${x}  ->  ${y}`);
    /* Report the transition even when nothing changed; it names what *would* move. */
    if (before.transitionProperty && before.transitionProperty !== 'all' && before.transitionProperty !== 'none') {
      console.log(`    (transition: ${before.transitionProperty} ${before.transitionDuration} ${before.transitionTimingFunction})`);
    }
    await page.mouse.move(5, 500);
    await new Promise((r) => setTimeout(r, 350));
  }
}

if (menuSel) {
  const n = await page.evaluate((s) => document.querySelectorAll(s).length, menuSel);
  console.log(`opening ${n} menu trigger(s): ${menuSel}\n`);
  for (let i = 0; i < n; i++) {
    const label = await page.evaluate(({ s, i }) => (document.querySelectorAll(s)[i].innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24), { s: menuSel, i });
    await page.evaluate(({ s, i }) => {
      const el = document.querySelectorAll(s)[i];
      for (const t of ['pointerenter', 'mouseenter', 'mouseover', 'focus']) {
        el.dispatchEvent(new MouseEvent(t, { bubbles: true }));
      }
      el.click?.();
    }, { s: menuSel, i });
    await new Promise((r) => setTimeout(r, 650));
    const info = await page.evaluate(({ s, i, within }) => {
      const trig = document.querySelectorAll(s)[i];
      const tr = trig.getBoundingClientRect();
      /* The panel is the biggest visible box that is not an ancestor of the trigger. */
      let best = null;
      for (const el of document.querySelectorAll(within || 'header *, nav *, body > div > div')) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width < 300 || r.height < 120) continue;
        if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') continue;
        if (r.top < tr.bottom - 4) continue;
        if (!best || r.width * r.height > best.area) {
          best = { area: r.width * r.height, w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), t: Math.round(r.top), cls: (el.className || '').toString().slice(0, 44), radius: cs.borderTopLeftRadius, shadow: cs.boxShadow.slice(0, 60), bg: cs.backgroundColor };
        }
      }
      const tcs = getComputedStyle(trig);
      return { trigger: { l: Math.round(tr.left), w: Math.round(tr.width), bg: tcs.backgroundColor, radius: tcs.borderTopLeftRadius, color: tcs.color }, panel: best };
    }, { s: menuSel, i, within });
    console.log(`[${i}] ${label}`);
    console.log(`    trigger  left=${info.trigger.l} w=${info.trigger.w} bg=${info.trigger.bg} r=${info.trigger.radius} color=${info.trigger.color}`);
    if (info.panel) {
      console.log(`    panel    left=${info.panel.l} w=${info.panel.w} h=${info.panel.h} right=${info.panel.l + info.panel.w} centre=${Math.round(info.panel.l + info.panel.w / 2)}`);
      console.log(`             radius=${info.panel.radius} bg=${info.panel.bg} .${info.panel.cls}`);
    } else console.log('    panel    not found');
    await page.mouse.move(5, 600);
    await new Promise((r) => setTimeout(r, 400));
  }
}

await browser.close();
