'use strict';

/**
 * FIX137: Publisher photo-cache contract.
 * The application cache follows release.latestHotfixBuild; the curated photo
 * cache remains independently pinned to the existing FIX135 photo library.
 */
function evaluateHomepagePhotoCacheContract({
  html = '',
  serviceWorkerSource = '',
  release = {},
  photoLibrary = {},
  forbiddenTokens = []
} = {}) {
  const errors = [];
  const coreMatch = serviceWorkerSource.match(/^\s*const\s+CACHE_NAME\s*=\s*(['"])([^'"]+)\1\s*;/m);
  const photoMatch = serviceWorkerSource.match(/^\s*const\s+PHOTO_CACHE_NAME\s*=\s*(['"])([^'"]+)\1\s*;/m);
  const activeCoreCache = coreMatch?.[2] || '';
  const activePhotoCache = photoMatch?.[2] || '';
  const expectedBuildTag = String(release.latestHotfixBuild || '');
  const expectedCoreCache = String(release.serviceWorkerCacheName || (expectedBuildTag ? `nauka-${expectedBuildTag}` : ''));
  if (expectedBuildTag && expectedCoreCache !== `nauka-${expectedBuildTag}`) {
    errors.push(`release.serviceWorkerCacheName (${expectedCoreCache}) nie odpowiada latestHotfixBuild (${expectedBuildTag}).`);
  }
  const expectedPhotoCache = String(
    release.fix136_top_photo_priority_practice_lessons?.photoCacheName ||
    release.homepagePhotoFirstRenderFix?.cacheName ||
    photoLibrary.cacheName || ''
  );

  if (!expectedBuildTag || !expectedCoreCache) errors.push('Brak release.latestHotfixBuild lub release.serviceWorkerCacheName.');
  if (!activeCoreCache || activeCoreCache !== expectedCoreCache) {
    errors.push(`CACHE_NAME Service Workera (${activeCoreCache || 'brak'}) nie zgadza się z aktywnym buildem (${expectedCoreCache || 'brak'}).`);
  }
  for (const [label, value] of [
    ['release.serviceWorkerCacheName', release.serviceWorkerCacheName],
    ['release.homepagePhotoFirstRenderFix.serviceWorkerCacheName', release.homepagePhotoFirstRenderFix?.serviceWorkerCacheName],
    ['release.fix118_local_photo_library.serviceWorkerCacheName', release.fix118_local_photo_library?.serviceWorkerCacheName],
    ['release.localPhotoLibraryFix118.serviceWorkerCacheName', release.localPhotoLibraryFix118?.serviceWorkerCacheName],
    ['release.fix136_top_photo_priority_practice_lessons.serviceWorkerCacheName', release.fix136_top_photo_priority_practice_lessons?.serviceWorkerCacheName]
  ]) {
    if (value && value !== activeCoreCache) errors.push(`${label} (${value}) nie zgadza się z CACHE_NAME Service Workera (${activeCoreCache || 'brak'}).`);
  }

  if (!expectedPhotoCache) errors.push('Brak nazwy zachowanego cache fotografii w metadanych biblioteki.');
  if (!activePhotoCache || activePhotoCache !== expectedPhotoCache) {
    errors.push(`PHOTO_CACHE_NAME (${activePhotoCache || 'brak'}) nie zgadza się z biblioteką fotografii (${expectedPhotoCache || 'brak'}).`);
  }
  if (photoLibrary.cacheName && photoLibrary.cacheName !== activePhotoCache) {
    errors.push(`Cache biblioteki zdjęć (${photoLibrary.cacheName}) nie zgadza się z PHOTO_CACHE_NAME (${activePhotoCache || 'brak'}).`);
  }

  for (const token of forbiddenTokens) {
    if (token && (html.includes(token) || serviceWorkerSource.includes(token))) {
      errors.push(`Wykryto wyłączony skrypt blokujący zdjęcia: ${token}.`);
    }
  }

  const requiredRuntimeMarkers = [
    'isCuratedPhotoHost',
    'PHOTO_HOSTS',
    "url.pathname.startsWith('/media/photos/')",
    'photoCache.put(request, response.clone())',
    'caches.open(PHOTO_CACHE_NAME)'
  ];
  for (const marker of requiredRuntimeMarkers) {
    if (!serviceWorkerSource.includes(marker)) errors.push(`Service Worker nie zawiera wymaganego mechanizmu zdjęć: ${marker}.`);
  }

  return {
    ok: errors.length === 0,
    errors,
    activeCoreCache,
    activePhotoCache,
    expectedCoreCache,
    expectedPhotoCache
  };
}

module.exports = { evaluateHomepagePhotoCacheContract };
