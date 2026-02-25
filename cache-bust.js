// Append content hashes to CSS/JS URLs in all HTML files for cache busting
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const cssFile = path.join(ROOT, 'style.min.css');
const jsFile = path.join(ROOT, 'script.min.js');

function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buf).digest('hex').slice(0, 10);
}

function bustInFile(htmlPath, cssHash, jsHash) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const before = html;

  // Replace style.min.css and script.min.js references, with or without existing ?v=...
  const cssPattern = /(style\.min\.css)(?:\?v=[^"'>]*)?/g;
  const jsPattern = /(script\.min\.js)(?:\?v=[^"'>]*)?/g;

  html = html.replace(cssPattern, `$1?v=${cssHash}`);
  html = html.replace(jsPattern, `$1?v=${jsHash}`);

  // Normalize favicon + apple-touch icon links
  const faviconBlock = [
    '<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="icons/favicon-16.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">'
  ].join('\n');

  // Remove existing icon tags (we'll inject a consistent block)
  html = html
    .replace(/<link\s+rel="apple-touch-icon"[^>]*>/gi, '')
    .replace(/<link\s+rel="icon"[^>]*>/gi, '');

  // If we don't already have our favicon assets referenced, inject them.
  if (!/icons\/favicon-32\.png|icons\/apple-touch-icon\.png/i.test(html)) {
    if (/<link\s+rel="canonical"/i.test(html)) {
      html = html.replace(/(<link\s+rel="canonical"[^>]*>)/i, `${faviconBlock}$1`);
    } else if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${faviconBlock}</head>`);
    }
  }

  if (html !== before) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✔ Cache-busted: ${path.basename(htmlPath)}`);
  }
}

function run() {
  if (!fs.existsSync(cssFile) || !fs.existsSync(jsFile)) {
    console.error('✖ Minified assets not found. Run `npm run build` first.');
    process.exit(1);
  }
  const cssHash = hashFile(cssFile);
  const jsHash = hashFile(jsFile);

  const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  files.forEach(f => bustInFile(path.join(ROOT, f), cssHash, jsHash));

  console.log(`Done. CSS hash=${cssHash}, JS hash=${jsHash}`);
}

run();
