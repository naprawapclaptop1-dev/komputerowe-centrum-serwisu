'use strict';
const fs = require('node:fs');
const path = require('node:path');

/**
 * Shared local release guard for the FIX83 unique-illustration runtime.
 * The runtime itself keeps its FIX83 filename; its cache-busting URL is
 * declared independently in release.json so later hotfixes do not make
 * OneClick/Watcher demand a stale query-string version.
 */
function verifyFix83VisualLibrary({ webDir, indexHtml, releaseJson }) {
  if (!webDir || typeof indexHtml !== 'string' || !releaseJson || typeof releaseJson !== 'object') {
    throw new TypeError('FIX83/FIX88: brak danych wejściowych kontroli biblioteki ilustracji.');
  }

  const runtimeBuildTag = String(releaseJson.visualRuntimeBuildTag || '').trim();
  if (!/^6\.8\.0-fix\d+$/.test(runtimeBuildTag)) {
    throw new Error(`FIX83/FIX88: niepoprawny visualRuntimeBuildTag w release.json: ${runtimeBuildTag || 'brak'}.`);
  }

  const expectedScript = `assets/visual-uniqueness-fix83.js?v=${runtimeBuildTag}`;
  const escapedScript = expectedScript.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const scriptPattern = new RegExp(`<script\\b[^>]*\\bsrc=[\"']${escapedScript}[\"'][^>]*>`, 'i');
  const scriptMatch = scriptPattern.exec(indexHtml);
  const scriptIndex = scriptMatch ? scriptMatch.index : -1;
  const lessonArtIndex = indexHtml.indexOf('assets/lesson-art.js?');
  const appIndex = indexHtml.indexOf('assets/app.js?');
  if (scriptIndex < 0 || lessonArtIndex < 0 || appIndex < 0 || scriptIndex > lessonArtIndex || scriptIndex > appIndex) {
    throw new Error(`FIX83/FIX88: biblioteka nie jest podłączona przed lesson-art/app (oczekiwano ${expectedScript}).`);
  }
  const scriptLineEnd = indexHtml.indexOf('\n', scriptIndex);
  const scriptLine = indexHtml.slice(scriptIndex, scriptLineEnd < 0 ? indexHtml.length : scriptLineEnd);
  if (/\b(?:async|defer)\b/i.test(scriptLine)) {
    throw new Error('FIX83/FIX88: biblioteka musi uruchamiać się synchronicznie przed pierwszym renderem lekcji.');
  }

  const runtimePath = path.join(webDir, 'assets', 'visual-uniqueness-fix83.js');
  const manifestPath = path.join(webDir, 'assets', 'visual-uniqueness-manifest-fix83.json');
  if (!fs.existsSync(runtimePath) || !fs.existsSync(manifestPath)) {
    throw new Error('FIX83/FIX88: brakuje pliku runtime lub manifestu biblioteki ilustracji.');
  }
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const categories = Array.isArray(manifest.categories) ? manifest.categories : [];
  const vramRule = String(manifest.vramRule || '');
  const runtimeValid = runtime.includes('uniqueVisualUrl')
    && runtime.includes('GDDR6')
    && runtime.includes('GDDR / BGA MEMORY');
  const manifestValid = manifest.hotfix === 'FIX83'
    && manifest.galleryIllustrationCount === 54
    && categories.includes('vram')
    && categories.includes('ram')
    && vramRule.includes('Separate GDDR/BGA packages on PCB')
    && vramRule.includes('Never use DIMM/SO-DIMM imagery');

  if (!runtimeValid || !manifestValid) {
    throw new Error(`FIX83/FIX88: biblioteka lub grafika VRAM jest niepoprawna (runtime=${runtimeValid}, manifest=${manifestValid}, tag=${runtimeBuildTag}).`);
  }

  return Object.freeze({ runtimeBuildTag, galleryIllustrationCount: manifest.galleryIllustrationCount, runtimePath, manifestPath });
}

module.exports = { verifyFix83VisualLibrary };
