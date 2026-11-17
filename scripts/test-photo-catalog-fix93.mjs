import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix93.js');
const css = read('WEB_PUBLISH/assets/photo-catalog-fix93.css');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const one = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));
const checks = [];
async function check(label, fn) { await fn(); checks.push(label); console.log(`[PASS] ${label}`); }

await check('FIX93 jest aktywnym runtime katalogu fotografii online i zachowuje bazę produktu 6.8.0', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.latestHotfix, 'FIX93');
  assert.equal(manifest.hotfix, 'FIX93');
  assert.equal(release.photoCatalog.legacyGuardCompatibility.includes('FIX93_CATALOG_IMAGE_ERROR_OWNER'), true);
  assert.equal(release.photoCatalog.displayedPhotoCounter.includes('naturalWidth'), true);
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix93-online-photo-guard-and-fast-render-20261107');
  assert.equal(release.photoCatalog.searchLimits.openverseQueryVariantsPerCategory, 3);
  assert.equal(release.photoCatalog.fullCatalogQueue, true);
  assert.equal(release.photoCatalog.homepagePrioritySlots, 21);
  assert.ok(runtime.includes('#view-home .np30-module-photo img'), 'all homepage module cards must be queued even before a photo id exists');
  assert.equal(release.photoCatalog.automaticTransientRetry, true);
  assert.equal(manifest.dynamicProvider.fullCatalogQueue, true);
  assert.equal(manifest.dynamicProvider.licenseNormalization, true);
  assert.equal(manifest.dynamicProvider.legacyExhaustedPageStateRecovery, true);
  assert.equal(release.photoCatalog.searchLimits.openversePagesPerQuery, 3);
  assert.equal(release.photoCatalog.searchLimits.commonsQueryVariantsPerCategory, 3);
  assert.equal(release.photoCatalog.searchLimits.openverseDailyRequestBudget, manifest.dynamicProvider.dailyAnonymousRequestBudget);
  assert.ok(!manifest.uniqueRepairPhotoPolicy.licenseFilter.includes('CC BY-ND'), 'manifest must not claim a license the runtime rejects');
  assert.match(release.photoCatalog.searchBehavior, /three broad, category-specific Openverse queries/i);
  assert.equal(manifest.onlinePhotoRuntime, 'assets/photo-catalog-fix93.js?v=6.8.0-fix93');
  assert.equal(manifest.dynamicProvider.enabled, true);
  assert.equal(manifest.dynamicProvider.queryVariantsPerCategory, 3);
  assert.equal(manifest.dynamicProvider.maxPagesPerQuery, 3);
  assert.equal(manifest.dynamicProvider.maxCommonsPages, 6);
  assert.equal(manifest.dynamicProvider.commonsQueryVariantsPerCategory, 3);
  assert.equal(manifest.uniqueRepairPhotoPolicy.globalSingleAssignment, true);
});

await check('HTML i Service Worker ładują aktywny runtime FIX93 przed aplikacją i z nowym cache', () => {
  const runtimeIndex = html.indexOf('assets/photo-catalog-fix93.js?v=6.8.0-fix93');
  const appIndex = html.indexOf('assets/app.js?v=6.8.0-fix87-repair-visuals');
  assert.ok(runtimeIndex >= 0 && appIndex > runtimeIndex);
  assert.ok(html.includes('assets/photo-catalog-fix93.css?v=6.8.0-fix93'));
  assert.ok(sw.includes('nauka-6.8.0-fix93-online-photo-guard-render-20261107'));
  assert.ok(sw.includes("'/assets/photo-catalog-fix93.js?v=6.8.0-fix93'"));
  assert.ok(sw.includes("'/assets/photo-catalog-fix93.css?v=6.8.0-fix93'"));
  assert.ok(sw.includes("'/media/photo-sources-online.json'"));
});

