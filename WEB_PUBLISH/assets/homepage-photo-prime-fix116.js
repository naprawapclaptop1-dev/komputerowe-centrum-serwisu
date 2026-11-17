/* NAUKA OD A DO Z 6.8.0 FIX117 — homepage first-render assignment registration.
 * Uses the already-curated, licensed source manifest for the exact 21 homepage slots.
 * No provider API calls; catalog runtime waits for this bootstrap before restoring assignments.
 */
(() => {
  'use strict';
  const VERSION = '6.8.0-fix117-homepage-photo-assignment-registration-20261109';
  const MANIFEST_URL = '/media/photo-sources-online.json?v=6.8.0-fix117';
  const licenseAllowed = value => {
    const s = String(value || '').toLowerCase();
    if (!s || /non.?commercial|\bby-nc\b|\bnc-sa\b|\bnc-nd\b/.test(s)) return false;
    return /pexels license|public domain|cc0|cc by(?:-sa)?(?:\s|$)/i.test(s);
  };
  const abs = value => { try { const u = new URL(String(value || ''), location.href); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } };
  const safeText = value => String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 150);
  const seedIdentity = item => `${String(item.provider || '').toLowerCase()}:${item.id}`;
  const task = (async () => {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    const config = await response.json();
    const byId = new Map((config.photos || []).map(item => [item.id, item]));
    const mapping = config.homepageSlotSeedMap || {};
    const usedIds = new Set();
    const usedUrls = new Set();
    const reserved = Object.create(null);
    const results = { version: VERSION, slots: 0, skipped: [], failed: [], photos: Object.create(null) };
    for (const [slotId, seedId] of Object.entries(mapping)) {
      const img = document.querySelector(`#view-home img[data-photo-id="${CSS.escape(slotId)}"]`);
      if (!img) { results.skipped.push(`${slotId}: image slot missing`); continue; }
      const item = byId.get(seedId);
      if (!item) { results.skipped.push(`${slotId}: curated seed missing`); continue; }
      const src = abs(item.asset), page = abs(item.page), licenseUrl = abs(item.licenseUrl) || page;
      const category = String(item.category || '').trim().toLowerCase();
      const expectedCategory = String(img.dataset.photoKind || '').trim().toLowerCase();
      if (!src || !page || !licenseUrl || !item.author || !licenseAllowed(item.license)
          || !/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(src)
          || (expectedCategory && category !== expectedCategory)
          || usedIds.has(seedId) || usedUrls.has(src)) {
        results.skipped.push(`${slotId}: invalid source, license, category or duplicate`);
        continue;
      }
      usedIds.add(seedId); usedUrls.add(src); reserved[slotId] = seedId;
      // FIX117: give the catalog runtime the complete validated photo record. Merely
      // changing img.src is not enough: the queue would treat the slot as unassigned
      // and could restore its SVG fallback after the provider search returned empty.
      results.photos[slotId] = {
        id: item.id,
        seedId: item.id,
        provider: String(item.provider || 'Pexels'),
        providerId: seedIdentity(item),
        url: src,
        originalUrl: src,
        page,
        author: String(item.author),
        license: String(item.license),
        licenseUrl,
        category,
        title: String(item.topic || img.dataset.photoTitle || ''),
        topic: String(item.topic || ''),
        tags: String(item.tags || ''),
        description: String(item.description || ''),
        alt: String(item.topic || img.dataset.photoTitle || ''),
        hash: ''
      };
      // Keep the original labelled SVG as the honest offline/error fallback.
      const fallback = img.dataset.photoFix90Fallback || img.dataset.fix77Fallback || img.getAttribute('src') || '';
      if (fallback && /\.svg(?:[?#]|$)/i.test(fallback)) img.dataset.photoFix90Fallback = fallback;
      img.dataset.photoFix116Seed = seedId;
      img.dataset.photoFix116ProviderId = seedIdentity(item);
      img.dataset.photoFix90State = 'online-photo-pending';
      img.dataset.photoFix90Loaded = '0';
      img.classList.remove('photo-fix90-offline-fallback');
      img.classList.add('photo-fix90-online');
      img.alt = `${safeText(item.topic || img.dataset.photoTitle || 'Materiał edukacyjny')} — fotografia`;
      img.title = `${safeText(item.topic || '')} · ${safeText(item.author)} · ${safeText(item.license)}`;
      const label = img.parentElement?.querySelector('i');
      if (label) label.textContent = `FOTOGRAFIA ONLINE · ${safeText(item.author).slice(0, 26)} · ${safeText(item.license)}`;
      let credit = Array.from(img.parentElement?.querySelectorAll('.photo-credit-fix90[data-photo-credit-for]') || [])
        .find(node => node.dataset.photoCreditFor === slotId);
      if (!credit && img.parentElement) {
        credit = document.createElement('small');
        credit.className = 'photo-credit-fix90';
        credit.dataset.photoCreditFor = slotId;
        img.parentElement.appendChild(credit);
      }
      if (credit) {
        credit.replaceChildren();
        const author = document.createElement('a'); author.href = page; author.target = '_blank'; author.rel = 'noopener noreferrer'; author.textContent = safeText(item.author);
        const provider = document.createElement('span'); provider.textContent = ` · ${safeText(item.provider || 'Źródło online')}`;
        const license = document.createElement('a'); license.href = licenseUrl; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = ` · ${safeText(item.license)}`;
        credit.append(author, provider, license); credit.hidden = false;
      }
      img.addEventListener('load', () => {
        if (img.naturalWidth >= 320 && img.naturalHeight >= 180) {
          img.dataset.photoFix90Loaded = '1';
          img.dataset.photoFix90State = 'online-photo';
          img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
          img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
        }
      });
      img.src = src;
      if (img.complete && img.naturalWidth >= 320 && img.naturalHeight >= 180) {
        img.dataset.photoFix90Loaded = '1';
        img.dataset.photoFix90State = 'online-photo';
        img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
        img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
      }
      results.slots++;
    }
    window.NPA_HOME_PHOTO_PRIME_FIX117 = { ...results, seedIds: reserved, mappingVersion: config.runtimeBuildTag || config.version || '' };
    // Keep the FIX116 alias for rollback-compatible consumers; FIX117 is canonical.
    window.NPA_HOME_PHOTO_PRIME_FIX116 = window.NPA_HOME_PHOTO_PRIME_FIX117;
    if (results.slots !== 21 || Object.keys(results.photos).length !== 21) console.warn('[PHOTO FIX117] homepage first-render binding incomplete', results);
    else console.info('[PHOTO FIX117] 21 homepage photo records registered before catalog queue', results);
    return window.NPA_HOME_PHOTO_PRIME_FIX117;
  })();
  window.__NPA_HOME_PHOTO_PRIME_PROMISE = task.catch(error => {
    console.warn('[PHOTO FIX117] homepage first-render bootstrap failed; catalog queue will use normal fallback:', error?.message || error);
    window.NPA_HOME_PHOTO_PRIME_FIX116 = { version: VERSION, slots: 0, skipped: [], failed: [String(error?.message || error)] };
    return window.NPA_HOME_PHOTO_PRIME_FIX116;
  });
})();
