import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const read = relative => fs.readFileSync(path.join(WEB, relative), 'utf8');
const html = read('index.html');
const gax = read('assets/global-academy-expansion-fix73.js');
const scope = read('assets/master-workshop-630-extension.js');
const sw = read('service-worker.js');
const coreSource = read('assets/electronics-simulator-fix119.js');
const css = read('assets/electronics-simulator-fix119.css');
const release = JSON.parse(read('release.json'));
const manifest = JSON.parse(read('assets/electronics-simulator-fix119-manifest.json'));

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`[PASS] ${name}`); };

const windowStub = {};
vm.runInNewContext(coreSource, { window: windowStub, Object, Number, Math, Set, Array, String });
const core = windowStub.NPA_ELECTRONICS_FIX119;
assert.ok(core, 'FIX119 shared simulator core did not register');

check('kafelki modułów Global Academy są obsługiwane przed ogólnym data-nav', () => {
  const academyRoute = html.indexOf("var academyLaunch = target.closest && target.closest('[data-gax-open]')");
  const genericRoute = html.indexOf("var nav = target.closest && target.closest('.nav-item[data-view], [data-nav]')");
  assert.ok(academyRoute >= 0 && genericRoute > academyRoute);
  for (const token of ['ACADEMY_SHOW_VIEW', 'NPA_GLOBAL_ACADEMY_FIX77', 'openAcademyModule', 'stopImmediatePropagation']) assert.ok(html.includes(token));
});

check('wspólny silnik symulatorów jest załadowany przed modułami korzystającymi z niego', () => {
  const coreTag = html.indexOf('assets/electronics-simulator-fix119.js?v=6.8.0-fix119');
  const workshopTag = html.indexOf('assets/master-workshop-630-extension.js?v=6.8.0-fix119');
  const academyTag = html.indexOf('assets/global-academy-expansion-fix73.js?v=6.8.0-fix119');
  assert.ok(coreTag >= 0 && workshopTag > coreTag && academyTag > coreTag);
  assert.ok(html.includes('assets/electronics-simulator-fix119.css?v=6.8.0-fix119'));
});

check('oscyloskop wylicza poprawny okres i Vpp dla wartości testowych', () => {
  const oneKhz = core.scopeMetrics(1000, 2);
  const fiveKhz = core.scopeMetrics(5000, 3.5);
  assert.ok(Math.abs(oneKhz.periodMs - 1) < 1e-12);
  assert.ok(Math.abs(fiveKhz.periodMs - 0.2) < 1e-12);
  assert.ok(Math.abs(fiveKhz.vppV - 7) < 1e-12);
  assert.equal(fiveKhz.cyclesVisible, 10);
});

check('przebieg SVG zmienia się po zmianie częstotliwości, amplitudy i kształtu', () => {
  const initial = core.buildScopePath(1000, 2, 'sine');
  const faster = core.buildScopePath(5000, 2, 'sine');
  const louder = core.buildScopePath(1000, 3.5, 'sine');
  const square = core.buildScopePath(1000, 2, 'square');
  const triangle = core.buildScopePath(1000, 2, 'triangle');
  for (const pathValue of [initial, faster, louder, square, triangle]) assert.ok(pathValue.length > 1000);
  assert.notEqual(initial, faster, 'frequency must alter waveform path');
  assert.notEqual(initial, louder, 'amplitude must alter waveform path');
  assert.notEqual(initial, square, 'waveform selector must alter waveform path');
  assert.notEqual(square, triangle, 'square and triangle must differ');
});

check('symulator USB-C PD poprawnie przyjmuje profil 9 V / 2 A', () => {
  const result = core.negotiatePd({ voltage: 9, current: 2, sourceCurrentLimit: 3, cableCurrentLimit: 3, orientation: 'normal', ccFault: 'none' });
  assert.equal(result.ok, true);
  assert.equal(result.voltageV, 9);
  assert.equal(result.currentA, 2);
  assert.equal(result.powerW, 18);
  assert.equal(result.activeCc, 'CC1');
});

check('USB-C PD wykrywa przerwanie aktywnej CC i respektuje orientację wtyku', () => {
  const normal = core.negotiatePd({ voltage: 9, current: 2, orientation: 'normal', ccFault: 'cc1' });
  const reversed = core.negotiatePd({ voltage: 9, current: 2, orientation: 'reversed', ccFault: 'cc1' });
  assert.equal(normal.ok, false);
  assert.equal(normal.code, 'CC_NEGOTIATION_FAILED');
  assert.equal(reversed.ok, true);
  assert.match(reversed.warning, /odwróceniu wtyku/i);
});

check('USB-C PD respektuje limity źródła i przewodu E-Marker dla profili stałego napięcia', () => {
  const limited = core.negotiatePd({ voltage: 20, current: 5, sourceCurrentLimit: 5, cableCurrentLimit: 3, orientation: 'normal', ccFault: 'none' });
  const full = core.negotiatePd({ voltage: 20, current: 5, sourceCurrentLimit: 5, cableCurrentLimit: 5, orientation: 'normal', ccFault: 'none' });
  const fifteenVoltFiveAmp = core.negotiatePd({ voltage: 15, current: 5, sourceCurrentLimit: 5, cableCurrentLimit: 5, orientation: 'normal', ccFault: 'none' });
  assert.equal(limited.ok, true);
  assert.equal(limited.currentA, 3);
  assert.equal(limited.powerW, 60);
  assert.equal(limited.limited, true);
  assert.equal(full.currentA, 5);
  assert.equal(full.powerW, 100);
  assert.equal(fifteenVoltFiveAmp.currentA, 5);
  assert.equal(fifteenVoltFiveAmp.powerW, 75);
});