await check('Openverse URL zawsze wysyła jawny numer strony oraz zapytanie kategorii', () => {
  assert.ok(runtime.includes("page: String(Math.max(1, Math.floor(Number(page) || 1)))"));
  assert.ok(runtime.includes("category: 'photograph'"));
  assert.ok(runtime.includes("license_type: 'commercial'"));
  assert.ok(runtime.includes('function buildOpenverseUrl(category, page, queryText = \'\')'));
});

await check('Kategorie mają trzy szersze frazy wyszukiwania zdjęć; limity są spójne z release.json', () => {
  for (const key of ['vram', 'ram', 'gpu', 'cpu', 'board', 'port', 'meter', 'bios', 'cooling']) {
    assert.equal(manifest.dynamicProvider.queryVariantsPerCategory, 3, `${key}: trzy warianty Openverse`);
  }
  assert.ok(runtime.includes("vram: { query: 'GDDR memory'"));
  assert.ok(runtime.includes("ram: { query: 'RAM memory'"));
  assert.ok(runtime.includes("gpu: { query: 'video card'"));
  assert.ok(runtime.includes("board: { query: 'motherboard'"));
  assert.ok(runtime.includes("meter: { query: 'multimeter'"));
  assert.ok(runtime.includes("commons: ['graphics card GDDR', 'GDDR3 memory chip', 'video memory GPU']"));
});

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.dataset = {};
    this.classList = { add() {}, remove() {}, contains() { return false; } };
    this.style = {};
    this.hidden = false;
    this.textContent = '';
    this.title = '';
    this.parentNode = null;
  }
  set innerHTML(value) { this.textContent = String(value || '').replace(/<[^>]*>/g, ' '); }
  get innerText() { return this.textContent; }
  append(...nodes) { for (const node of nodes) { node.parentNode = this; this.children.push(node); } }
  appendChild(node) { node.parentNode = this; this.children.push(node); return node; }
  prepend(...nodes) { this.children.unshift(...nodes); }
  querySelector(selector) { return this.children.find(node => (selector.includes('fix90-status-text') || selector.includes('fix90StatusText')) && node.dataset?.fix90StatusText) || null; }
  querySelectorAll() { return this.children; }
  setAttribute() {}
  addEventListener() {}
  remove() {}
}

