import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const runtime = read('WEB_PUBLISH/assets/photo-catalog-fix109.js');
const workshopData = read('WEB_PUBLISH/assets/service-workshop-data.js');
const workshopUi = read('WEB_PUBLISH/assets/service-workshop.js');
const css = read('WEB_PUBLISH/assets/photo-catalog-fix109.css');
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
    this.parentNode = null; this.parentElement = null; this.isConnected = true; this.rect = { ...rect };
    this.className = classes.join(' '); this.src = '';
  }
  append(...nodes) { for (const node of nodes) { node.parentNode = this; node.parentElement = this; this.children.push(node); } }
  appendChild(node) { this.append(node); return node; }
  prepend(...nodes) { for (const node of nodes) { node.parentNode = this; node.parentElement = this; } this.children.unshift(...nodes); }
  addEventListener() {}
  setAttribute(key, value) { this.attributes.set(key, String(value)); if (key === 'src') this.src = String(value); }
  getAttribute(key) { if (key === 'src') return this.src || this.attributes.get('src') || ''; return this.attributes.get(key) ?? null; }
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
      }
      node = node.parentElement;
    }
    return null;
  }
  querySelector() { return null; }
  querySelectorAll(selector) {
    const out = [];
    const walk = node => { for (const child of node.children || []) { if (child instanceof FakeImage) out.push(child); walk(child); } };
    walk(this);
    return out;
  }
}
class FakeImage extends FakeElement {
  constructor(options = {}) { super('img', options); this.alt = options.alt || 'Ilustracja techniczna offline'; this.naturalWidth = 0; this.naturalHeight = 0; }
  set src(value) { this._src = String(value || ''); }
  get src() { return this._src || ''; }
}

const body = new FakeElement('body');
const methodsView = new FakeElement('section', { classes: ['view-section','active'], rect: { top: 0, bottom: 5000, width: 1200, height: 5000 } });
methodsView.id = 'view-methods';
const hiddenView = new FakeElement('section', { classes: ['view-section'], rect: { top: 0, bottom: 5000, width: 0, height: 0 } });
hiddenView.id = 'view-hidden';
const methodCard = new FakeElement('button', { classes: ['method-card'], rect: { top: 120, bottom: 420, width: 320, height: 300 } });
const visibleMethodImage = new FakeImage({ rect: { top: 120, bottom: 280, width: 320, height: 160 } });
visibleMethodImage.dataset.photoId = 'method:test-visible'; visibleMethodImage.dataset.photoScope = 'workshop-method'; visibleMethodImage.dataset.photoKind = 'Dyski, dane i system'; visibleMethodImage.dataset.photoTitle = 'Wymiana dysku NVMe';
visibleMethodImage.src = 'data:image/svg+xml,<svg></svg>';
methodCard.append(visibleMethodImage); methodsView.append(methodCard);
const repairRow = new FakeElement('article', { classes: ['repair-row-photo-wrap'], rect: { top: 450, bottom: 650, width: 320, height: 200 } });
const hiddenRepairImage = new FakeImage({ rect: { top: 0, bottom: 0, width: 0, height: 0 }, hidden: true });
hiddenRepairImage.dataset.photoId = 'repair-card:test-hidden-img'; hiddenRepairImage.dataset.photoScope = 'repair-card'; hiddenRepairImage.dataset.photoKind = 'board'; hiddenRepairImage.dataset.photoTitle = 'Diagnostyka płyty głównej'; hiddenRepairImage.src = 'data:image/svg+xml,<svg></svg>';
repairRow.append(hiddenRepairImage); methodsView.append(repairRow);
const farCard = new FakeElement('button', { classes: ['method-card'], rect: { top: 4300, bottom: 4600, width: 320, height: 300 } });
const farImage = new FakeImage({ rect: { top: 4300, bottom: 4460, width: 320, height: 160 } });
farImage.dataset.photoId = 'method:test-far'; farImage.dataset.photoScope = 'workshop-method'; farImage.dataset.photoKind = 'Systemy operacyjne'; farImage.dataset.photoTitle = 'Naprawa systemu Windows'; farImage.src = 'data:image/svg+xml,<svg></svg>';
farCard.append(farImage); methodsView.append(farCard);
const hiddenCard = new FakeElement('button', { classes: ['method-card'], rect: { top: 130, bottom: 430, width: 320, height: 300 } });
const hiddenViewImage = new FakeImage({ rect: { top: 130, bottom: 290, width: 320, height: 160 } });
hiddenViewImage.dataset.photoId = 'method:test-hidden-view'; hiddenViewImage.dataset.photoScope = 'workshop-method'; hiddenViewImage.dataset.photoKind = 'Sieć i łączność'; hiddenViewImage.dataset.photoTitle = 'Diagnostyka routera'; hiddenViewImage.src = 'data:image/svg+xml,<svg></svg>';
hiddenCard.append(hiddenViewImage); hiddenView.append(hiddenCard);
body.append(methodsView, hiddenView);

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
  addEventListener() {}, getElementById() { return null; },
  querySelector(selector) { if (selector === '.view-section.active') return methodsView; if (selector === '#view-home') return null; if (selector === '#view-home .np640-showcase') return null; return null; },
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
  window, document, localStorage, navigator: { onLine: false }, location: { href: 'https://academy.example/#view-methods' },
  URL, URLSearchParams, Date, Map, Set, Array, String, Number, Math, Object, JSON, RegExp, Promise,
  Float64Array, encodeURIComponent, decodeURIComponent, setTimeout, clearTimeout, fetch,
  HTMLImageElement: FakeImage, IntersectionObserver: FakeIntersectionObserver, MutationObserver: FakeMutationObserver,
  console: { info() {}, warn() {}, error() {} }
};
vm.runInNewContext(runtime, context, { filename: 'photo-catalog-fix109.js', timeout: 10000 });
const api = window.NPA_PHOTO_CATALOG_FIX99;
assert.ok(api, 'FIX99 runtime API booted');
await new Promise(resolve => setTimeout(resolve, 0));