check('nieobsługiwane profile i wartości prądu są odrzucane', () => {
  assert.equal(core.negotiatePd({ voltage: 12, current: 2 }).code, 'UNSUPPORTED_VOLTAGE');
  assert.equal(core.negotiatePd({ voltage: 9, current: 5.5 }).code, 'INVALID_CURRENT');
  assert.equal(core.negotiatePd({ voltage: 9, current: 2, sourceVoltages: [5, 9], orientation: 'normal', ccFault: 'none' }).ok, true);
  assert.equal(core.negotiatePd({ voltage: 15, current: 2, sourceVoltages: [5, 9], orientation: 'normal', ccFault: 'none' }).code, 'PDO_NOT_OFFERED');
});

check('wspólny panel elektroniki zawiera kalkulator, multimetr, PD i szybkie przejścia', () => {
  for (const id of ['gaxOhmForm','gaxMeterRun','gaxPdVoltage','gaxPdCurrent','gaxPdSourceLimit','gaxPdCableLimit','gaxPdOrientation','gaxPdCcFault','gaxPdRun','gaxPdReset','gaxPdResult']) assert.ok(gax.includes(id), `missing ${id}`);
  for (const route of ['scope','sequence','faultlab','thermal','microscope','soldering','schematic','servicesim']) assert.ok(gax.includes(`data-gax-launch="${route}"`), `missing launcher ${route}`);
  assert.ok(gax.includes('negotiatePd'));
});

check('oscyloskop ma kontrolę wymaganych elementów i zapisuje aktualne dane przebiegu', () => {
  for (const token of ['n63ScopeFreq','n63ScopeAmp','n63ScopeWave','n63ScopeTrace','n63ScopeTimebase','NPA_ELECTRONICS_FIX119','trace.dataset.frequency','trace.dataset.amplitude','addEventListener(\'change\',update)']) assert.ok(scope.includes(token), `missing ${token}`);
  assert.ok(!scope.includes('const phase=(i/720)*Math.PI*4'), 'legacy fixed-cycle waveform remains');
});

check('wszystkie panele ćwiczeń weryfikują elementy DOM przed podpięciem zdarzeń', () => {
  const knowledge = fs.readFileSync(path.join(ROOT, 'WEB_PUBLISH/assets/knowledge-suite-fix43.js'), 'utf8');
  for (const token of ["if(!$('n63ThermalScene')||!$('n63ThermalMap')", "if(!$('n63MicroscopeFile')||!$('n63MicroscopeZoom')", "if(!$('n63SolderGrade')||!$('n63SolderScore')", "if(!$('n63SchematicDetail')||!$('n63ExportSchematic')"]) assert.ok(scope.includes(token), token);
  for (const token of ['!select||!brief||!steps||!save||!reset||!faultStatus', '!pdControlsReady']) assert.ok(gax.includes(token), token);
  assert.ok(knowledge.includes('!resultNode||!historyNode'));
});

check('kalkulator i multimetr mają odporne podpięcie zdarzeń', () => {
  assert.ok(gax.includes("if(ohmForm&&ohmResult)ohmForm.addEventListener('submit'"));
  assert.ok(gax.includes('if(meterRun&&meterMode&&meterScenario&&meterReadout)meterRun.addEventListener'));
  assert.ok(gax.includes('if(pdControlsReady){pdRun.addEventListener'));
});

check('Service Worker zawiera FIX119, zachowując pamięć biblioteki zdjęć FIX118', () => {
  assert.ok(sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix135-home-module-photo-coverage-20261113'"));
  assert.ok(!sw.includes('const PHOTO_LIBRARY_CACHE_NAME')); assert.ok(sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'")); assert.ok(sw.includes('isCuratedPhotoHost')); assert.ok(!sw.includes('FIX123_LOCAL_IMAGE_FALLBACK'));
  assert.ok(sw.includes('const exact = await cache.match(request);'));
  assert.ok(sw.indexOf('const exact = await cache.match(request);') < sw.indexOf('const cached = exact || await cache.match(request, {ignoreSearch:true});'));
  assert.ok(sw.includes('electronics-simulator-fix119-manifest.json'));
  for (const asset of ['electronics-simulator-fix119.js?v=6.8.0-fix119','electronics-simulator-fix119.css?v=6.8.0-fix119','master-workshop-630-extension.js?v=6.8.0-fix119','global-academy-expansion-fix73.js?v=6.8.0-fix119']) assert.ok(sw.includes(asset), `SW core missing ${asset}`);
});

check('manifest i release.json wskazują FIX119 bez zmiany wersji produktu', () => {
  assert.equal(release.productVersion, '6.8.0');
  assert.equal(release.version, '6.8.0-fix129-equipment-only-photo-recovery-20261113');
  assert.equal(release.latestHotfix, 'FIX135');
  assert.equal(release.fix118_local_photo_library.serviceWorkerCacheName, 'nauka-6.8.0-fix135-home-module-photo-coverage-20261113');
  assert.equal(release.fix119_electronics_simulators.hotfix, 'FIX119');
  assert.equal(manifest.hotfix, 'FIX119');
  assert.equal(manifest.productVersion, '6.8.0');
  assert.ok(css.includes('.gax-pd-controls') && css.includes('.gax-launch-grid') && css.includes('@media(max-width:600px)'));
});

console.log(`ELECTRONICS SIMULATORS FIX119: ${passed}/${passed} PASS`);