let fakeNow = 1_800_000_000_000;
class TestDate extends Date { static now() { fakeNow += 4000; return fakeNow; } }
const openverseRequests = [];
let boardAlternateReturned = false;
const commonsRequests = [];
const daily = new Map();
const fakeManifestResponse = { ok: true, status: 200, json: async () => manifest };
const emptyLocalHashes = { ok: true, status: 200, json: async () => ({ photos: [] }) };
const response = data => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => data });
const photoResult = {
  id: 'fix92-board-photo-unique',
  title: 'Real photograph of computer motherboard repair',
  creator: 'FIX93 Test Photographer',
  license: 'by',
  license_url: 'https://creativecommons.org/licenses/by/4.0/',
  foreign_landing_url: 'https://example.org/photos/fix92-board-photo',
  url: 'https://images.example.org/fix92-board-photo.jpg',
  thumbnail: 'https://images.example.org/fix92-board-photo-thumb.jpg',
  width: 1600,
  height: 1000,
  category: 'photograph',
  tags: [{ name: 'motherboard' }, { name: 'computer repair' }]
};
const photoResult2 = { ...photoResult, id: 'fix92-board-photo-unique-2', title: 'Motherboard circuit board close-up', foreign_landing_url: 'https://example.org/photos/fix92-board-photo-2', url: 'https://images.example.org/fix92-board-photo-2.jpg', thumbnail: 'https://images.example.org/fix92-board-photo-2-thumb.jpg' };
const photoResult3 = { ...photoResult, id: 'fix92-board-photo-unique-3', title: 'Computer motherboard components', foreign_landing_url: 'https://example.org/photos/fix92-board-photo-3', url: 'https://images.example.org/fix92-board-photo-3.jpg', thumbnail: 'https://images.example.org/fix92-board-photo-3-thumb.jpg' };
const fetchMock = async (url) => {
  const target = String(url);
  if (target.includes('photo-sources-online.json')) return fakeManifestResponse;
  if (target.includes('photo-uniqueness-manifest-fix77.json')) return emptyLocalHashes;
  if (target.startsWith('https://api.openverse.org/v1/images/')) {
    const parsed = new URL(target);
    const page = Number(parsed.searchParams.get('page'));
    const query = parsed.searchParams.get('q') || '';
    openverseRequests.push({ page, query, url: target });
    if (query === 'motherboard' && page <= 2) return response({ results: [], page_count: 2, result_count: 40 });
    if (query === 'computer motherboard' && page === 1) return response({ results: [], page_count: 1, result_count: 1 });
    if (query === 'computer circuit board' && !boardAlternateReturned) {
      boardAlternateReturned = true;
      return response({ results: [photoResult, photoResult2, photoResult3], page_count: 1, result_count: 3 });
    }
    return response({ results: [], page_count: 1, result_count: 0 });
  }
  if (target.startsWith('https://commons.wikimedia.org/w/api.php')) {
    const parsed = new URL(target);
    commonsRequests.push({ query: parsed.searchParams.get('gsrsearch') || '', offset: Number(parsed.searchParams.get('gsroffset') || 0) });
    return response({ query: { pages: {} } });
  }
  return response({});
};
const domEvents = {};
const body = new FakeElement('body');
const document = {
  readyState: 'complete',
  body,
  documentElement: new FakeElement('html'),
  addEventListener(name, fn) { domEvents[name] = fn; },
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) { return new FakeElement(tag); }
};
const localStorage = {
  getItem(key) { return daily.get(key) || null; },
  setItem(key, value) { daily.set(key, value); },
  removeItem(key) { daily.delete(key); }
};
const winEvents = {};
const window = { ACADEMY_ART: {}, addEventListener(name, fn) { winEvents[name] = fn; }, setInterval() { return 1; } };
const context = {
  window, document, localStorage, navigator: { onLine: true }, location: { href: 'https://academy.example/' },
  URL, URLSearchParams, Date: TestDate, Map, Set, Array, String, Number, Math, Object, JSON, RegExp, Promise,
  Float64Array, encodeURIComponent, decodeURIComponent, setTimeout, clearTimeout, fetch: fetchMock,
  HTMLImageElement: class HTMLImageElement {},
  console: { info() {}, warn() {}, error() {} }
};
vm.runInNewContext(runtime, context, { filename: 'photo-catalog-fix93.js', timeout: 10000 });
const api = window.NPA_PHOTO_CATALOG_FIX93;
assert.ok(api, 'FIX92 runtime must expose its verification API');
await new Promise(resolve => setTimeout(resolve, 0));

await check('Runtime FIX92 poprawnie klasyfikuje osobno VRAM GDDR/HBM oraz RAM DIMM/SO-DIMM', () => {
  assert.equal(api.categoryFor('VRAM GDDR6 graphics memory BGA'), 'vram');
  assert.equal(api.categoryFor('RAM DDR5 SO-DIMM module'), 'ram');
  assert.equal(api.categoryFor('GPU graphics card PCB'), 'gpu');
  assert.equal(api.categoryFor('CPU processor socket'), 'cpu');
  assert.equal(api.categoryFor('USB-C charging port'), 'port');
  assert.equal(api.categoryFor('digital multimeter voltage measurement'), 'meter');
  assert.equal(api.isVramPhotoRelevant({ title: 'GDDR6 graphics memory BGA package' }), true);
  assert.equal(api.isVramPhotoRelevant({ title: 'DDR5 SO-DIMM system memory module' }), false);
  assert.equal(api.isVramPhotoRelevant({ title: 'Generic memory chip in BGA package' }), false, 'BGA alone does not prove VRAM');
  assert.equal(api.isVramPhotoRelevant({ title: 'GDDR3 video memory chip in BGA package' }), true);
});

