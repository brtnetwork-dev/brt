#!/usr/bin/env node
// Simple cross-platform copy of static renderer assets into dist.
// Ensures dist/renderer/index.html exists for production loads.

const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`[copy-static] ${src} -> ${dest}`);
}

const repoRoot = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const srcHtml = path.join(repoRoot, 'src', 'renderer', 'index.html');
const destHtml = path.join(repoRoot, 'dist', 'renderer', 'index.html');

if (!fs.existsSync(srcHtml)) {
  console.error('[copy-static] Missing source HTML:', srcHtml);
  process.exit(1);
}

copyFile(srcHtml, destHtml);

