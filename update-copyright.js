// Updates hard-coded copyright year in HTML files to an auto-updating span.
// Safe to run repeatedly.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function updateHtml(html) {
  const year = String(new Date().getFullYear());

  // Match: &copy; 2025 LifePrep Academy Foundation
  // Also tolerate missing spaces or different year.
  const pattern = /&copy;\s*\d{4}\s+LifePrep Academy Foundation/g;

  let out = html.replace(pattern, `&copy; <span data-auto-year>${year}</span> LifePrep Academy Foundation`);

  // If a span exists but is empty, seed it.
  out = out.replace(/<span data-auto-year><\/span>/g, `<span data-auto-year>${year}</span>`);
  return out;
}

function run() {
  const files = fs.readdirSync(ROOT).filter(f => f.toLowerCase().endsWith('.html'));
  let changed = 0;

  for (const file of files) {
    const p = path.join(ROOT, file);
    const before = fs.readFileSync(p, 'utf8');
    const after = updateHtml(before);
    if (after !== before) {
      fs.writeFileSync(p, after, 'utf8');
      changed++;
      console.log('✔ Updated:', file);
    }
  }

  console.log(`Done. Updated ${changed} HTML file(s).`);
}

run();