await check('Licencje Openverse są normalizowane; zapisane CC CC0 / CC BY / CC BY-SA nie są tracone po odświeżeniu', () => {
  assert.equal(api.normalizeLicense('CC CC0'), 'cc0');
  assert.equal(api.normalizeLicense('CC0 1.0'), 'cc0');
  assert.equal(api.normalizeLicense('CC BY 4.0'), 'by');
  assert.equal(api.normalizeLicense('CC BY-SA 4.0'), 'by-sa');
  assert.equal(api.normalizeLicense('Public Domain Mark 1.0'), 'cc0');
  assert.equal(api.licenseAllowed('CC CC0'), true);
  assert.equal(api.licenseAllowed('CC BY-SA 4.0'), true);
  assert.equal(api.licenseAllowed('CC BY-NC 4.0'), false);
  assert.equal(api.licenseAllowed('CC BY-ND 4.0'), false);
  const cc0 = api.parseOpenverse({ ...photoResult, id: 'fix92-cc0', license: 'cc0', title: 'Motherboard CC0 photograph' }, 'board');
  assert.ok(cc0);
  assert.equal(cc0.license, 'CC0');
});

await check('Parser zdjęć używa oryginalnego URL; VRAM wymaga GDDR/HBM lub jawnego opisu pamięci graficznej, a DIMM i ogólne BGA są odrzucane', () => {
  const goodVram = api.parseOpenverse({ ...photoResult, id: 'vram-good', title: 'GDDR6 graphics memory BGA chips', tags: [{ name: 'GDDR6' }, { name: 'BGA package' }] }, 'vram');
  const dimm = api.parseOpenverse({ ...photoResult, id: 'ram-wrong', title: 'DDR5 SO-DIMM memory module', tags: [{ name: 'SO-DIMM' }] }, 'vram');
  const nonCommercial = api.parseOpenverse({ ...photoResult, id: 'nc-wrong', license: 'by-nc' }, 'board');
  const wrongCategory = api.parseOpenverse({ ...photoResult, id: 'illustration-wrong', category: 'illustration' }, 'board');
  assert.ok(goodVram);
  assert.equal(goodVram.url, photoResult.thumbnail);
  assert.equal(goodVram.originalUrl, photoResult.url);
  assert.equal(dimm, null);
  assert.equal(nonCommercial, null);
  assert.equal(wrongCategory, null);
});

await check('Wikimedia Commons przekazuje opis i kategorie do filtra VRAM, aby wykrywać rzeczywiste kości GDDR', async () => {
  const commonsVram = api.parseCommons({
    pageid: 901, title: 'File:memory-chip-closeup.jpg', imageinfo: [{
      thumburl: 'https://upload.wikimedia.org/vram-chip.jpg', url: 'https://upload.wikimedia.org/vram-chip-original.jpg',
      mime: 'image/jpeg', thumbwidth: 1280, thumbheight: 800,
      extmetadata: {
        LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: 'Test Photographer' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
        ImageDescription: { value: 'GDDR3 video memory chip in BGA package on graphics card PCB' },
        Categories: { value: 'Graphics card memory chips|GDDR3' }
      }
    }]
  }, 'vram');
  const commonsDimm = api.parseCommons({
    pageid: 902, title: 'File:DDR5 SO-DIMM laptop module.jpg', imageinfo: [{
      thumburl: 'https://upload.wikimedia.org/dimm.jpg', mime: 'image/jpeg', thumbwidth: 1280, thumbheight: 800,
      extmetadata: { LicenseShortName: { value: 'CC BY 4.0' }, Artist: { value: 'Test Photographer' }, ImageDescription: { value: 'DDR5 SO-DIMM system RAM module' } }
    }]
  }, 'vram');
  assert.ok(commonsVram);
  assert.match(commonsVram.tags, /GDDR3/i);
  assert.equal(commonsDimm, null);
  await api.commonsSearch('vram', 0, 'graphics card GDDR');
  assert.match(commonsRequests.at(-1).query, /graphics card GDDR/);
});

