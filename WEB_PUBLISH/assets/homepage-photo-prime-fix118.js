/* NAUKA OD A DO Z 6.8.0 — FIX136: keep original curated slot bindings; prioritize the top hero and active slide; lazy-load all other homepage imagery. */
(() => {
  'use strict';
  const VERSION = '6.8.0-fix136-top-photo-priority-practice-lessons-20261114';
  const MANIFEST_URL = '/media/photo-sources-online.json?v=6.8.0-fix135';
  const PHOTO_CACHE_NAME = 'academy-photo-library-fix135';
  const EXPECTED_SLOTS = 19;
  const homePhotoUrls = new Set();
  const allowedLicense = value => {
    const s = String(value || '').trim().toLowerCase();
    if (!s || /non.?commercial|\bby-nc\b|\bnc-sa\b|\bnc-nd\b/.test(s)) return false;
    return /pexels license|public domain|cc0|cc by(?:-sa)?(?:\s|$)/i.test(s);
  };
  const safeUrl = value => {
    try { const u = new URL(String(value || ''), location.href); return u.protocol === 'https:' ? u.href : ''; }
    catch (_) { return ''; }
  };
  const clean = value => String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
  const photoSourceAllowed = value => /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(String(value || ''));
  const topicText = item => [item.topic, item.tags, item.description, item.page, item.sourcePage].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const noHumanSubject = /\b(?:people|person|persons|human|humans|man|woman|men|women|hand|hands|finger|fingers|face|faces|portrait|selfie|teacher|teachers|instructor|instructors|student|students|trainee|technician|technicians|mechanic|mechanics|worker|workers|employee|employees|astronaut|classroom|team|group|staff|operator|child|children|boy|girl|czlowiek|osoba|osoby|rece|dlonie|twarz|mezczyzna|kobieta|uczen|uczniowie|nauczyciel|instruktor|technik|serwisant|pracownik|zespol|dzieci|chlopiec|dziewczynka|astronauta)\b/i;
  const nonPhoto = /\b(?:diagram|flowchart|schematic|infographic|illustration|vector graphic|clip art|logo|icon|poster|screenshot|blueprint|worksheet|presentation slide|topology diagram|mind map|wiring diagram|circuit diagram)\b/i;
  const slotCategory = img => String(img?.dataset?.photoKind || '').trim().toLowerCase();
  const creditFor = (slotId, item, page, licenseUrl) => {
    const img = document.querySelector(`#view-home img[data-photo-id="${CSS.escape(slotId)}"]`);
    const wrapper = img?.parentElement;
    if (!wrapper) return;
    let credit = wrapper.querySelector(`.photo-credit-fix118[data-photo-credit-for="${CSS.escape(slotId)}"]`);
    if (!credit) {
      credit = document.createElement('small');
      credit.className = 'photo-credit-fix118';
      credit.dataset.photoCreditFor = slotId;
      wrapper.appendChild(credit);
    }
    credit.replaceChildren();
    const author = document.createElement('a');
    author.href = page; author.target = '_blank'; author.rel = 'noopener noreferrer'; author.textContent = clean(item.author);
    const provider = document.createElement('span'); provider.textContent = ` · ${clean(item.provider || 'Źródło')}`;
    const license = document.createElement('a');
    license.href = licenseUrl; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = ` · ${clean(item.license)}`;
    credit.append(author, provider, license);
    credit.hidden = true;
  };
  async function photoCacheStats() {
    if (homePhotoUrls.size === 0) return { available: true, cached: 0, homepageCached: 0, homepageTotal: 0, cacheName: PHOTO_CACHE_NAME, mode: 'equipment-photo-cache' };
    try {
      if (!('caches' in window)) return { available: false, cached: 0, homepageCached: 0, homepageTotal: homePhotoUrls.size };
      const cache = await caches.open(PHOTO_CACHE_NAME);
      const keys = await cache.keys();
      const cachedUrls = new Set(keys.map(request => { try { return new URL(request.url).href; } catch (_) { return ''; } }));
      const homepageCached = Array.from(homePhotoUrls).filter(url => cachedUrls.has(url)).length;
      return { available: true, cached: keys.length, homepageCached, homepageTotal: homePhotoUrls.size, cacheName: PHOTO_CACHE_NAME };
    } catch (error) { return { available: false, cached: 0, error: String(error?.message || error) }; }
  }
  function collectStats() {
    const images = Array.from(document.querySelectorAll('#view-home img[data-photo-id]'));
    const assigned = images.filter(img => Boolean(img.dataset.photoFix118Seed));
    const loaded = assigned.filter(img => img.dataset.photoFix90Loaded === '1' && img.naturalWidth >= 320 && img.naturalHeight >= 180);
    const pending = assigned.filter(img => !loaded.includes(img) && (img.dataset.photoFix90State === 'online-photo-pending' || (!img.complete && img.dataset.photoFix118Asset)));
    const fallback = assigned.filter(img => !loaded.includes(img) && !pending.includes(img));
    return {
      version: VERSION,
      mode: 'curated-equipment-photographs-with-local-svg-fallback',
      total: EXPECTED_SLOTS,
      tracked: assigned.length,
      loaded: loaded.length,
      fallback: fallback.length,
      pending: pending.length,
      uniqueSeeds: new Set(assigned.map(img => img.dataset.photoFix118Seed)).size,
      allHomepageImages: images.length
    };
  }

  const task = (async () => {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    const manifest = await response.json();
    const byId = new Map((manifest.photos || []).map(item => [item.id, item]));
    const mapping = manifest.homepageSlotSeedMap || {};
    const usedIds = new Set();
    const usedUrls = new Set();
    const slots = Object.create(null);
    const photos = Object.create(null);
    const results = { version: VERSION, slots: 0, skipped: [], failed: [], cacheName: PHOTO_CACHE_NAME };
    for (const [slotId, seedId] of Object.entries(mapping)) {
      const img = document.querySelector(`#view-home img[data-photo-id="${CSS.escape(slotId)}"]`);
      if (!img) { results.skipped.push(`${slotId}: missing HTML slot`); continue; }
      if (img.dataset.photoIgnore === 'true' || img.dataset.photoEligible === 'false') {
        results.skipped.push(`${slotId}: explicitly excluded by the page`);
        continue;
      }
      const item = byId.get(seedId);
      if (!item) { results.skipped.push(`${slotId}: missing seed ${seedId}`); continue; }
      const src = safeUrl(item.asset), page = safeUrl(item.page), licenseUrl = safeUrl(item.licenseUrl) || page;
      const category = String(item.category || '').trim().toLowerCase();
      const expected = slotCategory(img);
      const text = topicText(item);
      if (!src || !page || !licenseUrl || !item.author || !allowedLicense(item.license) || !photoSourceAllowed(src)
          || (expected && category !== expected) || nonPhoto.test(text) || noHumanSubject.test(text) || usedIds.has(seedId) || usedUrls.has(src)) {
        results.skipped.push(`${slotId}: rejected by URL/license/topic/media/unique validation`);
        continue;
      }
      usedIds.add(seedId); usedUrls.add(src); homePhotoUrls.add(src); slots[slotId] = seedId;
      const fallback = img.dataset.photoFix90Fallback || img.dataset.fix77Fallback || img.getAttribute('src') || '';
      if (fallback && /\.svg(?:[?#]|$)/i.test(fallback)) img.dataset.photoFix90Fallback = fallback.startsWith('/') ? fallback : `/${fallback}`;
      img.dataset.photoFix118Seed = seedId;
      img.dataset.photoFix118Asset = src;
      img.dataset.photoFix118Cache = PHOTO_CACHE_NAME;
      img.dataset.photoFix90State = 'online-photo-pending';
      img.dataset.photoFix90Loaded = '0';
      img.classList.remove('photo-fix90-offline-fallback');
      img.classList.add('photo-fix90-online');
      img.alt = `${clean(item.topic || img.dataset.photoTitle || 'Materiał edukacyjny')} — fotografia`;
      // FIX136: only the three hero images and the currently active slide are urgent.
      // All module/specialist cards and inactive slides keep their exact bindings and load lazily.
      const inHero = Boolean(img.closest('.np630-photo-hero'));
      const slide = img.closest('.np640-slide');
      const activeSlide = Boolean(slide && slide.classList.contains('is-active'));
      const topPriority = inHero || activeSlide;
      img.loading = topPriority ? 'eager' : 'lazy';
      img.fetchPriority = topPriority ? 'high' : 'low';
      img.decoding = 'async';
      img.title = `${clean(item.topic || '')} · ${clean(item.author)} · ${clean(item.license)}`;
      const label = img.parentElement?.querySelector('i');
      if (label) label.textContent = 'ZDJĘCIE SPRZĘTU · ŁADOWANIE…';
      // FIX131: attribution is rendered by the catalog only after the raster image decodes.
      img.addEventListener('error', () => {
        img.dataset.photoFix90State = 'fallback'; img.dataset.photoFix90Loaded = '0';
        const failedLabel = img.parentElement?.querySelector('i');
        if (failedLabel) failedLabel.textContent = 'ILUSTRACJA TECHNICZNA · ZDJĘCIE NIEDOSTĘPNE';
        const attribution = img.parentElement?.querySelector(`.photo-credit-fix118[data-photo-credit-for="${CSS.escape(slotId)}"]`);
        if (attribution) attribution.hidden = true;
        renderAudit();
      });
      img.addEventListener('load', () => {
        if (img.naturalWidth >= 320 && img.naturalHeight >= 180) {
          img.dataset.photoFix90Loaded = '1';
          img.dataset.photoFix90State = 'online-photo';
          img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
          img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
          const loadedLabel = img.parentElement?.querySelector('i');
          if (loadedLabel) loadedLabel.textContent = `FOTOGRAFIA SPRZĘTU · ${clean(item.author).slice(0, 26)} · ${clean(item.license)}`;
          const attribution = img.parentElement?.querySelector(`.photo-credit-fix118[data-photo-credit-for="${CSS.escape(slotId)}"]`);
          if (attribution) attribution.hidden = false;
        }
        renderAudit();
      });
      // HTML already contains this same source. Re-assert it only if an older cache/runtime changed it.
      if (String(img.getAttribute('src') || '') !== src) img.src = src;
      if (img.complete && img.naturalWidth >= 320 && img.naturalHeight >= 180) {
        img.dataset.photoFix90Loaded = '1';
        img.dataset.photoFix90State = 'online-photo';
        img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
        img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
      }
      photos[slotId] = {
        id: item.id, seedId: item.id, provider: String(item.provider || 'Source'),
        providerId: `${String(item.provider || '').toLowerCase()}:${item.id}`,
        url: src, originalUrl: safeUrl(item.sourceAsset) || src, page,
        author: String(item.author), license: String(item.license), licenseUrl,
        category, title: String(item.topic || ''), topic: String(item.topic || ''),
        tags: String(item.tags || ''), description: String(item.description || ''), alt: String(item.topic || ''), hash: ''
      };
      results.slots++;
    }
    const prime = { ...results, seedIds: slots, photos, mappingVersion: manifest.runtimeBuildTag || manifest.version || '' };
    window.NPA_HOME_PHOTO_PRIME_FIX118 = prime;
    window.NPA_HOME_PHOTO_PRIME_FIX117 = prime;
    window.NPA_HOME_PHOTO_PRIME_FIX116 = prime;
    window.NPA_HOME_PHOTO_PRIME_REGISTERED_FIX118 = 0;
    window.NPA_HOME_PHOTO_LIBRARY_FIX118 = {
      version: VERSION, cacheName: PHOTO_CACHE_NAME, manifestVersion: prime.mappingVersion,
      getStats: collectStats, getCacheStats: photoCacheStats, photoCacheName: PHOTO_CACHE_NAME,
      retry: () => {
        for (const img of document.querySelectorAll('#view-home img[data-photo-fix118-seed]')) {
          const src = img.dataset.photoFix118Asset;
          if (src && (img.dataset.photoFix90State === 'fallback' || /\.svg(?:[?#]|$)/i.test(img.currentSrc || img.src))) {
            img.dataset.photoFix90State = 'online-photo-pending';
            img.dataset.photoFix90Loaded = '0';
            img.src = src;
          }
        }
        renderAudit();
        return collectStats();
      }
    };
    renderAudit();
    const status = document.getElementById('np77PhotoAudit');
    if (status) { const stats = collectStats(); status.textContent = `FIX131: ${stats.loaded}/${stats.total} prawdziwych zdjęć sprzętu · ${stats.fallback} ilustracji awaryjnych · ${stats.pending} wczytywanych · filtr bez osób i dłoni`; status.dataset.state = 'ok'; }
    console.info('[FIX131] homepage equipment photo library', collectStats());
    return prime;
  })();
  function renderAudit() {
    const panel = document.getElementById('photoLibraryFix118');
    if (!panel) return;
    const stats = collectStats();
    const summary = panel.querySelector('[data-photo-library-summary]');
    if (summary) summary.textContent = `${stats.loaded}/${stats.total} prawdziwych zdjęć sprzętu · ${stats.fallback} ilustracji awaryjnych · ${stats.pending} wczytywanych`;
    const cacheLabel = panel.querySelector('[data-photo-library-cache]');
    if (cacheLabel) photoCacheStats().then(cache => { cacheLabel.textContent = cache.available ? `Zdjęcia offline: ${cache.homepageCached || 0}/${cache.homepageTotal || 0}` : 'Pamięć zdjęć offline: niedostępna'; }).catch(() => {});
    const list = panel.querySelector('[data-photo-library-list]');
    if (list) {
      list.replaceChildren();
      for (const img of document.querySelectorAll('#view-home img[data-photo-id]')) {
        const row = document.createElement('li');
        if (!img.dataset.photoFix118Seed) continue;
        const name = img.dataset.photoTitle || img.alt || img.dataset.photoId;
        const ok = img.dataset.photoFix90Loaded === '1' && img.naturalWidth >= 320 && img.naturalHeight >= 180;
        row.textContent = `${clean(name)} — ${ok ? 'FOTOGRAFIA SPRZĘTU' : 'ILUSTRACJA ZASTĘPCZA / OCZEKUJE'}`;
        row.dataset.status = ok ? 'photo' : 'fallback';
        list.appendChild(row);
      }
    }
  }
  window.__NPA_HOME_PHOTO_PRIME_PROMISE = task.catch(error => {
    console.warn('[PHOTO FIX131] photo manifest/bootstrap failed; local offline illustrations remain available:', error?.message || error);
    const fail = { version: VERSION, slots: 0, skipped: [], failed: [String(error?.message || error)], seedIds: {}, photos: {} };
    window.NPA_HOME_PHOTO_PRIME_FIX118 = fail;
    window.NPA_HOME_PHOTO_PRIME_FIX117 = fail;
    window.NPA_HOME_PHOTO_PRIME_FIX116 = fail;
    return fail;
  });
  document.addEventListener('click', event => {
    if (event.target.closest('#photoLibraryRetryFix118')) {
      event.preventDefault();
      window.NPA_HOME_PHOTO_LIBRARY_FIX118?.retry?.();
    }
  });
  window.addEventListener('load', renderAudit, { once: true });
  window.addEventListener('scroll', () => { if (window.__npaFix118AuditPending) return; window.__npaFix118AuditPending = true; setTimeout(() => { window.__npaFix118AuditPending = false; renderAudit(); }, 160); }, { passive: true });
})();
