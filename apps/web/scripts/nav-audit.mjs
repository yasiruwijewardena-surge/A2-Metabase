/**
 * The navigation, compared in full against the original.
 *
 * The nav is the one component on every page, so it is the thing worth getting
 * exactly right first. This opens each menu on both sites and reports the panel
 * box, every row's label and icon, and what changes on hover.
 *
 *   npm run nav
 *   npm run nav -- --menu product
 *   npm run nav -- --hover
 *
 * Icons are identified by their geometry rather than by taking the first svg in
 * the link: a card can hold both an illustration and a trailing arrow, and
 * "first" quietly picks the arrow.
 */
import { launch } from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ORIGINAL = 'https://www.metabase.com';
const REPLICA = process.env.PSI_SITE || 'https://elegant-spontaneity-production-28e1.up.railway.app';
const MENUS = ['product', 'features', 'docs', 'resources', 'pricing'];

const argv = process.argv.slice(2);
const only = argv.includes('--menu') ? argv[argv.indexOf('--menu') + 1] : null;
const doHover = argv.includes('--hover');
const menus = only ? [only] : MENUS;

function readPanel(which) {
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    const c = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none';
  };

  /* The original keeps all five panels in the DOM and measurable at once -- it
     closes them by clipping a parent, not by hiding them -- so picking "the
     visible block under the bar" returns whichever is widest and the Product
     menu reads back as Docs. They are `.nav-menu.overflow-hidden` in menu
     order, so each is addressed directly instead. */
  const panel = which.orig
    ? document.querySelectorAll('.nav-menu.overflow-hidden')[which.index]
    : document.querySelector(`[data-panel="${which.menu}"], #nav-panel-${which.menu}`)
      || [...document.querySelectorAll('[data-open]')].pop();
  if (!panel) return { error: 'no panel' };

  const pc = getComputedStyle(panel);
  const pr = panel.getBoundingClientRect();

  const rows = [...panel.querySelectorAll('a')].filter(vis).map((a) => {
    const ar = a.getBoundingClientRect();
    /* The icon is the biggest artwork in the row, not the first: a card holds
       both an illustration and a trailing arrow, and "first" picks the arrow. */
    const arts = [...a.querySelectorAll('svg,img')].filter(vis)
      .map((g) => ({ g, r: g.getBoundingClientRect() }))
      .sort((x, y) => y.r.width * y.r.height - x.r.width * x.r.height);
    const icon = arts[0];
    const leaf = [...a.querySelectorAll('*')].find((e) => e.children.length === 0 && norm(e.textContent)) || a;
    const lc = getComputedStyle(leaf);
    const ac = getComputedStyle(a);
    return {
      label: norm(leaf.textContent).slice(0, 34),
      rowBox: Math.round(ar.width) + 'x' + Math.round(ar.height),
      rowPad: ac.padding,
      gap: ac.gap,
      font: lc.fontSize + '/' + lc.lineHeight + '/' + lc.fontWeight,
      color: lc.color,
      icon: icon ? {
        kind: icon.g.tagName.toLowerCase(),
        box: Math.round(icon.r.width) + 'x' + Math.round(icon.r.height),
        shapes: icon.g.querySelectorAll('path,circle,rect,ellipse,line,polygon').length,
        src: icon.g.tagName === 'IMG' ? (icon.g.currentSrc || '').split('/').pop() : '',
        stroke: icon.g.querySelector('path,circle,rect')
          ? getComputedStyle(icon.g.querySelector('path,circle,rect')).stroke : '',
      } : null,
      arts: arts.length,
    };
  });

  return {
    panel: {
      box: Math.round(pr.width) + 'x' + Math.round(pr.height),
      bg: pc.backgroundColor, radius: pc.borderRadius,
      shadow: pc.boxShadow.slice(0, 56), pad: pc.padding,
    },
    rows,
  };
}

async function open(p, site, menu, index) {
  if (site === 'orig') {
    /* The original's panels are always in the DOM but are clipped shut, so
       reading one without opening it returns the collapsed geometry -- every
       box a few pixels short, and a rotated illustration measured before the
       rotation. It only opens on a real pointer, not a dispatched click, so
       the mouse has to go to the trigger and stay there. */
    const t = await p.evaluate((i) => {
      const e = document.querySelectorAll('[id$="-nav-button-desktop"]')[i];
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, index);
    if (!t) return { error: `no trigger ${menu}` };
    await p.mouse.move(t.x, t.y, { steps: 10 });
    await new Promise((r) => setTimeout(r, 1100));
    return p.evaluate(readPanel, { orig: true, index });
  }
  /* This build hides its panels properly, so they do have to be opened. */
  const ok = await p.evaluate((menu) => {
    const t = document.querySelector(`[data-menu="${menu}"]`);
    if (!t) return false;
    t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return true;
  }, menu);
  if (!ok) return { error: `no trigger for ${menu}` };
  await new Promise((r) => setTimeout(r, 500));
  return p.evaluate(readPanel, { orig: false, menu });
}

async function close(p) {
  await p.evaluate(() => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));
}