await check('Paginacja Openverse używa szerokich zapytań kategorii i przechodzi przez strony oraz kolejne frazy', async () => {
  const photo = await api.takeOnline('board');
  assert.ok(photo);
  assert.equal(photo.providerId, 'openverse:fix92-board-photo-unique');
  const boardRequests = openverseRequests.filter(item => ['motherboard', 'computer motherboard', 'computer circuit board'].includes(item.query));
  assert.deepEqual(boardRequests.map(item => [item.query, item.page]), [
    ['motherboard', 1], ['motherboard', 2], ['computer motherboard', 1], ['computer circuit board', 1]
  ]);
  assert.equal(photo.category, 'board');
  assert.equal(photo.url, photoResult.thumbnail);
  assert.equal(photo.originalUrl, photoResult.url);
});

await check('Postęp paginacji i niewykorzystane zdjęcia są zapisywane i odzyskiwane po przeładowaniu runtime', async () => {
  const pageSnapshot = JSON.parse(daily.get(api.storageKeys.pageState) || '{}');
  const poolSnapshot = JSON.parse(daily.get(api.storageKeys.candidatePools) || '{}');
  assert.equal(pageSnapshot.board.queryIndex, 2);
  assert.equal(pageSnapshot.board.page, 2);
  assert.equal(poolSnapshot.board.length, 2);
  let unexpectedNetworkRequests = 0;
  const reloadWindow = { ACADEMY_ART: {}, addEventListener() {}, setInterval() { return 1; } };
  const reloadFetch = async url => {
    const target = String(url);
    if (target.includes('photo-sources-online.json')) return fakeManifestResponse;
    if (target.includes('photo-uniqueness-manifest-fix77.json')) return emptyLocalHashes;
    unexpectedNetworkRequests++;
    throw new Error(`Nieoczekiwane ponowne wyszukiwanie po odświeżeniu: ${target}`);
  };
  const reloadContext = { ...context, window: reloadWindow, fetch: reloadFetch };
  vm.runInNewContext(runtime, reloadContext, { filename: 'photo-catalog-fix93-reloaded.js', timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 0));
  const restoredPhoto = await reloadWindow.NPA_PHOTO_CATALOG_FIX93.takeOnline('board');
  assert.equal(restoredPhoto.providerId, 'openverse:fix92-board-photo-unique-2');
  assert.equal(unexpectedNetworkRequests, 0);
  const poolAfterReload = JSON.parse(daily.get(api.storageKeys.candidatePools) || '{}');
  assert.equal(poolAfterReload.board.length, 1);
});

await check('Bezpośredni test strony 3 i alternatywne frazy potwierdzają prawidłowy URL', async () => {
  const url = new URL(api.buildOpenverseUrl('vram', 3, 'GDDR6 chips BGA'));
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('q'), 'GDDR6 chips BGA');
  assert.equal(url.searchParams.get('category'), 'photograph');
  assert.equal(url.searchParams.get('license_type'), 'commercial');
  assert.equal(api.categorySearchQueries('vram').length, 3);
  assert.equal(api.commonsSearchQueries('vram').length, 3);
  await api.openversePage('vram', 3, 'GDDR6 chips BGA');
  assert.equal(openverseRequests.at(-1).page, 3);
});

await check('Wyczerpana kategoria po kliknięciu Wznów wraca do prawidłowego stanu queryIndex/page', async () => {
  const empty = await api.takeOnline('meter');
  assert.equal(empty, null);
  assert.equal(api.getPageState('meter').exhausted, true);
  await api.resume();
  assert.equal(api.getPageState('meter').queryIndex, 0);
  assert.equal(api.getPageState('meter').page, 1);
  assert.equal(api.getPageState('meter').exhausted, false);
});

