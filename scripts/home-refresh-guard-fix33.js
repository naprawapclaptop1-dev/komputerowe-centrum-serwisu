// FIX33 — wspólny kontrakt kontroli zdalnych zasobów odświeżonego pulpitu.
'use strict';

const HOME_REFRESH_CSS_MARKERS = Object.freeze([
  '.np30-hero-visual',
  '.np640-module-grid',
  '.np30-module-photo'
]);
const PHOTO_UNIQUENESS_JS_MARKERS = Object.freeze([
  'NP_PHOTO_UNIQUENESS_FIX30',
  'gallery:',
  'np630-fallback='
]);

function verifyHomeRefreshAssets(css, photoJs) {
  if (typeof css !== 'string' || typeof photoJs !== 'string') {
    throw new TypeError('Kontrola FIX33 wymaga treści CSS i JavaScript jako tekstu.');
  }
  const missingCss = HOME_REFRESH_CSS_MARKERS.filter(marker => !css.includes(marker));
  const missingPhotoJs = PHOTO_UNIQUENESS_JS_MARKERS.filter(marker => !photoJs.includes(marker));
  if (missingCss.length || missingPhotoJs.length) {
    const details = [
      missingCss.length ? `CSS: ${missingCss.join(', ')}` : '',
      missingPhotoJs.length ? `JS: ${missingPhotoJs.join(', ')}` : ''
    ].filter(Boolean).join('; ');
    throw new Error(`Niekompletne zasoby pulpitu FIX30 (${details}).`);
  }
  return {
    cssMarkers: HOME_REFRESH_CSS_MARKERS.length,
    photoJsMarkers: PHOTO_UNIQUENESS_JS_MARKERS.length
  };
}

module.exports = { HOME_REFRESH_CSS_MARKERS, PHOTO_UNIQUENESS_JS_MARKERS, verifyHomeRefreshAssets };
