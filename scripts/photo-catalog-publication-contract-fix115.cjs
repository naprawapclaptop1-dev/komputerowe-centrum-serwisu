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
  remoteRelease, expectedPhotoCatalogBuild, methodRenderer, visualPhotoGuard, legacyPhotoGuard, layoutCss, photoLibrary
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
  const layout = String(layoutCss || '');
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

  // FIX176 keeps the current FIX135 curated library + FIX136 runtime while the
  // application cache, Global Academy fallback and learning modules advance independently. Validate
  // the actual 19 same-origin photo bindings rather than obsolete FIX128 flags.
  if (remoteRelease?.latestHotfix === 'FIX176') {
    const mapping = manifest?.homepageSlotSeedMap || {};
    const slotEntries = Array.isArray(photoLibrary?.entries) ? photoLibrary.entries : [];
    const byId = new Map(photos.map(photo => [photo.id, photo]));
    const htmlSlotIds = [...page.matchAll(/<img\b[^>]*\bdata-photo-id=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
    const humanMeta = /\b(?:person|people|human|man|woman|hand|hands|finger|face|teacher|student|technician|worker|classroom|group|osoba|osoby|czlowiek|rece|dlonie|technik|serwisant|nauczyciel|uczen)\b/i;
    const mappedRecordsValid = Object.entries(mapping).length === 19
      && new Set(Object.values(mapping)).size === 19
      && Object.entries(mapping).every(([slotId, seedId]) => {
        const photo = byId.get(seedId);
        const entry = slotEntries.find(item => item.slotId === slotId);
        if (!photo || !entry) return false;
        const category = String(photo.category || '');
        const tag = [...page.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]).find(value => value.includes(`data-photo-id="${slotId}"`));
        return Boolean(
          photo.asset === `/media/photos/${seedId}.jpg`
          && photo.author && photo.license && photo.licenseUrl && photo.page && /^https:\/\//.test(photo.sourceAsset || '')
          && !humanMeta.test([photo.topic, photo.tags, photo.description, photo.page, photo.sourcePage].join(' '))
          && entry.seedId === seedId && entry.assetUrl === photo.asset
          && /^https:\/\//.test(entry.sourceAsset || '') && /^https:\/\//.test(entry.sourcePage || '')
          && entry.creator && entry.license && /^https:\/\//.test(entry.licenseUrl || '')
          && entry.category === category && entry.topic
          && tag && new RegExp(`data-photo-id=["']${slotId}["'][^>]*data-photo-kind=["']${category}["']`).test(tag)
        );
      });
    const activeCache = String(remoteRelease?.serviceWorkerCacheName || '');
    const photoCache = String(photoLibrary?.cacheName || '');
    const firstRender = remoteRelease?.homepagePhotoFirstRenderFix || {};
    const localLibrary = remoteRelease?.localPhotoLibraryFix118 || {};
    const currentPhotoLibrary = remoteRelease?.fix118_local_photo_library || {};
    const photoBuild = String(remoteRelease?.photoCatalogRuntimeBuildTag || '');
    const expectedRuntime = '6.8.0-fix136-top-photo-priority-practice-lessons-20261114';
    const valid = jsOk === true && cssOk === true && manifestOk === true
      && manifest?.hotfix === 'FIX129' && manifest?.runtimeHotfix === 'FIX135'
      && manifest?.runtimeBuildTag === '6.8.0-fix135-home-module-photo-coverage-20261113'
      && photoBuild === expectedRuntime && expectedPhotoCatalogBuild === expectedRuntime
      && manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix115.js?v=6.8.0-fix135'
      && mappedRecordsValid && slotEntries.length === 19
      && htmlSlotIds.filter(id => Object.prototype.hasOwnProperty.call(mapping, id)).length === 19
      && provider.enabled === true
      && runtime.includes('function hasHumanSubjectMetadata')
      && runtime.includes('function renderedOnlinePhotoCount()')
      && runtime.includes('sameOriginCuratedPhoto')
      && runtime.includes('function isPhotoRelevantForSlot')
      && stylesheet.includes('.photo-fix90-online')
      && layout.includes('#view-home .np75-specialist-photo>img')
      && renderer.includes('methodCategoryFor')
      && page.includes('photo-catalog-fix115.js?v=6.8.0-fix136')
      && page.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136')
      && sw.includes(`const CACHE_NAME = 'nauka-${remoteRelease.latestHotfixBuild}'`)
      && sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'")
      && sw.includes("url.pathname.startsWith('/media/photos/')")
      && sw.includes('photoCache.put(request, response.clone())')
      && !page.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123')
      && !page.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122')
      && firstRender.registeredAssignments === 19 && firstRender.homepageEnabled === true
      && firstRender.cacheName === photoCache
      && localLibrary.hotfix === 'FIX136' && localLibrary.moduleSlots === 19 && localLibrary.uniqueSeeds === 19
      && localLibrary.cacheName === photoCache
      && localLibrary.deliveryMode === 'same-origin-pages-function-proxy'
      && releasePhoto.runtimeHotfix === 'FIX136' && releasePhoto.methodAssignmentNamespace === 'academyPhotoCatalogAssignmentsFix115'
      && releasePhoto.homepageEnabled === true && releasePhoto.runtime === 'assets/photo-catalog-fix115.js?v=6.8.0-fix136'
      && localLibrary.hotfix === 'FIX136' && localLibrary.moduleSlots === 19 && localLibrary.uniqueSeeds === 19
      && localLibrary.cacheName === photoCache && localLibrary.deliveryMode === 'same-origin-pages-function-proxy'
      && currentPhotoLibrary.hotfix === 'FIX136' && currentPhotoLibrary.photoSlots === 19
      && currentPhotoLibrary.uniqueSeeds === 19 && currentPhotoLibrary.uniqueAssets === 19
      && currentPhotoLibrary.cacheName === photoCache && currentPhotoLibrary.homepageEnabled === true
      && currentPhotoLibrary.d1Migrations === 'none' && currentPhotoLibrary.dataMigrations === 'none';
    return {
      valid,
      missing: valid ? [] : ['FIX176 current photo contract (19 unique licensed same-origin equipment photos, FIX136 runtime, preserved FIX135 cache, current PWA cache and no migrations)'],
      moduleCards: 19,
      modulePhotoSlots: Object.keys(mapping).length,
      specialistPhotoSlots: specialistIds.length,
      seedPhotoCount: photos.length,
      methodPhotoSlots: queue.methodCards || 147
    };
  }

  // FIX131 replaces direct browser-to-CDN homepage image requests with a same-origin
  // Pages Function route. Validate both the local URL contract and the runtime count logic.
  if (['FIX131', 'FIX133', 'FIX134', 'FIX135', 'FIX136', 'FIX145', 'FIX147', 'FIX148', 'FIX149', 'FIX155', 'FIX162', 'FIX163', 'FIX164', 'FIX165'].includes(remoteRelease?.latestHotfix)) {
    const mapping = manifest?.homepageSlotSeedMap || {};
    const values = Object.values(mapping);
    const byId = new Map(photos.map(photo => [photo.id, photo]));
    const htmlSlotIds = [...page.matchAll(/<img\b[^>]*\bdata-photo-id=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
    const mappedRecordsValid = values.length === 19 && new Set(values).size === 19 && values.every(id => {
      const photo = byId.get(id);
      return Boolean(photo && photo.asset === `/media/photos/${id}.jpg`
        && /^https:\/\//.test(photo.sourceAsset || '')
        && /^https:\/\//.test(photo.page || '')
        && photo.author && photo.license && photo.licenseUrl && photo.category && photo.topic);
    });
    const humanMeta = /\b(?:person|people|human|man|woman|hand|hands|finger|face|teacher|student|technician|worker|classroom|group|osoba|osoby|czlowiek|rece|dlonie|technik|serwisant|nauczyciel|uczen)\b/i;
    const humanFree = values.every(id => { const x=byId.get(id)||{}; return !humanMeta.test([x.topic,x.tags,x.description,x.page,x.sourcePage].join(' ')); });
    const slotsPresent = Object.keys(mapping).every(slot => htmlSlotIds.includes(slot));
    const localPhoto = remoteRelease?.fix118_local_photo_library || {};
    const firstRender = remoteRelease?.homepagePhotoFirstRenderFix || {};
    const valid = jsOk === true && cssOk === true && manifestOk === true
      && provider.enabled === true && mappedRecordsValid && humanFree && slotsPresent
      && manifest?.runtimeHotfix === 'FIX135'
      && manifest?.runtimeBuildTag === '6.8.0-fix135-home-module-photo-coverage-20261113'
      && runtime.includes('function hasHumanSubjectMetadata')
      && runtime.includes('function renderedOnlinePhotoCount()')
      && runtime.includes('sameOriginCuratedPhoto')
      && page.includes(`homepage-photo-prime-fix118.js?v=6.8.0-${['FIX136','FIX145','FIX148','FIX149','FIX155','FIX162','FIX163','FIX164','FIX165'].includes(remoteRelease?.latestHotfix) ? 'fix136' : 'fix135'}`)
      && page.includes(`photo-catalog-fix115.js?v=6.8.0-${['FIX136','FIX145','FIX148','FIX149','FIX155','FIX162','FIX163','FIX164','FIX165'].includes(remoteRelease?.latestHotfix) ? 'fix136' : 'fix135'}`)
      && sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'")
      && sw.includes("url.pathname.startsWith('/media/photos/')")
      && sw.includes('photoCache.put(request, response.clone())')
      && !page.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123')
      && !page.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122')
      && localPhoto.homepageEnabled === true && localPhoto.photoSlots === 19
      && localPhoto.deliveryMode === 'same-origin-pages-function-proxy'
      && firstRender.registeredAssignments === 19 && firstRender.homepageEnabled === true;
    return { valid, missing: valid ? [] : ['FIX131 same-origin photo contract (19 same-origin raster URLs, original HTTPS sources, safe metadata filter, corrected loaded-photo counter, PWA cache and enabled homepage assignments)'], moduleCards, modulePhotoSlots: values.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length, methodPhotoSlots: queue.methodCards || 147 };
  }

  // FIX129 supersedes the FIX122/FIX123 homepage-photo lock. Validate the new
  // equipment-only contract here so both OneClick and Watcher reject bad packages.
  if (['FIX129', 'FIX130'].includes(remoteRelease?.latestHotfix)) {
    const mapping = manifest?.homepageSlotSeedMap || {};
    const values = Object.values(mapping);
    const byId = new Map(photos.map(photo => [photo.id, photo]));
    const htmlSlotIds = [...page.matchAll(/<img\b[^>]*\bdata-photo-id=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
    const forbiddenShell = ['sitewide-tech-visuals-fix123.js?v=6.8.0-fix123','homepage-tech-only-fix122.js?v=6.8.0-fix122'];
    const blockedByHtml = forbiddenShell.some(token => page.includes(token));
    const blockedBySw = sw.includes('FIX123_LOCAL_IMAGE_FALLBACK');
    const seedRecordsValid = values.every(id => {
      const photo = byId.get(id);
      return Boolean(photo && /^https:\/\//.test(photo.asset || '') && /^https:\/\//.test(photo.page || '')
        && photo.author && photo.license && photo.licenseUrl && photo.category && photo.topic);
    });
    const humanMeta = /\b(?:person|people|human|man|woman|hand|hands|finger|face|teacher|student|technician|worker|classroom|group|osoba|osoby|czlowiek|rece|dlonie|technik|serwisant|nauczyciel|uczen)\b/i;
    const humanFree = values.every(id => { const x=byId.get(id)||{}; return !humanMeta.test([x.topic,x.tags,x.description,x.page,x.sourcePage].join(' ')); });
    const slotsPresent = values.every((_, index) => htmlSlotIds.includes(Object.keys(mapping)[index]));
    const valid = jsOk === true && cssOk === true && manifestOk === true && provider.enabled === true
      && values.length === 19 && new Set(values).size === 19 && seedRecordsValid && humanFree && slotsPresent
      && runtime.includes('function hasHumanSubjectMetadata') && runtime.includes('FIX129')
      && page.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix129') && page.includes('photo-catalog-fix115.js?v=6.8.0-fix129')
      && sw.includes('academy-photo-library-fix129') && sw.includes('isCuratedPhotoHost') && !blockedByHtml && !blockedBySw
      && releasePhoto.homepageEnabled === true && releasePhoto.homepagePhotoSlots === 19
      && remoteRelease?.homepagePhotoFirstRenderFix?.registeredAssignments === 19;
    return { valid, missing: valid ? [] : ['FIX129 equipment-photo contract (19 unique licensed equipment images, active homepage slots, safe metadata filter, no legacy blockers, PWA photo cache)'], moduleCards, modulePhotoSlots: values.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length, methodPhotoSlots: queue.methodCards || 147 };
  }

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
  mark(manifest?.runtimeHotfix === 'FIX118', 'photo_runtime_fix118');
  mark(manifest?.version === expectedPhotoCatalogBuild && manifest?.runtimeBuildTag === expectedPhotoCatalogBuild, 'photo_runtime_build_tag');
  mark(manifest?.onlinePhotoRuntime === 'assets/photo-catalog-fix115.js?v=6.8.0-fix118', 'photo_runtime_path');
  mark(manifest?.onlinePhotoStylesheet === 'assets/photo-catalog-fix109.css?v=6.8.0-fix109', 'photo_stylesheet_path');
  mark(manifest?.homepageLayoutStylesheet === 'assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115', 'homepage_specialist_layout_path');
  mark(manifest?.photoQualityPolicy?.hotfix === 'FIX115' && manifest.photoQualityPolicy.nonPhotographicMediaRejected === true && manifest.photoQualityPolicy.slotSpecificValidation === true, 'photo_quality_policy_manifest');
  mark(queue.methodCards === 147 && queue.methodTitleTopicMapping === true, 'manifest_method_title_topic_mapping');
  mark(queue.methodRendererQueueHandoff === true && queue.methodManualRetry === '#methodPhotoRetry', 'manifest_method_renderer_handoff_and_retry');
  mark(queue.methodVisibleStatus === true && queue.methodVisibleStatusPanel === '#methodPhotoQueueStatusText', 'manifest_visible_method_status');
  mark(queue.homeSeedOwnershipReservation === true && queue.homepageSlots === 21 && queue.homepageSeedOwnershipMigration === true, 'manifest_homepage_seed_owner_migration');
  mark(manifest?.homepagePhotoFirstRenderFix?.hotfix === 'FIX118' && manifest?.homepagePhotoFirstRenderFix?.catalogAssignmentMapRegistration === true, 'legacy_manifest_prime_record_compatibility');
  mark(queue.fullCatalogTrackedLazy === true && queue.allViewsQueuedOnBoot === false && queue.globalBackgroundQueue === false && queue.hiddenViewsQueuedOnBoot === false, 'manifest_global_tracking_lazy_download');

  const runtimeMarkers = [
    'FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE', 'FIX111_HOME_SEED_OWNERSHIP_MIGRATION',
    'FIX115_STRICT_PHOTO_MEDIA_MATCH', 'FIX115_REVALIDATE_LEGACY_ASSIGNMENTS', 'FIX117_REGISTER_PRIMED_HOME_ASSIGNMENTS', 'const primedHomePhotos = primeResult?.photos || {}',
    'NON_PHOTO_VISUAL_RE', 'function isNonPhotographicVisual(photo)', "function isPhotoRelevantForSlot(photo, category = photo?.category, slotId = '')",
    'academyPhotoCatalogAssignmentsFix115', 'academyPhotoCatalogAssignmentsFix111',
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
  mark(layout.includes('#view-home .np75-specialist-photo>img') && layout.includes('max-width:100%!important') && layout.includes('overflow:hidden!important') && layout.includes('grid-template-columns:repeat(3,minmax(0,1fr))'), 'specialist_card_image_containment');
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
  mark(modulePhotoTags.every(tag => /\bdata-photo-ignore="true"/i.test(tag) && /\bdata-photo-eligible="false"/i.test(tag) && /\balt="Ilustracja techniczna[^"]+"/i.test(tag)), 'homepage_module_technical_visual_lock');
  mark(specialistPhotoTags.length === 6 && new Set(specialistIds).size === 6, 'specialist_photo_slots_6');
  mark(specialistPhotoTags.every(tag => /\bdata-photo-ignore="true"/i.test(tag) && /\bdata-photo-eligible="false"/i.test(tag) && /\balt="Ilustracja techniczna[^"]+"/i.test(tag)), 'specialist_technical_visual_lock');
  for (const id of Object.keys(EXPECTED_SLOT_CATEGORIES)) {
    const tag = [...modulePhotoTags, ...specialistPhotoTags].find(value => value.includes(`data-photo-id="${id}"`));
    mark(Boolean(tag && /data-photo-ignore="true"/.test(tag) && /data-photo-eligible="false"/.test(tag)), `locked_home_slot:${id}`);
  }
  mark(page.includes('content="FIX123"'), 'html_hotfix_fix122');
  mark(page.includes('photo-catalog-fix115.js?v=6.8.0-fix118'), 'html_runtime_reference');
  mark(page.includes('photo-catalog-fix109.css?v=6.8.0-fix109'), 'html_stylesheet_reference');
  mark(sw.includes('nauka-6.8.0-fix127-portable-sha256-20261111') && sw.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123') && sw.includes('FIX123_LOCAL_IMAGE_FALLBACK') && !sw.includes('PHOTO_LIBRARY_CACHE_NAME'), 'service_worker_sitewide_tech_policy_and_retired_photo_cache');
  mark(sw.includes('photo-catalog-fix115.js?v=6.8.0-fix118'), 'service_worker_runtime_reference');
  mark(sw.includes('photo-catalog-fix109.css?v=6.8.0-fix109') && sw.includes('home-specialist-photo-layout-fix115.css?v=6.8.0-fix115') && sw.includes('media/photo-sources-online.json'), 'service_worker_styles_and_manifest');
  mark(remoteRelease?.latestHotfix === 'FIX128', 'release_latest_hotfix');
  mark(remoteRelease?.latestHotfixBuild === '6.8.0-fix128-live-tech-visual-publication-20261111', 'release_hotfix_build');
  mark(remoteRelease?.homepagePhotoFirstRenderFix?.registeredAssignments === 0 && remoteRelease?.homepagePhotoFirstRenderFix?.homepageEnabled === false, 'release_homepage_photo_engine_disabled');
  mark(remoteRelease?.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'release_photo_runtime_build');
  mark(releasePhoto.strictMediaTypeValidation === true && releasePhoto.slotSpecificTopicValidation === true && releasePhoto.specialistCardContainment === true, 'release_photo_quality_and_layout_flags');
  mark(releasePhoto.runtimeHotfix === 'FIX118' && releasePhoto.methodAssignmentNamespace === 'academyPhotoCatalogAssignmentsFix115', 'release_photo_runtime_and_assignment_namespace');
  mark(releasePhoto.version === expectedPhotoCatalogBuild && releasePhoto.photoCatalogRuntimeBuildTag === expectedPhotoCatalogBuild, 'release_photo_runtime_version_fields');
  mark(releasePhoto.fullCatalogQueue === false && releasePhoto.allViewsQueuedOnBoot === false && releasePhoto.globalBackgroundQueue === false, 'release_no_global_background_photo_download');
  const localLibrary = remoteRelease?.fix118_local_photo_library || {};
  mark(localLibrary.hotfix === 'FIX118' && localLibrary.cacheName === 'disabled-by-FIX123' && localLibrary.photoSlots === 0 && localLibrary.homepageEnabled === false, 'release_local_photo_library_disabled_for_homepage');
  mark(localLibrary.serviceWorkerCacheName === 'nauka-6.8.0-fix127-portable-sha256-20261111' && localLibrary.dataMigrations === 'none' && localLibrary.d1Migrations === 'none', 'release_service_worker_and_no_d1_migration');
  const staticPhotoTags = [...page.matchAll(/<img\b(?=[^>]*\bdata-photo-fix118-seed=\"[^\"]+\")(?=[^>]*\bdata-photo-id=\"[^\"]+\")[^>]*>/gi)].map(m => m[0]);
  mark(staticPhotoTags.length === 0, 'homepage_has_no_static_remote_photo_seed_tags');
  const homepageTechTags = [...page.matchAll(/<img\b(?=[^>]*\bdata-tech-visual-id=\"home-tech-\d{2}\")(?=[^>]*\bdata-photo-ignore=\"true\")(?=[^>]*\bdata-photo-eligible=\"false\")[^>]*>/gi)].map(m => m[0]);
  mark(homepageTechTags.length === 36 && homepageTechTags.every(tag => /\bsrc=\"assets\/artwork-fix(?:77|51)\/[^\"]+\.svg\"/i.test(tag)), 'homepage_36_local_svg_slots_locked_against_photo_provider');
  mark(sw.includes("request.destination === 'image'") && sw.includes('url.origin !== self.location.origin') && sw.includes('FIX123_LOCAL_IMAGE_FALLBACK') && !sw.includes('PHOTO_LIBRARY_HOSTS.has(url.hostname)'), 'service_worker_external_image_block');
  mark(runtime.includes('function registerStaticHomepagePhotoAssignments()') && runtime.includes('staticHomepagePhotoSlots()') && runtime.includes('NPA_HOME_PHOTO_PRIME_REGISTERED_FIX118'), 'runtime_static_homepage_assignment_adoption');
  mark(page.includes('assets/sitewide-tech-visuals-fix123.js?v=6.8.0-fix123'), 'sitewide_visual_policy_script_loaded');
  mark(page.includes('id="photoLibraryFix118"') && page.includes('id="photoLibraryRetryFix118"') && page.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122'), 'homepage_technical_visual_diagnostics_and_guard');
  return { valid: missing.length === 0, missing, moduleCards, modulePhotoSlots: modulePhotoIds.length, specialistPhotoSlots: specialistIds.length, seedPhotoCount: photos.length, methodPhotoSlots: releasePhoto.methodPhotoSlots || 147 };
}

module.exports = { evaluatePhotoCatalogPublicationContract, EXPECTED_SLOT_CATEGORIES };
