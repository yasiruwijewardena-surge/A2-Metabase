/**
 * Converts the markdown-ish strings in seed/data into Strapi's `blocks` format.
 *
 * Supports exactly what the seed content uses: paragraphs, level-2 headings,
 * unordered lists, and inline **bold**. Deliberately not a general Markdown
 * parser — if the seed data needs more than this, the data is the thing to
 * reconsider.
 */

function inline(text) {
  const nodes = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push({ type: 'text', text: text.slice(last, m.index) });
    nodes.push({ type: 'text', text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push({ type: 'text', text: text.slice(last) });
  return nodes.length ? nodes : [{ type: 'text', text: '' }];
}

function toBlocks(markdownish) {
  if (!markdownish) return [];
  const lines = markdownish.split('\n');
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    blocks.push({
      type: 'list',
      format: 'unordered',
      children: listBuffer.map((item) => ({
        type: 'list-item',
        children: inline(item),
      })),
    });
    listBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }

    if (line.startsWith('- ')) { listBuffer.push(line.slice(2)); continue; }
    flushList();

    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, children: inline(line.slice(3)) });
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, children: inline(line.slice(4)) });
    } else {
      blocks.push({ type: 'paragraph', children: inline(line) });
    }
  }
  flushList();
  return blocks;
}

function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { toBlocks, slugify };
