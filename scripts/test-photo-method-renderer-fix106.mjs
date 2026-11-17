import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix115.js');
const workshopData = read('WEB_PUBLISH/assets/service-workshop-data.js');
const workshopUi = read('WEB_PUBLISH/assets/service-workshop.js');
const css = read('WEB_PUBLISH/assets/photo-catalog-fix109.css');
const html = read('WEB_PUBLISH/index.html');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const manifest = JSON.parse(read('WEB_PUBLISH/media/photo-sources-online.json'));

const checks = [];
function check(label, fn) { fn(); checks.push(label); console.log(`[PASS] ${label}`); }

class FakeClassList {
  constructor(...values) { this.values = new Set(values); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}
class FakeElement {
  constructor(tag = 'div', { classes = [], rect = { top: 100, bottom: 260, width: 320, height: 160 }, hidden = false } = {}) {
    this.tagName = String(tag).toUpperCase(); this.children = []; this.dataset = {}; this.classList = new FakeClassList(...classes);
    this.style = {}; this.hidden = hidden; this.textContent = ''; this.title = ''; this.attributes = new Map();
    this.parentNode = null; this.parentElement = null; this.isConnected = true; this.rect = { ...rect }; this.events = new Map();
    this.className = classes.join(' '); this.id = '';
  }
  append(...nodes) { for (const node of nodes) { node.parentNode = this; node.parentElement = this; this.children.push(node); } }
  appendChild(node) { this.append(node); return node; }
  prepend(...nodes) { for (const node of nodes) { node.parentNode = this; node.parentElement = this; } this.children.unshift(...nodes); }
  addEventListener(type, callback) { this.events.set(type, callback); }
  setAttribute(key, value) { this.attributes.set(key, String(value)); if (key === 'id') this.id = String(value); }
  getAttribute(key) { if (key === 'id') return this.id; if (key === 'src' && this instanceof FakeImage) return this.src; return this.attributes.get(key) ?? null; }
  getBoundingClientRect() { return this.rect; }
  contains(target) { let node = target; while (node) { if (node === this) return true; node = node.parentElement; } return false; }
  closest(selector) {
    const selectors = String(selector).split(',').map(s => s.trim());
    let node = this;
    while (node) {
      for (const part of selectors) {
        if (part === '.view-section' && node.classList?.contains('view-section')) return node;
        if (part === '[hidden]' && node.hidden) return node;
        if (part.startsWith('.') && node.classList?.contains(part.slice(1))) return node;
        if (part === 'button' && node.tagName === 'BUTTON') return node;
        if (part === '#view-methods' && node.id === 'view-methods') return node;
      }
      node = node.parentElement;
    }
    return null;
  }
  querySelector(selector) {
    if (selector.includes('data-fix90-status-text')) return this.children.find(child => child.dataset?.fix90StatusText === '1') || null;
    return null;
  }
  querySelectorAll(selector) {
    const out = [];
    const walk = node => { for (const child of node.children || []) { if (child instanceof FakeImage) out.push(child); walk(child); } };
    walk(this);
    return out;
  }
}
class FakeImage extends FakeElement {
  constructor(options = {}) { super('img', options); this.alt = options.alt || 'Ilustracja techniczna offline'; this.naturalWidth = 0; this.naturalHeight = 0; this._src = ''; }
  set src(value) { this._src = String(value || ''); }
  get src() { return this._src; }
}

const body = new FakeElement('body');
const methodsView = new FakeElement('section', { classes: ['view-section','active'], rect: { top: 0, bottom: 5000, width: 1200, height: 5000 } });
methodsView.id = 'view-methods';
const hiddenView = new FakeElement('section', { classes: ['view-section'], rect: { top: 0, bottom: 5000, width: 0, height: 0 } });
hiddenView.id = 'view-hidden';
const methodCard = new FakeElement('button', { classes: ['method-card'], rect: { top: 120, bottom: 420, width: 320, height: 300 } });
const visibleMethodImage = new FakeImage({ rect: { top: 120, bottom: 280, width: 320, height: 160 } });
visibleMethodImage.dataset.photoId = 'method:test-visible'; visibleMethodImage.dataset.photoScope = 'workshop-method'; visibleMethodImage.dataset.photoKind = 'storage'; visibleMethodImage.dataset.photoTitle = 'Wymiana dysku NVMe'; visibleMethodImage.src = 'data:image/svg+xml,<svg></svg>';
methodCard.append(visibleMethodImage); methodsView.append(methodCard);
const repairRow = new FakeElement('article', { classes: ['repair-row-photo-wrap'], rect: { top: 450, bottom: 650, width: 320, height: 200 } });
const hiddenRepairImage = new FakeImage({ rect: { top: 0, bottom: 0, width: 0, height: 0 }, hidden: true });
hiddenRepairImage.dataset.photoId = 'repair-card:test-hidden-img'; hiddenRepairImage.dataset.photoScope = 'repair-card'; hiddenRepairImage.dataset.photoKind = 'board'; hiddenRepairImage.dataset.photoTitle = 'Diagnostyka płyty głównej'; hiddenRepairImage.src = 'data:image/svg+xml,<svg></svg>';
repairRow.append(hiddenRepairImage); methodsView.append(repairRow);
const farCard = new FakeElement('button', { classes: ['method-card'], rect: { top: 4300, bottom: 4600, width: 320, height: 300 } });
const farImage = new FakeImage({ rect: { top: 4300, bottom: 4460, width: 320, height: 160 } });
farImage.dataset.photoId = 'method:test-far'; farImage.dataset.photoScope = 'workshop-method'; farImage.dataset.photoKind = 'software'; farImage.dataset.photoTitle = 'Naprawa systemu Windows'; farImage.src = 'data:image/svg+xml,<svg></svg>';
farCard.append(farImage); methodsView.append(farCard);
const hiddenCard = new FakeElement('button', { classes: ['method-card'], rect: { top: 130, bottom: 430, width: 320, height: 300 } });
const hiddenViewImage = new FakeImage({ rect: { top: 130, bottom: 290, width: 320, height: 160 } });
hiddenViewImage.dataset.photoId = 'method:test-hidden-view'; hiddenViewImage.dataset.photoScope = 'workshop-method'; hiddenViewImage.dataset.photoKind = 'network'; hiddenViewImage.dataset.photoTitle = 'Diagnostyka routera'; hiddenViewImage.src = 'data:image/svg+xml,<svg></svg>';
hiddenCard.append(hiddenViewImage); hiddenView.append(hiddenCard);

const retryButton = new FakeElement('button'); retryButton.id = 'methodPhotoRetry';
const statusNode = new FakeElement('div'); statusNode.id = 'photoCatalogFix90Status';
const statusText = new FakeElement('span'); statusText.dataset.fix90StatusText = '1'; statusNode.append(statusText);
body.append(methodsView, hiddenView, statusNode, retryButton);
let observerInstance = null;
class FakeIntersectionObserver {
  constructor(callback) { this.callback = callback; this.observed = new Set(); observerInstance = this; }
  observe(target) { this.observed.add(target); }
  unobserve(target) { this.observed.delete(target); }
  disconnect() { this.observed.clear(); }
}
let mutationCallback = null;
class FakeMutationObserver {
  constructor(callback) { mutationCallback = callback; }
  observe() {}
  disconnect() {}
}
const document = {
  readyState: 'complete', body, documentElement: new FakeElement('html', { rect: { top: 0, bottom: 900, width: 1500, height: 900 } }),
  addEventListener() {},
  getElementById(id) { return ({ methodPhotoRetry: retryButton, photoCatalogFix90Status: statusNode })[id] || null; },
  querySelector(selector) { if (selector === '.view-section.active') return methodsView; if (selector === '#view-home') return null; return null; },
  querySelectorAll() { return [visibleMethodImage, hiddenRepairImage, farImage, hiddenViewImage]; },
  createElement(tag) { return new FakeElement(tag); }
};
const stored = new Map();
const localStorage = { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
const window = { ACADEMY_ART: {}, innerHeight: 900, MutationObserver: FakeMutationObserver, IntersectionObserver: FakeIntersectionObserver, addEventListener() {}, setInterval() { return 1; } };
const fetch = async url => String(url).includes('photo-sources-online.json')
  ? { ok: true, status: 200, json: async () => manifest }
  : { ok: false, status: 404, json: async () => ({}) };
const context = {
  window, document, localStorage, navigator: { onLine: false }, location: { href: 'https://academy.example/?view=methods' },
  URL, URLSearchParams, Date, Map, Set, Array, String, Number, Math, Object, JSON, RegExp, Promise,
  Float64Array, encodeURIComponent, decodeURIComponent, setTimeout, clearTimeout, fetch,
  HTMLImageElement: FakeImage, IntersectionObserver: FakeIntersectionObserver, MutationObserver: FakeMutationObserver,
  console: { info() {}, warn() {}, error() {} }
};
vm.runInNewContext(runtime, context, { filename: 'photo-catalog-fix115.js', timeout: 10000 });
const api = window.NPA_PHOTO_CATALOG_FIX111;
assert.ok(api, 'FIX106 runtime API booted');
await new Promise(resolve => setTimeout(resolve, 0));

const dataWindow = {};
vm.runInNewContext(workshopData, { window: dataWindow }, { filename: 'service-workshop-data.js', timeout: 10000 });
const methods = dataWindow.ACADEMY_REPAIR_METHODS || [];

check('147 kart metod ma indywidualną kategorię ustaloną z tytułu, z szerokim rozkładem tematów', () => {
  assert.equal(methods.length, 147);
  const mapped = methods.map(method => api.methodCategoryFor(method));
  assert.equal(mapped.length, 147);
  assert.ok(mapped.every(category => typeof category === 'string' && category.length > 0));
  const counts = new Map(); for (const category of mapped) counts.set(category, (counts.get(category) || 0) + 1);
  assert.ok(counts.size >= 15, `expected at least 15 dedicated topics; got ${[...counts.keys()].join(', ')}`);
  for (const category of ['display','network','bios','cooling','ram','storage','battery','audio','power','electronics','solder','vram','cpu','laptop','safety']) assert.ok(counts.get(category) > 0, `${category} has real method coverage`);
});
check('Polskie znaki, odmiany i precyzyjne tytuły kierują do właściwych grup zdjęć', () => {
  assert.equal(api.methodCategoryFor({ name: 'Czyszczenie radiatora i wentylatora', category: 'Bez wymiany części' }), 'cooling');
  assert.equal(api.methodCategoryFor({ name: 'Test pamięci według modułu i slotu', category: 'Bez wymiany części' }), 'ram');
  assert.equal(api.methodCategoryFor({ name: 'Wymiana baterii', category: 'Naprawy modułowe PC' }), 'battery');
  assert.equal(api.methodCategoryFor({ name: 'Wymiana karty rozszerzeń i kontrolera', category: 'Naprawy modułowe PC' }), 'electronics');
  assert.equal(api.methodCategoryFor({ name: 'Diagnostyka sieci Wi‑Fi i routera', category: 'Bez wymiany części' }), 'network');
  assert.equal(api.methodCategoryFor({ name: 'Łączność i peryferia', category: 'Łączność i peryferia' }), 'port');
  assert.equal(api.methodCategoryFor({ name: 'Odzyskiwanie SSD NVMe', category: 'Bez wymiany części', diagnosis: 'BIOS/UEFI GPU RAM' }), 'storage');
  assert.equal(api.methodCategoryFor({ name: 'Kontrola wentylatora', category: 'Bez wymiany części', diagnosis: 'matryca LCD' }), 'cooling');
});
check('Metody używają wyłącznie tytułu i kategorii; tekst diagnozy nie przekierowuje fotografii', () => {
  const item = { name: 'Wymiana dysku SSD', category: 'Bez wymiany części', diagnosis: 'pomiar zasilania, BIOS, wentylator GPU', procedure: 'test pamięci RAM' };
  assert.equal(api.methodCategoryFor(item), 'storage');
  assert.ok(runtime.includes("methodCategoryFor({ category: rawCategory, name: alt })"));
  assert.ok(!runtime.includes('methodCategoryFor({ category: rawCategory, name: alt, diagnosis: parentText })'));
});
check('Renderer tworzy każdy obrazek karty metod z ID, tytułem, kategorią i zakresem', () => {
  assert.ok(workshopUi.includes('const renderMethods='));
  assert.ok(workshopUi.includes('methodCategoryFor?.(x)'));
  assert.ok(workshopUi.includes('data-photo-id="method:${esc(x.id)}"'));
  assert.ok(workshopUi.includes('data-photo-scope="workshop-method"'));
  assert.ok(workshopUi.includes('data-photo-title="${esc(x.name)}"'));
  assert.ok(workshopUi.includes('data-photo-kind="${esc(photoCategory||x.category)}"'));
  assert.ok(workshopUi.includes('queueActivePhotos();'));
});
check('Kolejka zdjęć działa wyłącznie w aktywnym widoku i w obrębie marginesu 1450 px', () => {
  assert.equal(api.isInActiveView(visibleMethodImage), true);
  assert.equal(api.isNearActiveViewport(visibleMethodImage), true);
  assert.equal(api.isInActiveView(hiddenViewImage), false);
  assert.equal(api.isNearActiveViewport(hiddenViewImage), false);
  assert.equal(api.isNearActiveViewport(farImage), false);
  assert.equal(api.queueActiveViewImages(), 3);
});
check('Ukryte IMG w widocznej karcie naprawy bierze pozycję z kontenera, a nie własny zerowy rozmiar', () => {
  assert.equal(api.isInActiveView(hiddenRepairImage), true);
  assert.equal(api.isNearActiveViewport(hiddenRepairImage), true);
  assert.equal(hiddenRepairImage.dataset.photoFix90Fallback, 'data:image/svg+xml,<svg></svg>');
});
check('Zmiana widoku, przewijanie i wymiana zawartości kart uruchamiają ponowne kolejkowanie', () => {
  assert.ok(runtime.includes('function queueActiveViewImages()'));
  assert.ok(runtime.includes('function scheduleActiveViewQueue()'));
  assert.ok(runtime.includes("window.addEventListener?.('scroll', scheduleActiveViewQueue, { passive: true })"));
  assert.ok(runtime.includes("window.addEventListener?.('resize', scheduleActiveViewQueue, { passive: true })"));
  assert.ok(runtime.includes("record.target.classList.contains('active')"));
  assert.ok(mutationCallback);
  assert.ok(observerInstance);
});
check('Limit API, tempo żądań, licencje i globalna unikalność pozostają aktywne', () => {
  assert.ok(runtime.includes('MAX_DAILY_REQUESTS = 180'));
  assert.ok(runtime.includes('OPENVERSE_GAP_MS = 3300'));
  assert.ok(runtime.includes('function photoIdentity(photo)'));
  assert.ok(runtime.includes('function renderedOnlinePhotoCount()'));
  assert.ok(runtime.includes('sameOriginCuratedPhoto'));
  assert.ok(runtime.includes('hamming(old, photo.hash) < 10'));
  assert.ok(runtime.includes('function pruneQueueToActiveView()'));
  assert.ok(manifest.photos.length >= 37);
  assert.ok(manifest.photos.every(p => p.author && p.license && p.licenseUrl && p.page?.startsWith('https://') && (p.sourceAsset ? (p.asset?.startsWith('/media/photos/') && p.sourceAsset.startsWith('https://')) : p.asset?.startsWith('https://'))));
});
check('19 głównych zdjęć ma osobnych właścicieli i nie może zostać skradzionych przez karty metod', () => {
  const allPrimary = Object.entries(api.homeSlotSeedPreferences).map(([slotId, ids]) => [slotId, ids[0]]);
  assert.equal(allPrimary.length, 19);
  assert.equal(new Set(allPrimary.map(([,id]) => id)).size, 19);
  for (const [slotId, seedId] of allPrimary) assert.equal(api.homeSeedOwners.get(seedId), slotId, `${seedId} belongs to ${slotId}`);
  const methodSeed = api.takeSeed('board', 'method:reservation-probe');
  assert.ok(!methodSeed || !api.homeSeedOwners.has(methodSeed.seedId), 'method slot cannot consume a reserved homepage seed');
  for (const [slotId, seedId] of allPrimary) {
    const slot = Object.entries(api.homeSlotSeedPreferences).find(([id]) => id === slotId)[1];
    const seed = manifest.photos.find(p => p.id === slot[0]);
    assert.ok(seed, `primary seed ${seedId} exists`);
    assert.ok(api.licenseAllowed(seed.license));
    assert.equal(api.isPhotoRelevant({ title: seed.topic, tags: seed.tags, description: seed.description }, seed.category), true);
  }
});
check('Przycisk ponawiania jest podpinany także wtedy, gdy istnieje już starszy globalny panel statusu', () => {
  assert.equal(retryButton.dataset.fix106Bound, '1');
  assert.equal(typeof retryButton.events.get('click'), 'function');
  assert.ok(runtime.includes('function bindMethodPhotoRetry()'));
  assert.ok(runtime.includes('bindMethodPhotoRetry();'));
});
check('Widoczny status pokazuje liczbę zdjęć, fallbacków, kolejkę, limity i błędy źródła', () => {
  assert.ok(html.includes('id="methodPhotoQueueStatus"'));
  assert.ok(html.includes('id="methodPhotoQueueStatusText"'));
  assert.ok(html.includes('id="methodPhotoRetry"'));
  assert.ok(css.includes('#view-methods .method-photo-queue-status'));
  assert.ok(runtime.includes('METODY NAPRAW — zdjęcia:'));
  assert.ok(runtime.includes('getMethodPhotoStats'));
});
check('PWA i manifest wskazują aktywny FIX117, 147 metod i jawny handoff renderera', () => {
  assert.equal(release.latestHotfix, 'FIX135');
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix135-home-module-photo-coverage-20261113');
  assert.equal(manifest.runtimeHotfix, 'FIX135');
  assert.equal(manifest.photoQueuePolicy.methodCards, 147);
  assert.equal(manifest.photoQueuePolicy.methodRendererQueueHandoff, true);
  assert.equal(manifest.photoQueuePolicy.methodTitleTopicMapping, true);
  assert.ok(read('WEB_PUBLISH/service-worker.js').includes('photo-catalog-fix115.js'));
});

console.log(`FIX106 METHOD PHOTO RENDERER / FIX117 RUNTIME SUMMARY: ${checks.length}/${checks.length} PASS`);
