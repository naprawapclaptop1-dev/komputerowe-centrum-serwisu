'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { readServiceWorkerContract, runFix49StaticAudits } = require('./release-contract-fix49.cjs');

function loadFix50Manifest(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'FIX50_RELEASE_MANIFEST.json'), 'utf8'));
  if (manifest.fix !== 'FIX50' || manifest.release !== '6.8.0' || !manifest.build || !manifest.cacheMarker) {
    throw new Error('Manifest FIX50 ma nieprawidłową wersję lub brakuje build/cache marker.');
  }
  return manifest;
}

function verifyFix50Release(root) {
  const manifest = loadFix50Manifest(root);
  const web = path.join(root, 'WEB_PUBLISH');
  const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
  const release = JSON.parse(fs.readFileSync(path.join(web, 'release.json'), 'utf8'));
  const status = fs.readFileSync(path.join(root, 'functions/api/auth/status.js'), 'utf8');
  const sw = readServiceWorkerContract(path.join(web, 'service-worker.js'));
  const engine = fs.readFileSync(path.join(web, 'assets/lesson-art.js'), 'utf8');
  const app = fs.readFileSync(path.join(web, 'assets/app.js'), 'utf8');
  const registry = JSON.parse(fs.readFileSync(path.join(web, 'media/photo-sources-online.json'), 'utf8'));
  const failures = [];
  const buildMeta = html.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i)?.[1] || '';
  if (release.release !== manifest.release || release.build !== manifest.build) failures.push('release.json nie zgadza się z manifestem FIX50');
  if (!status.includes(manifest.build)) failures.push('API /api/auth/status nie raportuje build ID FIX50');
  if (buildMeta !== manifest.build) failures.push('academy-build w HTML nie zgadza się z manifestem FIX50');
  if (!html.includes(`assets/lesson-art.js?v=${manifest.photoEngineVersion}`)) failures.push('HTML nie ładuje silnika zdjęć FIX50');
  if (!html.includes(`assets/app.js?v=${manifest.appAssetVersion}`)) failures.push('HTML nie ładuje aplikacji FIX50');
  if (!html.includes(`assets/theme-630.css?v=${manifest.styleVersion}`)) failures.push('HTML nie ładuje stylów FIX50');
  if (!sw.cacheName.includes(manifest.cacheMarker)) failures.push('Service Worker CACHE_NAME nie zawiera FIX50');
  if (!sw.source.includes(`lesson-art.js?v=${manifest.photoEngineVersion}`) || !sw.source.includes(`app.js?v=${manifest.appAssetVersion}`)) failures.push('Service Worker nie buforuje aktualnych assetów FIX50');
  if (engine.includes('perceptualHashVerificationRequired:true')) failures.push('silnik nadal wymaga hash perceptual jako warunku akceptacji');
  for (const token of manifest.requiredEngineTokens || []) if (!engine.includes(token)) failures.push(`brak funkcji silnika: ${token}`);
  for (const token of manifest.requiredAppTokens || []) if (!app.includes(token)) failures.push(`brak obsługi galerii: ${token}`);
  if (registry.uniqueRepairPhotoPolicy?.localFirst !== true || registry.uniqueRepairPhotoPolicy?.offlineFallback !== true || registry.uniqueRepairPhotoPolicy?.requirePerceptualHash !== false) failures.push('rejestr zdjęć nie ma polityki local-first/CORS-safe');
  for (const file of manifest.localPhotos || []) if (!fs.existsSync(path.join(web, file))) failures.push(`brak lokalnego zdjęcia: ${file}`);
  for (const file of manifest.requiredFiles || []) if (!fs.existsSync(path.join(root, file))) failures.push(`brak pliku wydania: ${file}`);
  if (!release.fix50_photo_reliability || release.fix50_photo_reliability.photo_engine !== manifest.photoEngineVersion) failures.push('release.json nie opisuje zakresu FIX50');
  if (failures.length) throw new Error(`Kontrakt FIX50 niekompletny:\n- ${failures.join('\n- ')}`);
  const audit = runFix49StaticAudits(root);
  return Object.freeze({ manifest, build: manifest.build, cacheName: sw.cacheName, audit });
}
module.exports = { loadFix50Manifest, verifyFix50Release, readServiceWorkerContract };
