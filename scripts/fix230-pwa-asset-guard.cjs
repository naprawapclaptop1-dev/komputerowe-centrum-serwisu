'use strict';
const fs = require('node:fs');
const path = require('node:path');

function normalizeAssetPath(value) {
  return String(value || '').split(/[?#]/, 1)[0].replace(/^\/+/, '').replace(/\\/g, '/');
}

/**
 * Verifies that every required local asset is referenced by HTML and that the
 * exact same versioned URL is precached by the Service Worker. Query versions
 * may legitimately advance in later hotfixes; they must match each other, not
 * an obsolete hard-coded version in the publisher.
 */
function verifyHtmlAssetsInServiceWorker({ html, serviceWorker, webRoot, assets }) {
  const errors = [];
  const references = {};
  if (typeof html !== 'string' || typeof serviceWorker !== 'string' || !webRoot || !Array.isArray(assets)) {
    return { ok: false, errors: ['Nieprawidłowe argumenty walidatora zasobów HTML/PWA.'], references };
  }

  const htmlRefs = [];
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']+)\1/gi)) {
    htmlRefs.push(match[2]);
  }
  const swRefs = [];
  for (const match of serviceWorker.matchAll(/(["'])([^"']+)\1/g)) {
    swRefs.push(match[2]);
  }

  for (const requested of assets) {
    const expectedPath = normalizeAssetPath(requested);
    const matchingHtml = htmlRefs.filter(ref => normalizeAssetPath(ref) === expectedPath);
    if (matchingHtml.length !== 1) {
      errors.push(matchingHtml.length === 0
        ? `HTML nie zawiera zasobu ${expectedPath}`
        : `HTML zawiera ${matchingHtml.length} odwołań do ${expectedPath}; wymagane jest jedno`);
      continue;
    }

    const htmlRef = matchingHtml[0];
    if (!/[?&]v=[^&#]+/.test(htmlRef)) {
      errors.push(`Brak wersji cache (?v=...) dla ${expectedPath}`);
      continue;
    }

    const expectedSwRef = `/${htmlRef.replace(/^\/+/, '')}`;
    const matchingSw = swRefs.filter(ref => {
      const normalized = ref.startsWith('/') ? ref : `/${ref}`;
      return normalizeAssetPath(normalized) === expectedPath && normalized === expectedSwRef;
    });
    const uniqueMatchingSw = [...new Set(matchingSw)];
    if (uniqueMatchingSw.length !== 1) {
      errors.push(uniqueMatchingSw.length === 0
        ? `Service Worker nie buforuje dokładnie wersji ${htmlRef}`
        : `Service Worker zawiera wielokrotne wpisy wersji ${htmlRef}`);
    }

    const localFile = path.resolve(webRoot, expectedPath);
    const root = path.resolve(webRoot) + path.sep;
    if (!localFile.startsWith(root) || !fs.existsSync(localFile) || !fs.statSync(localFile).isFile()) {
      errors.push(`Brak lokalnego pliku ${expectedPath}`);
    }
    references[expectedPath] = { html: htmlRef, serviceWorker: uniqueMatchingSw[0] || null };
  }

  return { ok: errors.length === 0, errors, references };
}

module.exports = { verifyHtmlAssetsInServiceWorker };
