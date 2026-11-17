'use strict';

const EXPECTED_SLOT_CATEGORIES = Object.freeze({
  'home-module-repairmaster':'meter','home-module-components':'ram',
  'home-module-ultimate3d':'board','home-module-labplus':'solder',
  'home-module-courses':'certification','home-module-checklists':'certification',
  'home-module-modelcenter':'board','home-module-knowledge':'certification',
  'home-module-cloudchat':'certification','home-module-14':'diagnostics',
  'home-module-15':'electronics','home-module-16':'board','home-module-17':'ram',
  'home-module-18':'laptop','home-module-19':'certification',
  'home-specialist-laptop':'laptop','home-specialist-bios':'bios',
  'home-specialist-storage':'storage','home-specialist-windows':'diagnostics',
  'home-specialist-network':'network','home-specialist-cpu-ram':'ram'
});

const RUNTIME_MARKERS = Object.freeze([
  'FIX109_FULL_CATALOG_BACKGROUND_QUEUE',
  'FIX108_PROVIDER_RECOVERY',
  'function retryAfterDelayMs(value, now = Date.now(), fallbackMs = 60000)',
  'function commonsBackoffMs(failures)',
  "headers['Api-User-Agent']",
  'The 180/day limit applies only to Openverse; Commons must keep retrying.',
  'state.commonsTried = false; // Never discard the remaining queries after a transient provider failure.',
  'state.commonsRetryAt = Date.now() + delay;',
  'FIX106_METHOD_TITLE_TOPIC_MAPPING',
  'FIX106_METHOD_RENDERER_QUEUE_HANDOFF',
  'FIX106_METHOD_STATUS_PANEL',
  'function methodCategoryFor(record)',
  'replace(/ł/g, \'l\')',
  'function queueActiveViewImages()',
  'function getMethodPhotoStats()',
  'function bindMethodPhotoRetry()',
  'methodCategoryFor({ category: rawCategory, name: alt })',
  'FIX106_HOME_SLOT_SEEDS',
  'FIX106_HOME_SEED_OWNER',
  'academyPhotoCatalogAssignmentsFix108',
  'academyPhotoCatalogAssignmentsFix106',
  'const trustedMethodAssignments = new Set([...Object.keys(safeJson(LEGACY_ASSIGN_KEY_FIX108) || {}), ...Object.keys(safeJson(LEGACY_ASSIGN_KEY) || {}), ...Object.keys(assignmentState)]);',
  'academyPhotoCatalogPageStateFix108',
  'academyPhotoCatalogPageStateFix106',
  'academyPhotoCatalogCandidatePoolsFix108',
  'academyPhotoCatalogCandidatePoolsFix106',
  'MAX_DAILY_REQUESTS = 180',
  'OPENVERSE_GAP_MS = 3300',
  'function photoIdentity(photo)',
  'hamming(old, photo.hash) < 10',
  'function pruneQueueToActiveView()',
  'function isNearActiveViewport(img, margin = ACTIVE_VIEW_MARGIN)',
  'methodPhotoQueueStatusText',
  'methodPhotoRetry',
  'FIX96_HOME_LOCAL_PHOTOGRAPHY',
  "'.np30-hero-photo-main img'", "'.np30-hero-photo-stack img'", "'.diagnostic-photo-fix90'",
  "'.academy-video-cover img'", "'.video-card img'", "'.video-cover img'", "'.long-video-cover img'",
  "'.fix51-photo-grid img'", "'.nwm-related-media img'"
]);

const CSS_MARKERS = Object.freeze([
  '.photo-fix90-online', '.photo-fallback-label-fix90', '.photo-catalog-fix90-status',
  '#view-methods .method-card>.catalog-card-art',
  '#view-methods .method-photo-queue-status',
  '.view-section.active .diagnostic-feature-image img'
]);

