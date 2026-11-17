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

function unique(values) {
  const normalized = values.map(value => String(value || '').split('?')[0].replace(/#.*$/, '').replace(/\/$/, '').toLowerCase());
  return normalized.every(Boolean) && new Set(normalized).size === normalized.length;
}

function evaluatePhotoCatalogPublicationContract({
  jsOk, cssOk, manifestOk, manifest, js, css, html, serviceWorker,
  remoteRelease, expectedPhotoCatalogBuild, methodRenderer, visualPhotoGuard, legacyPhotoGuard
} = {}) {
  const missing = [];
  const mark = (condition, label) => { if (!condition) missing.push(label); };
  const provider = manifest?.dynamicProvider || {};
  const queue = manifest?.photoQueuePolicy || {};
  const photoPolicy = manifest?.uniqueRepairPhotoPolicy || {};
  const runtime = String(js || '');
  const stylesheet = String(css || '');
  const page = String(html || '');
  const sw = String(serviceWorker || '');
  const renderer = String(methodRenderer || '');
  const visual = String(visualPhotoGuard || '');
  const legacy = String(legacyPhotoGuard || '');
  const photos = Array.isArray(manifest?.photos) ? manifest.photos : [];
  const moduleGrid = page.match(/<div class="np640-module-grid[^\"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  const moduleCards = [...moduleGrid.matchAll(/<button\b/g)].length;
  const modulePhotoTags = [...moduleGrid.matchAll(/<img\b(?=[^>]*\bdata-photo-id="home-module-[^"]+")[^>]*>/gi)].map(match => match[0]);
  const modulePhotoIds = modulePhotoTags.map(tag => tag.match(/\bdata-photo-id="([^"]+)"/i)?.[1] || '');
  const specialistSection = page.match(/<section class="np75-specialists"[\s\S]*?<\/section>/i)?.[0] || '';
  const specialistPhotoTags = [...specialistSection.matchAll(/<img\b(?=[^>]*\bdata-photo-id="home-specialist-[^"]+")[^>]*>/gi)].map(match => match[0]);
  const specialistIds = specialistPhotoTags.map(tag => tag.match(/\bdata-photo-id="([^"]+)"/i)?.[1] || '');
  const slotMap = manifest?.homepageSlotSeedMap || {};
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
  mark(photoPolicy.photosPerRepair === 3 && photoPolicy.globalSingleAssignment === true, 'repair_photo_single_assignment_policy');
  mark(provider.queryVariantsPerCategory === 3 && provider.maxPagesPerQuery === 3, 'openverse_query_and_page_limits');
  mark(provider.maxCommonsPages === 6 && provider.commonsQueryVariantsPerCategory === 3, 'commons_query_limits');
  mark(provider.licenseNormalization === true && provider.topicRelevanceFilter === true && provider.noGenericTopicFallback === true, 'strict_license_topic_filters');
  mark(provider.fullCatalogQueue === true && provider.fullCatalogTrackedLazy === true && provider.automaticTransientRetry === true, 'all_catalog_slots_tracked');
  mark(provider.activeViewLazyQueue === true && provider.visibleOnlyProgressive === true && provider.hiddenViewsQueuedOnBoot === false && provider.fullCatalogBackgroundQueue === false, 'active_view_progressive_fetch_policy');
  mark(queue.activeViewOnly === true && queue.activeViewQueueOnly === true && queue.hiddenViewsQueuedOnBoot === false && queue.allViewsQueuedOnBoot === false && queue.globalBackgroundQueue === false && queue.fullCatalogTrackedLazy === true && queue.fullCatalogBackgroundQueue === false, 'photo_queue_policy_consistency');
  mark(provider.activeViewMarginPx === 1450 && provider.dynamicInsertionQueue === true, 'viewport_margin_and_dynamic_insertions');
  mark(provider.visibleWrapperAnchorForHiddenImage === true && provider.requeueOnScrollAndNavigation === true, 'visible_wrapper_anchor_and_requeue');
  mark(provider.methodPhotoCount === 147 && provider.methodPhotoProgressive === true, '147_method_photo_slots');
  mark(provider.dailyAnonymousRequestBudget === 180 && provider.minRequestIntervalMs === 3300, 'provider_rate_limits_preserved');
  mark(provider.retryAfterHttpDateSupported === true && provider.commonsTransientRetry === 'network, HTTP 408, 429, 503 and 5xx with bounded exponential backoff', 'provider_http_date_and_commons_retry_policy');
  mark(provider.openverseDailyBudgetScope === 'Openverse only; does not block Wikimedia Commons fallback retries', 'openverse_budget_scoped_to_provider');
  mark(queue.openverseBudgetDoesNotBlockCommonsRetry === true && queue.commonsTransientRetry === true, 'manifest_commons_retry_policy');
  mark(String(provider.strictPortEvidence || '').includes('USB-C'), 'strict_usb_c_evidence');
  mark(String(provider.strictVramEvidence || '').includes('GDDR'), 'strict_vram_evidence');
  mark(String(provider.strictRamEvidence || '').includes('DIMM'), 'strict_ram_evidence');
  mark(manifest?.hotfix === 'FIX94', 'photo_manifest_fix94_lineage_preserved');
  mark(manifest?.runtimeHotfix === 'FIX111', 'photo_runtime_fix111');
  mark(manifest?.version === expectedPhotoCatalogBuild && manifest?.runtimeBuildTag === expectedPhotoCatalogBuild, 'photo_runtime_build_tag');
  mark(manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix111.js?v=6.8.0-fix111', 'photo_runtime_path');
  mark(manifest?.onlinePhotoStylesheet === 'assets/photo-catalog-fix109.css?v=6.8.0-fix109', 'photo_stylesheet_path');
  mark(queue.methodCards === 147 && queue.methodTitleTopicMapping === true, 'manifest_method_title_topic_mapping');
  mark(queue.methodRendererQueueHandoff === true && queue.methodManualRetry === '#methodPhotoRetry', 'manifest_method_renderer_handoff_and_retry');
  mark(queue.methodVisibleStatus === true && queue.methodVisibleStatusPanel === '#methodPhotoQueueStatusText', 'manifest_visible_method_status');
  mark(queue.homeSeedOwnershipReservation === true && queue.homepageSlots === 21 && queue.homepageSeedOwnershipMigration === true, 'manifest_homepage_seed_owner_migration');
  mark(queue.fullCatalogTrackedLazy === true && queue.allViewsQueuedOnBoot === false && queue.globalBackgroundQueue === false && queue.hiddenViewsQueuedOnBoot === false, 'manifest_global_tracking_lazy_download');

  const runtimeMarkers = [
    'FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE', 'FIX111_HOME_SEED_OWNERSHIP_MIGRATION',
    'FIX108_PROVIDER_RECOVERY', 'function resolveCuratedSeedId(photo)',
    'function restoreAssignments()', 'function queueCatalogImages(root = document)',
    'if (isInActiveView(img) && isNearActiveViewport(img))',
    'function queueActiveViewImages()', 'function photoViewportAnchor(img)',
    'function methodCategoryFor(record)', 'replace(/ł/g, \'l\')',
    'function getMethodPhotoStats()', 'function bindMethodPhotoRetry()',
    'MAX_DAILY_REQUESTS = 180', 'OPENVERSE_GAP_MS = 3300',
    'https://api.openverse.org/v1/images/', 'https://commons.wikimedia.org/w/api.php',
    'FIX106_HOME_SEED_OWNER', 'academyPhotoCatalogAssignmentsFix109'
  ];
  for (const token of runtimeMarkers) mark(runtime.includes(token), `runtime:${token}`);
  mark(stylesheet.includes('.photo-fix90-online') && stylesheet.includes('#view-methods .method-photo-queue-status'), 'photo_stylesheet_markers');
  mark(visual.includes('FIX93_CATALOG_IMAGE_ERROR_OWNER') && visual.includes('isCatalogManagedSlot') && visual.includes('!isCatalogManagedSlot(img)'), 'visual_photo_guard_compatibility');
  mark(legacy.includes('FIX93_LEGACY_PHOTO_GUARD_OWNER') && legacy.includes('isOnlineCatalogPhoto(img)'), 'legacy_photo_guard_compatibility');
  mark(renderer.includes('methodCategoryFor?.(x)') && renderer.includes('data-photo-scope="workshop-method"') && renderer.includes('queueActivePhotos();'), 'method_renderer_queue_handoff');

  mark(Object.keys(slotMap).length === 21 && new Set(Object.values(slotMap)).size === 21, '21_unique_homepage_seed_bindings');
  const seedById = new Map(photos.map(photo => [photo.id, photo]));
  for (const [slotId, category] of Object.entries(EXPECTED_SLOT_CATEGORIES)) {
    const seed = seedById.get(slotMap[slotId]);
    mark(Boolean(seed && seed.category === category), `reserved_seed_exists_and_matches_category:${slotId}`);
  }
  mark(moduleCards === 19, 'homepage_module_cards_19');
  mark(modulePhotoTags.length === 15 && new Set(modulePhotoIds).size === 15, 'homepage_module_photo_slots_15');
  mark(modulePhotoTags.every(tag => /\bdata-photo-kind="[^"]+"/i.test(tag) && /\bdata-photo-title="[^"]+"/i.test(tag) && /\balt="[^"]+"/i.test(tag)), 'homepage_module_photo_metadata');
  mark(specialistPhotoTags.length === 6 && new Set(specialistIds).size === 6, 'specialist_photo_slots_6');
  mark(specialistPhotoTags.every(tag => /\bdata-photo-kind="[^"]+"/i.test(tag) && /\bdata-photo-title="[^"]+"/i.test(tag) && /\balt="[^"]+"/i.test(tag)), 'specialist_photo_metadata');
  for (const [id, category] of Object.entries(EXPECTED_SLOT_CATEGORIES)) {
    const tag = [...modulePhotoTags, ...specialistPhotoTags].find(value => value.includes(`data-photo-id="${id}"`));
    mark(Boolean(tag && tag.includes(`data-photo-kind="${category}"`)), `slot_category:${id}`);
  }
  mark(page.includes('content="FIX111"'), 'html_hotfix_fix111');
  mark(page.includes('photo-catalog-fix111.js?v=6.8.0-fix111'), 'html_runtime_reference');
  mark(page.includes('photo-catalog-fix109.css?v=6.8.0-fix109'), 'html_stylesheet_reference');
  mark(sw.includes('nauka-6.8.0-fix118-photo-library-20261110'), 'service_worker_cache_preserved');
  mark(sw.includes('photo-catalog-fix111.js?v=6.8.0-fix111'), 'service_worker_runtime_reference');
  mark(sw.includes('photo-catalog-fix109.css?v=6.8.0-fix109') && sw.includes('media/photo-sources-online.json'), 'service_worker_styles_and_manifest');
  mark(remoteRelease?.latestHotfix === 'FIX111', 'release_latest_hotfix');
  mark(remoteRelease?.latestHotfixBuild === expectedPhotoCatalogBuild, 'release_hotfix_build');
  mark(remoteRelease?.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'release_photo_runtime_build');
  return { valid: missing.length === 0, missing, moduleCards, modulePhotoSlots: modulePhotoIds.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length, methodPhotoSlots: releasePhoto.methodPhotoSlots || 147 };
}

module.exports = { evaluatePhotoCatalogPublicationContract, EXPECTED_SLOT_CATEGORIES };
