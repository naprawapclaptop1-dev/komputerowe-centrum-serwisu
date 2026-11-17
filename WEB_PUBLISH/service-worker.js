const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
const PHOTO_CACHE_NAME = 'academy-photo-library-fix135';
const PHOTO_HOSTS = ['images.pexels.com', 'thumb.wikimedia.org', 'upload.wikimedia.org', 'images.unsplash.com', 'live.staticflickr.com'];
const isCuratedPhotoHost = host => PHOTO_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
// FIX110 naprawia wyłącznie bramki OneClick/Watcher. Prawidłowy cache FIX109 pozostaje bez zmian, aby nie czyścić niepotrzebnie zasobów offline. Historyczne cache-markery są tylko komentarzem diagnostycznym. Poprzednie nazwy nie są aktywnymi cache: fix79-pwa-cache-20261106 nauka-6.8.0-fix94-topic-verified-photo-20261107-fix107 fix94-topic-verified-photo-20261107 fix51-visual-academy-pro-20261105 fix50-photo-reliability-20261105 fix49-ultimate-quality-20261104 fix48-publication-guard-hotfix-20261104 fix47-master-control-center-20261104 fix46-publication-guard-20261104 fix45-professional-service-20261104 fix44-master-service-center-20261104 fix43-knowledge-feedback-20261104 fix42-real-workshop-20261104 fix41-service-academy-20261104 fix40-learning-center-20261104 fix39-support-community-guard-20261104 fix28-practice-academy-pwa support-video-clean-fix9 nauka-od-a-do-z-fix60-global-academy-suite fix60-global-academy-suite-20261105-v3 fix64-fix73-global-academy-expansion-20261106 fix75-photo-academy-20261106 fix77-global-unique-photos-20261106 fix83-topic-correct-global-visuals-20261106.
const CORE = [
  '/assets/academy-fix220-228.css?v=6.8.0-fix228',
  '/assets/academy-fix222-exam-bank.js?v=6.8.0-fix222',
  '/assets/academy-platform-fix210-218.css?v=6.8.0-fix218',
  '/assets/academy-platform-fix210-218.js?v=6.8.0-fix228',
  '/assets/cloud-academy.js?v=6.8.0-fix221-revision-sync',
  '/assets/academy-admin-center-fix209.css?v=6.8.0-fix209', '/assets/academy-admin-center-fix209.js?v=6.8.0-fix209',
  '/assets/academy-professional-repair-fix175.js?v=6.8.0-fix175', '/assets/academy-professional-repair-fix175.css?v=6.8.0-fix175',
  '/assets/academy-advanced-curriculum-fix179.js?v=6.8.0-fix179', '/assets/academy-advanced-curriculum-fix179.css?v=6.8.0-fix179',
  '/assets/academy-system-diagnostics-fix180.js?v=6.8.0-fix180', '/assets/academy-system-diagnostics-fix180.css?v=6.8.0-fix180',
  '/assets/academy-deployment-migration-refurb-fix181.js?v=6.8.0-fix181', '/assets/academy-deployment-migration-refurb-fix181.css?v=6.8.0-fix181',
  '/assets/academy-specialist-systems-fix182.js?v=6.8.0-fix182', '/assets/academy-specialist-systems-fix182.css?v=6.8.0-fix182',
  '/assets/academy-advanced-service-lab-fix183.js?v=6.8.0-fix183', '/assets/academy-advanced-service-lab-fix183.css?v=6.8.0-fix183',
  '/assets/academy-expert-diagnostics-fix184.js?v=6.8.0-fix184', '/assets/academy-expert-diagnostics-fix184.css?v=6.8.0-fix184',
  '/assets/academy-performance-firmware-fix185.js?v=6.8.0-fix185', '/assets/academy-performance-firmware-fix185.css?v=6.8.0-fix185',
  '/assets/academy-practical-lab-fix186.js?v=6.8.0-fix186', '/assets/academy-practical-lab-fix186.css?v=6.8.0-fix186', '/assets/academy-hardware-import-fix198.js?v=6.8.0-fix205', '/assets/academy-hardware-import-fix198.css?v=6.8.0-fix205',
  '/assets/academy-labs-fix195.js?v=6.8.0-fix195',
  '/assets/platform-enhancements-fix231-239.css?v=6.8.0-fix239',
  '/assets/platform-enhancements-fix231-239.js?v=6.8.0-fix239', '/assets/academy-labs-fix195.css?v=6.8.0-fix195', '/assets/academy-workshop-3d-fix199.css?v=6.8.0-fix206', '/assets/academy-workshop-3d-fix199.js?v=6.8.0-fix225-glb-import',
  '/assets/global-academy-fallback-fix176.css?v=6.8.0-fix176',
  '/media/video_posters/akademia-wsparcie-poster.jpg?v=6.8.0-fix123',
  '/assets/academy-master-hub-fix145.js?v=6.8.0-fix145', '/assets/academy-master-hub-fix145.css?v=6.8.0-fix145', '/assets/academy-expanded-practice-fix145.js?v=6.8.0-fix145',
  '/assets/academy-pro-modules-fix148.js?v=6.8.0-fix148', '/assets/academy-pro-modules-fix148.css?v=6.8.0-fix148',
  '/assets/academy-master-extension-fix149.js?v=6.8.0-fix149', '/assets/academy-master-extension-fix149.css?v=6.8.0-fix149',
  '/assets/academy-practical-core-fix155.js?v=6.8.0-fix155', '/assets/academy-practical-suite-fix155.js?v=6.8.0-fix155', '/assets/academy-practical-suite-fix155.css?v=6.8.0-fix155',
  '/assets/academy-master-curriculum-core-fix162.js?v=6.8.0-fix162', '/assets/academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification', '/assets/academy-master-curriculum-fix162.css?v=6.8.0-fix162', '/assets/academy-teacher-dashboard-fix201.css?v=6.8.0-fix203',
  '/media/cooling-cleaning.jpg?v=6.8.0-fix123', '/media/gpu-cpu-cooling.jpg?v=6.8.0-fix123', '/media/laptop-board-inspection.jpg?v=6.8.0-fix123', '/media/laptop-cooling-fan-cleaning.jpg?v=6.8.0-fix123', '/media/laptop-hinge-display-repair.jpg?v=6.8.0-fix123', '/media/laptop-screen-hinge.jpg?v=6.8.0-fix123', '/media/master-workshop-hotair-fix75.jpg?v=6.8.0-fix123', '/media/motherboard-multimeter-probing.jpg?v=6.8.0-fix123', '/media/motherboard-multimeter-test.jpg?v=6.8.0-fix123', '/media/ram-m2-installation-detail.jpg?v=6.8.0-fix123', '/media/ram-ssd-installation.jpg?v=6.8.0-fix123', '/media/usb-c-power-delivery-diagnostic.jpg?v=6.8.0-fix123', '/media/hero-usbc-power-delivery-fix142.jpg?v=6.8.0-fix145', '/media/workbench-motherboard-inspection.jpg?v=6.8.0-fix123',
  ...Array.from({length:6},(_,i)=>`/media/video_slides_fix9/scene-${String(i+1).padStart(2,'0')}.png?v=6.8.0-fix123`),
  '/assets/artwork-fix77/feature-bios.svg', '/assets/artwork-fix77/feature-storage.svg', '/assets/artwork-fix77/feature-ram.svg',
  '/assets/nauka-centrum-fix40.css?v=6.8.0-fix40', '/assets/nauka-centrum-fix40.js?v=6.8.0-fix40',
  '/assets/akademia-serwisanta-fix41.css?v=6.8.0-fix41', '/assets/akademia-serwisanta-fix41.js?v=6.8.0-fix41',
  '/assets/real-workshop-fix42.css?v=6.8.0-fix42', '/assets/real-workshop-fix42.js?v=6.8.0-fix42',
  '/assets/knowledge-suite-fix43.css?v=6.8.0-fix43', '/assets/knowledge-suite-fix43.js?v=6.8.0-fix43',
  '/assets/master-service-center-fix44.css?v=6.8.0-fix44', '/assets/master-service-center-fix44.js?v=6.8.0-fix44', '/assets/knowledge-updates-fix44.json',
  '/assets/professional-service-fix45.css?v=6.8.0-fix45', '/assets/professional-service-fix45.js?v=6.8.0-fix45',
  '/assets/master-control-fix47.css?v=6.8.0-fix47', '/assets/master-control-fix47.js?v=6.8.0-fix47',
  '/assets/ultimate-quality-fix49.css?v=6.8.0-fix49', '/assets/ultimate-quality-fix49.js?v=6.8.0-fix49', '/release-contract-fix49.json', '/release-contract-fix50.json', '/release-contract-fix51.json',
  '/assets/global-academy-suite-fix60.js?v=6.8.0-fix60', '/assets/global-academy-suite-fix60.css?v=6.8.0-fix60', '/assets/global-academy-suite-manifest-fix60.json',
  '/assets/electronics-simulator-fix119.js?v=6.8.0-fix119', '/assets/electronics-simulator-fix119.css?v=6.8.0-fix119',
  '/assets/master-workshop-630-extension.js?v=6.8.0-fix119', '/assets/master-workshop-630-extension.css?v=6.8.0-fix119',
  '/assets/global-academy-expansion-fix73.js?v=6.8.0-fix119', '/assets/global-academy-expansion-fix73.css?v=6.8.0-fix119', '/assets/global-academy-expansion-manifest-fix73.json',
  '/assets/electronics-simulator-fix119-manifest.json',
  '/assets/home-learning-fix75.css?v=6.8.0-fix75', '/assets/home-learning-fix75.js?v=6.8.0-fix75', '/assets/home-learning-manifest-fix75.json', '/assets/global-academy-fix77.css?v=6.8.0-fix77', '/assets/photo-uniqueness-fix77.js?v=6.8.0-fix77', '/assets/photo-uniqueness-manifest-fix77.json', '/assets/global-academy-fix77-manifest.json', '/assets/visual-uniqueness-fix83.js?v=6.8.0-fix87', '/assets/visual-uniqueness-manifest-fix83.json', '/assets/video-poster-manifest-fix83.json', '/media/master-workshop-hotair-fix75.jpg',
  '/assets/theme-controller-610.js',
  '/assets/academy-dashboard-610.js',
  '/assets/knowledge-hub-610.js',
  '/assets/lesson-count-610.js',
  '/assets/academy-master-lessons-610.js?v=6.8.0-fix28-catalog',
  '/assets/academy-expanded-practice-fix136.js?v=6.8.0-fix136',
  '/assets/practice-quiz-fix136.css?v=6.8.0-fix136',
  '/assets/learning-engine.js?v=6.8.0-fix136',
  '/assets/photo-catalog-fix115.js?v=6.8.0-fix136',
  '/assets/homepage-photo-prime-fix118.js?v=6.8.0-fix136',
  '/assets/home-refresh-fix30.css?v=6.8.0-fix30', '/assets/support-expansion-fix35.css?v=6.8.0-fix35', '/assets/support-enhancements-fix35.js?v=6.8.0-fix35', '/assets/support-community-fix36.css?v=6.8.0-fix36', '/assets/support-community-fix36.js?v=6.8.0-fix36', '/assets/photo-unique-thumbnails-fix30.js?v=6.8.0-fix30',
  '/assets/artwork-fix30/components.svg','/assets/artwork-fix30/boardview.svg','/assets/artwork-fix30/oscilloscope.svg','/assets/artwork-fix30/learning-path.svg','/assets/artwork-fix30/checklist.svg','/assets/artwork-fix30/model-id.svg','/assets/artwork-fix30/media-library.svg','/assets/artwork-fix30/knowledge-map.svg','/assets/artwork-fix30/ai-mentor.svg','/assets/artwork-fix30/workshop-simulator.svg',
  '/assets/artwork-fix51/01-motherboard-map.svg', '/assets/artwork-fix51/02-power-vrm.svg', '/assets/artwork-fix51/03-laptop-exploded.svg', '/assets/artwork-fix51/04-ram-ddr4-ddr5.svg', '/assets/artwork-fix51/05-ssd-sata-nvme.svg', '/assets/artwork-fix51/06-multimeter-guide.svg', '/assets/artwork-fix51/07-oscilloscope-guide.svg', '/assets/artwork-fix51/08-cooling-flow.svg', '/assets/artwork-fix51/09-display-chain.svg', '/assets/artwork-fix51/10-bios-boot.svg', '/assets/artwork-fix51/11-usbc-pd.svg', '/assets/artwork-fix51/12-esd-safety.svg', '/assets/artwork-fix51/13-gpu-layout.svg', '/assets/artwork-fix51/14-smart-drive.svg', '/assets/artwork-fix51/15-wifi-network.svg', '/assets/artwork-fix51/16-diagnostic-flow.svg', '/assets/artwork-fix51/17-audio-circuit.svg', '/assets/artwork-fix51/18-connector-pinout.svg', '/assets/artwork-fix54/19-power-path.svg','/assets/artwork-fix54/20-bios-firmware-flow.svg','/assets/artwork-fix54/21-storage-interface.svg','/assets/artwork-fix54/22-memory-diagnostics.svg','/assets/artwork-fix54/23-display-edp-path.svg','/assets/artwork-fix54/24-fan-control-flow.svg','/assets/artwork-fix54/25-audio-signal-path.svg','/assets/artwork-fix54/26-wifi-network-path.svg','/assets/artwork-fix54/27-esd-workbench.svg','/assets/artwork-fix54/28-data-recovery-workflow.svg','/assets/artwork-fix54/29-gpu-thermal-path.svg','/assets/artwork-fix54/30-keyboard-touchpad.svg',
  '/media/video_posters/LOCAL-ESD.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-COOL.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-RAMSSD.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-POWER.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-DISPLAY.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-WIN26.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-SECUREBOOT.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-WIFIUSB4.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-POSTTEST.jpg?v=6.8.0-fix83','/media/video_posters/LOCAL-NPU.jpg?v=6.8.0-fix83',

  '/assets/theme-610.css', '/assets/theme-630.css?v=6.8.0-fix51', '/assets/homepage-showcase-640.css', '/assets/homepage-showcase-640.js', '/assets/scroll-navigation-630.js', '/assets/nauka-od-a-do-z.css', '/assets/ultimate-workshop-620.css', '/assets/ultimate-workshop-620.js', '/assets/lab-device-bridge-630.css', '/assets/lab-device-bridge-630.js', '/assets/progress-backup-621.js', '/assets/progress-backup-621.css', '/assets/measurement-log-640.js', '/assets/measurement-log-640.css', '/assets/master-workshop-630.js', '/assets/master-workshop-630.css', '/assets/master-workshop-630-extension.js', '/assets/master-workshop-630-extension.css', '/assets/master-academy-640-pro.js', '/assets/master-academy-640-pro.css', '/assets/master-academy-650-ultimate.js', '/assets/master-academy-650-ultimate.css', '/assets/master-academy-660-center.js', '/assets/master-academy-660-center.css', '/assets/practice-academy-fix27.js', '/assets/practice-academy-fix27.css',
  '/', '/index.html', '/manifest.webmanifest',
  ...Array.from({length:3},(_,i)=>`/assets/artwork-fix77/hero-${['main','gpu','ram'][i]}.svg`), ...Array.from({length:6},(_,i)=>`/assets/artwork-fix77/slide-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:6},(_,i)=>`/assets/artwork-fix77/module-${String(i+14).padStart(2,'0')}.svg`), ...Array.from({length:13},(_,i)=>`/assets/artwork-fix77/gax-visual-index-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:8},(_,i)=>`/assets/artwork-fix77/gax-media-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:14},(_,i)=>`/assets/artwork-fix77/lesson-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:24},(_,i)=>`/assets/artwork-fix77/page-illustration-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:13},(_,i)=>`/assets/artwork-fix77/home-card-fallback-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:5},(_,i)=>`/assets/artwork-fix77/photo-lab-thumb-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:8},(_,i)=>`/assets/artwork-fix77/video-index-${String(i+1).padStart(2,'0')}.svg`), ...Array.from({length:203},(_,i)=>`/assets/artwork-fix77/academy-data-${String(i+1).padStart(3,'0')}.svg`),
  '/assets/style.css', '/assets/theme-350.css', '/assets/theme-360.css', '/assets/theme-380.css',
  '/assets/theme-392.css', '/assets/theme-393.css', '/assets/theme-394.css', '/assets/theme-395.css',
  '/assets/theme-400.css', '/assets/theme-420.css', '/assets/theme-430.css', '/assets/theme-440.css', '/assets/theme-450.css', '/assets/theme-500.css', '/assets/theme-520.css', '/assets/theme-521.css', '/assets/theme-522.css', '/assets/theme-523.css', '/assets/theme-531.css?v=6.8.0-fix20', '/assets/theme-530.css?v=6.8.0-fix18b','/assets/theme-600.css?v=6.8.0-fix18b',
  '/assets/academy-data.js?v=6.8.0-fix28-catalog', '/assets/academy-expansion.js?v=6.8.0-fix28-catalog', '/assets/academy-ultra-lessons.js?v=6.8.0-fix28-catalog', '/assets/academy-ultra-lessons-2.js?v=6.8.0-fix28-catalog', '/assets/academy-ultra-lessons-3.js?v=6.8.0-fix28-catalog','/assets/academy-ultimate-lessons-600.js?v=6.8.0-fix28-catalog', '/assets/device-model-catalog.js', '/assets/community-models.js', '/assets/learning-sources.js', '/assets/learning-engine.js',
  '/assets/lesson-art.js?v=6.8.0-fix87', '/assets/visual-assets-fix51.js?v=6.8.0-fix51', '/assets/photo-catalog-fix96.js?v=6.8.0-fix96', '/assets/photo-catalog-fix96.css?v=6.8.0-fix96', '/assets/photo-catalog-fix98.js?v=6.8.0-fix98', '/assets/photo-catalog-fix98.css?v=6.8.0-fix98', '/assets/photo-catalog-fix99.js?v=6.8.0-fix99', '/assets/photo-catalog-fix99.css?v=6.8.0-fix99', '/assets/photo-catalog-fix109.js?v=6.8.0-fix109', '/assets/photo-catalog-fix111.js?v=6.8.0-fix111', '/assets/homepage-photo-prime-fix118.css?v=6.8.0-fix118', '/assets/photo-catalog-fix109.css?v=6.8.0-fix109', '/assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115', '/assets/visual-academy-fix51.js?v=6.8.0-fix51', '/assets/visual-academy-fix51.css?v=6.8.0-fix51', '/assets/visual-asset-manifest-fix51.json', '/assets/app.js?v=6.8.0-fix87-repair-visuals', '/assets/advanced-learning-studio-620.js', '/assets/advanced-learning-studio-620.css', '/assets/long-video-catalog-620.js', '/media/photo-sources-online.json', '/media/home-photo-library-fix118.json', '/assets/app.js', '/assets/repair-photo-layout-fix87.css?v=6.8.0-fix87', '/media/photo-sources-online.json?v=6.8.0-fix135', '/media/home-photo-library-fix118.json?v=6.8.0-fix135', '/media/laptop-board-inspection.jpg', '/media/cooling-cleaning.jpg', '/media/laptop-screen-hinge.jpg', '/media/ram-m2-installation-detail.jpg', '/media/laptop-cooling-fan-cleaning.jpg', '/media/usb-c-power-delivery-diagnostic.jpg', '/media/workbench-motherboard-inspection.jpg', '/media/motherboard-multimeter-probing.jpg', '/media/laptop-hinge-display-repair.jpg', '/media/ram-ssd-installation.jpg', '/media/gpu-cpu-cooling.jpg', '/media/motherboard-multimeter-test.jpg', '/assets/service-workshop-data.js', '/assets/service-workshop.js',
  '/assets/component-encyclopedia.js', '/assets/component-catalog.js', '/assets/visitor-dashboard.js',
  '/assets/free-chat-engine.js', '/assets/cloud-academy.js?v=6.8.0-fix221-revision-sync', '/assets/labplus-engine.js', '/assets/lab45-service-center.js', '/assets/neon-motion.js',
  '/assets/ultra-cyber-530.js?v=6.8.0-fix18b','/assets/ultimate-600.js?v=6.8.0-fix18b', '/assets/favicon.svg', '/assets/pwa-icon.svg', '/media/videos/akademia-dlaczego-warto-wspierac.mp4', '/media/videos/akademia-dlaczego-warto-wspierac.mp4?v=6.8.0-fix127-fix9-clean-video', '/media/video_posters/akademia-wsparcie-poster.jpg', '/media/videos/akademia-dlaczego-warto-wspierac.vtt', '/media/videos/akademia-dlaczego-warto-wspierac.vtt?v=6.8.0-fix127'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE.map(url => new Request(url, {cache:'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ((key.startsWith('naprawa-pc-akademia-') || key.startsWith('nauka-od-a-do-z-') || key.startsWith('nauka-6.8.0-')) && key !== CACHE_NAME) || (key.startsWith('academy-photo-library-') && key !== PHOTO_CACHE_NAME)).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== 'GET') return;
  // FIX134: Pages-compatible .js helper; same-origin curated photo proxy responses are cached in the dedicated photo cache.
  if (url.origin === self.location.origin && request.destination === 'image' && url.pathname.startsWith('/media/photos/')) {
    event.respondWith((async () => {
      const photoCache = await caches.open(PHOTO_CACHE_NAME);
      const cachedPhoto = await photoCache.match(request, { ignoreSearch: false });
      if (cachedPhoto) return cachedPhoto;
      const response = await fetch(request);
      if (response && response.ok) {
        try { await photoCache.put(request, response.clone()); } catch (_) { /* Browser quota: keep online rendering. */ }
      }
      return response;
    })());
    return;
  }
  // Retain the historical allowlisted external image cache for non-homepage catalog results.
  if (request.destination === 'image' && url.protocol === 'https:' && isCuratedPhotoHost(url.hostname)) {
    event.respondWith((async () => {
      const photoCache = await caches.open(PHOTO_CACHE_NAME);
      const cachedPhoto = await photoCache.match(request, { ignoreSearch: false });
      if (cachedPhoto) return cachedPhoto;
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        try { await photoCache.put(request, response.clone()); } catch (_) { /* quota/private mode: keep online rendering */ }
      }
      return response;
    })());
    return;
  }
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put('/index.html',copy)); return response; }).catch(() => caches.match('/index.html')));
    return;
  }
  if (url.pathname.startsWith('/Biblioteka/')) {
    // Duże pliki PDF/DOCX są pobierane do cache tylko na żądanie użytkownika.
    // Przy pierwszym pobraniu czekamy na cache.put(), aby pasek offline nie zgłaszał sukcesu przed zapisem.
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) {
        const refresh = fetch(request).then(response => response.ok ? caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())) : undefined).catch(() => undefined);
        event.waitUntil(refresh);
        return cached;
      }
      const response = await fetch(request);
      if (response.ok) await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })());
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/media/')) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
      // FIX119: exact versioned URL wins before the legacy ignoreSearch fallback.
      // This prevents an old ?v= query entry from shadowing a newly precached FIX asset.
      const exact = await cache.match(request);
      const cached = exact || await cache.match(request, {ignoreSearch:true});
      const network = fetch(request).then(response => { if(response.ok){const copy=response.clone();cache.put(request,copy);} return response; }).catch(() => cached);
      return cached || network;
    }));
  }
});

// FIX232: standard Web Push events. Payload is delivered only by a configured VAPID sender.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  const title = String(data.title || 'Nauka od A do Z').slice(0, 100);
  const body = String(data.body || 'Masz nowe powiadomienie.').slice(0, 220);
  const url = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/?view=account';
  event.waitUntil(self.registration.showNotification(title, { body, icon: '/assets/pwa-icon.svg', badge: '/assets/favicon.svg', data: { url }, tag: String(data.tag || 'nauka-platform').slice(0, 100), renotify: false }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const raw = event.notification.data?.url;
  const target = typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? new URL(raw, self.location.origin).toString() : self.location.origin + '/?view=account';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(target); return existing.focus(); }
    return self.clients.openWindow(target);
  }));
});
