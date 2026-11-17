'use strict';

const RUNTIME_MARKERS = [
  'Openverse', 'Wikimedia Commons', 'isVramPhotoRelevant', 'buildOpenverseUrl',
  'page: String', 'queryIndex', 'commonsSearchQueries', 'commonsQueryIndex',
  'PAGE_STATE_KEY', 'LEGACY_PAGE_STATE_KEY', 'Old FIX91 exhausted flags were terminal',
  'normalizeLicense', 'academyPhotoCatalogPageStateFix98', 'GDDR3 memory chip',
  'USB-C', 'isPhotoRelevant', '3300', 'window.addEventListener', 'FIX93',
  'photoFix90Assigned', 'photo-fix90-online', 'FIX96_DIRECT_TARGET_IMAGE_LOAD_TOPIC_VERIFIED',
  'renderedOnlinePhotoCount', 'renderedLocalPhotoCount', 'FIX96_HOME_LOCAL_PHOTOGRAPHY',
  'recoverPhotoSlotId', 'FIX98_ALL_MODULE_AND_SPECIALIST_PHOTOS',
  '.np75-specialist-photo img', 'home-specialist'
];

const CSS_MARKERS = [
  '.photo-fix90-online', '.photo-fallback-label-fix90', '.photo-catalog-fix90-status'
];

