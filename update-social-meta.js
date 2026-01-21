// Small, repeatable HTML tweaks for security/SEO consistency.
// - Ensures meta theme-color exists.
// - Ensures social profile links use rel="me noopener noreferrer".
// Safe to run repeatedly.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const SOCIAL_LINKS = [
  'https://www.facebook.com/profile.php?id=61580380810980',
  'https://www.instagram.com/lpa_foundation/'
];

function ensureThemeColor(html) {
  if (html.includes('name="theme-color"')) return html;
  // Insert before the first favicon/link icon if present; otherwise before </head>.
  const meta = '<meta name="theme-color" content="#281156" />';
  if (html.includes('<link rel="icon"')) {
    return html.replace('<link rel="icon"', meta + '<link rel="icon"');
  }
  return html.replace('</head>', meta + '</head>');
}

function updateSocialRel(html) {
  let out = html;

  for (const url of SOCIAL_LINKS) {
    const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Normalize rel attribute to include "me" for the known social links.
    // Works even if rel appears before/after target, etc.
    const reAnchor = new RegExp(`(<a\\b[^>]*href=\"${esc}\"[^>]*)(>)`, 'g');
    out = out.replace(reAnchor, (m, head, tail) => {
      if (/\brel=\"[^\"]*\"/.test(head)) {
        return head.replace(/\brel=\"[^\"]*\"/, 'rel="me noopener noreferrer"') + tail;
      }
      return head + ' rel="me noopener noreferrer"' + tail;
    });
  }

  return out;
}

function ensureContactPreconnects(html) {
  const needed = [
    'https://challenges.cloudflare.com',
    'https://script.google.com',
    'https://script.googleusercontent.com'
  ];

  let out = html;
  for (const href of needed) {
    if (out.includes(`rel=\"preconnect\" href=\"${href}\"`)) continue;
    if (out.includes(`rel=\"preconnect\" href=\"${href}/\"`)) continue;
    // Insert after the existing Cornerstone preconnect if possible, else before </head>.
    const insertion = `<link rel=\"preconnect\" href=\"${href}\" crossorigin>`;
    if (out.includes('href="https://give.cornerstone.cc"')) {
      out = out.replace('href="https://give.cornerstone.cc" crossorigin>', `href="https://give.cornerstone.cc" crossorigin>${insertion}`);
    } else {
      out = out.replace('</head>', insertion + '</head>');
    }
  }
  return out;
}

function run() {
  const files = fs.readdirSync(ROOT).filter(f => f.toLowerCase().endsWith('.html'));
  let changed = 0;

  for (const file of files) {
    // Only apply to real site pages (skip test/debug/etc that are disallowed in robots.txt)
    if ([
      'basic-test.html',
      'debug.html',
      'test.html',
      'test-photos.html',
      'phototest.html',
      'status.html'
    ].includes(file)) {
      continue;
    }

    const p = path.join(ROOT, file);
    const before = fs.readFileSync(p, 'utf8');
    let after = before;

    after = ensureThemeColor(after);
    after = updateSocialRel(after);
    if (file.toLowerCase() === 'contact.html') {
      after = ensureContactPreconnects(after);
    }

    if (after !== before) {
      fs.writeFileSync(p, after, 'utf8');
      changed++;
      console.log('✔ Updated:', file);
    }
  }

  console.log(`Done. Updated ${changed} HTML file(s).`);
}

run();
