// Lightweight HTML minifier without external deps
// - Removes comments
// - Collapses whitespace between tags
// - Trims leading/trailing whitespace
// Skips test/demo pages to keep them readable

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const SKIP_FILES = new Set([
  'basic-test.html',
  'debug.html',
  'test.html',
  'test-photos.html',
  'phototest.html',
  'simple.html',
  'status.html'
]);

function listRootHtmlFiles() {
  // Only operate on site HTML pages in the repo root.
  // This prevents accidentally minifying HTML inside node_modules or other folders.
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => path.join(ROOT, e.name));
}

function minifyHtml(html) {
  // Remove HTML comments (naive; fine for this static site)
  let out = html.replace(/<!--[^!][\s\S]*?-->/g, '');
  // Collapse whitespace between tags
  out = out.replace(/>\s+</g, '><');
  // Collapse multiple spaces
  out = out.replace(/\s{2,}/g, ' ');
  // Restore minimal spacing in head meta/link/script tags if needed (safe no-op mostly)
  // Trim
  out = out.trim();
  return out;
}

function run() {
  const allHtml = listRootHtmlFiles();
  let count = 0;
  for (const file of allHtml) {
    const base = path.basename(file);
    if (SKIP_FILES.has(base)) continue;
    try {
      const src = fs.readFileSync(file, 'utf8');
      const min = minifyHtml(src);
      fs.writeFileSync(file, min, 'utf8');
      count++;
    } catch (e) {
      console.warn('Skipping (error):', file, e.message);
    }
  }
  console.log(`✔ Minified ${count} HTML file(s)`);
}

run();