function unique(values) {
  const normalized = values.map(value => String(value || '').split('?')[0].replace(/#.*$/, '').replace(/\/$/, '').toLowerCase());
  return normalized.every(Boolean) && new Set(normalized).size === normalized.length;
}

function evaluatePhotoCatalogPublicationContract({
  jsOk, cssOk, manifestOk, manifest, js, css, homeCss, html, serviceWorker,
  remoteRelease, expectedPhotoCatalogBuild
} = {}) {
  const missing = [];
  const mark = (condition, label) => { if (!condition) missing.push(label); };
  const provider = manifest?.dynamicProvider || {};
  const policy = manifest?.uniqueRepairPhotoPolicy || {};
  const runtime = String(js || '');
  const stylesheet = String(css || '');
  const page = String(html || '');
  const sw = String(serviceWorker || '');
  const photos = Array.isArray(manifest?.photos) ? manifest.photos : [];
  const moduleGrid = page.match(/<div class="np640-module-grid[^\"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  const moduleCards = [...moduleGrid.matchAll(/<button\b/g)].length;
  const modulePhotoTags = [...moduleGrid.matchAll(/<img\b(?=[^>]*\bdata-photo-id="home-module-[^"]+")[^>]*>/gi)].map(match => match[0]);
  const modulePhotoIds = modulePhotoTags.map(tag => tag.match(/\bdata-photo-id="([^"]+)"/i)?.[1] || '');
  const specialistSection = page.match(/<section class="np75-specialists"[\s\S]*?<\/section>/i)?.[0] || '';
  const specialistPhotoTags = [...specialistSection.matchAll(/<img\b(?=[^>]*\bdata-photo-id="home-specialist-[^"]+")[^>]*>/gi)].map(match => match[0]);
  const specialistIds = specialistPhotoTags.map(tag => tag.match(/\bdata-photo-id="([^"]+)"/i)?.[1] || '');
  const expectedModulePhotoIds = ['home-module-repairmaster','home-module-components','home-module-ultimate3d','home-module-labplus','home-module-courses','home-module-checklists','home-module-modelcenter','home-module-knowledge','home-module-cloudchat','home-module-14','home-module-15','home-module-16','home-module-17','home-module-18','home-module-19'];
  const expectedSpecialistPhotoIds = ['home-specialist-laptop','home-specialist-bios','home-specialist-storage','home-specialist-windows','home-specialist-network','home-specialist-cpu-ram'];

  mark(jsOk === true, 'photo_catalog_js_http');
  mark(cssOk === true, 'photo_catalog_css_http');
  mark(manifestOk === true, 'photo_sources_manifest_http');
  mark(provider.enabled === true, 'provider_enabled');
  mark(photos.length >= 37, 'verified_seed_photos_37');
  mark(unique(photos.map(photo => photo.id)), 'unique_seed_ids');
  mark(unique(photos.map(photo => photo.page)), 'unique_seed_source_pages');
  mark(unique(photos.map(photo => photo.asset)), 'unique_seed_asset_urls');
  mark(photos.every(photo => photo.asset?.startsWith('https://') && photo.page?.startsWith('https://') && photo.author && photo.license && photo.licenseUrl && photo.category && photo.topic), 'seed_attribution_and_license_metadata');
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
  mark(manifest?.hotfix === 'FIX94', 'photo_manifest_fix94_lineage');
  mark(manifest?.runtimeHotfix === 'FIX98', 'photo_runtime_fix98');
  mark(manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix98.js?v=6.8.0-fix98', 'photo_runtime_path');
  mark(manifest?.onlinePhotoStylesheet === 'assets/photo-catalog-fix98.css?v=6.8.0-fix98', 'photo_stylesheet_path');

  for (const token of RUNTIME_MARKERS) mark(runtime.includes(token), `runtime:${token}`);
  for (const token of CSS_MARKERS) mark(stylesheet.includes(token), `css:${token}`);

  mark(moduleCards === 19, 'homepage_module_cards_19');
  mark(modulePhotoTags.length === 15 && new Set(modulePhotoIds).size === 15 && expectedModulePhotoIds.every(id => modulePhotoIds.includes(id)), 'homepage_module_photo_slots_15');
  mark(modulePhotoTags.every(tag => /\bdata-photo-kind="[^"]+"/i.test(tag) && /\bdata-photo-title="[^"]+"/i.test(tag) && /\balt="[^"]+"/i.test(tag)), 'homepage_module_photo_metadata');
  mark(specialistPhotoTags.length === 6 && new Set(specialistIds).size === 6 && expectedSpecialistPhotoIds.every(id => specialistIds.includes(id)), 'specialist_photo_slots_6');
  mark(specialistPhotoTags.every(tag => /\bdata-photo-kind="[^"]+"/i.test(tag) && /\bdata-photo-title="[^"]+"/i.test(tag) && /\balt="[^"]+"/i.test(tag)), 'specialist_photo_metadata');
  mark(String(homeCss || '').includes('#view-home .np75-specialist-photo>img') && String(homeCss || '').includes('object-fit:cover'), 'specialist_photo_responsive_styles');
  mark(releasePhotoCoverageValid(remoteRelease), 'release_photo_coverage_metadata');
  mark(page.includes('content="FIX98"'), 'html_hotfix_fix98');
  mark(page.includes('photo-catalog-fix98.js?v=6.8.0-fix98'), 'html_runtime_reference');
  mark(page.includes('photo-catalog-fix98.css?v=6.8.0-fix98'), 'html_stylesheet_reference');
  mark(sw.includes('photo-catalog-fix98.js?v=6.8.0-fix98'), 'service_worker_runtime_reference');
  mark(sw.includes('photo-catalog-fix98.css?v=6.8.0-fix98'), 'service_worker_stylesheet_reference');
  mark(sw.includes('media/photo-sources-online.json'), 'service_worker_source_manifest_reference');
  mark(Boolean(expectedPhotoCatalogBuild) && remoteRelease?.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'photo_catalog_runtime_build_tag');
  mark(remoteRelease?.latestHotfix === 'FIX98', 'remote_release_hotfix_fix98');
  mark(remoteRelease?.release === '6.8.0', 'remote_product_version_unchanged');

  return { valid: missing.length === 0, missing, moduleCards, modulePhotoSlots: modulePhotoIds.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length };
}

function releasePhotoCoverageValid(release) {
  const photo = release?.photoCatalog || {};
  return release?.latestHotfix === 'FIX98'
    && photo.homepagePrioritySlots === 21
    && photo.modulePhotoSlots === 19
    && photo.specialistPhotoSlots === 6
    && String(photo.photoCoverageGuard || '').includes('19 module cards + 6 specialist cards');
}

module.exports = { evaluatePhotoCatalogPublicationContract, RUNTIME_MARKERS, CSS_MARKERS, releasePhotoCoverageValid };
