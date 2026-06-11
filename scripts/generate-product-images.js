#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'public', 'assets');
const outputFile = path.join(assetsDir, 'product-images.js');
const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const ignoredNames = new Set([
  'air',
  'favicon',
  'logo',
  'mtn',
  'yuyu',
]);

function toTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function isProductImage(file) {
  const ext = path.extname(file.name).toLowerCase();
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase();
  return file.isFile() && imageExts.has(ext) && !ignoredNames.has(base);
}

const products = fs.readdirSync(assetsDir, { withFileTypes: true })
  .filter(isProductImage)
  .map(file => ({
    name: toTitle(file.name),
    file: `assets/${file.name}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const content = `// Auto-generated from /assets by scripts/generate-product-images.js
// Re-run: node scripts/generate-product-images.js
window.PRODUCT_IMAGE_ASSETS = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync(outputFile, content, 'utf8');
console.log(`Generated ${path.relative(rootDir, outputFile)} with ${products.length} product images.`);
