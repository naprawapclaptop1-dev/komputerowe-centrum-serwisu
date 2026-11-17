'use strict';

const RUNTIME_MARKERS = [
  'FIX99_ACTIVE_VIEW_LAZY_QUEUE', 'FIX99_HOME_SLOT_SEEDS',
  'function isInActiveView(img)', 'function photoViewportAnchor(img)',
  'function isNearActiveViewport(img, margin = ACTIVE_VIEW_MARGIN)',
  'function queueActiveViewImages()', 'function pruneQueueToActiveView()',
  'function activatePendingImages(active)', 'function scheduleActiveViewQueue()',
  'methodCategoryFor({ category: rawCategory, name: alt, diagnosis: parentText })',
  'FIX99_METHOD_CATEGORY_ALIASES', 'home-specialist-bios',
  'academyPhotoCatalogAssignmentsFix99', 'academyPhotoCatalogAssignmentsFix98',
  'academyPhotoCatalogDailyFix99', 'academyPhotoCatalogPageStateFix99',
  'academyPhotoCatalogCandidatePoolsFix99', 'MAX_DAILY_REQUESTS = 180',
  'OPENVERSE_GAP_MS = 3300', 'function photoIdentity(photo)',
  'hamming(old, photo.hash) < 10', 'renderedOnlinePhotoCount',
  'renderedLocalPhotoCount', 'FIX96_HOME_LOCAL_PHOTOGRAPHY',
  'photoCatalogActiveViewLazyQueueFix99', 'photoCatalogQueuePolicy',
  'photo-fix90-online', 'ILUSTRACJA TECHNICZNA OFFLINE'
];

const CSS_MARKERS = [
  '.photo-fix90-online', '.photo-fallback-label-fix90', '.photo-catalog-fix90-status',
  '#view-methods .method-card>.catalog-card-art',
  '.view-section.active .diagnostic-feature-image img'
];

