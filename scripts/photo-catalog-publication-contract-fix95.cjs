'use strict';

const RUNTIME_MARKERS = [
  'Openverse',
  'Wikimedia Commons',
  'isVramPhotoRelevant',
  'buildOpenverseUrl',
  'page: String',
  'queryIndex',
  'commonsSearchQueries',
  'commonsQueryIndex',
  'PAGE_STATE_KEY',
  'LEGACY_PAGE_STATE_KEY',
  'Old FIX91 exhausted flags were terminal',
  'normalizeLicense',
  'academyPhotoCatalogPageStateFix96',
  'GDDR3 memory chip',
  'USB-C',
  'isPhotoRelevant',
  '3300',
  'window.addEventListener',
  'FIX93',
  'photoFix90Assigned',
  'photo-fix90-online',
  'FIX96_DIRECT_TARGET_IMAGE_LOAD_TOPIC_VERIFIED',
  'renderedOnlinePhotoCount',
  'renderedLocalPhotoCount',
  'FIX96_HOME_LOCAL_PHOTOGRAPHY',
  'recoverPhotoSlotId'
];

const CSS_MARKERS = [
  '.photo-fix90-online',
  '.photo-fallback-label-fix90',
  '.photo-catalog-fix90-status'
];

function evaluatePhotoCatalogPublicationContract({
  jsOk,
  cssOk,
  manifestOk,
  manifest,
  js,
  css,
  html,
  serviceWorker,
  remoteRelease,
  expectedPhotoCatalogBuild
} = {}) {
  const missing = [];
  const mark = (condition, label) => { if (!condition) missing.push(label); };
  const provider = manifest?.dynamicProvider || {};
  const policy = manifest?.uniqueRepairPhotoPolicy || {};
  const runtime = String(js || '');
  const stylesheet = String(css || '');
  const page = String(html || '');
  const sw = String(serviceWorker || '');

  mark(jsOk === true, 'photo_catalog_js_http');
  mark(cssOk === true, 'photo_catalog_css_http');
  mark(manifestOk === true, 'photo_sources_manifest_http');
  mark(provider.enabled === true, 'provider_enabled');
  mark(Array.isArray(manifest?.photos) && manifest.photos.length >= 19, 'verified_seed_photos_19');
  mark(policy.photosPerRepair === 3, 'three_photos_per_repair');
  mark(policy.globalSingleAssignment === true, 'global_single_assignment');
  mark(provider.queryVariantsPerCategory === 3, 'openverse_query_variants');
  mark(provider.maxPagesPerQuery === 3, 'openverse_pages_per_query');
  mark(provider.maxCommonsPages === 6, 'commons_pages_per_category');
  mark(provider.commonsQueryVariantsPerCategory === 3, 'commons_query_variants');
  mark(provider.licenseNormalization === true, 'license_normalization');
  mark(provider.legacyExhaustedPageStateRecovery === true, 'legacy_exhausted_state_recovery');
  mark(provider.fullCatalogQueue === true, 'full_catalog_queue');
  mark(provider.automaticTransientRetry === true, 'automatic_transient_retry');
  mark(provider.topicRelevanceFilter === true, 'topic_relevance_filter');
  mark(provider.noGenericTopicFallback === true, 'no_generic_topic_fallback');
  mark(String(provider.strictPortEvidence || '').includes('USB-C'), 'strict_usb_c_evidence');
  mark(String(provider.strictVramEvidence || '').includes('GDDR'), 'strict_vram_evidence');
  mark(String(provider.strictRamEvidence || '').includes('DIMM'), 'strict_ram_evidence');
  mark(String(provider.searches || '').toLowerCase().includes('category-specific'), 'category_specific_search_metadata');
  mark(manifest?.hotfix === 'FIX94', 'photo_manifest_fix94');
  mark(manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix96.js?v=6.8.0-fix96', 'photo_runtime_path');
  mark(manifest?.runtimeHotfix === 'FIX96', 'photo_runtime_hotfix');

  // Executable behavior belongs in the JavaScript; descriptive policy labels belong in JSON.
  // FIX94 previously searched the JS file for manifest-only keys, creating a false negative.
  for (const token of RUNTIME_MARKERS) mark(runtime.includes(token), `runtime:${token}`);
  for (const token of CSS_MARKERS) mark(stylesheet.includes(token), `css:${token}`);

  mark(page.includes('photo-catalog-fix96.js?v=6.8.0-fix96'), 'html_runtime_reference');
  mark(page.includes('photo-catalog-fix96.css?v=6.8.0-fix96'), 'html_stylesheet_reference');
  mark(sw.includes('photo-catalog-fix96.js?v=6.8.0-fix96'), 'service_worker_runtime_reference');
  mark(sw.includes('photo-catalog-fix96.css?v=6.8.0-fix96'), 'service_worker_stylesheet_reference');
  mark(sw.includes('media/photo-sources-online.json'), 'service_worker_source_manifest_reference');
  mark(Boolean(expectedPhotoCatalogBuild) && remoteRelease?.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'photo_catalog_runtime_build_tag');

  return { valid: missing.length === 0, missing };
}

module.exports = { evaluatePhotoCatalogPublicationContract, RUNTIME_MARKERS, CSS_MARKERS };
