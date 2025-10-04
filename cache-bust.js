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