function unique(values) {
  const normalized = values.map(value => String(value || '').split('?')[0].replace(/#.*$/, '').replace(/\/$/, '').toLowerCase());
  return normalized.every(Boolean) && new Set(normalized).size === normalized.length;
}

function evaluatePhotoCatalogPublicationContract({
  jsOk, cssOk, manifestOk, manifest, js, css, homeCss, html, serviceWorker,
  remoteRelease, expectedPhotoCatalogBuild, methodRenderer
} = {}) {
  const missing = [];
  const mark = (condition, label) => { if (!condition) missing.push(label); };
  const provider = manifest?.dynamicProvider || {};
  const policy = manifest?.uniqueRepairPhotoPolicy || {};
  const queuePolicy = manifest?.photoQueuePolicy || {};
  const runtime = String(js || '');
  const stylesheet = String(css || '');
  const page = String(html || '');
  const sw = String(serviceWorker || '');
  const renderer = String(methodRenderer || '');
  const photos = Array.isArray(manifest?.photos) ? manifest.photos : [];
  const moduleGrid = page.match(/<div class="np640-module-grid[^\"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  const moduleCards = [...moduleGrid.matchAll(/<button\b/g)].length;
  const modulePhotoTags = [...moduleGrid.matchAll(/<img\b(?=[^>]*\bdata-photo-id="home-module-[^"]+")[^>]*>/gi)].map(match => match[0]);
  const modulePhotoIds = modulePhotoTags.map(tag => tag.match(/\bdata-photo-id="([^"]+)"/i)?.[1] || '');
  const specialistSection = page.match(/<section class="np75-specialists"[\s\S]*?<\/section>/i)?.[0] || '';
  const specialistPhotoTags = [...specialistSection.matchAll(/<img\b(?=[^>]*\bdata-photo-id="home-specialist-[^"]+")[^>]*>/gi)].map(match => match[0]);
  const specialistIds = specialistPhotoTags.map(tag => tag.match(/\bdata-photo-id="([^"]+)"/i)?.[1] || '');
  const methodStatusPanel = page.match(/<div class="method-photo-queue-status"[^>]*id="methodPhotoQueueStatus"[\s\S]*?<\/div>/i)?.[0] || '';
  const slotMap = manifest?.homepageSlotSeedMap || {};
  const slotMapIds = Object.keys(slotMap);
  const seedById = new Map(photos.map(photo => [photo.id, photo]));
  const releasePhoto = remoteRelease?.photoCatalog || {};

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
  mark(provider.activeViewLazyQueue === false && provider.visibleOnlyProgressive === false && provider.fullCatalogQueue === true, 'full_catalog_progressive_queue');
  mark(provider.activeViewMarginPx === 1450 && provider.hiddenViewsQueuedOnBoot === true && provider.dynamicInsertionQueue === true, 'all_views_queued_at_boot_and_dynamic_insertions');
  mark(provider.visibleWrapperAnchorForHiddenImage === true && provider.requeueOnScrollAndNavigation === true, 'hidden_image_wrapper_anchor_and_requeue');
  mark(provider.methodPhotoCount === 147 && provider.methodPhotoProgressive === true, '147_method_photo_slots');
  mark(provider.dailyAnonymousRequestBudget === 180 && provider.minRequestIntervalMs === 3300, 'provider_rate_limits_preserved');
  mark(provider.retryAfterHttpDateSupported === true && provider.commonsTransientRetry === 'network, HTTP 408, 429, 503 and 5xx with bounded exponential backoff', 'provider_http_date_and_commons_retry_policy');
  mark(provider.openverseDailyBudgetScope === 'Openverse only; does not block Wikimedia Commons fallback retries', 'openverse_budget_scoped_to_provider');
  mark(manifest?.photoQueuePolicy?.openverseBudgetDoesNotBlockCommonsRetry === true && manifest?.photoQueuePolicy?.commonsTransientRetry === true, 'manifest_commons_retry_policy');
  mark(String(provider.strictPortEvidence || '').includes('USB-C'), 'strict_usb_c_evidence');
  mark(String(provider.strictVramEvidence || '').includes('GDDR'), 'strict_vram_evidence');
  mark(String(provider.strictRamEvidence || '').includes('DIMM'), 'strict_ram_evidence');
  mark(manifest?.hotfix === 'FIX94', 'photo_manifest_fix94_lineage_preserved');
  mark(manifest?.runtimeHotfix === 'FIX109', 'photo_runtime_fix109');
  mark(manifest?.version === expectedPhotoCatalogBuild, 'photo_manifest_current_version');
  mark(manifest?.runtimeBuildTag === expectedPhotoCatalogBuild, 'photo_manifest_build_tag');
  mark(manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix109.js?v=6.8.0-fix109', 'photo_runtime_path');
  mark(manifest?.onlinePhotoStylesheet === 'assets/photo-catalog-fix109.css?v=6.8.0-fix109', 'photo_stylesheet_path');
  mark(queuePolicy.methodCards === 147 && queuePolicy.methodTitleTopicMapping === true, 'manifest_method_title_topic_mapping');
  mark(queuePolicy.methodRendererQueueHandoff === true && queuePolicy.methodManualRetry === '#methodPhotoRetry', 'manifest_explicit_renderer_handoff_and_retry');
  mark(queuePolicy.methodVisibleStatus === true && queuePolicy.methodVisibleStatusPanel === '#methodPhotoQueueStatusText', 'manifest_visible_147_method_status');
  mark(queuePolicy.homeSeedOwnershipReservation === true && queuePolicy.homepageSlots === 21, 'manifest_homepage_seed_reservation');

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

  mark(renderer.includes('const renderMethods=') && renderer.includes('methodCategoryFor?.(x)'), 'method_renderer_uses_title_category_mapper');
  mark(renderer.includes('data-photo-scope="workshop-method"') && renderer.includes('data-photo-title="${esc(x.name)}"'), 'method_renderer_uses_method_title_and_scope');
  mark(renderer.includes('queueActivePhotos();'), 'method_renderer_explicit_queue_handoff');
  mark(methodStatusPanel.includes('id="methodPhotoQueueStatusText"') && methodStatusPanel.includes('id="methodPhotoRetry"'), 'html_method_photo_status_and_retry');

  mark(remoteRelease?.release === '6.8.0', 'remote_product_version_unchanged');
  mark(remoteRelease?.latestHotfix === 'FIX109', 'remote_release_hotfix_fix109');
  mark(remoteRelease?.latestHotfixBuild === '6.8.0-fix109-full-catalog-photo-queue-20261109', 'remote_release_build_fix109');
  mark(Boolean(expectedPhotoCatalogBuild) && remoteRelease?.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'photo_catalog_runtime_build_tag');
  mark(releasePhoto.homepagePrioritySlots === 21 && releasePhoto.modulePhotoSlots === 19 && releasePhoto.specialistPhotoSlots === 6, 'release_home_slot_counts');
  mark(releasePhoto.methodPhotoSlots === 147 && releasePhoto.activeViewLazyQueue === false && releasePhoto.allViewsQueuedOnBoot === true && releasePhoto.activeViewMarginPx === 1450, 'release_method_full_catalog_policy');
  mark(releasePhoto.methodRendererQueueHandoff === true && releasePhoto.visibleMethodPhotoStatus === true, 'release_method_renderer_status_policy');
  mark(releasePhoto.hiddenViewsQueuedOnBoot === true && releasePhoto.dynamicInsertionsQueuedImmediately === true && releasePhoto.visibleWrapperAnchorForHiddenImage === true, 'release_hidden_image_handling');
  mark(Array.isArray(manifest?.photoQueuePolicy?.imageSlotCoverage) && manifest.photoQueuePolicy.imageSlotCoverage.includes('video and long-video thumbnails') && manifest.photoQueuePolicy.imageSlotCoverage.includes('master workshop related media'), 'manifest_extended_image_slot_coverage');
  mark(String(releasePhoto.photoCoverageGuard || '').includes('147 method cards'), 'release_photo_coverage_guard');

  mark(page.includes('content="FIX109"'), 'html_hotfix_fix109');
  mark(page.includes('photo-catalog-fix109.js?v=6.8.0-fix109'), 'html_runtime_reference');
  mark(page.includes('photo-catalog-fix109.css?v=6.8.0-fix109'), 'html_stylesheet_reference');
  mark(sw.includes('nauka-6.8.0-fix118-photo-library-20261110'), 'service_worker_cache_fix109');
  mark(sw.includes('photo-catalog-fix109.js?v=6.8.0-fix109'), 'service_worker_runtime_reference');
  mark(sw.includes('photo-catalog-fix109.css?v=6.8.0-fix109'), 'service_worker_stylesheet_reference');
  mark(sw.includes('media/photo-sources-online.json'), 'service_worker_source_manifest_reference');
  return { valid: missing.length === 0, missing, moduleCards, modulePhotoSlots: modulePhotoIds.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length, methodPhotoSlots: releasePhoto.methodPhotoSlots || 0 };
}

module.exports = { evaluatePhotoCatalogPublicationContract, RUNTIME_MARKERS, CSS_MARKERS, EXPECTED_SLOT_CATEGORIES };
