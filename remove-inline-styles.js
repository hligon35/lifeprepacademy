// Remove a few remaining inline style attributes from production pages
// to improve CSP readiness without changing visual design.
// Safe to run repeatedly.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function updateContact(html) {
  // Remove inline style on the Turnstile container
  // Example:
  // <div id="captchaContainer" ... style="margin: 0 0 1rem; display:none;"></div>
  let out = html.replace(
    /(<div\b[^>]*id="captchaContainer"[^>]*?)\sstyle="[^"]*"/g,
    '$1'
  );

  // Fallback for exact string (minified HTML tends to preserve it verbatim)
    out = out.replace(' style="margin: 0 0 1rem; display:none;"', '');
    out = out.replace(' style="margin: 0 0 1rem; display:none"', '');
  return out;
}

function updateIndex(html) {
  // Remove inline <style> block. The same styles already exist in style.css.
  // Keeping CSS centralized improves CSP readiness and avoids duplicated bytes.
  let out = html.replace(/<style>[\s\S]*?<\/style>/, '');

  // Replace the noscript hero fallback inline style (display:none) with the hidden attribute.
  // Keeps element from displaying while still giving crawlers a reference.
  out = out.replace(
    /(<noscript><img\b[^>]*?)\sstyle="display:none;"([^>]*?)\s*\/>\s*<\/noscript>/g,
    (m, head, tail) => {
      // If hidden already present, just strip style.
      if (/\shidden\b/.test(head + tail)) {
        return `${head}${tail} /><\/noscript>`;
      }
      return `${head}${tail} hidden /><\/noscript>`;
    }
  );

  return out;
}

function updateOffline(html) {
  // Remove inline <style> block and add a page-scoping class.
  let out = html.replace(/<style>[\s\S]*?<\/style>/, '');
  out = out.replace(/<body(\s|>)/, '<body class="offline-page"$1');
  return out;
}

function updateFile(filename, transform) {
  const p = path.join(ROOT, filename);
  const before = fs.readFileSync(p, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(p, after, 'utf8');
    console.log('✔ Updated:', filename);
    return true;
  }
  return false;
}

function run() {
  let changed = 0;
  if (fs.existsSync(path.join(ROOT, 'contact.html'))) {
    if (updateFile('contact.html', updateContact)) changed++;
  }
  if (fs.existsSync(path.join(ROOT, 'index.html'))) {
    if (updateFile('index.html', updateIndex)) changed++;
  }
  if (fs.existsSync(path.join(ROOT, 'offline.html'))) {
    if (updateFile('offline.html', updateOffline)) changed++;
  }
  console.log(`Done. Updated ${changed} file(s).`);
}

run();
