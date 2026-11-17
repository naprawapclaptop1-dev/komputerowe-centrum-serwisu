import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMigrationInventory } from './migration-inventory-compat-fix62.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'WEB_PUBLISH');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const js = read('WEB_PUBLISH/assets/global-academy-suite-fix60.js');
const css = read('WEB_PUBLISH/assets/global-academy-suite-fix60.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const manifest = JSON.parse(read('WEB_PUBLISH/assets/global-academy-suite-manifest-fix60.json'));
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const log = [];
const check = (name, fn) => { fn(); log.push(name); };

const photoFiles = [
  'media/laptop-board-inspection.jpg','media/cooling-cleaning.jpg','media/ram-ssd-installation.jpg','media/motherboard-multimeter-test.jpg','media/gpu-cpu-cooling.jpg','media/laptop-screen-hinge.jpg','media/workbench-motherboard-inspection.jpg','media/motherboard-multimeter-probing.jpg','media/ram-m2-installation-detail.jpg','media/usb-c-power-delivery-diagnostic.jpg','media/laptop-cooling-fan-cleaning.jpg','media/laptop-hinge-display-repair.jpg'
];
const posterFiles = ['media/video_posters/LOCAL-WIN26.jpg','media/video_posters/LOCAL-SECUREBOOT.jpg','media/video_posters/LOCAL-NPU.jpg'];
const diagramFiles = [
  ...['01-motherboard-map.svg','02-power-vrm.svg','03-laptop-exploded.svg','04-ram-ddr4-ddr5.svg','05-ssd-sata-nvme.svg','06-multimeter-guide.svg','07-oscilloscope-guide.svg','08-cooling-flow.svg','09-display-chain.svg','10-bios-boot.svg','11-usbc-pd.svg','12-esd-safety.svg','13-gpu-layout.svg','14-smart-drive.svg','15-wifi-network.svg','16-diagnostic-flow.svg','17-audio-circuit.svg','18-connector-pinout.svg'].map(f=>`assets/artwork-fix51/${f}`),
  'assets/artwork-fix54/19-power-path.svg','assets/artwork-fix54/20-bios-firmware-flow.svg','assets/artwork-fix54/21-storage-interface.svg','assets/artwork-fix54/22-memory-diagnostics.svg','assets/artwork-fix54/23-display-edp-path.svg','assets/artwork-fix54/24-fan-control-flow.svg','assets/artwork-fix54/25-audio-signal-path.svg','assets/artwork-fix54/26-wifi-network-path.svg','assets/artwork-fix54/27-esd-workbench.svg','assets/artwork-fix54/28-data-recovery-workflow.svg','assets/artwork-fix54/29-gpu-thermal-path.svg','assets/artwork-fix54/30-keyboard-touchpad.svg'
];
const allVisual = [...photoFiles, ...posterFiles, ...diagramFiles];

check('index references the suite view, nav item, stylesheet and runtime', () => {
  assert.match(html, /id="view-globalacademy"/);
  assert.match(html, /data-view="globalacademy"/);
  assert.match(html, /global-academy-suite-fix60\.css\?v=6\.8\.0-fix60/);
  assert.match(html, /global-academy-suite-fix60\.js\?v=6\.8\.0-fix60/);
  assert.match(html, /'globalacademy'/);
});
check('FIX54–FIX60 manifest describes 7 modules and 45 real visual assets', () => {
  assert.equal(manifest.suite, 'GLOBAL ACADEMY PRO');
  assert.deepEqual(manifest.fixSeries, ['FIX54','FIX55','FIX56','FIX57','FIX58','FIX59','FIX60']);
  assert.equal(manifest.assets.photos, 12);
  assert.equal(manifest.assets.videoPosters, 3);
  assert.equal(manifest.assets.technicalIllustrations, 30);
  assert.equal(manifest.assets.visualTotal, 45);
  assert.equal(manifest.assets.longVideoCatalogueEntries, 12);
  assert.equal(manifest.assets.technicalIllustrationFiles.length, 30);
  assert.equal(manifest.assets.visualFiles.length, 45);
  assert.equal(new Set(manifest.assets.visualFiles).size, 45);
});
check('all photo, poster and diagram files exist and contain valid file signatures', () => {
  for (const asset of allVisual) {
    const full = path.join(web, asset);
    assert.ok(fs.existsSync(full), `missing ${asset}`);
    const data = fs.readFileSync(full);
    assert.ok(data.length > 100, `too small ${asset}`);
    if (asset.endsWith('.jpg')) assert.deepEqual([...data.subarray(0,3)], [0xff,0xd8,0xff], `invalid JPEG signature ${asset}`);
    if (asset.endsWith('.svg')) assert.match(data.toString('utf8').slice(0,1000), /<svg[\s>]/i, `invalid SVG ${asset}`);
  }
});
check('new runtime covers all FIX modules and privacy boundaries', () => {
  for (const token of [
    'NPA_GLOBAL_ACADEMY_FIX60','runAudit','runSecurityCheck','ACADEMY_LONG_VIDEOS','ACADEMY_DEVICE_CATALOG',
    '/api/chat','/api/models','npaFix60WorkshopCasesV1','npaFix60LearningAnalyticsV1','gasExamNext',
    'gasSecurityCheck','gasGlobalSearch','gasOfflineAudit','data-gas-community','knowledgeNodes',
    'localStorage','caches.open','isSecureContext','navigator.serviceWorker'
  ]) assert.ok(js.includes(token), `missing runtime contract token ${token}`);
  assert.ok(!js.includes('OPENAI_API_KEY'), 'browser code must never contain the secret name or value');
  assert.ok(!js.includes('document.cookie'), 'security center must not read browser cookies');
});
check('visual page includes source-linked training catalogue and correct asset counts', () => {
  for (const token of ['30 diagramów','Katalog kursów wideo','window.ACADEMY_LONG_VIDEOS','rel="noopener noreferrer"','licencje']) assert.ok(js.includes(token), `missing visual catalogue token ${token}`);
  const videoSource = read('WEB_PUBLISH/assets/long-video-catalog-620.js');
  assert.equal((videoSource.match(/id:'LONG-/g)||[]).length, 12);
});
check('security, accessibility and responsive styles exist', () => {
  for (const token of ['function security()','function runSecurityCheck()','function bindSecurity()','gasSecContext','gasSecurityResults']) assert.ok(js.includes(token));
  for (const token of ['.gas-security-grid','.gas-video-grid','.gas-security-grid','.gas-video-card','focus-visible']) assert.ok(css.includes(token));
  assert.ok(js.includes("rows.push(auditRow('API diagnostyki AI','INFO'"), 'audyt nie powinien wykonywać pustego GET do endpointu POST czatu');
  assert.ok(!js.includes("probe('/api/chat'"), 'brak pustego żądania GET do API czatu');
  assert.ok(!js.includes("download('global-academy-security-check-fix60.json'"), 'kontrola bezpieczeństwa nie może samoczynnie pobierać pliku');
});
check('Service Worker precaches all 12 new SVG diagrams and suite runtime', () => {
  for (const asset of diagramFiles.filter(x=>x.includes('artwork-fix54/'))) assert.ok(sw.includes(`/${asset}`), `SW missing ${asset}`);
  for (const token of ['global-academy-suite-fix60.js','global-academy-suite-fix60.css','global-academy-suite-manifest-fix60.json']) assert.ok(sw.includes(token));
  assert.match(sw, /nauka-od-a-do-z-fix60-global-academy-suite/);
});
check('release watcher checks remote suite, video cards, security and diagram count', () => {
  for (const token of ['remoteGlobalAcademySuiteValid','remoteGlobalDiagramPaths','remoteGlobalDiagramsValid','globalAcademySuiteFix60','globalDiagramsValid']) assert.ok(watcher.includes(token));
  assert.ok(watcher.includes('remoteGlobalSuiteManifest?.assets?.visualTotal === 45'));
  assert.ok(watcher.includes('remoteGlobalSuiteManifest?.assets?.technicalIllustrations === 30'));
  assert.ok(watcher.includes('artwork-fix54/30-keyboard-touchpad.svg'));
});
check('release metadata retains existing build and declares no D1 migrations', () => {
  assert.equal(release.release, '6.8.0');
  assert.equal(release.build, '6.8.0-fix51-visual-academy-pro-20261105');
  assert.equal(manifest.safety.newD1Migrations, false);
  assert.equal(manifest.safety.automaticCustomerDataUpload, false);
  assert.equal(manifest.safety.exposesOpenAIKey, false);
  assert.equal(manifest.safety.crossDeviceSync, false);
  assert.equal(manifest.safety.inheritedPhotoLicenseVerified, false);
});
check('migration inventory preserves the 17-file base and recognizes the two approved historical extras', () => {
  const migrations = path.join(root, 'migrations');
  assert.ok(fs.existsSync(migrations));
  const files = fs.readdirSync(migrations).filter(f => f.endsWith('.sql'));
  const inventory = validateMigrationInventory(files);
  assert.ok(inventory.ok,
    `unsupported migration inventory: ${JSON.stringify({ reason: inventory.reason, actualCount: inventory.actualCount, missing: inventory.missing, unexpected: inventory.unexpected, optionalPresent: inventory.optionalPresent })}`);
  assert.ok([17, 19].includes(inventory.actualCount), `unexpected migration count: ${inventory.actualCount}`);
  assert.equal(manifest.safety.newD1Migrations, false, 'FIX54-FIX60 must not introduce new D1 migrations');
  if (inventory.optionalHistoricalCount === 2) {
    log.push('legacy workspace contains both approved historical migrations; preserved and not executed');
  }
});

console.log(log.map(x=>`[PASS] ${x}`).join('\n'));
console.log(`GLOBAL ACADEMY SUITE FIX54–FIX60: ${log.length}/${log.length} PASS`);
