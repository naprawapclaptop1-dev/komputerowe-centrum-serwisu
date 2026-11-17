/* NAUKA OD A DO Z 6.8.0 FIX122 — homepage equipment-only artwork guard.
 * All #view-home visuals are local, curated SVG technical illustrations. No human subjects.
 * This runtime prevents legacy photo engines, retries or stale browser state from replacing them.
 */
(() => {
  'use strict';
  const POLICY = 'FIX122_HOME_TECH_ONLY_NO_PEOPLE';
  const SELECTOR = '#view-home img';
  const APPROVED = /^assets\/artwork-fix(?:77|51)\/[a-z0-9-]+\.svg$/i;
  const DEFAULT = 'assets/artwork-fix77/home-card-fallback-01.svg';
  const LOCKED_SOURCES = Object.freeze({"home-tech-01":"assets/artwork-fix77/hero-main.svg","home-tech-02":"assets/artwork-fix77/hero-gpu.svg","home-tech-03":"assets/artwork-fix77/hero-ram.svg","home-tech-04":"assets/artwork-fix77/slide-01.svg","home-tech-05":"assets/artwork-fix77/slide-02.svg","home-tech-06":"assets/artwork-fix77/slide-03.svg","home-tech-07":"assets/artwork-fix77/slide-04.svg","home-tech-08":"assets/artwork-fix77/slide-05.svg","home-tech-09":"assets/artwork-fix77/slide-06.svg","home-tech-10":"assets/artwork-fix77/home-card-fallback-01.svg","home-tech-11":"assets/artwork-fix77/home-card-fallback-02.svg","home-tech-12":"assets/artwork-fix77/home-card-fallback-03.svg","home-tech-13":"assets/artwork-fix77/home-card-fallback-04.svg","home-tech-14":"assets/artwork-fix77/home-card-fallback-05.svg","home-tech-15":"assets/artwork-fix77/home-card-fallback-06.svg","home-tech-16":"assets/artwork-fix77/home-card-fallback-07.svg","home-tech-17":"assets/artwork-fix77/home-card-fallback-08.svg","home-tech-18":"assets/artwork-fix77/home-card-fallback-09.svg","home-tech-19":"assets/artwork-fix77/home-card-fallback-10.svg","home-tech-20":"assets/artwork-fix77/home-card-fallback-11.svg","home-tech-21":"assets/artwork-fix77/home-card-fallback-12.svg","home-tech-22":"assets/artwork-fix77/home-card-fallback-13.svg","home-tech-23":"assets/artwork-fix77/module-14.svg","home-tech-24":"assets/artwork-fix77/module-15.svg","home-tech-25":"assets/artwork-fix77/module-16.svg","home-tech-26":"assets/artwork-fix77/module-17.svg","home-tech-27":"assets/artwork-fix77/module-18.svg","home-tech-28":"assets/artwork-fix77/module-19.svg","home-tech-29":"assets/artwork-fix51/03-laptop-exploded.svg","home-tech-30":"assets/artwork-fix77/feature-bios.svg","home-tech-31":"assets/artwork-fix77/feature-storage.svg","home-tech-32":"assets/artwork-fix77/lesson-04.svg","home-tech-33":"assets/artwork-fix51/15-wifi-network.svg","home-tech-34":"assets/artwork-fix77/feature-ram.svg","home-tech-35":"assets/artwork-fix77/page-illustration-01.svg","home-tech-36":"assets/artwork-fix77/page-illustration-02.svg"});
  const LOCKED_ALTS = Object.freeze({"home-tech-01":"Ilustracja techniczna złącza USB-C i układu zasilania laptopa","home-tech-02":"Ilustracja techniczna karty graficznej i układu chłodzenia","home-tech-03":"Ilustracja techniczna pamięci RAM i modułu M.2","home-tech-04":"Ilustracja techniczna płyty głównej PCB i ścieżek sygnałowych","home-tech-05":"Ilustracja techniczna pomiarów multimetrem i punktów testowych","home-tech-06":"Ilustracja techniczna lutowania i elementów SMD","home-tech-07":"Ilustracja techniczna konstrukcji laptopa i zawiasów","home-tech-08":"Ilustracja techniczna pamięci RAM i dysków SSD","home-tech-09":"Ilustracja techniczna stanowiska diagnostycznego i płyty głównej","home-tech-10":"Ilustracja techniczna diagnostyki płyty i miernika","home-tech-11":"Ilustracja techniczna modułu pamięci RAM","home-tech-12":"Ilustracja techniczna płyty głównej i widoku BoardView","home-tech-13":"Ilustracja techniczna laboratorium elektroniki i lutowania","home-tech-14":"Ilustracja techniczna dokumentacji serwisowej laptopa","home-tech-15":"Ilustracja techniczna diagnostyki układu chłodzenia","home-tech-16":"Ilustracja techniczna ścieżki nauki i kursów","home-tech-17":"Ilustracja techniczna checklist i procedur testowych","home-tech-18":"Ilustracja techniczna modeli płyt i numerów części","home-tech-19":"Ilustracja techniczna materiałów edukacyjnych i wideo","home-tech-20":"Ilustracja techniczna mapy wiedzy i połączeń","home-tech-21":"Ilustracja techniczna asystenta i schematów edukacyjnych","home-tech-22":"Ilustracja techniczna symulatora usterek i egzaminów","home-tech-23":"Ilustracja techniczna laboratorium usterek","home-tech-24":"Ilustracja techniczna symulatora elektroniki","home-tech-25":"Ilustracja techniczna widoku BoardView 3D","home-tech-26":"Ilustracja techniczna kompatybilności modułów RAM","home-tech-27":"Ilustracja techniczna procesu serwisowego komputera","home-tech-28":"Ilustracja techniczna akademii certyfikacji i ścieżek nauki","home-tech-29":"Ilustracja techniczna konstrukcji i podzespołów laptopa","home-tech-30":"Ilustracja techniczna układu BIOS i pamięci firmware","home-tech-31":"Ilustracja techniczna dysków HDD, SSD i NVMe","home-tech-32":"Ilustracja techniczna systemu Windows i diagnostyki komputera","home-tech-33":"Ilustracja techniczna sieci Ethernet i Wi-Fi","home-tech-34":"Ilustracja techniczna procesora, grafiki i pamięci RAM","home-tech-35":"Ilustracja techniczna diagnostyki komputera","home-tech-36":"Ilustracja techniczna CPU, VRM, BIOS i pamięci RAM"});
  const clean = value => String(value || '').trim();
  function safeSource(img) {
    const id = clean(img.dataset.techVisualId || img.getAttribute('data-tech-visual-id'));
    const source = LOCKED_SOURCES[id];
    return source && APPROVED.test(source) ? source : DEFAULT;
  }
  function apply(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const source = safeSource(img);
    const id = clean(img.dataset.techVisualId || img.getAttribute('data-tech-visual-id'));
    if (img.dataset.techVisualSrc !== source) img.dataset.techVisualSrc = source;
    if (img.dataset.techVisualFallback !== source) img.dataset.techVisualFallback = source;
    if (img.dataset.photoIgnore !== 'true') img.dataset.photoIgnore = 'true';
    if (img.dataset.photoEligible !== 'false') img.dataset.photoEligible = 'false';
    if (img.dataset.techVisualPolicy !== POLICY) img.dataset.techVisualPolicy = POLICY;
    img.classList.remove('photo-fix90-online', 'photo-fix90-offline-fallback');
    for (const key of [
      'photoFix118Seed','photoFix118Asset','photoFix118Source','photoFix118License','photoFix118Cache',
      'photoFix90State','photoFix90Assigned','photoFix90Loaded','photoFix90Fallback','fix77Fallback',
      'photoTitle','photoAuthor','photoLicense','photoLicenseUrl','photoSource','photoCredit','photoProvider',
      'photoFix118Seed','photoFix90Fallback','visualUnique'
    ]) delete img.dataset[key];
    for (const attribute of ['data-photo-title','data-photo-author','data-photo-license','data-photo-license-url',
      'data-photo-source','data-photo-credit','data-photo-provider','data-photo-fix118-seed','data-photo-fix90-fallback',
      'data-visual-unique']) img.removeAttribute(attribute);
    img.removeAttribute('title');
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    if (img.getAttribute('src') !== source) img.setAttribute('src', source);
    img.alt = LOCKED_ALTS[id] || 'Ilustracja techniczna komputera, podzespołów i elektroniki';
    return true;
  }
  function scan(root = document) {
    const nodes = [];
    if (root instanceof HTMLImageElement && root.matches(SELECTOR)) nodes.push(root);
    if (root.querySelectorAll) nodes.push(...root.querySelectorAll(SELECTOR));
    nodes.forEach(apply);
    const result = {
      policy: POLICY,
      total: document.querySelectorAll(SELECTOR).length,
      protected: document.querySelectorAll(`${SELECTOR}[data-photo-ignore="true"][data-photo-eligible="false"]`).length,
      localSvg: [...document.querySelectorAll(SELECTOR)].filter(img => APPROVED.test(clean(img.getAttribute('src')))).length
    };
    window.NPA_HOME_TECH_ONLY_FIX122 = result;
    const status = document.getElementById('np77PhotoAudit');
    if (status) {
      status.dataset.state = result.total === result.protected && result.total === result.localSvg ? 'ok' : 'warning';
      status.textContent = `FIX122: ${result.localSvg}/${result.total} lokalnych ilustracji technicznych · bez postaci · bez zdjęć zewnętrznych`;
    }
    const summary = document.querySelector('[data-photo-library-summary]');
    if (summary) summary.textContent = `${result.localSvg}/${result.total} lokalnych ilustracji technicznych · bez postaci`;
    const cache = document.querySelector('[data-photo-library-cache]');
    if (cache) cache.textContent = 'Pliki SVG w projekcie — dostępne offline';
    const list = document.querySelector('[data-photo-library-list]');
    if (list && !list.dataset.fix122Rendered) {
      list.replaceChildren();
      for (const img of document.querySelectorAll(SELECTOR)) {
        const item = document.createElement('li');
        item.textContent = `${img.dataset.techVisualId || 'dodatkowy-element'}: ${img.alt} — LOKALNA ILUSTRACJA SVG`;
        list.appendChild(item);
      }
      list.dataset.fix122Rendered = 'true';
    }
    return result;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
  else scan();
  document.addEventListener('error', event => {
    const img = event.target;
    if (img instanceof HTMLImageElement && img.matches(SELECTOR)) {
      const fallback = safeSource(img);
      if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
    }
  }, true);
  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) apply(record.target);
        for (const node of record.addedNodes || []) if (node.nodeType === 1) scan(node);
      }
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'data-tech-visual-id', 'data-tech-visual-src', 'data-photo-ignore', 'data-photo-eligible'] });
    window.NPA_HOME_TECH_ONLY_OBSERVER_FIX122 = observer;
  }
  document.addEventListener('click', event => {
    if (event.target.closest('#photoLibraryRetryFix118')) {
      event.preventDefault();
      const result = scan();
      const status = document.getElementById('np77PhotoAudit');
      if (status) status.textContent = `FIX122: ponownie sprawdzono ${result.localSvg}/${result.total} lokalnych ilustracji · bez postaci`;
    }
  });
})();
