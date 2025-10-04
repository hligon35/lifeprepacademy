// Minify CSS and JS without external CLI dependencies
const fs = require('fs');
const path = require('path');

function minifyCSS() {
  try {
    const csso = require('csso');
    const cssPath = path.join(__dirname, 'style.css');
    const outPath = path.join(__dirname, 'style.min.css');
    const css = fs.readFileSync(cssPath, 'utf8');
  const result = csso.minify(css, { restructure: false });
    fs.writeFileSync(outPath, result.css, 'utf8');
    console.log('✔ CSS minified -> style.min.css');
  } catch (e) {
    console.error('✖ CSS minification failed:', e.message);
    process.exitCode = 1;
  }
}

async function minifyJS() {
  try {
    const terser = require('terser');
    const jsPath = path.join(__dirname, 'script.js');
    const outPath = path.join(__dirname, 'script.min.js');
    const code = fs.readFileSync(jsPath, 'utf8');
    const result = await terser.minify(code, { compress: true, mangle: true });
    if (result.error) throw result.error;
    fs.writeFileSync(outPath, result.code, 'utf8');
    console.log('✔ JS minified -> script.min.js');
  } catch (e) {
    console.error('✖ JS minification failed:', e.message);
    process.exitCode = 1;
  }
}

(async function run() {
  await minifyJS();
  minifyCSS();
})();