await check('Status pokazuje błąd źródła, a katalog nie liczy ilustracji SVG jako fotografii', () => {
  assert.ok(runtime.includes('ŹRÓDŁO ${lastProvider}: ${lastProviderError}'));
  assert.ok(runtime.includes('ilustracja techniczna offline; brak zweryfikowanej fotografii'));
  assert.ok(runtime.includes('photoCatalogStats'));
  assert.ok(runtime.includes('photoFallbackMayRepeatAcrossDifferentRepairs') === false || manifest.uniqueRepairPhotoPolicy.localFallbackMayRepeatAcrossDifferentRepairs === false);
});

await check('Po odświeżeniu runtime odtwarza zapisane fotografie Openverse CC CC0 i zachowuje kolejkę kandydatów', async () => {
  const savedCc0 = {
    url: 'https://images.example.org/fix92-saved-cc0.jpg',
    page: 'https://example.org/photos/fix92-saved-cc0',
    originalUrl: 'https://images.example.org/fix92-saved-cc0.jpg',
    providerId: 'openverse:fix92-saved-cc0', provider: 'Openverse / stocksnap',
    author: 'FIX93 Photographer', license: 'CC CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    title: 'Motherboard photo', tags: 'motherboard computer repair', category: 'board', width: 1600, height: 1000
  };
  const savedCandidate = { url: photoResult2.url, page: photoResult2.foreign_landing_url, originalUrl: photoResult2.url, providerId: 'openverse:fix92-saved-candidate', provider: 'Openverse / test', author: 'FIX93 Test Photographer', license: 'CC CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', title: photoResult2.title, tags: 'motherboard computer repair', category: 'board', width: 1600, height: 1000 };
  daily.set(api.storageKeys.assignments, JSON.stringify({ 'restored-cc0-slot': savedCc0 }));
  daily.set(api.storageKeys.candidatePools, JSON.stringify({ board: [savedCandidate] }));
  const restoreWindow = { ACADEMY_ART: {}, addEventListener() {}, setInterval() {} };
  const restoreFetch = async url => {
    const target = String(url);
    if (target.includes('photo-sources-online.json')) return fakeManifestResponse;
    if (target.includes('photo-uniqueness-manifest-fix77.json')) return emptyLocalHashes;
    throw new Error(`Nieoczekiwane zapytanie sieciowe podczas odtwarzania CC0: ${target}`);
  };
  vm.runInNewContext(runtime, { ...context, window: restoreWindow, fetch: restoreFetch }, { filename: 'photo-catalog-fix93-cc0-restore.js', timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 0));
  const restoredApi = restoreWindow.NPA_PHOTO_CATALOG_FIX93;
  assert.equal(restoreWindow.ACADEMY_ART.getPhotoCatalogAssignment('restored-cc0-slot')?.providerId, 'openverse:fix92-saved-cc0');
  assert.equal(restoreWindow.ACADEMY_ART.getPhotoCatalogAssignment('restored-cc0-slot')?.license, 'CC0');
  const fromPool = await restoredApi.takeOnline('board');
  assert.equal(fromPool.providerId, 'openverse:fix92-saved-candidate');
  assert.equal(fromPool.license, 'CC0');
});