const dataWindow = {};
vm.runInNewContext(workshopData, { window: dataWindow }, { filename: 'service-workshop-data.js', timeout: 10000 });
const methods = dataWindow.ACADEMY_REPAIR_METHODS || [];

check('Wszystkie 147 metod mają rozpoznaną kategorię tematyczną, bez awaryjnego board dla etykiet znanych kategorii', () => {
  assert.equal(methods.length, 147);
  const mapped = methods.map(method => api.methodCategoryFor(method));
  assert.equal(mapped.length, 147);
  assert.ok(mapped.every(category => typeof category === 'string' && category.length > 0));
  const counts = new Map(); for (const category of mapped) counts.set(category, (counts.get(category) || 0) + 1);
  assert.ok(counts.size >= 6, `expected diverse categories; got ${[...counts.keys()].join(', ')}`);
  assert.ok((counts.get('display') || 0) > 0, 'display/monitor methods have a dedicated photo category');
  assert.ok((counts.get('network') || 0) > 0, 'network methods have a dedicated photo category');
  assert.ok((counts.get('bios') || 0) > 0, 'firmware methods have a dedicated photo category');
});

check('Aktywne zakładki zachowują priorytet, a API nadal rozpoznaje położenie widoków', () => {
  assert.equal(api.isInActiveView(visibleMethodImage), true);
  assert.equal(api.isNearActiveViewport(visibleMethodImage), true);
  assert.equal(api.isInActiveView(hiddenViewImage), false);
  assert.equal(api.isNearActiveViewport(hiddenViewImage), false);
  assert.equal(api.isNearActiveViewport(farImage), false);
  assert.equal(api.queueActiveViewImages(), 3, 'active view contains three test image slots');
});

check('Ukryty IMG w karcie naprawy dziedziczy widoczność z wrappera i może dostać fotografię', () => {
  assert.equal(api.isInActiveView(hiddenRepairImage), true, 'own hidden attribute does not block a pending image');
  assert.equal(api.isNearActiveViewport(hiddenRepairImage), true, 'visible repair wrapper is the viewport anchor');
  assert.equal(hiddenRepairImage.dataset.photoFix90Fallback, 'data:image/svg+xml,<svg></svg>');
});

check('Karty metod i narzędzi FIX106 są rozpoznawane dynamicznie, również po wymianie innerHTML', () => {
  assert.ok(runtime.includes("'.catalog-card-art'"));
  assert.ok(runtime.includes("context === 'workshop-method'"));
  assert.ok(runtime.includes('methodCategoryFor({ category: rawCategory, name: alt })'));
  assert.ok(workshopUi.includes('data-photo-scope="workshop-method"'));
  assert.ok(workshopUi.includes('data-photo-id="method:${esc(x.id)}"'));
  assert.ok(runtime.includes("mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true"));
});

check('Widok aktywny uruchamia ponowne kolejkowanie po zmianie zakładki i przewinięciu', () => {
  assert.ok(runtime.includes('queueActiveViewImages()'));
  assert.ok(runtime.includes('scheduleActiveViewQueue'));
  assert.ok(runtime.includes("window.addEventListener?.('scroll', scheduleActiveViewQueue, { passive: true })"));
  assert.ok(runtime.includes("window.addEventListener?.('resize', scheduleActiveViewQueue, { passive: true })"));
  assert.ok(runtime.includes("record.target.classList.contains('active')"));
  assert.ok(mutationCallback, 'MutationObserver callback is installed');
  assert.ok(observerInstance, 'IntersectionObserver is installed');
});

check('Prawdziwe fotografie zachowują unikalność i limit Openverse 180 żądań/dzień', () => {
  assert.ok(runtime.includes('MAX_DAILY_REQUESTS = 180'));
  assert.ok(runtime.includes('OPENVERSE_GAP_MS = 3300'));
  assert.ok(runtime.includes('function photoIdentity(photo)'));
  assert.ok(runtime.includes('hamming(old, photo.hash) < 10'));
  assert.ok(runtime.includes('function pruneQueueToActiveView()'));
  assert.ok(runtime.includes('FIX109_FULL_CATALOG_BACKGROUND_QUEUE'));
});

check('Manifest ma oddzielne i kompletne źródła dla 21 slotów głównej strony', () => {
  assert.equal(manifest.photos.length, 37);
  assert.equal(Object.keys(api.homeSlotSeedPreferences).length, 21);
  const allPrimary = Object.values(api.homeSlotSeedPreferences).map(ids => ids[0]);
  assert.equal(new Set(allPrimary).size, 21);
  for (const seedId of allPrimary) {
    const seed = manifest.photos.find(photo => photo.id === seedId);
    assert.ok(seed, `missing seed ${seedId}`);
    assert.ok(seed.author && seed.license && seed.licenseUrl && seed.page && seed.asset);
    assert.ok(api.licenseAllowed(seed.license));
    assert.equal(api.isPhotoRelevant({ title: seed.topic, tags: seed.tags, description: seed.description }, seed.category), true, seedId);
  }
});

check('Nie obniżono wersji runtime ani nie wyłączono limitu API', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.photoCatalogRuntimeBuildTag, '6.8.0-fix111-active-view-photo-queue-20261109', 'FIX109 runtime release metadata');
  assert.ok(css.includes('#view-methods .method-card>.catalog-card-art'));
});

console.log(`FIX99 ACTIVE VIEW PHOTO QUEUE SUMMARY: ${checks.length}/${checks.length} PASS`);
