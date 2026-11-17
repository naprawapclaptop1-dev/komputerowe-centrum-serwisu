/* NAUKA OD A DO Z 6.8.0 FIX90 — online-first real photo catalog.
 * Photos are selected from licensed Openverse/Wikimedia results and a small Pexels seed set.
 * One source image is assigned to one slot globally. SVG remains an honestly-labelled offline fallback.
 */
(() => {
  'use strict';
  const VERSION = '6.8.0-fix90-online-photo-catalog-20261106';
  const CONFIG_URL = 'media/photo-sources-online.json?v=6.8.0-fix90';
  const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix90';
  const DAILY_KEY = 'academyPhotoCatalogDailyFix90';
  const MAX_DAILY_REQUESTS = 150;
  const OPENVERSE_GAP_MS = 3350;
  const COMMONS_GAP_MS = 1350;
  const MAX_PAGES_PER_QUERY = 5;
  const OPENVERSE_ENDPOINT = 'https://api.openverse.org/v1/images/';
  const COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
  const api = window.ACADEMY_ART || (window.ACADEMY_ART = {});
  const CATEGORY = {
    vram: { query: 'VRAM GDDR6 GDDR7 BGA graphics card memory chips close up', alternate: 'graphics card GDDR video memory packages PCB', min: 6 },
    ram: { query: 'computer RAM DIMM SO-DIMM memory module laptop close up', alternate: 'DDR4 DDR5 computer memory module', min: 0 },
    gpu: { query: 'graphics card GPU board graphics processor computer hardware close up', alternate: 'GPU graphics card PCB', min: 0 },
    cpu: { query: 'CPU processor chip silicon package socket computer motherboard close up', alternate: 'computer processor CPU hardware', min: 0 },
    storage: { query: 'SSD NVMe M.2 hard drive computer storage device close up', alternate: 'solid state drive SSD computer hardware', min: 0 },
    cooling: { query: 'laptop cooling fan heatsink heat pipe cleaning repair', alternate: 'computer cooling fan heatsink hardware', min: 0 },
    display: { query: 'laptop LCD display screen hinge eDP cable repair', alternate: 'laptop screen display replacement repair', min: 0 },
    port: { query: 'USB C charging port connector laptop motherboard repair close up', alternate: 'USB connector computer port close up', min: 0 },
    network: { query: 'laptop WiFi wireless network card computer adapter motherboard', alternate: 'computer wireless network card WiFi', min: 0 },
    audio: { query: 'laptop speaker microphone audio module computer repair', alternate: 'computer speaker sound card electronics', min: 0 },
    power: { query: 'laptop motherboard power circuit MOSFET charging repair PCB', alternate: 'electronics power supply board MOSFET close up', min: 0 },
    board: { query: 'computer laptop motherboard PCB electronics repair close up', alternate: 'motherboard circuit board computer repair', min: 0 },
    meter: { query: 'multimeter oscilloscope circuit testing electronics technician workbench', alternate: 'multimeter electronic measurement PCB repair', min: 0 },
    safety: { query: 'electronics repair ESD antistatic workstation safety technician', alternate: 'electronics technician safe workbench repair', min: 0 },
    software: { query: 'computer laptop diagnostic technician software repair workstation', alternate: 'computer technician laptop diagnostics', min: 0 },
    laptop: { query: 'open laptop computer repair technician workshop motherboard', alternate: 'laptop repair service workshop', min: 0 },
    bios: { query: 'BIOS EEPROM SPI flash programmer motherboard chip', alternate: 'SPI flash memory programmer electronics', min: 0 },
    solder: { query: 'electronics soldering hot air rework PCB technician', alternate: 'SMD soldering circuit board repair close up', min: 0 },
    diagnostics: { query: 'computer hardware diagnostics repair technician workbench', alternate: 'electronics diagnosis measurement technician', min: 0 },
    battery: { query: 'laptop battery replacement repair battery pack', alternate: 'laptop battery service repair', min: 0 }
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
  function licenseAllowed(value) {
    const raw = String(value || '').trim();
    if (!raw || isNonCommercial(raw)) return false;
    if (/^pexels(?:\s+photo)?\s+license$/i.test(raw) || /^pexels license$/i.test(raw)) return true;
    const s = raw.toLowerCase().replace(/^cc-/, '').replace(/[^a-z0-9-]/g, '');
    return ['cc0', 'pdm', 'by', 'by-sa'].includes(s) || /^cc[- ]?(?:0|zero|by(?:[- ]?sa)?)(?:[- ]?\d(?:\.\d)?)?$/i.test(raw) || /public.?domain|creative commons attribution(?: share alike)?/i.test(raw);
  }
  function categoryFor(text) {
    const s = clean(text).toLowerCase();
    if (/\bvram\b|gddr[3-7x]?|hbm[23e]?|video memory|graphics memory|pamięć graficzna|pamięć karty graficznej/.test(s)) return 'vram';
    if (/\bram\b|\bddr[3-6]\b|so-dimm|sodimm|udimm|pamięć operacyjna|moduł pamięci/.test(s)) return 'ram';
    if (/bios|uefi|spi flash|firmware|eeprom|programator/.test(s)) return 'bios';
    if (/lutow|hot.?air|smd|reball|bga|solder|mikrolut/.test(s)) return 'solder';
    if (/gpu|grafik|graphics card|karta graficzna|karta wideo/.test(s)) return 'gpu';
    if (/cpu|procesor|processor|socket|gniazdo procesora/.test(s)) return 'cpu';
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
    return /\b(vram|gddr[3-7x]?|hbm[23e]?|graphics memory|video memory|gpu memory|memory chip|bga package)\b/.test(text);
  }
  function photoIdentity(photo) {
    return [photo.providerId && `id:${photo.providerId}`, photo.page && `page:${canonicalUrl(photo.page)}`, photo.url && `url:${canonicalUrl(photo.url)}`].filter(Boolean);
  }
  function keyHash(value) {
    let h = 2166136261; for (const ch of String(value || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0');
  }
  function nodeInfo(img) {
    const alt = clean(img.dataset.photoTitle || img.dataset.photoAlt || img.alt || '');
    const parent = img.closest('article,button,figure,.np30-module-photo,.photo-card,section') || img.parentElement;
    const parentText = clean(parent?.textContent || '');
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
  const candidatePools = new Map();
  const pageState = new Map();
  const failedUrls = new Set();
  const scheduled = new WeakSet();
  const processed = new WeakSet();
  const queue = [];
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
  let currentRepairs = [];
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
      const accepted = { ...photo, url: absoluteUrl(photo.url), page: absoluteUrl(photo.page) };
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
  function setStatus() {
    const registered = Array.from(document.querySelectorAll(SELECTOR)).filter(img => !localRaster(img.getAttribute('src') || '') || img.dataset.photoForceOnline).length;
    const pending = Math.max(0, registered - onlinePhotos);
    const message = `Fotografie online: ${onlinePhotos} przypisanych · ${pending} pozycji czeka lub korzysta z awaryjnej ilustracji`;
    if (statusNode) { statusNode.querySelector('[data-fix90-status-text]').textContent = message; statusNode.title = 'Prawdziwe fotografie są pobierane z licencjonowanych źródeł. Gdy źródło nie zwróci pasującego zdjęcia, pozostaje podpisana ilustracja techniczna offline.'; }
    const repairStatus = document.getElementById('repairPhotoStatus');
    if (repairStatus) repairStatus.textContent = message;
    api.photoCount = onlinePhotos;
    api.photoCatalogStats = { onlinePhotos, queued: queue.length, failed: failedCount, version: VERSION };
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
  function applyPhoto(img, photo) {
    if (!img || !photo) return;
    if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
    img.dataset.photoFix90Assigned = photo.providerId || photo.url;
    img.dataset.photoFix90State = 'online-photo';
    img.hidden = false;
    img.src = photo.url;
    img.classList.add('photo-fix90-online');
    img.classList.remove('photo-fix90-offline-fallback', 'repair-photo-illustration');
    img.alt = `${img.dataset.photoTitle || img.alt || 'Fotografia edukacyjna'} — fotografia ${clean(photo.title || photo.category || '')}`;
    img.title = `${clean(photo.title || '')} · ${clean(photo.author)} · ${clean(photo.license)}`;
    removeCredit(img);
    addCredit(img, photo);
    const fallbackLabel = Array.from(img.parentElement?.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (fallbackLabel) fallbackLabel.remove();
    const pending = img.parentElement?.querySelector('.repair-photo-pending');
    if (pending) pending.hidden = true;
    img.onerror = () => {
      failedUrls.add(canonicalUrl(photo.url));
      assignments.delete(img.dataset.photoId);
      delete assignmentState[img.dataset.photoId];
      delete img.dataset.photoFix90Assigned;
      for (const key of photoIdentity(photo)) used.delete(key);
      if (photo.hash) { const index = hashUsed.indexOf(photo.hash); if (index >= 0) hashUsed.splice(index, 1); }
      saveJson(ASSIGN_KEY, assignmentState);
      onlinePhotos = Math.max(0, onlinePhotos - 1);
      img.onerror = null;
      restoreFallback(img);
      failedCount++;
      scheduled.delete(img); processed.delete(img);
      scheduleImage(img, true);
      setStatus();
    };
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
    const url = absoluteUrl(result.thumbnail || result.url); const page = absoluteUrl(result.foreign_landing_url);
    const license = String(result.license || '').toLowerCase(); const author = clean(result.creator || '');
    if (!url || !page || !author || !licenseAllowed(license) || Number(result.width || 0) < 320 || Number(result.height || 0) < 180) return null;
    const tags = Array.isArray(result.tags) ? result.tags.map(tag => typeof tag === 'string' ? tag : tag.name).join(' ') : '';
    const photo = { url, page, originalUrl: absoluteUrl(result.url), providerId: `openverse:${result.id || canonicalUrl(page)}`, provider: `Openverse / ${clean(result.source || result.provider || '')}`, author, license: `CC ${license.toUpperCase()}`, licenseUrl: absoluteUrl(result.license_url) || page, title: clean(result.title), tags, category, width: Number(result.width || 0), height: Number(result.height || 0) };
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
    if (!url || !pageUrl || !author || !licenseAllowed(license)) return null;
    const photo = { url, page: pageUrl, originalUrl: absoluteUrl(info?.url), providerId: `commons:${page.pageid || page.title}`, provider: 'Wikimedia Commons', author, license, licenseUrl: absoluteUrl(meta.LicenseUrl?.value) || pageUrl, title: clean(page.title), tags: '', category, width: Number(info?.thumbwidth || info?.width || 0), height: Number(info?.thumbheight || info?.height || 0) };
    if (photo.width < 320 || photo.height < 180) return null;
    if (category === 'vram' && !isVramPhotoRelevant(photo)) return null;
    return photo;
  }
  async function fetchJson(url, provider) {
    if (!navigator.onLine) throw new Error('offline');
    if (provider === 'Openverse') {
      if (!canRequest()) throw new Error('Openverse: lokalny budżet zapytań dziennych osiągnięty lub limit aktywny.');
      const wait = Math.max(0, OPENVERSE_GAP_MS - (Date.now() - lastOpenverseAt)); if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastOpenverseAt = Date.now(); addDailyRequest();
    } else {
      const wait = Math.max(0, COMMONS_GAP_MS - (Date.now() - lastCommonsAt)); if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastCommonsAt = Date.now();
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
      return await response.json();
    } finally { if (timer) clearTimeout(timer); }
  }
  async function openversePage(category, page) {
    const def = CATEGORY[category] || CATEGORY.board;
    const query = page <= 2 ? def.query : def.alternate;
    const params = new URLSearchParams({ q: query, page: String(page <= 2 ? page : page - 2), page_size: '20', license: 'cc0,by,by-sa,pdm', license_type: 'commercial', category: 'photograph', size: 'large', aspect_ratio: 'wide', filter_dead: 'true', mature: 'false', extension: 'jpg,jpeg,png,webp' });
    const data = await fetchJson(`${OPENVERSE_ENDPOINT}?${params}`, 'Openverse');
    return { photos: (data.results || []).map(item => parseOpenverse(item, category)).filter(Boolean), pageCount: Number(data.page_count || 1), count: Number(data.result_count || 0) };
  }
  async function commonsSearch(category) {
    const def = CATEGORY[category] || CATEGORY.board;
    const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '20', gsrsearch: `${def.query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1280', redirects: '1' });
    const data = await fetchJson(`${COMMONS_ENDPOINT}?${params}`, 'Commons');
    return Object.values(data.query?.pages || {}).map(page => parseCommons(page, category)).filter(Boolean);
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
    for (let attempts = 0; attempts < 10; attempts++) {
      while (pool.length) {
        const photo = pool.shift();
        if (alreadyUsed(photo) || failedUrls.has(canonicalUrl(photo.url))) continue;
        const verification = await probePhoto(photo);
        if (verification?.ok) {
          const accepted = { ...photo, hash: verification.hash || '', width: verification.width || 0, height: verification.height || 0 };
          if (alreadyUsed(accepted)) { failedUrls.add(canonicalUrl(photo.url)); continue; }
          return accepted;
        }
        failedUrls.add(canonicalUrl(photo.url));
      }
      const state = pageState.get(category) || { next: 1, pageCount: MAX_PAGES_PER_QUERY, commonsTried: false, exhausted: false };
      if (state.next <= Math.min(state.pageCount, MAX_PAGES_PER_QUERY) && canRequest()) {
        try {
          const result = await openversePage(category, state.next);
          state.next++; state.pageCount = Math.min(MAX_PAGES_PER_QUERY, Math.max(1, result.pageCount));
          pool.push(...result.photos.filter(photo => !alreadyUsed(photo)));
        } catch (error) {
          console.warn('[PHOTO FIX90] Openverse', category, error.message);
          if (/429|limit|budżet|przerwa/i.test(error.message)) pausedUntil = Math.max(pausedUntil, Date.now() + 60000);
          state.next = MAX_PAGES_PER_QUERY + 1;
        }
        pageState.set(category, state);
        if (pool.length) continue;
        // If a query's first pass yielded no suitable result, try the alternate query once.
        if (state.next <= MAX_PAGES_PER_QUERY) continue;
      }
      if (!state.commonsTried && Date.now() >= pausedUntil) {
        state.commonsTried = true;
        try { pool.push(...(await commonsSearch(category)).filter(photo => !alreadyUsed(photo))); }
        catch (error) { console.warn('[PHOTO FIX90] Wikimedia Commons', category, error.message); }
        pageState.set(category, state);
        if (pool.length) continue;
      }
      state.exhausted = true; pageState.set(category, state); return null;
    }
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
      console.warn('[PHOTO FIX90] photo source manifest unavailable:', error.message);
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
  function observeImage(img) {
    if (!eligible(img) || scheduled.has(img) || processed.has(img)) return;
    scheduled.add(img);
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
  async function processQueue() {
    if (running) return; running = true;
    try {
      while (queue.length) {
        const img = queue.shift();
        if (!img?.isConnected || img.dataset.photoFix90Assigned) continue;
        const info = nodeInfo(img);
        const saved = assignments.get(info.id);
        if (saved) { applyPhoto(img, saved); continue; }
        if (!navigator.onLine) { restoreFallback(img); continue; }
        let photo = takeSeed(info.category);
        if (!photo) photo = await takeOnline(info.category);
        if (photo) {
          setAssignment(info.id, photo); applyPhoto(img, photo); onlinePhotos++;
        } else {
          restoreFallback(img); failedCount++;
        }
        setStatus();
      }
    } finally { running = false; setStatus(); }
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
        for (const record of records) for (const node of record.addedNodes || []) if (node.nodeType === 1) scan(node);
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
    scan(document);
    if (typeof window.setInterval === 'function') window.setInterval(() => { scan(document); setStatus(); }, 5000);
  }
  function resume() {
    pausedUntil = 0;
    for (const [category, state] of pageState) if (state.exhausted) pageState.set(category, { next: 1, pageCount: MAX_PAGES_PER_QUERY, commonsTried: false, exhausted: false });
    document.querySelectorAll(SELECTOR).forEach(img => {
      if (img.classList.contains('photo-fix90-offline-fallback') || img.dataset.photoFix90State === 'fallback') {
        scheduled.delete(img); processed.delete(img); delete img.dataset.photoFix90Assigned;
        observeImage(img);
        if (observer) { observer.unobserve(img); scheduleImage(img, true); }
      }
    });
    scan(document);
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
    api.photoCatalogEnabled = true;
    api.photoCatalogStats = { onlinePhotos: 0, queued: 0, failed: 0, version: VERSION };
    api.getPhotoCatalogStats = () => ({ onlinePhotos, queued: queue.length, failed: failedCount, slots: document.querySelectorAll(SELECTOR).length, version: VERSION });
    api.getPhotoCatalogAssignment = id => assignments.get(String(id)) || null;
    api.photoCount = onlinePhotos;
    window.NPA_PHOTO_CATALOG_FIX90 = {
      version: VERSION, categoryFor, licenseAllowed, isVramPhotoRelevant, parseOpenverse, nodeInfo, probePhoto,
      photoIdentity, normalizeUrl: canonicalUrl, parseCommons, takeSeed, resume, registerRepairRecords,
      getStats: () => ({ onlinePhotos, queued: queue.length, failed: failedCount, assignments: assignments.size, version: VERSION }),
      isEligibleSelector: SELECTOR
    };
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