async function trigger(p, site, menu) {
  const sel = site === 'orig' ? `#${menu}-nav-button-desktop` : `[data-menu="${menu}"]`;
  return p.evaluate((sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    const leaf = [...e.querySelectorAll('*')].find((x) => x.children.length === 0 && x.textContent.trim()) || e;
    const c = getComputedStyle(leaf);
    const ec = getComputedStyle(e);
    return {
      box: Math.round(r.width) + 'x' + Math.round(r.height), x: Math.round(r.left),
      font: c.fontSize + '/' + c.lineHeight + '/' + c.fontWeight, color: c.color,
      pad: ec.padding, bg: ec.backgroundColor, radius: ec.borderRadius,
    };
  }, sel);
}

const browser = await launch({
  executablePath: CHROME, headless: true, args: ['--no-sandbox'],
  protocolTimeout: 180000,
});
const pages = {};
for (const [k, url] of [['orig', ORIGINAL], ['mine', REPLICA]]) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1512, height: 1200 });
  await p.goto(url + '/', { waitUntil: 'networkidle2', timeout: 120000 });
  pages[k] = p;
}

const pad = (s, n) => String(s ?? '-').padEnd(n);

for (const menu of menus) {
  console.log('\n' + '='.repeat(78));
  console.log(menu.toUpperCase());
  console.log('='.repeat(78));

  const to = await trigger(pages.orig, 'orig', menu);
  const tm = await trigger(pages.mine, 'mine', menu);
  if (to && tm) {
    console.log('trigger');
    for (const k of Object.keys(to)) {
      if (to[k] !== tm[k]) console.log(`  ${pad(k, 8)} ${pad(to[k], 30)} -> ${tm[k]}`);
    }
  }

  const o = await open(pages.orig, 'orig', menu, MENUS.indexOf(menu));
  const m = await open(pages.mine, 'mine', menu, MENUS.indexOf(menu));
  await close(pages.mine);
  if (o.error || m.error) { console.log(`  panel: orig ${o.error || 'ok'}, mine ${m.error || 'ok'}`); continue; }

  console.log('panel');
  for (const k of Object.keys(o.panel)) {
    if (o.panel[k] !== m.panel[k]) console.log(`  ${pad(k, 8)} ${pad(o.panel[k], 30)} -> ${m.panel[k]}`);
  }

  console.log(`rows: original ${o.rows.length}, mine ${m.rows.length}`);
  const byLabel = new Map(m.rows.map((r) => [r.label.toLowerCase(), r]));
  for (const a of o.rows) {
    const b = byLabel.get(a.label.toLowerCase());
    if (!b) { console.log(`  MISSING  "${a.label}"`); continue; }
    const probs = [];
    if (a.font !== b.font) probs.push(`font ${a.font} -> ${b.font}`);
    if (a.color !== b.color) probs.push(`color ${a.color} -> ${b.color}`);
    if (a.rowBox !== b.rowBox) probs.push(`box ${a.rowBox} -> ${b.rowBox}`);
    if (a.gap !== b.gap) probs.push(`gap ${a.gap} -> ${b.gap}`);
    if (a.rowPad !== b.rowPad) probs.push(`pad ${a.rowPad} -> ${b.rowPad}`);
    const ia = a.icon, ib = b.icon;
    if (ia && ib) {
      if (ia.box !== ib.box) probs.push(`icon ${ia.box} -> ${ib.box}`);
      if (ia.shapes !== ib.shapes) probs.push(`icon shapes ${ia.shapes} -> ${ib.shapes}`);
      if (ia.vb !== ib.vb) probs.push(`icon viewBox ${ia.vb || '-'} -> ${ib.vb || '-'}`);
      if (ia.stroke !== ib.stroke) probs.push(`icon stroke ${ia.stroke} -> ${ib.stroke}`);
    } else if (ia !== ib) probs.push(`icon ${ia ? 'present' : 'none'} -> ${ib ? 'present' : 'none'}`);
    if (a.arts !== b.arts) probs.push(`artwork count ${a.arts} -> ${b.arts}`);
    if (probs.length) {
      console.log(`  "${a.label}"`);
      probs.forEach((p) => console.log(`      ${p}`));
    }
  }
  const extra = m.rows.filter((r) => !o.rows.some((a) => a.label.toLowerCase() === r.label.toLowerCase()));
  extra.forEach((r) => console.log(`  EXTRA    "${r.label}"`));
}
await browser.close();
