// Prettify all root-level HTML files (undo accidental minify-to-one-line)
// Usage: node format-html.js

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function listRootHtmlFiles() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => path.join(ROOT, e.name));
}

async function formatFile(prettier, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const formatted = await prettier.format(src, {
    parser: 'html',
    printWidth: 120,
    tabWidth: 4,
    useTabs: true,
    htmlWhitespaceSensitivity: 'ignore',
    endOfLine: 'auto'
  });

  if (formatted !== src) {
    fs.writeFileSync(filePath, formatted, 'utf8');
    return true;
  }
  return false;
}

async function run() {
  let prettier;
  try {
    prettier = require('prettier');
  } catch (e) {
    console.error('✖ Prettier is not installed. Run: npm install');
    process.exit(1);
  }

  const files = listRootHtmlFiles();
  let changed = 0;

  for (const file of files) {
    try {
      const didChange = await formatFile(prettier, file);
      if (didChange) {
        changed++;
        console.log(`✔ Formatted: ${path.basename(file)}`);
      }
    } catch (e) {
      console.warn(`Skipping (error): ${path.basename(file)} - ${e.message}`);
    }
  }

  console.log(`Done. Formatted ${changed} file(s).`);
}

run();