await check('FIX91 exhausted query-state migration reopens categories instead of leaving 1 query and permanent SVG fallbacks', async () => {
  const legacyKey = 'academyPhotoCatalogPageStateFix91';
  daily.delete('academyPhotoCatalogPageStateFix92');
  const legacySnapshot = {
    board: { queryIndex: 3, page: 1, pageCount: 1, queryFailures: 0, retryAt: 0, commonsOffset: 0, commonsPages: 6, commonsQueryIndex: 3, commonsTried: true, commonsHasMore: false, exhausted: true },
    ram: { queryIndex: 2, page: 1, pageCount: 1, queryFailures: 0, retryAt: 0, commonsOffset: 0, commonsPages: 6, commonsQueryIndex: 3, commonsTried: true, commonsHasMore: false, exhausted: true }
  };
  daily.set(legacyKey, JSON.stringify(legacySnapshot));
  const migratedWindow = { ACADEMY_ART: {}, addEventListener() {}, setInterval() {} };
  const migratedFetch = async url => {
    const target = String(url);
    if (target.includes('photo-sources-online.json')) return fakeManifestResponse;
    if (target.includes('photo-uniqueness-manifest-fix77.json')) return emptyLocalHashes;
    throw new Error(`Nieoczekiwane żądanie sieciowe podczas migracji stanu: ${target}`);
  };
  vm.runInNewContext(runtime, { ...context, window: migratedWindow, fetch: migratedFetch }, { filename: 'photo-catalog-fix93-state-migration.js', timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 0));
  const migrated = migratedWindow.NPA_PHOTO_CATALOG_FIX93;
  assert.equal(migrated.storageKeys.legacyPageState, legacyKey);
  assert.equal(migrated.getPageState('board').exhausted, false);
  assert.equal(migrated.getPageState('board').queryIndex, 0);
  assert.equal(migrated.getPageState('ram').exhausted, false);
  assert.equal(migrated.getPageState('ram').commonsQueryIndex, 0);
  const stored = JSON.parse(daily.get(migrated.storageKeys.pageState));
  assert.equal(stored.board.exhausted, false);
  assert.equal(stored.ram.exhausted, false);
});

await check('Runtime kolejkuje cały załadowany katalog, a nagłówek, sześć slajdów i nowe kafelki mają priorytet', () => {
  assert.ok(runtime.includes("const HOME_PRIORITY_SELECTOR = '#view-home .np630-photo-hero img, #view-home .np640-slide > img, #view-home .np30-module-photo img'"));
  assert.ok(runtime.includes('queueHomeFirst(document);'));
  assert.ok(runtime.includes('queueCatalogImages(document);'));
  assert.ok(runtime.includes('queueCatalogImages(node);'));
  assert.ok(runtime.includes("const PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix92'"));
  assert.ok(runtime.includes('LEGACY_PAGE_STATE_KEY'));
  assert.ok(runtime.includes('Old FIX91 exhausted flags were terminal')); 
  assert.ok(runtime.includes('function scheduleQueueRetry(img)'));
  assert.ok(runtime.includes('categoryWaitingForProvider(info.category)'));
  assert.ok(runtime.includes('dailyState().requests >= MAX_DAILY_REQUESTS'));
});

await check('OneClick i Watcher uruchamiają test paginacji przed publikacją', () => {
  assert.ok(one.includes("'scripts/test-photo-catalog-fix93.mjs'"));
  assert.ok(watcher.includes("'scripts/test-photo-catalog-fix93.mjs'"));
  assert.ok(one.includes("photoRegistry.dynamicProvider?.enabled !== true"));
  assert.ok(one.includes("photoRegistry.dynamicProvider?.commonsQueryVariantsPerCategory !== 3"));
  assert.ok(one.includes("photoRegistry.dynamicProvider?.legacyExhaustedPageStateRecovery !== true"));
  assert.ok(watcher.includes("photoSourceManifest.dynamicProvider?.enabled !== true"));
  assert.ok(watcher.includes("photoSourceManifest.dynamicProvider?.legacyExhaustedPageStateRecovery !== true"));
  assert.ok(watcher.includes('LEGACY_PAGE_STATE_KEY'));
  assert.ok(watcher.includes('remotePhotoSources?.dynamicProvider?.commonsQueryVariantsPerCategory === 3'));
  assert.ok(watcher.includes('remotePhotoCatalogValid'));
});

for (const [name, source] of [
  ['photo-catalog-fix93.js', runtime],
  ['ONECLICK_AKADEMIA.js', one],
  ['AUTO_PUBLISH_WATCHER.js', watcher]
]) new Function(source);
console.log('[PASS] Składnia runtime, OneClick i Watchera FIX93: 3/3.');
console.log(`FIX93 PHOTO CATALOG SUMMARY: ${checks.length + 1}/${checks.length + 1} PASS.`);
