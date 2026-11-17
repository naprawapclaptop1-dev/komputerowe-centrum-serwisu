/* NAUKA OD A DO Z 6.8.0 FIX93 — render licensed online photos without legacy SVG replacement; fast target-image loading.
 * Photos are selected from licensed Openverse/Wikimedia results and a small Pexels seed set.
 * One source image is assigned to one slot globally. SVG remains an honestly-labelled offline fallback.
 */
(() => {
  'use strict';
  const VERSION = '6.8.0-fix93-online-photo-guard-and-fast-render-20261107';
  const CONFIG_URL = 'media/photo-sources-online.json?v=6.8.0-fix93';
  const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix91';
  const DAILY_KEY = 'academyPhotoCatalogDailyFix91';
  const PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix92';
  const LEGACY_PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix91';
  const CANDIDATE_POOL_KEY = 'academyPhotoCatalogCandidatePoolsFix91';
  const MAX_DAILY_REQUESTS = 180; // Keep below Openverse anonymous daily quota.
  const OPENVERSE_GAP_MS = 3300; // Stay below the anonymous per-minute request ceiling.
  const COMMONS_GAP_MS = 1200;
  const MAX_PAGES_PER_QUERY = 3;
  const MAX_COMMONS_PAGES = 6;
  const OPENVERSE_QUERY_VARIANTS = 3;
  const MAX_COMMONS_QUERY_VARIANTS = 3;
  const OPENVERSE_ENDPOINT = 'https://api.openverse.org/v1/images/';
  const COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
  const HOME_PRIORITY_SELECTOR = '#view-home .np630-photo-hero img, #view-home .np640-slide > img, #view-home .np30-module-photo img';
  const api = window.ACADEMY_ART || (window.ACADEMY_ART = {});
  const CATEGORY = {
    vram: { query: 'GDDR memory', alternate: 'video memory chip', third: 'graphics card GDDR', commons: ['graphics card GDDR', 'GDDR3 memory chip', 'video memory GPU'], min: 6 },
    ram: { query: 'RAM memory', alternate: 'computer RAM', third: 'laptop memory', commons: ['computer RAM memory', 'DDR memory module', 'laptop RAM'], min: 0 },
    gpu: { query: 'video card', alternate: 'graphics processor', third: 'video graphics card', commons: ['video card computer', 'graphics processor', 'graphics card GPU'], min: 0 },
    cpu: { query: 'CPU processor chip', alternate: 'computer processor', third: 'microprocessor computer', commons: ['CPU processor', 'computer CPU chip', 'microprocessor'], min: 0 },
    storage: { query: 'hard disk drive', alternate: 'solid state drive', third: 'NVMe SSD drive', commons: ['hard disk drive', 'solid state drive', 'M.2 SSD'], min: 0 },
    cooling: { query: 'computer fan', alternate: 'heat sink computer', third: 'CPU cooling fan', commons: ['computer cooling fan', 'CPU heatsink', 'laptop cooling fan'], min: 0 },
    display: { query: 'laptop display', alternate: 'LCD screen', third: 'computer monitor display', commons: ['laptop display', 'LCD laptop screen', 'computer monitor'], min: 0 },
    port: { query: 'USB port', alternate: 'computer connector', third: 'laptop charging port', commons: ['USB port computer', 'laptop power connector', 'HDMI port'], min: 0 },
    network: { query: 'network card', alternate: 'ethernet card', third: 'wireless network adapter', commons: ['computer network card', 'ethernet network card', 'Wi-Fi adapter'], min: 0 },
    audio: { query: 'computer speaker', alternate: 'laptop speaker', third: 'computer sound card', commons: ['laptop speaker', 'computer speaker', 'sound card computer'], min: 0 },
    power: { query: 'computer power supply', alternate: 'laptop power adapter', third: 'power circuit board', commons: ['computer power supply', 'laptop power adapter', 'motherboard power circuit'], min: 0 },
    board: { query: 'motherboard', alternate: 'computer motherboard', third: 'computer circuit board', commons: ['motherboard', 'computer motherboard', 'laptop motherboard'], min: 0 },
    meter: { query: 'multimeter', alternate: 'digital multimeter electronics', third: 'electrical measurement', commons: ['digital multimeter', 'multimeter circuit board', 'electronics measurement'], min: 0 },
    safety: { query: 'electronics workbench', alternate: 'electrostatic discharge electronics', third: 'ESD workstation', commons: ['electronics workbench', 'ESD workstation', 'antistatic electronics repair'], min: 0 },
    software: { query: 'computer diagnostics', alternate: 'computer repair', third: 'computer technician', commons: ['computer diagnostics', 'computer repair technician', 'computer service desk'], min: 0 },
    laptop: { query: 'laptop repair', alternate: 'laptop disassembly', third: 'laptop motherboard repair', commons: ['laptop repair', 'laptop disassembly', 'open laptop hardware'], min: 0 },
    bios: { query: 'BIOS chip', alternate: 'SPI flash programmer', third: 'EEPROM programmer', commons: ['BIOS chip motherboard', 'SPI flash programmer', 'EEPROM programmer'], min: 0 },
    solder: { query: 'electronics soldering', alternate: 'soldering circuit board', third: 'hot air rework station', commons: ['electronics soldering', 'SMD soldering', 'hot air rework station'], min: 0 },
    diagnostics: { query: 'computer repair', alternate: 'electronics repair', third: 'computer troubleshooting', commons: ['computer repair', 'electronics repair workshop', 'computer troubleshooting'], min: 0 },
    battery: { query: 'laptop battery', alternate: 'laptop battery replacement', third: 'computer battery pack', commons: ['laptop battery', 'laptop battery replacement', 'laptop battery pack'], min: 0 },
    electronics: { query: 'electronic components', alternate: 'circuit board components', third: 'electronic circuit board', commons: ['electronic components', 'circuit board components', 'electronic circuit board'], min: 0 },
    certification: { query: 'computer technician training', alternate: 'electronics training', third: 'computer repair workshop', commons: ['computer repair training', 'electronics training workshop', 'computer technician'], min: 0 }
  };
  const SELECTOR = [
    'img[data-photo-id]', 'img[data-photo-title]', 'img[data-photo-kind]',
    '.np630-photo-hero img', '.np640-slide > img', '#view-home .np640-module-grid .np30-module-photo img',
    '.diagnostic-feature-image img', '.diagnostic-feature-card img', '.course-card-image', '.course-lesson-figure img',
    '.course-grid .course-card img', '.lesson-card img', '.learning-card img', '.lesson-tile img',
    '.catalog-card-art', '.tool-card > img', '.method-card > img',
    '.repair-row-art', '.repair-photo-stage img', '.photo-card-image-button img',
    '#np62PhotoMain', '.np62-photo-thumbs img', '.photo-lab-gallery img',
    '.workshop-photo-card img', '.long-video-photo img', '.lesson-photo-slot img'
  ].join(',');
  const safeJson = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const saveJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const clean = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim().slice(0, 500);
  const absoluteUrl = value => { try { const u = new URL(String(value || ''), location.href); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } };
  const canonicalUrl = value => { try { const u = new URL(value); u.hash = ''; u.search = ''; return u.href.replace(/\/$/, '').toLowerCase(); } catch (_) { return ''; } };
  const localRaster = value => /^(?:https?:\/\/[^/]+)?\/(?:media|assets\/media)\/.*\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(String(value || '')) || /^(?:media|assets\/media)\/.*\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(String(value || ''));
  const isSvg = value => /\.svg(?:[?#]|$)|^data:image\/svg/i.test(String(value || ''));
  const isNonCommercial = value => /(?:non.?commercial|\bcc\s*by\s*nc\b|\bby-nc\b|\bnc-sa\b|\bnc-nd\b)/i.test(String(value || ''));
  function normalizeLicense(value) {
    const raw = String(value || '').trim();
    if (!raw || isNonCommercial(raw)) return '';
    if (/^pexels(?:\s+photo)?\s+license$/i.test(raw) || /^pexels license$/i.test(raw)) return 'pexels';
    // Openverse returns short codes (cc0/by/by-sa), while FIX91 assignments
    // stored labels such as "CC CC0". Canonicalize both without allowing NC/ND.
    let s = raw.toLowerCase().replace(/\bcreative commons\b/g, 'cc');
    s = s.replace(/^cc\s+cc(?=\s*(?:0|by)(?:\b|$))/i, 'cc');
    s = s.replace(/public domain mark/ig, 'pdm').replace(/public domain/ig, 'pdm');
    const compact = s.replace(/[^a-z0-9]/g, '');
    if (/^(?:cc)?0\d*$/.test(compact) || ['zero','pdm','publicdomain','publicdomainmark'].includes(compact) || compact.startsWith('publicdomainmark') || compact.startsWith('pdm')) return 'cc0';
    if (/^(?:cc)?by\d*$/.test(compact)) return 'by';
    if (/^(?:cc)?bysa\d*$/.test(compact)) return 'by-sa';
    return '';
  }
  function licenseLabel(value) {
    const normalized = normalizeLicense(value);
    if (normalized === 'pexels') return 'Pexels License';
    if (normalized === 'cc0') return 'CC0';
    if (normalized === 'by') return 'CC BY';
    if (normalized === 'by-sa') return 'CC BY-SA';
    return clean(value);
  }
  function licenseAllowed(value) { return Boolean(normalizeLicense(value)); }
  function categoryFor(text) {
    const s = clean(text).toLowerCase();
    if (/\bvram\b|gddr[3-7x]?|hbm[23e]?|video memory|graphics memory|pamięć graficzna|pamięć karty graficznej/.test(s)) return 'vram';
    if (/\bram\b|\bddr[3-6]\b|so-dimm|sodimm|udimm|pamięć operacyjna|moduł pamięci/.test(s)) return 'ram';
    if (/bios|uefi|spi flash|firmware|eeprom|programator/.test(s)) return 'bios';
    if (/gpu|grafik|graphics card|karta graficzna|karta wideo/.test(s)) return 'gpu';
    if (/cpu|procesor|processor|socket|gniazdo procesora/.test(s)) return 'cpu';
    if (/lutow|hot.?air|smd|reball|solder|mikrolut/.test(s)) return 'solder';
    if (/certyfikat|certyfikac|egzamin|certification|academy|akademia/.test(s)) return 'certification';
    if (/elektronik|ohm|rezystor|kondensator|cewka|electronic/.test(s)) return 'electronics';
    if (/ssd|nvme|hdd|dysk|storage|nośnik|raid|m\.2/.test(s)) return 'storage';
    if (/chłod|temperatur|wentyl|fan|thermal|radiator|heat.?pipe|cooling/.test(s)) return 'cooling';
    if (/matryc|ekran|monitor|display|screen|zawias|edp|taśma obrazu/.test(s)) return 'display';
    if (/usb.?c|usb4|thunderbolt|port|złącze|dock|hdmi|displayport/.test(s)) return 'port';
    if (/wi.?fi|wifi|bluetooth|ethernet|router|sieć|network|lan/.test(s)) return 'network';
    if (/audio|dźwięk|mikrofon|speaker|głośnik|sound/.test(s)) return 'audio';
    if (/bater|akumulator|zasil|power|ładow|charger|mosfet|vrm|buck|dc.?in/.test(s)) return 'power';
    if (/esd|bezpieczeń|antystat|bhp|ochron|safety|zalani|koroz/.test(s)) return 'safety';
    if (/windows|system|sterownik|driver|bsod|software|program/.test(s)) return 'software';
    if (/multimetr|oscyloskop|pomiar|test|diagnost|miernik|measurement|probe|sonda/.test(s)) return 'meter';
    if (/usterk|napraw|repair|diagnos|workbench|warsztat|serwis/.test(s)) return 'diagnostics';
    if (/laptop|notebook|komputer przenośny/.test(s)) return 'laptop';
    return 'board';
  }
  function isVramPhotoRelevant(photo) {
    const text = `${photo.title || ''} ${photo.tags || ''} ${photo.description || ''}`.toLowerCase();
    if (/\b(dimm|so-dimm|sodimm|udimm|desktop ram|system ram|memory module)\b/.test(text)) return false;
    return /\b(vram|gddr[3-7x]?|hbm[23e]?|graphics memory|video memory|gpu memory|video card memory|graphics card memory)\b/.test(text);
  }
  function photoIdentity(photo) {
    return [photo.providerId && `id:${photo.providerId}`, photo.page && `page:${canonicalUrl(photo.page)}`, photo.url && `url:${canonicalUrl(photo.url)}`].filter(Boolean);
  }
  function keyHash(value) {
    let h = 2166136261; for (const ch of String(value || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0');
  }
  function nodeInfo(img) {
    const parent = img.closest('article,button,figure,.np30-module-photo,.photo-card,section') || img.parentElement;
    const parentText = clean(parent?.textContent || '');
    const explicitTitle = clean(img.dataset.photoTitle || img.dataset.photoAlt || img.alt || '');
    const explicitIsGeneric = /^(?:(?:unikalna\s+)?ilustracja techniczna|(?:unikalna\s+)?ilustracja edukacyjna|grafika techniczna)(?:\s|:|$)/i.test(explicitTitle);
    const contentTitleNode = parent?.querySelector?.('.diagnostic-feature-title,.course-card-title,h2,h3,b,strong,.np30-module-kicker');
    const contentTitle = clean(contentTitleNode?.textContent || '');
    const alt = explicitIsGeneric ? (contentTitle || parentText || explicitTitle) : explicitTitle;
    const context = img.dataset.photoScope || (img.classList.contains('course-card-image') ? 'course-card' : img.classList.contains('catalog-card-art') ? 'workshop-catalog' : img.classList.contains('repair-row-art') ? 'repair-card' : img.classList.contains('np630-hero-photo') ? 'home-hero' : img.closest('.np640-slide') ? 'home-slide' : img.closest('.np30-module-photo') ? 'home-module' : img.closest('.diagnostic-feature-image') ? 'diagnostic-card' : 'photo-slot');
    const repair = img.dataset.repairPhoto;
    const course = img.closest('[data-course-id]')?.dataset.courseId;
    const tool = img.closest('[data-tool-id]')?.dataset.toolId;
    const method = img.closest('[data-method-id]')?.dataset.methodId;
    const slot = img.dataset.photoSlot || '0';
    let id = img.dataset.photoId || '';
    if (!id && repair) id = `repair:${repair}:${img.dataset.photoContext || context}:${slot}`;
    if (!id && course) id = `${context}:${course}:${slot}`;
    if (!id && tool) id = `tool:${tool}`;
    if (!id && method) id = `method:${method}`;
    if (!id) {
      const identity = `${context}|${alt}|${parentText.slice(0, 160)}|${img.getAttribute('src') || ''}|${img.closest('[data-slide]')?.getAttribute('data-slide') || ''}`;
      id = `${context}:${keyHash(identity)}`;
    }
    const rawCategory = clean(img.dataset.photoKind || img.dataset.photoCategory || '').toLowerCase();
    const category = CATEGORY[rawCategory] ? rawCategory : categoryFor(`${rawCategory} ${alt} ${parentText} ${img.getAttribute('src') || ''}`);
    return { id, category: CATEGORY[category] ? category : 'board', title: alt || parentText || id, context, slot };
  }
  const assignmentState = safeJson(ASSIGN_KEY) || {};
  const assignments = new Map();
  const used = new Set();
  const hashUsed = [];
  const seedPools = new Map();
  const savedCandidates = safeJson(CANDIDATE_POOL_KEY) || {};
  const candidatePools = new Map(Object.entries(savedCandidates).filter(([category, photos]) => CATEGORY[category] && Array.isArray(photos)).map(([category, photos]) => [category, photos.filter(photo => photo && absoluteUrl(photo.url) && absoluteUrl(photo.page) && photo.author && licenseAllowed(photo.license) && photo.category === category).map(photo => ({ ...photo, url: absoluteUrl(photo.url), page: absoluteUrl(photo.page), license: licenseLabel(photo.license) })).slice(0, 20)]));
  const savedPageStates = safeJson(PAGE_STATE_KEY) || safeJson(LEGACY_PAGE_STATE_KEY) || {};
  const pageState = new Map(Object.entries(savedPageStates).filter(([category, state]) => CATEGORY[category] && state && typeof state === 'object').map(([category, state]) => [category, {
    queryIndex: Math.max(0, Math.min(OPENVERSE_QUERY_VARIANTS, Number(state.queryIndex) || 0)),
    page: Math.max(1, Number(state.page) || 1),
    pageCount: Math.max(1, Math.min(MAX_PAGES_PER_QUERY, Number(state.pageCount) || MAX_PAGES_PER_QUERY)),
    queryFailures: Math.max(0, Number(state.queryFailures) || 0),
    retryAt: Math.max(0, Number(state.retryAt) || 0),
    commonsOffset: Math.max(0, Number(state.commonsOffset) || 0),
    commonsPages: Math.max(0, Number(state.commonsPages) || 0),
    commonsQueryIndex: Math.max(0, Math.min(MAX_COMMONS_QUERY_VARIANTS, Number(state.commonsQueryIndex) || 0)),
    commonsTried: Boolean(state.commonsTried),
    commonsHasMore: Boolean(state.commonsHasMore),
    exhausted: Boolean(state.exhausted)
  }]));
  if (!safeJson(PAGE_STATE_KEY) && pageState.size) {
    // Old FIX91 exhausted flags were terminal even when providers only rate-limited
    // or previous query variants were too narrow. Re-open exhausted categories once.
    for (const [category, state] of pageState) {
      if (state.exhausted || state.retryAt) {
        state.exhausted = false; state.retryAt = 0;
        state.queryIndex = 0; state.page = 1; state.pageCount = MAX_PAGES_PER_QUERY; state.queryFailures = 0;
        state.commonsOffset = 0; state.commonsPages = 0; state.commonsQueryIndex = 0; state.commonsTried = false; state.commonsHasMore = false;
        pageState.set(category, state);
      }
    }
    try { saveJson(PAGE_STATE_KEY, Object.fromEntries(pageState.entries())); } catch (_) { /* Continue in memory if storage is unavailable. */ }
  }
  const failedUrls = new Set();
  const scheduled = new WeakSet();
  const processed = new WeakSet();
  const retryTimers = new WeakMap();
  const pendingRetryImages = new Set();
  const queue = [];
  let queueRetryTimer = null;
  let config = null;
  let seedsReady = false;
  let running = false;
  let observer = null;
  let mutationObserver = null;
  let statusNode = null;
  let onlinePhotos = 0;
  let queuedCount = 0;
  let failedCount = 0;
  let lastOpenverseAt = 0;
  let lastCommonsAt = 0;
  let pausedUntil = 0;
  let lastProviderError = '';
  let lastProvider = '';
  let apiRequests = 0;
  let currentRepairs = [];
  function persistPageState(category, state) {
    pageState.set(category, state);
    try { saveJson(PAGE_STATE_KEY, Object.fromEntries(pageState.entries())); } catch (_) { /* Storage can be full; in-memory pagination continues. */ }
  }
  function persistCandidatePools() {
    const snapshot = {};
    for (const [category, pool] of candidatePools) if (pool.length) snapshot[category] = pool.slice(0, 20);
    try { saveJson(CANDIDATE_POOL_KEY, snapshot); } catch (_) { /* Storage can be full; online search still continues. */ }
  }
  function reserve(photo) { for (const key of photoIdentity(photo)) used.add(key); if (photo.hash && !hashUsed.includes(photo.hash)) hashUsed.push(photo.hash); }
  function alreadyUsed(photo) { return photoIdentity(photo).some(key => used.has(key)) || (photo.hash && hashUsed.some(old => hamming(old, photo.hash) < 10)); }
  function hamming(a, b) { if (!a || !b || a.length !== b.length) return 64; let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; }
  function perceptualHash(image) {
    try {
      const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return '';
      ctx.drawImage(image, 0, 0, 32, 32); const data = ctx.getImageData(0, 0, 32, 32).data; const gray = new Float64Array(1024);
      for (let i = 0; i < 1024; i++) gray[i] = data[i * 4] * .299 + data[i * 4 + 1] * .587 + data[i * 4 + 2] * .114;
      const coeff = []; const cos = Array.from({ length: 8 }, (_, u) => Array.from({ length: 32 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 64)));
      for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) { let sum = 0; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) sum += gray[y * 32 + x] * cos[u][x] * cos[v][y]; coeff.push(sum); }
      const values = coeff.slice(1).sort((a, b) => a - b); const median = values[Math.floor(values.length / 2)];
      return coeff.slice(1).map(value => value > median ? '1' : '0').join('');
    } catch (_) { return ''; } // CORS-tainted canvas: URL/provider-ID checks remain active.
  }
  async function restoreLocalPhotoHashes() {
    try {
      const response = await fetch('/assets/photo-uniqueness-manifest-fix77.json', { cache: 'force-cache', credentials: 'same-origin' });
      if (!response.ok) return;
      const manifest = await response.json();
      for (const item of manifest.photos || []) if (typeof item.perceptualHash === 'string' && item.perceptualHash.length === 63) hashUsed.push(item.perceptualHash);
    } catch (_) { /* Local photo checks continue by URL and assignment ID. */ }
  }
  function restoreAssignments() {
    for (const [id, photo] of Object.entries(assignmentState)) {
      if (!photo || !absoluteUrl(photo.url) || !absoluteUrl(photo.page) || !photo.author || !licenseAllowed(photo.license) || alreadyUsed(photo)) continue;
      const accepted = { ...photo, url: absoluteUrl(photo.url), page: absoluteUrl(photo.page), license: licenseLabel(photo.license) };
      assignments.set(id, accepted); reserve(accepted);
    }
    onlinePhotos = assignments.size;
  }
  function dailyState() {
    const today = new Date().toISOString().slice(0, 10); const old = safeJson(DAILY_KEY);
    return old && old.day === today ? old : { day: today, requests: 0 };
  }
  function canRequest() { return dailyState().requests < MAX_DAILY_REQUESTS && Date.now() >= pausedUntil; }
  function addDailyRequest() { const d = dailyState(); d.requests++; saveJson(DAILY_KEY, d); }
  function renderedOnlinePhotoCount() {
    return Array.from(document.querySelectorAll(SELECTOR)).filter(img => {
      const src = String(img.getAttribute('src') || img.currentSrc || '');
      return img.classList?.contains('photo-fix90-online')
        && img.dataset.photoFix90Loaded === '1'
        && img.naturalWidth >= 320 && img.naturalHeight >= 180
        && /^https:\/\//i.test(src) && !/\.svg(?:[?#]|$)/i.test(src);
    }).length;
  }
  function setStatus() {
    const registered = Array.from(document.querySelectorAll(SELECTOR)).filter(img => !localRaster(img.getAttribute('src') || '') || img.dataset.photoForceOnline).length;
    const displayed = renderedOnlinePhotoCount();
    const pending = Math.max(0, registered - displayed);
    const providerNote = lastProviderError ? ` · ŹRÓDŁO ${lastProvider}: ${lastProviderError}` : (apiRequests ? ` · źródła online: ${apiRequests} zapytań` : ' · oczekiwanie na pierwsze zapytanie online');
    const message = `Prawdziwe fotografie: ${displayed} wyświetlonych · ${pending} pozycji bez zdjęcia · kolejka ${queue.length}${providerNote}`;
    if (statusNode) { statusNode.querySelector('[data-fix90-status-text]').textContent = message; statusNode.title = `Wyświetlone i zweryfikowane fotografie: ${displayed}. Przypisane rekordy katalogu: ${assignments.size}. ${apiRequests} zapytań API w tej sesji. ${lastProviderError ? `${lastProvider}: ${lastProviderError}` : 'Nie zgłoszono błędu dostawcy.'} Ilustracje SVG są wyłącznie awaryjne i nie są liczone jako zdjęcia.`; }
    const repairStatus = document.getElementById('repairPhotoStatus');
    if (repairStatus) repairStatus.textContent = message;
    api.photoCount = displayed;
    api.photoCatalogStats = { onlinePhotos: displayed, assignedPhotos: assignments.size, queued: queue.length, failed: failedCount, version: VERSION };
  }
  function ensureStatus() {
    if (statusNode) return;
    statusNode = document.getElementById('photoCatalogFix90Status');
    if (statusNode) return;
    const box = document.createElement('div'); box.id = 'photoCatalogFix90Status'; box.className = 'photo-catalog-fix90-status';
    const textNode = document.createElement('span'); textNode.dataset.fix90StatusText = '1'; textNode.textContent = 'Włączanie katalogu prawdziwych fotografii…';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Wznów pobieranie'; button.addEventListener('click', () => resume());
    box.append(textNode, button);
    const home = document.querySelector('#view-home .np640-showcase');
    if (home?.parentNode) home.parentNode.insertBefore(box, home);
    else (document.querySelector('#view-home') || document.body).prepend(box);
    statusNode = box;
  }
  function addCredit(img, photo) {
    const slotId = img.dataset.photoId || '';
    const repairCredit = img.closest('.repair-photo-stage,.repair-row-photo-wrap')?.querySelector('[data-repair-photo-credit]');
    const slideCredit = img.closest('.np640-slide')?.querySelector('.np640-photo-credit');
    const existing = Array.from(img.parentElement?.querySelectorAll('.photo-credit-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === slotId);
    const heroCaption = img.closest('.np30-hero-photo-main')?.querySelector('figcaption');
    let credit = repairCredit || slideCredit || existing;
    if (!credit) {
      credit = document.createElement('small'); credit.className = 'photo-credit-fix90'; credit.dataset.photoCreditFor = slotId;
      const parent = img.parentElement; if (parent) parent.appendChild(credit);
    }
    credit.replaceChildren(); credit.classList.add('photo-credit-fix90'); credit.dataset.photoCreditFor = slotId;
    const author = document.createElement('a'); author.href = photo.page; author.target = '_blank'; author.rel = 'noopener noreferrer'; author.textContent = clean(photo.author || 'Autor niepodany');
    const provider = document.createElement('span'); provider.textContent = ` · ${clean(photo.provider || 'Openverse')}`;
    const license = document.createElement('a'); license.href = photo.licenseUrl || photo.page; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = ` · ${clean(photo.license)}`;
    credit.append(author, provider, license); credit.hidden = false;
    if (slideCredit) slideCredit.textContent = `FOTOGRAFIA · ${clean(photo.author)} · ${clean(photo.license)}`;
    const moduleLabel = img.closest('.np30-module-photo')?.querySelector('i');
    if (moduleLabel) moduleLabel.textContent = `FOTOGRAFIA · ${clean(photo.author).slice(0, 32)} · ${clean(photo.license)}`;
    if (heroCaption) {
      const small = heroCaption.querySelector('small');
      if (small) small.textContent = `Fotografia: ${clean(photo.author)} · ${clean(photo.license)}`;
    }
  }
  function removeCredit(img) {
    const credit = Array.from(img.parentElement?.querySelectorAll('.photo-credit-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (credit) credit.remove();
    const fallback = Array.from(img.parentElement?.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (fallback) fallback.remove();
  }
  function addFallbackLabel(img) {
    const slotId = img.dataset.photoId || '';
    if (!slotId || !img.parentElement) return;
    const existing = Array.from(img.parentElement.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]')).find(node => node.dataset.photoCreditFor === slotId);
    if (existing) return;
    const label = document.createElement('small');
    label.className = 'photo-fallback-label-fix90';
    label.dataset.photoCreditFor = slotId;
    label.textContent = 'ILUSTRACJA TECHNICZNA OFFLINE · FOTOGRAFIA NIEDOSTĘPNA';
    img.parentElement.appendChild(label);
  }
  function restoreFallback(img, caption = true) {
    const fallback = img.dataset.photoFix90Fallback || '';
    if (fallback) img.src = fallback;
    img.hidden = false;
    delete img.dataset.photoFix90Assigned;
    img.dataset.photoFix90State = 'fallback';
    img.classList.add('photo-fix90-offline-fallback');
    img.classList.remove('photo-fix90-online');
    img.alt = `${img.dataset.photoTitle || img.alt || 'Materiał'} — ilustracja techniczna offline; brak zweryfikowanej fotografii`;
    const credit = img.closest('.repair-photo-stage,.repair-row-photo-wrap')?.querySelector('[data-repair-photo-credit]');
    if (credit) { credit.hidden = false; credit.textContent = 'Ilustracja techniczna · brak zweryfikowanej fotografii'; }
    const slideCredit = img.closest('.np640-slide')?.querySelector('.np640-photo-credit');
    if (slideCredit) slideCredit.textContent = 'ILUSTRACJA TECHNICZNA OFFLINE · BRAK ZWERYFIKOWANEJ FOTOGRAFII';
    const heroSmall = img.closest('.np30-hero-photo-main')?.querySelector('figcaption small');
    if (heroSmall) heroSmall.textContent = 'Ilustracja techniczna offline · zdjęcie niedostępne';
    removeCredit(img);
    addFallbackLabel(img);
    const pending = img.parentElement?.querySelector('.repair-photo-pending');
    if (pending) pending.hidden = true;
    if (caption) {
      const label = img.closest('.np30-module-photo')?.querySelector('i');
      if (label) label.textContent = 'ILUSTRACJA TECHNICZNA · ZDJĘCIE NIEDOSTĘPNE';
    }
  }
  // FIX93_DIRECT_TARGET_IMAGE_LOAD: the destination IMG performs the real fetch once; no serial probe.
  function applyPhoto(img, photo) {
    if (!img || !photo) return;
    recoverPhotoSlotId(img);
    if (!img.dataset.photoId) {
      const info = nodeInfo(img);
      img.dataset.photoId = info.id;
      img.dataset.photoKind = info.category;
      img.dataset.photoTitle = info.title;
    }
    if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
    // Mark the slot before changing src. FIX77/FIX83 observe src changes and must
    // recognize this as a catalog-owned photograph in the same mutation cycle.
    img.dataset.photoFix90Assigned = photo.providerId || photo.url;
    img.dataset.photoFix90State = 'online-photo';
    img.dataset.photoFix90Loaded = '0';
    img.hidden = false;
    img.classList.add('photo-fix90-online');
    img.classList.remove('photo-fix90-offline-fallback', 'repair-photo-illustration', 'npa-fix83-visual');
    delete img.dataset.npaFix83Generated;
    delete img.dataset.fix77Replaced;
    img.alt = `${img.dataset.photoTitle || img.alt || 'Fotografia edukacyjna'} — fotografia ${clean(photo.title || photo.category || '')}`;
    img.title = `${clean(photo.title || '')} · ${clean(photo.author)} · ${clean(photo.license)}`;
    removeCredit(img);
    addCredit(img, photo);
    const fallbackLabel = Array.from(img.parentElement?.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (fallbackLabel) fallbackLabel.remove();
    const pending = img.parentElement?.querySelector('.repair-photo-pending');
    if (pending) pending.hidden = true;
    let originalFallbackTried = false;
    img.onload = () => {
      if (img.naturalWidth >= 320 && img.naturalHeight >= 180) {
        img.dataset.photoFix90Loaded = '1';
        img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
        img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
        img.dataset.photoFix90State = 'online-photo';
        setStatus();
      } else if (img.onerror) {
        img.onerror();
      }
    };
    img.onerror = () => {
      const originalUrl = absoluteUrl(photo.originalUrl);
      if (!originalFallbackTried && originalUrl && canonicalUrl(originalUrl) !== canonicalUrl(photo.url)) {
        originalFallbackTried = true;
        img.dataset.photoFix90TriedOriginal = '1';
        img.dataset.photoFix90State = 'online-photo';
        img.src = originalUrl;
        return;
      }
      failedUrls.add(canonicalUrl(photo.url));
      assignments.delete(img.dataset.photoId);
      delete assignmentState[img.dataset.photoId];
      delete img.dataset.photoFix90Assigned;
      delete img.dataset.photoFix90Loaded;
      for (const key of photoIdentity(photo)) used.delete(key);
      if (photo.hash) { const index = hashUsed.indexOf(photo.hash); if (index >= 0) hashUsed.splice(index, 1); }
      saveJson(ASSIGN_KEY, assignmentState);
      onlinePhotos = Math.max(0, onlinePhotos - 1);
      img.onerror = null;
      restoreFallback(img);
      failedCount++;
      scheduled.delete(img);
      processed.delete(img);
      scheduleImage(img, true);
      setStatus();
    };
    // Register handlers before src assignment so cached/fast failures cannot race them.
    img.src = photo.url;
  }
  function setAssignment(id, photo) {
    assignments.set(id, photo); assignmentState[id] = photo; reserve(photo); saveJson(ASSIGN_KEY, assignmentState);
  }
  function takeSeed(category) {
    const pool = seedPools.get(category);
    if (!pool?.length) return null;
    while (pool.length) {
      const photo = pool.shift();
      if (!alreadyUsed(photo) && !failedUrls.has(canonicalUrl(photo.url))) return photo;
    }
    return null;
  }
  function parseOpenverse(result, category) {
    const url = absoluteUrl(result.thumbnail) || absoluteUrl(result.url); const page = absoluteUrl(result.foreign_landing_url);
    const license = String(result.license || '').toLowerCase(); const author = clean(result.creator || '');
    if (!url || !page || !author || !licenseAllowed(license) || (result.category && result.category !== 'photograph') || Number(result.width || 0) < 320 || Number(result.height || 0) < 180) return null;
    const tags = [result.title || '', result.description || '', ...(Array.isArray(result.tags) ? result.tags.map(tag => typeof tag === 'string' ? tag : tag.name) : [])].join(' ');
    const photo = { url, page, originalUrl: absoluteUrl(result.url), providerId: `openverse:${result.id || canonicalUrl(page)}`, provider: `Openverse / ${clean(result.source || result.provider || '')}`, author, license: licenseLabel(license), licenseUrl: absoluteUrl(result.license_url) || page, title: clean(result.title), tags, category, width: Number(result.width || 0), height: Number(result.height || 0) };
    if (category === 'vram' && !isVramPhotoRelevant(photo)) return null;
    return photo;
  }
  function htmlText(value) { const node = document.createElement('div'); node.innerHTML = String(value || ''); return clean(node.textContent || node.innerText || ''); }
  function parseCommons(page, category) {
    const info = page?.imageinfo?.[0]; const meta = info?.extmetadata || {};
    const url = absoluteUrl(info?.thumburl || info?.url);
    const pageUrl = absoluteUrl(`https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page?.title || '').replace(/ /g, '_'))}`);
    const license = htmlText(meta.LicenseShortName?.value || meta.License?.value || '');
    const author = htmlText(meta.Artist?.value || meta.Credit?.value || '');
    const description = htmlText(meta.ImageDescription?.value || '');
    const categories = htmlText(meta.Categories?.value || '');
    const objectName = htmlText(meta.ObjectName?.value || '');
    const title = clean(objectName || page?.title || '');
    const tags = [page?.title || '', title, description, categories].join(' ');
    if (!url || !pageUrl || !author || !licenseAllowed(license) || (info?.mime && !/^image\/(?:jpe?g|png|webp)$/i.test(info.mime))) return null;
    const photo = { url, page: pageUrl, originalUrl: absoluteUrl(info?.url), providerId: `commons:${page.pageid || page.title}`, provider: 'Wikimedia Commons', author, license: licenseLabel(license), licenseUrl: absoluteUrl(meta.LicenseUrl?.value) || pageUrl, title, tags, description, category, width: Number(info?.thumbwidth || info?.width || 0), height: Number(info?.thumbheight || info?.height || 0) };
    if (photo.width < 320 || photo.height < 180) return null;
    if (category === 'vram' && !isVramPhotoRelevant(photo)) return null;
    return photo;
  }
  async function fetchJson(url, provider) {
    if (!navigator.onLine) throw new Error('offline');
    if (provider === 'Openverse') {
      if (!canRequest()) throw new Error('Openverse: lokalny budżet zapytań dziennych osiągnięty lub limit aktywny.');
      const wait = Math.max(0, OPENVERSE_GAP_MS - (Date.now() - lastOpenverseAt)); if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastOpenverseAt = Date.now(); addDailyRequest(); apiRequests++; lastProvider = provider;
    } else {
      const wait = Math.max(0, COMMONS_GAP_MS - (Date.now() - lastCommonsAt)); if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastCommonsAt = Date.now(); apiRequests++; lastProvider = provider;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 18000) : null;
    try {
      const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller?.signal });
      if (response.status === 429) {
        const retry = Number(response.headers?.get?.('retry-after') || 60);
        pausedUntil = Date.now() + Math.max(60, retry) * 1000;
        throw new Error(`${provider} HTTP 429 — przerwa przed kolejnym pobieraniem.`);
      }
      if (!response.ok) throw new Error(`${provider} HTTP ${response.status}`);
      lastProviderError = '';
      return await response.json();
    } finally { if (timer) clearTimeout(timer); }
  }
  function categorySearchQueries(category) {
    const def = CATEGORY[category] || CATEGORY.board;
    return [...new Set([def.query, def.alternate, def.third].filter(Boolean))].slice(0, OPENVERSE_QUERY_VARIANTS);
  }
  function commonsSearchQueries(category) {
    const def = CATEGORY[category] || CATEGORY.board;
    return [...new Set((def.commons || [def.query, def.alternate, def.third]).filter(Boolean))].slice(0, MAX_COMMONS_QUERY_VARIANTS);
  }
  function buildOpenverseUrl(category, page, queryText = '') {
    const query = clean(queryText || categorySearchQueries(category)[0]).slice(0, 200);
    const params = new URLSearchParams({
      q: query,
      page: String(Math.max(1, Math.floor(Number(page) || 1))),
      page_size: '20',
      license: 'cc0,by,by-sa,pdm',
      license_type: 'commercial',
      category: 'photograph',
      filter_dead: 'true',
      mature: 'false'
    });
    return `${OPENVERSE_ENDPOINT}?${params}`;
  }
  async function openversePage(category, page, queryText = '') {
    const data = await fetchJson(buildOpenverseUrl(category, page, queryText), 'Openverse');
    return { photos: (data.results || []).map(item => parseOpenverse(item, category)).filter(Boolean), pageCount: Number(data.page_count || 1), count: Number(data.result_count || 0) };
  }
  async function commonsSearch(category, offset = 0, queryText = '') {
    const queries = commonsSearchQueries(category);
    const query = clean(queryText || queries[0] || 'computer hardware').slice(0, 180);
    const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '20', gsroffset: String(Math.max(0, Number(offset) || 0)), gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1280', redirects: '1' });
    const data = await fetchJson(`${COMMONS_ENDPOINT}?${params}`, 'Commons');
    const nextOffset = Number(data.continue?.gsroffset || (Number(offset || 0) + 20));
    return { photos: Object.values(data.query?.pages || {}).map(page => parseCommons(page, category)).filter(Boolean), nextOffset, hasMore: Boolean(data.continue?.gsroffset) };
  }
  async function probePhoto(photo) {
    if (typeof Image === 'undefined') return { ok: true, hash: '' };
    const load = useCors => new Promise(resolve => {
      const image = new Image(); let done = false;
      const finish = result => { if (done) return; done = true; clearTimeout(timer); resolve(result); };
      const timer = setTimeout(() => finish(null), 12000);
      image.onload = () => {
        const valid = image.naturalWidth >= 320 && image.naturalHeight >= 180;
        finish(valid ? { image, hash: perceptualHash(image), width: image.naturalWidth, height: image.naturalHeight } : null);
      };
      image.onerror = () => finish(null);
      image.referrerPolicy = 'strict-origin-when-cross-origin';
      if (useCors) image.crossOrigin = 'anonymous';
      image.src = photo.url;
    });
    // First try CORS so the same photo can be checked against local and online pHashes.
    const checked = await load(true);
    if (checked) return { ok: true, hash: checked.hash, width: checked.width, height: checked.height };
    // If the host doesn't expose CORS, still allow normal display; URL/provider identity is checked.
    const display = await load(false);
    return display ? { ok: true, hash: '', width: display.width, height: display.height } : { ok: false, hash: '' };
  }
  async function takeOnline(category) {
    let pool = candidatePools.get(category);
    if (!pool) { pool = []; candidatePools.set(category, pool); }
    const queries = categorySearchQueries(category).slice(0, OPENVERSE_QUERY_VARIANTS);
    const commonsQueries = commonsSearchQueries(category).slice(0, MAX_COMMONS_QUERY_VARIANTS);
    const state = pageState.get(category) || {
      queryIndex: 0, page: 1, pageCount: MAX_PAGES_PER_QUERY, queryFailures: 0, retryAt: 0,
      commonsOffset: 0, commonsPages: 0, commonsQueryIndex: 0, commonsTried: false, commonsHasMore: false, exhausted: false
    };
    if (state.exhausted) return null;
    for (let attempts = 0; attempts < 32; attempts++) {
      while (pool.length) {
        const photo = pool.shift();
        persistCandidatePools();
        if (alreadyUsed(photo) || failedUrls.has(canonicalUrl(photo.url))) continue;
        // Openverse/Commons parsers already enforce licensed photograph metadata and
        // minimum dimensions. Do not pre-download every candidate twice here: the
        // target <img> now performs the real load once, with an original-URL fallback.
        // This removes up to 24 seconds of serial image probing per candidate.
        // FIX93_DIRECT_TARGET_IMAGE_LOAD: the destination card image owns decoding and fallback.
        const accepted = { ...photo, hash: photo.hash || '' };
        if (alreadyUsed(accepted)) { failedUrls.add(canonicalUrl(photo.url)); continue; }
        lastProviderError = '';
        persistPageState(category, state);
        return accepted;
      }

      const waitingForOpenverse = Date.now() < Number(state.retryAt || 0) || Date.now() < pausedUntil;
      if (state.queryIndex < queries.length && canRequest() && !waitingForOpenverse) {
        if (state.page > Math.min(state.pageCount || MAX_PAGES_PER_QUERY, MAX_PAGES_PER_QUERY)) {
          state.queryIndex++;
          state.page = 1;
          state.pageCount = MAX_PAGES_PER_QUERY;
          state.queryFailures = 0;
          persistPageState(category, state);
          continue;
        }
        const requestedPage = state.page;
        try {
          const result = await openversePage(category, requestedPage, queries[state.queryIndex]);
          state.page = requestedPage + 1;
          state.pageCount = Math.min(MAX_PAGES_PER_QUERY, Math.max(1, Number(result.pageCount || 1)));
          state.queryFailures = 0;
          state.retryAt = 0;
          pool.push(...result.photos.filter(photo => !alreadyUsed(photo)));
          persistCandidatePools();
          persistPageState(category, state);
          if (pool.length) continue;
          continue;
        } catch (error) {
          lastProvider = 'Openverse';
          lastProviderError = clean(error.message).slice(0, 140);
          console.warn('[PHOTO FIX93] Openverse', category, error.message);
          if (/429|limit|budżet|przerwa/i.test(error.message)) {
            state.retryAt = Math.max(pausedUntil, Date.now() + 60000);
            pausedUntil = state.retryAt;
          } else {
            state.queryFailures = Number(state.queryFailures || 0) + 1;
            if (state.queryFailures >= 2) {
              state.queryIndex++;
              state.page = 1;
              state.pageCount = MAX_PAGES_PER_QUERY;
              state.queryFailures = 0;
              state.retryAt = 0;
            } else {
              state.retryAt = Date.now() + 15000;
            }
          }
          persistPageState(category, state);
          // Try Commons immediately; do not discard the current Openverse query state.
        }
      }

      if (!state.commonsTried || (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES)) {
        try {
          const commonsQuery = commonsQueries[state.commonsQueryIndex] || commonsQueries[0];
          const commons = await commonsSearch(category, state.commonsOffset || 0, commonsQuery);
          state.commonsPages = Number(state.commonsPages || 0) + 1;
          state.commonsOffset = commons.nextOffset;
          state.commonsHasMore = commons.hasMore;
          pool.push(...commons.photos.filter(photo => !alreadyUsed(photo)));
          persistCandidatePools();
          if (!commons.hasMore) {
            state.commonsQueryIndex = Number(state.commonsQueryIndex || 0) + 1;
            state.commonsOffset = 0;
            state.commonsHasMore = false;
            state.commonsTried = state.commonsQueryIndex >= commonsQueries.length;
          } else {
            state.commonsTried = false;
          }
          persistPageState(category, state);
          if (pool.length) continue;
          if (!state.commonsTried && state.commonsPages < MAX_COMMONS_PAGES) continue;
          if (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES) continue;
        } catch (error) {
          lastProvider = 'Wikimedia Commons';
          lastProviderError = clean(error.message).slice(0, 140);
          state.commonsTried = true;
          console.warn('[PHOTO FIX93] Wikimedia Commons', category, error.message);
          persistPageState(category, state);
        }
      }

      // Openverse quota/backoff is a temporary state, not a permanently exhausted category.
      if ((state.queryIndex < queries.length && (Date.now() < Number(state.retryAt || 0) || !canRequest()))
        || (!state.commonsTried && state.commonsQueryIndex < commonsQueries.length && state.commonsPages < MAX_COMMONS_PAGES)
        || (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES)) {
        state.exhausted = false;
        persistPageState(category, state);
        return null;
      }
      state.exhausted = true;
      persistPageState(category, state);
      return null;
    }
    persistPageState(category, state);
    return null;
  }
  async function loadConfig() {
    try {
      const response = await fetch(CONFIG_URL, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
      config = await response.json();
      const license = config.license || {};
      for (const item of config.photos || []) {
        const url = absoluteUrl(item.asset); const page = absoluteUrl(item.page);
        const author = clean(item.author || '');
        if (!url || !page || !author) continue;
        const cat = item.category || (item.topic ? categoryFor(item.topic) : categoryFor(item.id));
        const photo = { url, page, originalUrl: url, providerId: `pexels:${item.id}`, provider: 'Pexels', author, license: item.license || 'Pexels License', licenseUrl: item.licenseUrl || license.url || 'https://www.pexels.com/license/', title: clean(item.topic || item.id), tags: clean(item.topic || '') , category: cat };
        if (!licenseAllowed(photo.license)) continue;
        if (!seedPools.has(cat)) seedPools.set(cat, []);
        seedPools.get(cat).push(photo);
      }
      seedsReady = true;
    } catch (error) {
      console.warn('[PHOTO FIX93] photo source manifest unavailable:', error.message);
      config = { photos: [] }; seedsReady = true;
    }
  }
  function sourceLooksPhoto(src) { return /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(String(src || '')) && !/^data:image/i.test(String(src || '')); }
  function eligible(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (img.dataset.photoIgnore === 'true' || img.dataset.photoEligible === 'false') return false;
    const current = img.getAttribute('src') || '';
    if (localRaster(current) && !img.dataset.photoForceOnline) return false; // Preserve the 13 individually assigned local home photographs.
    return sourceLooksPhoto(current) || isSvg(current) || Boolean(img.dataset.photoId || img.dataset.photoTitle || img.dataset.photoKind) || img.classList.contains('course-card-image') || img.classList.contains('catalog-card-art') || img.classList.contains('repair-row-art');
  }
  function recoverPhotoSlotId(img) {
    if (!img) return '';
    if (img.dataset.photoId) return img.dataset.photoId;
    const credits = img.parentElement?.querySelectorAll?.('.photo-credit-fix90, .np640-photo-credit, figcaption') || [];
    const saved = Array.from(credits).map(node => String(node.dataset?.photoCreditFor || '')).find(Boolean);
    if (saved) {
      img.dataset.photoId = saved;
      return saved;
    }
    // Production DOM credits have class names but no data-photo-credit-for attribute.
    // Rebuild the same deterministic slot identity from the current wrapper context.
    const hasVisibleCredit = credits.length > 0;
    const hasOnlineMarker = img.classList?.contains?.('photo-fix90-online');
    if (hasVisibleCredit && hasOnlineMarker) {
      const info = nodeInfo(img);
      img.dataset.photoId = info.id;
      if (!img.dataset.photoKind) img.dataset.photoKind = info.category;
      if (!img.dataset.photoTitle) img.dataset.photoTitle = info.title;
      return info.id;
    }
    return '';
  }
  function observeImage(img) {
    if (!eligible(img) || scheduled.has(img) || processed.has(img)) return;
    scheduled.add(img);
    recoverPhotoSlotId(img);
    if (!img.dataset.photoId) { const info = nodeInfo(img); img.dataset.photoId = info.id; img.dataset.photoKind = info.category; img.dataset.photoTitle = info.title; }
    if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
    const saved = assignments.get(img.dataset.photoId);
    if (saved) { applyPhoto(img, saved); processed.add(img); return; }
    if (observer) observer.observe(img); else scheduleImage(img);
  }
  function scan(root = document) {
    if (!root) return;
    if (root instanceof HTMLImageElement) observeImage(root);
    root.querySelectorAll?.(SELECTOR).forEach(observeImage);
  }
  function scheduleImage(img, retry = false) {
    if (!img || !img.dataset.photoId) return;
    if (!retry && processed.has(img)) return;
    processed.add(img); queuedCount++; queue.push(img); processQueue();
  }
  function categoryWaitingForProvider(category) {
    const state = pageState.get(category);
    if (!state || state.exhausted) return false;
    const now = Date.now();
    if (Number(state.retryAt || 0) > now || pausedUntil > now) return true;
    const queries = categorySearchQueries(category);
    return state.queryIndex < queries.length && dailyState().requests >= MAX_DAILY_REQUESTS;
  }
  function nextQueueRetryDelay() {
    const now = Date.now();
    let retryAt = Math.max(pausedUntil, 0);
    for (const img of pendingRetryImages) {
      const category = nodeInfo(img).category;
      retryAt = Math.max(retryAt, Number(pageState.get(category)?.retryAt || 0));
    }
    if (dailyState().requests >= MAX_DAILY_REQUESTS) {
      const tomorrow = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1, 0, 0, 10);
      return Math.max(60000, tomorrow - now);
    }
    return Math.min(5 * 60 * 1000, Math.max(12000, retryAt - now + 1200));
  }
  function scheduleQueueRetry(img) {
    if (img?.isConnected) pendingRetryImages.add(img);
    if (queueRetryTimer || !pendingRetryImages.size) return;
    const delay = nextQueueRetryDelay();
    queueRetryTimer = setTimeout(() => {
      queueRetryTimer = null;
      if (!navigator.onLine || dailyState().requests >= MAX_DAILY_REQUESTS) { setStatus(); return; }
      const retry = Array.from(pendingRetryImages); pendingRetryImages.clear();
      for (const target of retry) {
        if (!target?.isConnected) continue;
        processed.delete(target); scheduled.delete(target);
        scheduleImage(target, true);
      }
      processQueue();
    }, delay);
  }
  function queueCatalogImages(root = document) {
    const found = new Set();
    if (root instanceof HTMLImageElement) found.add(root);
    root.querySelectorAll?.(SELECTOR).forEach(img => found.add(img));
    for (const img of found) {
      if (!eligible(img) || processed.has(img)) continue;
      recoverPhotoSlotId(img);
      if (!img.dataset.photoId) {
        const info = nodeInfo(img); img.dataset.photoId = info.id; img.dataset.photoKind = info.category; img.dataset.photoTitle = info.title;
      }
      if (observer) observer.unobserve(img);
      scheduled.delete(img);
      if (assignments.has(img.dataset.photoId)) {
        applyPhoto(img, assignments.get(img.dataset.photoId)); processed.add(img);
      } else scheduleImage(img, true);
    }
  }
  function queueHomeFirst(root = document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll(HOME_PRIORITY_SELECTOR).forEach(img => {
      if (!eligible(img) || processed.has(img)) return;
      recoverPhotoSlotId(img);
    if (!img.dataset.photoId) { const info = nodeInfo(img); img.dataset.photoId = info.id; img.dataset.photoKind = info.category; img.dataset.photoTitle = info.title; }
      if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
      if (observer) observer.unobserve(img);
      scheduled.delete(img);
      if (assignments.has(img.dataset.photoId)) { applyPhoto(img, assignments.get(img.dataset.photoId)); processed.add(img); }
      else scheduleImage(img, true);
    });
  }
  async function processQueue() {
    if (running) return; running = true;
    try {
      while (queue.length) {
        const img = queue.shift();
        if (!img?.isConnected || img.dataset.photoFix90Assigned) continue;
        const info = nodeInfo(img);
        const saved = assignments.get(info.id);
        if (saved) { applyPhoto(img, saved); continue; }
        if (!navigator.onLine) { restoreFallback(img); pendingRetryImages.add(img); continue; }
        let photo = takeSeed(info.category);
        if (!photo) photo = await takeOnline(info.category);
        if (photo) {
          setAssignment(info.id, photo); applyPhoto(img, photo); onlinePhotos++;
          pendingRetryImages.delete(img);
        } else {
          restoreFallback(img);
          if (categoryWaitingForProvider(info.category)) {
            pendingRetryImages.add(img);
          } else failedCount++;
        }
        // Stop at the global Openverse daily budget instead of walking 1,800 slots
        // and marking all of them failed. The remaining queue is kept for tomorrow.
        if (!photo && dailyState().requests >= MAX_DAILY_REQUESTS && categoryWaitingForProvider(info.category)) {
          queue.unshift(img);
          break;
        }
        setStatus();
      }
    } finally {
      running = false;
      if (pendingRetryImages.size) scheduleQueueRetry();
      setStatus();
    }
  }
  function installObservers() {
    ensureStatus();
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) { observer.unobserve(entry.target); scheduleImage(entry.target); }
      }, { root: null, rootMargin: '1100px 0px', threshold: 0.01 });
    }
    if ('MutationObserver' in window && document.body) {
      mutationObserver = new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes || []) if (node.nodeType === 1) { scan(node); queueCatalogImages(node); queueHomeFirst(node); }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
    scan(document);
    queueHomeFirst(document);
    queueCatalogImages(document);
    if (typeof window.setInterval === 'function') window.setInterval(() => { scan(document); queueHomeFirst(document); queueCatalogImages(document); setStatus(); }, 5000);
  }
  function resume() {
    pausedUntil = 0;
    if (queueRetryTimer) { clearTimeout(queueRetryTimer); queueRetryTimer = null; }
    for (const [category, state] of pageState) {
      if (state.exhausted) persistPageState(category, { queryIndex: 0, page: 1, pageCount: MAX_PAGES_PER_QUERY, queryFailures: 0, retryAt: 0, commonsOffset: 0, commonsPages: 0, commonsQueryIndex: 0, commonsTried: false, commonsHasMore: false, exhausted: false });
      else if (state.retryAt) { state.retryAt = 0; persistPageState(category, state); }
    }
    document.querySelectorAll(SELECTOR).forEach(img => {
      if (img.classList.contains('photo-fix90-offline-fallback') || img.dataset.photoFix90State === 'fallback') {
        scheduled.delete(img); processed.delete(img); delete img.dataset.photoFix90Assigned;
        observeImage(img);
        if (observer) { observer.unobserve(img); scheduleImage(img, true); }
      }
    });
    scan(document);
    queueHomeFirst(document);
    queueCatalogImages(document);
    for (const img of pendingRetryImages) { if (img?.isConnected) { processed.delete(img); scheduled.delete(img); scheduleImage(img, true); } }
    pendingRetryImages.clear();
    return processQueue();
  }
  function registerRepairRecords(repairs) {
    currentRepairs = Array.isArray(repairs) ? repairs : [];
    // The cards/details are rendered by app.js; the MutationObserver processes each real image slot.
    setTimeout(() => scan(document), 0);
    return Promise.resolve({ registered: currentRepairs.length, queued: queue.length, mode: 'global-unique-photo-catalog' });
  }
  function expose() {
    api.loadRepairPhotos = registerRepairRecords;
    api.resumePhotoDownload = resume;
    api.photoProvider = 'Pexels seed + Openverse + Wikimedia Commons';
    api.photoCatalogVersion = VERSION;
    api.photoCatalogCompatibleWithFix93Guards = true;
    api.photoCatalogLegacyGuardRecovery = true;
    api.photoCatalogEnabled = true;
    api.photoCatalogStats = { onlinePhotos: 0, queued: 0, failed: 0, version: VERSION };
    api.getPhotoCatalogStats = () => ({ onlinePhotos, queued: queue.length, retryPending: pendingRetryImages.size, failed: failedCount, slots: document.querySelectorAll(SELECTOR).length, apiRequests, lastProvider, lastProviderError, version: VERSION });
    api.getPhotoCatalogAssignment = id => assignments.get(String(id)) || null;
    api.photoCount = onlinePhotos;
    window.NPA_PHOTO_CATALOG_FIX93 = {
      version: VERSION, categoryFor, normalizeLicense, licenseLabel, licenseAllowed, isVramPhotoRelevant, parseOpenverse, nodeInfo, probePhoto, recoverPhotoSlotId, renderedOnlinePhotoCount, buildOpenverseUrl, openversePage, categorySearchQueries, commonsSearchQueries, commonsSearch, takeOnline, queueCatalogImages, queueHomeFirst,
      getPageState: category => pageState.get(category) || null, storageKeys: { assignments: ASSIGN_KEY, daily: DAILY_KEY, pageState: PAGE_STATE_KEY, legacyPageState: LEGACY_PAGE_STATE_KEY, candidatePools: CANDIDATE_POOL_KEY }, photoIdentity, normalizeUrl: canonicalUrl, parseCommons, takeSeed, resume, registerRepairRecords,
      getStats: () => ({ onlinePhotos: renderedOnlinePhotoCount(), assignedPhotos: assignments.size, queued: queue.length, retryPending: pendingRetryImages.size, failed: failedCount, assignments: assignments.size, apiRequests, lastProvider, lastProviderError, version: VERSION }),
      isEligibleSelector: SELECTOR
    };
    // Retain the previous public handle for integrations compiled against FIX92.
    window.NPA_PHOTO_CATALOG_FIX92 = window.NPA_PHOTO_CATALOG_FIX93;
  }
  function boot() {
    expose(); ensureStatus();
    Promise.all([loadConfig(), restoreLocalPhotoHashes()]).finally(() => {
      restoreAssignments();
      installObservers();
      setStatus();
    });
  }
  window.addEventListener?.('online', () => resume());
  document.addEventListener('click', event => { if (event.target.closest('#repairPhotoRetry,[data-fix90-retry]')) resume(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
