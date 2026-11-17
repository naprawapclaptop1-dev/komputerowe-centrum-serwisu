#!/usr/bin/env node
'use strict';
// Compatibility replacement for an obsolete local test that incorrectly required
// the entire platform release to remain at 6.2.0. The 6.2.0 module family is kept,
// while the platform itself is released as 6.8.0.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'release.json'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'service-worker.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'WEB_PUBLISH', 'index.html'), 'utf8');
const expectedBuild = '6.8.0-fix51-visual-academy-pro-20261105';
if (release.release !== '6.8.0' || release.build !== expectedBuild) {
  throw new Error(`Nieaktualny kontrakt wydania: oczekiwano 6.8.0 / ${expectedBuild}, otrzymano ${release.release} / ${release.build}`);
}
for (const asset of ['ultimate-workshop-620.js', 'ultimate-workshop-620.css']) {
  const file = path.join(root, 'WEB_PUBLISH', 'assets', asset);
  if (!fs.existsSync(file)) throw new Error(`Brak zachowanego modułu zgodności 6.2.0: ${asset}`);
  if (!sw.includes(asset)) throw new Error(`Service Worker nie buforuje zachowanego modułu 6.2.0: ${asset}`);
}
if (!html.includes('advanced-learning-studio-620.js')) throw new Error('HTML nie odwołuje się do zachowanego Learning Studio 620.');
console.log('PASS: platforma pozostaje na 6.8.0 FIX40, a moduły 6.2.0 są zachowane jako kompatybilne komponenty — bez cofania wersji całej platformy.');