const EXPECTED_SLOT_CATEGORIES = {
  'home-module-repairmaster': 'meter', 'home-module-components': 'ram',
  'home-module-ultimate3d': 'board', 'home-module-labplus': 'solder',
  'home-module-courses': 'certification', 'home-module-checklists': 'certification',
  'home-module-modelcenter': 'board', 'home-module-knowledge': 'certification',
  'home-module-cloudchat': 'certification', 'home-module-14': 'diagnostics',
  'home-module-15': 'electronics', 'home-module-16': 'board',
  'home-module-17': 'ram', 'home-module-18': 'laptop', 'home-module-19': 'certification',
  'home-specialist-laptop': 'laptop', 'home-specialist-bios': 'bios',
  'home-specialist-storage': 'storage', 'home-specialist-windows': 'diagnostics',
  'home-specialist-network': 'network', 'home-specialist-cpu-ram': 'ram'
};

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
  const slotMap = manifest?.homepageSlotSeedMap || {};
  const slotMapIds = Object.keys(slotMap);
  const seedById = new Map(photos.map(photo => [photo.id, photo]));

  mark(jsOk === true, 'photo_catalog_js_http');
  mark(cssOk === true, 'photo_catalog_css_http');
  mark(manifestOk === true, 'photo_sources_manifest_http');
  mark(provider.enabled === true, 'provider_enabled');
  mark(photos.length >= 37, 'verified_seed_photos_37');
  mark(unique(photos.map(photo => photo.id)), 'unique_seed_ids');
  mark(unique(photos.map(photo => photo.page)), 'unique_seed_source_pages');
  mark(unique(photos.map(photo => photo.asset)), 'unique_seed_asset_urls');
  mark(photos.every(photo => photo.asset?.startsWith('https://') && photo.page?.startsWith('https://') && photo.author && photo.license && photo.licenseUrl && photo.category && photo.topic), 'seed_attribution_and_license_metadata');
  mark(policy.photosPerRepair === 3 && policy.globalSingleAssignment === true, 'repair_photo_single_assignment_policy');
  mark(provider.queryVariantsPerCategory === 3 && provider.maxPagesPerQuery === 3, 'openverse_query_and_page_limits');
  mark(provider.maxCommonsPages === 6 && provider.commonsQueryVariantsPerCategory === 3, 'commons_query_limits');
  mark(provider.licenseNormalization === true && provider.topicRelevanceFilter === true && provider.noGenericTopicFallback === true, 'strict_license_topic_filters');
  mark(provider.fullCatalogQueue === true && provider.automaticTransientRetry === true, 'full_catalog_retry_enabled');
  mark(provider.activeViewLazyQueue === false && provider.visibleOnlyProgressive === false && provider.fullCatalogQueue === true, 'active_view_progressive_queue');
  mark(provider.activeViewMarginPx === 1450 && provider.hiddenViewsQueuedOnBoot === true, 'active_view_margin_and_hidden_view_budget');
  mark(provider.visibleWrapperAnchorForHiddenImage === true && provider.requeueOnScrollAndNavigation === true, 'hidden_image_wrapper_anchor_and_requeue');
  mark(provider.methodPhotoCount === 147 && provider.methodPhotoProgressive === true, '147_method_photo_slots');
  mark(provider.dailyAnonymousRequestBudget === 180 && provider.minRequestIntervalMs === 3300, 'provider_rate_limits_preserved');
  mark(String(provider.strictPortEvidence || '').includes('USB-C'), 'strict_usb_c_evidence');
  mark(String(provider.strictVramEvidence || '').includes('GDDR'), 'strict_vram_evidence');
  mark(String(provider.strictRamEvidence || '').includes('DIMM'), 'strict_ram_evidence');
  mark(manifest?.hotfix === 'FIX94', 'photo_manifest_fix94_lineage');
  mark(manifest?.runtimeHotfix === 'FIX99', 'photo_runtime_fix99');
  mark(manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix99.js?v=6.8.0-fix99', 'photo_runtime_path');
  mark(manifest?.onlinePhotoStylesheet === 'assets/photo-catalog-fix99.css?v=6.8.0-fix99', 'photo_stylesheet_path');

  for (const token of RUNTIME_MARKERS) mark(runtime.includes(token), `runtime:${token}`);
  for (const token of CSS_MARKERS) mark(stylesheet.includes(token), `css:${token}`);

  mark(moduleCards === 19, 'homepage_module_cards_19');
  mark(modulePhotoTags.length === 15 && new Set(modulePhotoIds).size === 15, 'homepage_module_photo_slots_15');
  mark(modulePhotoTags.every(tag => /\bdata-photo-kind="[^"]+"/i.test(tag) && /\bdata-photo-title="[^"]+"/i.test(tag) && /\balt="[^"]+"/i.test(tag)), 'homepage_module_photo_metadata');
  mark(specialistPhotoTags.length === 6 && new Set(specialistIds).size === 6, 'specialist_photo_slots_6');
  mark(specialistPhotoTags.every(tag => /\bdata-photo-kind="[^"]+"/i.test(tag) && /\bdata-photo-title="[^"]+"/i.test(tag) && /\balt="[^"]+"/i.test(tag)), 'specialist_photo_metadata');
  mark(slotMapIds.length === 21 && new Set(Object.values(slotMap)).size === 21, '21_unique_home_slot_seed_bindings');
  mark(Object.entries(EXPECTED_SLOT_CATEGORIES).every(([id, category]) => {
    const seed = seedById.get(slotMap[id]);
    return Boolean(seed && seed.category === category && seed.author && seed.license && seed.licenseUrl && seed.page?.startsWith('https://') && seed.asset?.startsWith('https://'));
  }), 'home_slot_seeds_match_topic_license_and_source');
  mark(Object.keys(EXPECTED_SLOT_CATEGORIES).every(id => Object.prototype.hasOwnProperty.call(slotMap, id)), 'all_15_module_and_6_specialist_ids_mapped');
  mark(String(homeCss || '').includes('#view-home .np75-specialist-photo>img') && String(homeCss || '').includes('object-fit:cover'), 'specialist_photo_responsive_styles');

  const photo = remoteRelease?.photoCatalog || {};
  mark(remoteRelease?.release === '6.8.0', 'remote_product_version_unchanged');
  mark(remoteRelease?.latestHotfix === 'FIX101', 'remote_release_hotfix_fix101');
  mark(remoteRelease?.latestHotfixBuild === '6.8.0-fix101-node-picker-cmd-first-20261108', 'remote_release_build_fix101');
  mark(Boolean(expectedPhotoCatalogBuild) && remoteRelease?.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'photo_catalog_runtime_build_tag');
  mark(photo.homepagePrioritySlots === 21 && photo.modulePhotoSlots === 19 && photo.specialistPhotoSlots === 6, 'release_home_slot_counts');
  mark(photo.methodPhotoSlots === 147 && photo.activeViewLazyQueue === false && photo.allViewsQueuedOnBoot === true && photo.activeViewMarginPx === 1450, 'release_method_active_view_policy');
  mark(photo.hiddenViewsQueuedOnBoot === true && photo.visibleWrapperAnchorForHiddenImage === true, 'release_hidden_image_handling');
  mark(String(photo.photoCoverageGuard || '').includes('147 method cards'), 'release_photo_coverage_guard');

  mark(page.includes('content="FIX101"'), 'html_hotfix_fix101');
  mark(page.includes('photo-catalog-fix99.js?v=6.8.0-fix99'), 'html_runtime_reference');
  mark(page.includes('photo-catalog-fix99.css?v=6.8.0-fix99'), 'html_stylesheet_reference');
  mark(sw.includes('nauka-6.8.0-fix94-topic-verified-photo-20261107-fix101'), 'service_worker_cache_fix101');
  mark(sw.includes('photo-catalog-fix99.js?v=6.8.0-fix99'), 'service_worker_runtime_reference');
  mark(sw.includes('photo-catalog-fix99.css?v=6.8.0-fix99'), 'service_worker_stylesheet_reference');
  mark(sw.includes('media/photo-sources-online.json'), 'service_worker_source_manifest_reference');
  return { valid: missing.length === 0, missing, moduleCards, modulePhotoSlots: modulePhotoIds.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length, methodPhotoSlots: photo.methodPhotoSlots || 0 };
}

module.exports = { evaluatePhotoCatalogPublicationContract, RUNTIME_MARKERS, CSS_MARKERS, EXPECTED_SLOT_CATEGORIES };
