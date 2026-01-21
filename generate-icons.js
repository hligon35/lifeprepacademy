// Generate proper PWA icons from logo.png
// Requires: npm install (sharp is already in devDependencies)

const path = require('path');
const fs = require('fs');

async function run() {
  const sharp = require('sharp');

  const root = __dirname;
  const src = path.join(root, 'logo.png');
  const outDir = path.join(root, 'icons');

  if (!fs.existsSync(src)) {
    console.error('✖ Missing logo.png');
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    { size: 192, file: 'icon-192.png' },
    { size: 512, file: 'icon-512.png' }
  ];

  for (const t of targets) {
    const outPath = path.join(outDir, t.file);

    // Create a square icon without distorting the logo.
    await sharp(src)
      .resize(t.size, t.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outPath);

    console.log('✔ Wrote', path.join('icons', t.file));
  }
}

run().catch(err => {
  console.error('✖ Icon generation failed:', err);
  process.exit(1);
});
