// NAUKA OD A DO Z — DLA WSZYSTKICH 6.8.0 FIX135 — MODULE PHOTO COVERAGE VERIFICATION
// Uruchamia lokalny plik JS Wrangler bez cmd.exe i bez zagniezdzonych cudzyslowow.
// Publikuje WEB_PUBLISH; przy istniejącym wrangler.toml/json/jsonc monitoruje też Pages Functions; bez configu działa statycznie.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto'); // FIX84: jawny moduł Node.js, nie globalny Web Crypto.
const { spawn, spawnSync } = require('child_process');
const { hasTomlProductionD1Binding, hasJsonProductionD1Binding } = require('./scripts/wrangler-production-d1');
const { checkPublicMediaAsset } = require('./scripts/public-media-check');
const { verifyHomepageShowcase } = require('./scripts/homepage-showcase-guard');
const { verifyHomeRefreshAssets } = require('./scripts/home-refresh-guard-fix33');
const { assertSharedPasswordKdfContract } = require('./scripts/password-kdf-contract-fix26');
const { verifySupportViewStructure } = require('./scripts/support-view-guard-fix35');
const { verifySupportUpdatesPayload } = require('./scripts/support-community-guard-fix39');
const { readServiceWorkerContract, verifyFix50Release } = require('./scripts/release-contract-fix50.cjs');
const { verifyFix51Release } = require('./scripts/release-contract-fix51.cjs');
const { verifyFix83VisualLibrary } = require('./scripts/fix83-visual-library-guard-fix88.cjs');
const { resolveCloudflarePagesProductionBranch } = require('./scripts/cloudflare-pages-branch-fix63.cjs');
const { extractDeploymentUrl } = require('./scripts/pages-production-branch-fix85.cjs');
const { buildDirectUploadProductionArgs } = require('./scripts/pages-production-direct-upload-fix86.cjs');
// FIX95/FIX98/FIX99 contracts remain historical; active photo publication gate uses FIX106.
// LEGACY_PAGE_STATE_KEY remains supported for recovery of the FIX91 exhausted-page state.
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix95Compatibility } = require('./scripts/photo-catalog-publication-contract-fix95.cjs');
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix106 } = require('./scripts/photo-catalog-publication-contract-fix106.cjs');
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix111 } = require('./scripts/photo-catalog-publication-contract-fix111.cjs');
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix115 } = require('./scripts/photo-catalog-publication-contract-fix115.cjs');
const { getMissingGlobalAcademyExpansionMarkers } = require('./scripts/global-academy-expansion-contract-fix82.cjs');
const { collectFix51VisualAssetPaths, verifyFix51VisualAssetProbes } = require('./scripts/fix51-visual-asset-verification-fix53.cjs');
const { verifyPhotoMetadataFilterRuntime } = require('./scripts/photo-publication-guard-fix130.cjs');
const { verifyHtmlAssetsInServiceWorker } = require('./scripts/fix230-pwa-asset-guard.cjs');
const ROOT = __dirname;
const FIX51_BUILD = '6.8.0-fix51-visual-academy-pro-20261105';
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const FUNCTIONS = path.join(ROOT, 'functions');
const WRANGLER_CONFIGS = ['wrangler.jsonc','wrangler.json','wrangler.toml'].map(name => path.join(ROOT,name)).filter(file => fs.existsSync(file));
const FULL_FUNCTIONS_MODE = WRANGLER_CONFIGS.length === 1;
if (WRANGLER_CONFIGS.length > 1) { console.error('[BLAD] Wykryto kilka plikow konfiguracji Wrangler: ' + WRANGLER_CONFIGS.map(x => path.basename(x)).join(', ') + '. Odloz nieaktywne kopie po wykonaniu kopii bezpieczenstwa.'); process.exit(2); }
const WRANGLER_CONFIG = WRANGLER_CONFIGS[0] || null;
const PROJECT = 'naprawa-pc-akademia-serwisu-pro';
let BRANCH = '';
let PAGES_PROJECT_MODE = '';
const ACCOUNT = '4ddfc3803a4f0c4457ccae083f18b975';
const EXPECTED_D1_ID = '6ac0a922-639c-43ee-ba33-5da14c25a533';
const RELEASE = '6.8.0';
const LOCAL_RELEASE_METADATA = (() => { try { return JSON.parse(fs.readFileSync(path.join(WEB,'release.json'),'utf8')); } catch { return {}; } })();
const EXPECTED_BUILD = String(LOCAL_RELEASE_METADATA.build || '');
const EXPECTED_HOTFIX = String(LOCAL_RELEASE_METADATA.latestHotfix || '');
const EXPECTED_HOTFIX_BUILD = String(LOCAL_RELEASE_METADATA.latestHotfixBuild || '');
const EXPECTED_PHOTO_CATALOG_BUILD = String(LOCAL_RELEASE_METADATA.photoCatalogRuntimeBuildTag || '');
const STABLE_URL = `https://${PROJECT}.pages.dev`;
let stablePageOpened = false;
let accountNegativeProbePassedForBuild = ''; // One controlled negative login probe per build per watcher process.
// Wywołuj plik JavaScript Wrangler bezpośrednio przez bieżący node.exe.
// Eliminuje to quoting .cmd / cmd.exe, który powodował błąd na Windows.
const WRANGLER_JS = path.join(ROOT, 'TOOLS_CLOUDFLARE', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const LIMIT = 25 * 1024 * 1024;
const DEBOUNCE_MS = 10000;
const POLL_MS = 2500;
const BLOCKED = new Set(['.exe','.msi','.dll','.zip','.rar','.7z','.bat','.cmd','.ps1','.psm1','.vbs','.sh','.mjs','.cjs','.map','.tmp','.part','.bak','.py','.pyc','.node','.db','.sqlite','.dmp','.iso','.pdb','.scr','.com']);
let lastSignature = '';
let deployRunning = false;
let pending = false;
let debounceTimer = null;
let retryTimer = null;
let retryCount = 0;
let stopping = false;
let poller = null;
let lastGuardError = '';

async function checkPublicVisualAsset(url) {
  const response = await fetch(url, { method: 'GET', cache: 'no-store', headers: { Range: 'bytes=0-2047', 'cache-control': 'no-cache, no-store', pragma: 'no-cache' } });
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const expected = /\.svg(?:[?#]|$)/i.test(url) ? 'image/svg+xml' : /\.jpe?g(?:[?#]|$)/i.test(url) ? 'image/jpeg' : '';
  let firstChunkBytes = 0;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    try { const first = await reader.read(); firstChunkBytes = first.value?.byteLength || 0; }
    catch { firstChunkBytes = 0; }
    finally { try { await reader.cancel(); } catch { /* ograniczony odczyt fragmentu */ } }
  }
  return response.ok && firstChunkBytes > 0 && (!expected || contentType.includes(expected));
}

function log(msg) { process.stdout.write(`[${new Date().toLocaleString()}] ${msg}\n`); }
function inventory(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isSymbolicLink()) throw new Error(`Link symboliczny niedozwolony: ${full}`);
    if (ent.isDirectory()) inventory(full, out);
    else if (ent.isFile()) {
      const st = fs.statSync(full), ext = path.extname(ent.name).toLowerCase();
      if (st.size > LIMIT) throw new Error(`Plik ponad 25 MiB: ${path.relative(WEB, full)} (${(st.size / 1048576).toFixed(2)} MiB)`);
      if (BLOCKED.has(ext)) throw new Error(`Niedozwolony plik w WWW: ${path.relative(WEB, full)}`);
      out.push(`${path.relative(WEB, full).replace(/\\/g, '/')}:${st.size}:${st.mtimeMs}:${st.ctimeMs}`);
    }
  }
  return out.sort().join('\n');
}

function inventoryFunctions(dir = FUNCTIONS, out = []) {
  if (!fs.existsSync(dir)) return '';
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isSymbolicLink()) throw new Error(`Link symboliczny niedozwolony w functions/: ${full}`);
    if (ent.isDirectory()) inventoryFunctions(full, out);
    else if (ent.isFile()) {
      const st = fs.statSync(full), ext = path.extname(ent.name).toLowerCase();
      if (!['.js', '.ts'].includes(ext) || st.size > LIMIT) {
        throw new Error(`Niedozwolony plik API (dozwolone .js/.ts, limit 25 MiB): ${path.relative(FUNCTIONS, full)} (${(st.size / 1048576).toFixed(2)} MiB)`);
      }
      out.push(`${path.relative(FUNCTIONS, full).replace(/\\/g, '/')}:${st.size}:${st.mtimeMs}:${st.ctimeMs}`);
    }
  }
  return out.sort().join('\n');
}
function deploymentSignature() {
  const web = inventory(WEB);
  const functions = FULL_FUNCTIONS_MODE ? inventoryFunctions() : 'STATIC_ONLY';
  let config = 'STATIC_ONLY_NO_WRANGLER_CONFIG';
  if (FULL_FUNCTIONS_MODE && WRANGLER_CONFIG) { const st=fs.statSync(WRANGLER_CONFIG); config=`${path.basename(WRANGLER_CONFIG)}:${st.size}:${st.mtimeMs}:${st.ctimeMs}`; }
  return `WEB\n${web}\nFUNCTIONS\n${functions}\nCONFIG\n${config}`;
}
function run(args) {
  return new Promise((resolve, reject) => {
    // Nie uruchamiamy wrangler.cmd. process.execPath obsluguje spacje w sciezkach
    // jako osobny argument, bez interpretacji przez CMD i bez dodatkowego quoting.
    const child = spawn(process.execPath, [WRANGLER_JS, ...args.map(String)], {
      cwd: ROOT,
      windowsHide: true,
      shell: false,
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { const s = d.toString(); stdout += s; process.stdout.write(s); });
    child.stderr.on('data', d => { const s = d.toString(); stderr += s; process.stderr.write(s); });
    child.on('error', e => reject(new Error(`Nie mozna uruchomic lokalnego Wrangler JS: ${e.message}`)));
    child.on('close', code => code === 0
      ? resolve({ stdout, stderr })
      : reject(new Error(`Wrangler zakończył kodem ${code}: ${args.join(' ')}`)));
  });
}
function parseProjectList(raw) {
  const text = String(raw || '').replace(/^\uFEFF/, '').trim();
  // Wrangler 4.156.0 may emit CLI JSON labels such as "Project Name".
  let parsed = null;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '[' && text[i] !== '{') continue;
    try { parsed = JSON.parse(text.slice(i)); break; } catch (_) { /* try next token */ }
  }
  if (!parsed) throw new Error('Wrangler nie zwrócił poprawnego JSON listy projektów.');
  if (Array.isArray(parsed)) return parsed;
  for (const key of ['result', 'projects', 'data', 'items']) {
    if (Array.isArray(parsed[key])) return parsed[key];
  }
  if (parsed.result && typeof parsed.result === 'object') {
    for (const key of ['projects', 'data', 'items']) if (Array.isArray(parsed.result[key])) return parsed.result[key];
  }
  throw new Error('Nieznany format listy projektów Pages — brak tablicy projektów.');
}
function rowValue(row, keys) {
  if (!row || typeof row !== 'object') return undefined;
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
  const normalized = new Map(Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase().replace(/[ _-]+/g, ''), v]));
  for (const key of keys) {
    const value = normalized.get(String(key).trim().toLowerCase().replace(/[ _-]+/g, ''));
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
}
function projectName(row) {
  return String(rowValue(row, ['name', 'project_name', 'projectName', 'Project Name']) || '').trim();
}
function readManualProductionBranchConfirmation() {
  const confirmationPath = path.join(ROOT, 'CLOUDFLARE_PRODUCTION_BRANCH_CONFIRMED.txt');
  if (!fs.existsSync(confirmationPath)) return '';
  return fs.readFileSync(confirmationPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line && !line.startsWith('#') && !line.startsWith(';')) || '';
}
async function verifyProjectBranch(row) {
  let branch = String(rowValue(row, ['production_branch', 'productionBranch', 'productionBranchName', 'Production Branch']) || '').trim();
  let source = branch ? 'Wrangler Pages project list' : '';
  let apiFailure = '';

  // Wrangler 4.156.0 może wypisać nazwę projektu i domenę, ale pominąć
  // production_branch. Wtedy odczytujemy prawdziwe ustawienie przez oficjalne
  // Cloudflare Pages API, wykorzystując już istniejące uwierzytelnienie Wrangler.
  if (!branch) {
    try {
      const discovered = await resolveCloudflarePagesProductionBranch({ accountId: ACCOUNT, projectName: PROJECT });
      if (discovered.branch) {
        branch = discovered.branch;
        source = `Cloudflare Pages API (${discovered.credentialSource})`;
      }
    } catch (error) {
      apiFailure = error.message || 'nieznany błąd API';
    }
  }

  const manual = readManualProductionBranchConfirmation();
  if (!branch && manual) {
    branch = manual;
    source = 'ręczne potwierdzenie w CLOUDFLARE_PRODUCTION_BRANCH_CONFIRMED.txt';
  }
  if (!branch) {
    const apiInfo = apiFailure ? ` Odczyt API nie powiódł się: ${apiFailure}.` : ' Nie znaleziono tokenu API w środowisku ani w zwykłym pliku poświadczeń Wrangler.';
    throw new Error(`Nie udało się bezpiecznie ustalić Production Branch projektu ${PROJECT}.${apiInfo} Sprawdź Cloudflare Pages > Settings > Builds & deployments i wpisz dokładną nazwę do CLOUDFLARE_PRODUCTION_BRANCH_CONFIRMED.txt. Publikacja pozostaje zablokowana.`);
  }
  if (branch.length > 200 || /[\s\u0000-\u001f]/.test(branch) || branch.startsWith('-')) {
    throw new Error('Cloudflare zwrócił nieprawidłową nazwę Production Branch; publikacja zablokowana.');
  }
  if (manual && manual !== branch) {
    throw new Error(`Production Branch z Cloudflare (${branch}) nie zgadza się z ręcznym potwierdzeniem (${manual}). Usuń nieaktualną wartość lub potwierdź właściwą gałąź; publikacja zablokowana.`);
  }
  BRANCH = branch;
  log(`Production Branch potwierdzona: ${BRANCH} (źródło: ${source}).`);
}
async function verifyExistingProject() {
  log('Weryfikuję istniejący projekt Pages przez lokalny plik JavaScript Wrangler…');
  const r = await run(['pages', 'project', 'list', '--json']);
  const projects = parseProjectList(r.stdout);
  const found = projects.find(p => projectName(p).toLowerCase() === PROJECT.toLowerCase());
  if (!found) {
    const names = projects.map(projectName).filter(Boolean);
    const detail = names.length ? ` Projekty zwrócone przez Wrangler: ${names.join(', ')}.` : ' Wrangler zwrócił pustą listę.';
    throw new Error(`Projekt ${PROJECT} nie występuje na liście aktywnego konta.${detail} Publikacja zablokowana — nie utworzę nowego projektu.`);
  }
  const domain = String(rowValue(found, ['domains', 'project_domains', 'projectDomains', 'Project Domains']) || '').trim();
  if (domain && !domain.split(/[;,\s]+/).some(d => d.toLowerCase() === `${PROJECT}.pages.dev`)) {
    log(`Ostrzeżenie: domena z listy Wrangler to ${domain}; projekt został dopasowany po dokładnej nazwie.`);
  }
  const gitProvider = rowValue(found, ['git_provider', 'gitProvider', 'Git Provider']);
  if (gitProvider === undefined) {
    throw new Error('Nie można potwierdzić typu projektu Pages (brak pola Git Provider w odpowiedzi Wrangler). FIX81 dopuszcza produkcyjny Direct Upload wyłącznie po potwierdzeniu Git Provider = No.');
  }
  if (!/^(?:no|false|none|not connected)$/i.test(String(gitProvider).trim())) {
    throw new Error(`Projekt ${PROJECT} zgłasza Git Provider = ${gitProvider}. FIX81 jest przeznaczony wyłącznie dla Direct Upload; produkcyjna publikacja została bezpiecznie zatrzymana.`);
  }
  PAGES_PROJECT_MODE = 'DIRECT_UPLOAD';
  log('Wrangler potwierdził Git Provider: No — projekt pracuje w trybie Direct Upload.');
  await verifyProjectBranch(found);
  log(`Potwierdzono istniejący projekt ${PROJECT} / ${BRANCH}${domain ? ` / ${domain}` : ''} / Direct Upload.`);
}
function stripJsonComments(input) {
  let out = '', inString = false, escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i], n = input[i + 1];
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && n === '/') { while (i < input.length && input[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++; i++; out += ' '; continue; }
    out += c;
  }
  return out.replace(/,\s*([}\]])/g, '$1');
}
function tomlHasBinding(source, tableName, bindingName) {
  const lines = String(source || '').split(/\r?\n/);
  const header = `[${tableName}]`;
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].replace(/\s+#.*$/, '').trim() === header) starts.push(i);
  if (starts.length !== 1) return false;
  let end = lines.length;
  for (let i = starts[0] + 1; i < lines.length; i++) if (/^\s*\[\[?.+\]\]?\s*$/.test(lines[i].replace(/\s+#.*$/, '').trim())) { end = i; break; }
  const matches = lines.slice(starts[0] + 1, end).map(line => line.replace(/\s+#.*$/, '').trim()).filter(line => /^binding\s*=/.test(line));
  return matches.length === 1 && matches[0].split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '') === bindingName;
}
function verifyProductionD1Binding() {
  if (!FULL_FUNCTIONS_MODE || !WRANGLER_CONFIG) throw new Error('Brak aktywnego pliku Wrangler — blokuję publikację, ponieważ binding produkcyjny D1 nie może zostać zweryfikowany.');
  const source = fs.readFileSync(WRANGLER_CONFIG, 'utf8');
  const ext = path.extname(WRANGLER_CONFIG).toLowerCase();
  const ok = ext === '.toml'
    ? hasTomlProductionD1Binding(source, 'DB', EXPECTED_D1_ID)
    : hasJsonProductionD1Binding(source, 'DB', EXPECTED_D1_ID);
  if (!ok) throw new Error(`Brak prawidłowego env.production.d1_databases.DB=${EXPECTED_D1_ID} w ${path.basename(WRANGLER_CONFIG)}. Wdrożenie zablokowane przed wysłaniem plików.`);
  log(`Kontrola konfiguracji produkcyjnej D1 OK: DB -> ${EXPECTED_D1_ID}.`);
}

function runFix49NodePreflight() {
  const scripts = ['scripts/run-tests-fix176.mjs', 'scripts/run-tests-fix181.mjs', 'scripts/test-fix182-specialist-systems.mjs', 'scripts/test-fix183-advanced-service-lab.mjs', 'scripts/test-fix185-performance-firmware.mjs', 'scripts/run-tests-fix186.mjs', 'scripts/test-fix186-practical-lab.mjs', 'scripts/test-fix194-three-oauth-providers.mjs', 'scripts/run-tests-fix210-218.mjs', 'scripts/test-fix219-publisher-preflight.mjs','scripts/test-fix220-228-publisher-guard.mjs','scripts/run-tests-fix220-228.mjs','scripts/run-tests-fix220-229.mjs','scripts/test-fix229-certificate-cache.mjs','scripts/run-tests-fix220-230.mjs','scripts/test-fix230-publisher-guard.mjs','scripts/test-fix240-publisher-scope.mjs','scripts/run-tests-fix241.mjs'];
  const fix177Scripts = ['scripts/test-fix177-publisher-photo-library-wiring.mjs'];
  const fix178Scripts = ['scripts/test-fix178-watcher-response-wiring.mjs'];
  for (const relative of [...scripts, ...fix177Scripts, ...fix178Scripts]) {
    const file = path.join(ROOT, relative);
    if (!fs.existsSync(file)) throw new Error(`FIX49 preflight: brak ${relative}.`);
    const result = spawnSync(process.execPath, [file], { cwd: ROOT, windowsHide: true, shell: false, encoding: 'utf8', timeout: ['scripts/test-fix182-specialist-systems.mjs','scripts/test-fix185-performance-firmware.mjs','scripts/run-tests-fix186.mjs','scripts/run-tests-fix210-218.mjs'].includes(relative) ? 1200000 : 120000, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, CI: '1' } });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error || result.status !== 0) throw new Error(`FIX49 preflight ${relative} nie przeszedł${result.error ? `: ${result.error.message}` : ` (kod ${result.status})`}. Deploy zablokowany.`);
  }
}

function verifyLocalRelease() {
  const file = path.join(WEB, 'index.html');
  if (!fs.existsSync(file)) throw new Error('Brak WEB_PUBLISH/index.html.');
  const html = fs.readFileSync(file, 'utf8');
  // FIX45: read the Service Worker before any release guard references `sw`.
  // Keeping this declaration at the top avoids the temporal-dead-zone crash
  // (`Cannot access 'sw' before initialization`) during the initial watcher scan.
  const swPath = path.join(WEB, 'service-worker.js');
  if (!fs.existsSync(swPath)) throw new Error('Brak WEB_PUBLISH/service-worker.js.');
  const { source: sw, cacheName: swCacheName } = readServiceWorkerContract(swPath);
  // FIX110 active PWA cache contract; historical compatibility token: swCacheName.includes('fix94-topic-verified-photo-20261107').
  const fix51Contract = verifyFix51Release(ROOT);
  log(`FIX51 pre-deploy guard: ${fix51Contract.visualAssets} plików wizualnych (${fix51Contract.localPhotos} zdjęć + ${fix51Contract.illustrations} ilustracji), cache ${fix51Contract.cacheMarker}.`); // verifyFix50Release(ROOT) remains for the historical FIX50 snapshot.
  runFix49NodePreflight();
  const supportViewGuard = verifySupportViewStructure(html);
  log(`Osobna zakładka wsparcia potwierdzona: ${supportViewGuard.supportNodes} elementy wsparcia w #view-support; ${supportViewGuard.viewCount} niezależnych widoków.`);
  const match = html.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i);
  const releasePath = path.join(WEB, 'release.json');
  const releaseJson = JSON.parse(fs.readFileSync(releasePath,'utf8'));
  const expectedBuild=String(releaseJson.build||'');
  if (!match || match[1] !== expectedBuild || releaseJson.release !== RELEASE || !expectedBuild.startsWith(`${RELEASE}-`)) throw new Error(`Lokalny academy-build musi być identyczny z WEB_PUBLISH/release.json (${expectedBuild || 'brak'}). Oczekiwano ${RELEASE}.`);
  const localRelease = JSON.parse(fs.readFileSync(path.join(WEB,'release.json'),'utf8'));
  const fix83VisualGuard = verifyFix83VisualLibrary({ webDir: WEB, indexHtml: html, releaseJson: localRelease });
  log(`FIX83/FIX88 biblioteka ilustracji lokalna: ${fix83VisualGuard.galleryIllustrationCount} tematów; URL ${fix83VisualGuard.runtimeBuildTag}.`);
  const photoSourceManifest = JSON.parse(fs.readFileSync(path.join(WEB,'media','photo-sources-online.json'),'utf8'));
  const photoCatalogRuntime = fs.readFileSync(path.join(WEB,'assets','photo-catalog-fix115.js'),'utf8');
  const photoPrimeRuntime = fs.readFileSync(path.join(WEB,'assets','homepage-photo-prime-fix118.js'),'utf8');
  const photoLibrary = JSON.parse(fs.readFileSync(path.join(WEB,'media','home-photo-library-fix118.json'),'utf8'));
  const photoMap = photoSourceManifest.homepageSlotSeedMap || {};
  const safeSeedCount = Object.values(photoMap).length;
  const proxyFunction = fs.readFileSync(path.join(ROOT,'functions','media','photos','[id].js'),'utf8');
  const proxyHelper = fs.readFileSync(path.join(ROOT,'functions','_photo-proxy-fix131.js'),'utf8');
  if (!proxyFunction.includes('serveCuratedPhotoFix131') || !proxyHelper.includes('PHOTO_SOURCES_FIX131') || !proxyHelper.includes("redirect: 'manual'") || !proxyHelper.includes('MAX_SAFE_REDIRECTS = 4') || !proxyHelper.includes('FIX134-SAFE-REDIRECTS') || proxyHelper.includes("redirect: 'error'")) throw new Error('FIX134: photo proxy redirect mode/allowlist contract is invalid.');
  const expectedModulePhotoIdsFix135 = ['home-module-repairmaster','home-module-components','home-module-ultimate3d','home-module-labplus','home-tech-slot-14','home-tech-slot-15','home-module-courses','home-module-checklists','home-module-modelcenter','home-tech-slot-19','home-module-knowledge','home-module-cloudchat','home-tech-slot-22','home-module-14','home-module-15','home-module-16','home-module-17','home-module-18','home-module-19'];
  const modulePhotoCoverageValidFix135 = expectedModulePhotoIdsFix135.every(id => { const seed = photoMap[id]; const item = (photoSourceManifest.photos || []).find(p => p.id === seed); return Boolean(item && new RegExp('data-photo-id=\"' + id + '\"[^>]*data-photo-kind=\"' + item.category + '\"').test(html)); });
  if (!modulePhotoCoverageValidFix135 || photoLibrary.entries?.some(entry => !expectedModulePhotoIdsFix135.includes(entry.slotId))) throw new Error('FIX135: all 19 module photo slots must have an exact category-matched curated seed.');
  if (localRelease.latestHotfix !== 'FIX176' || safeSeedCount !== 19 || new Set(Object.values(photoMap)).size !== 19 || photoLibrary.entries?.length !== 19
      || localRelease.homepagePhotoFirstRenderFix?.homepageEnabled !== true || localRelease.homepagePhotoFirstRenderFix?.registeredAssignments !== 19
      || !photoPrimeRuntime.includes('curated-equipment-photographs-with-local-svg-fallback') || !photoCatalogRuntime.includes('hasHumanSubjectMetadata') || !photoCatalogRuntime.includes('sameOriginCuratedPhoto')
      || !html.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136') || !sw.includes('academy-photo-library-fix135')
      || sw.includes('FIX123_LOCAL_IMAGE_FALLBACK') || html.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123') || html.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122')) {
    throw new Error('FIX129: lokalny katalog zdjęć musi aktywnie przypisywać 19 unikalnych fotografii sprzętu, odrzucać metadane osób i zachować fallback offline.');
  }
  log('FIX129: strona główna ma aktywne 19 unikalnych fotografii sprzętu; SVG jest wyłącznie awaryjnym fallbackiem offline.');
  const fix175Meta = localRelease.academyProfessionalRepairFix175 || {};
  const fix175RuntimePath = path.join(WEB, 'assets', 'academy-professional-repair-fix175.js');
  const fix175CssPath = path.join(WEB, 'assets', 'academy-professional-repair-fix175.css');
  const fix175Html = html.includes('class="a168-home-launch"') && html.includes('class="nav-item a168-nav-item"') && html.includes('data-a168-launch="master"') && html.includes('var a168Launch = target.closest');
  const fix175Pwa = sw.includes('academy-professional-repair-fix175.js') && sw.includes('academy-professional-repair-fix175.css') && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fs.existsSync(fix175RuntimePath) || !fs.existsSync(fix175CssPath) || !fix175Html || !fix175Pwa || fix175Meta.hotfix !== 'FIX175' || fix175Meta.modules?.length !== 8 || fix175Meta.sharedTools?.length !== 5 || fix175Meta.homeLaunchVisible !== true || fix175Meta.sidebarLaunchVisible !== true || fix175Meta.newD1Database !== false || fix175Meta.d1SchemaMigrations !== false) throw new Error('FIX175: brakuje Akademii Mistrza Serwisu, bezpośredniego wejścia lub zgodności PWA/release.');
  log('FIX175: 8 laboratoriów, 5 narzędzi, wejście z pulpitu i menu oraz PWA potwierdzone; 35 widoków i istniejąca D1 zachowane.');
  const fix181RuntimePath = path.join(WEB, 'assets', 'academy-deployment-migration-refurb-fix181.js');
  const fix181CssPath = path.join(WEB, 'assets', 'academy-deployment-migration-refurb-fix181.css');
  const fix181Html = html.includes('academy-deployment-migration-refurb-fix181.js?v=6.8.0-fix181') && html.includes('academy-deployment-migration-refurb-fix181.css?v=6.8.0-fix181') && html.includes('data-a168-tab="deploy"') && html.includes('id="a181DeploymentMigration"');
  const fix181Pwa = sw.includes('academy-deployment-migration-refurb-fix181.js?v=6.8.0-fix181') && sw.includes('academy-deployment-migration-refurb-fix181.css?v=6.8.0-fix181') && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fs.existsSync(fix181RuntimePath) || !fs.existsSync(fix181CssPath) || !fix181Html || !fix181Pwa) throw new Error('FIX181: brak panelu, runtime, stylów lub powiązania z Service Worker; publikacja zablokowana.');
  log('FIX181: runtime, CSS, 16. zakładka i PWA potwierdzone w istniejącej Akademii; cache i baza D1 pozostają bez zmian.');
  const fix182Meta = localRelease.academySpecialistSystemsFix182 || {};
  const fix182RuntimePath = path.join(WEB, 'assets', 'academy-specialist-systems-fix182.js');
  const fix182CssPath = path.join(WEB, 'assets', 'academy-specialist-systems-fix182.css');
  const fix182Html = html.includes('academy-specialist-systems-fix182.js?v=6.8.0-fix182') && html.includes('academy-specialist-systems-fix182.css?v=6.8.0-fix182') && html.includes('data-a168-tab="specialist"') && html.includes('data-a168-panel="specialist"') && html.includes('id="a182SpecialistSystems"');
  const fix182Pwa = sw.includes('academy-specialist-systems-fix182.js?v=6.8.0-fix182') && sw.includes('academy-specialist-systems-fix182.css?v=6.8.0-fix182') && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fs.existsSync(fix182RuntimePath) || !fs.existsSync(fix182CssPath) || !fix182Html || !fix182Pwa || fix182Meta.hotfix !== 'FIX182' || fix182Meta.lessons !== 20 || fix182Meta.quizQuestions !== 60 || fix182Meta.cases !== 17 || fix182Meta.projects !== 10 || fix182Meta.glossaryTerms !== 40 || fix182Meta.examQuestions !== 16 || fix182Meta.newViews !== 0 || fix182Meta.newD1Database !== false || fix182Meta.d1SchemaMigrations !== false || fix182Meta.hardwareAccess !== false || fix182Meta.networkAccess !== false) throw new Error('FIX182: brak nowego panelu, jego materiałów, PWA lub bezpiecznych metadanych; publikacja zablokowana.');
  log('FIX182: 20 lekcji, 60 pytań, 17 przypadków, 10 projektów, 40 haseł, egzamin 16 pytań; 17. zakładka i PWA potwierdzone bez nowego widoku i migracji D1.');
  const fix183Meta = localRelease.academyAdvancedServiceLabFix183 || {};
  const fix183RuntimePath = path.join(WEB, 'assets', 'academy-advanced-service-lab-fix183.js');
  const fix183CssPath = path.join(WEB, 'assets', 'academy-advanced-service-lab-fix183.css');
  const fix183Html = html.includes('academy-advanced-service-lab-fix183.js?v=6.8.0-fix183') && html.includes('academy-advanced-service-lab-fix183.css?v=6.8.0-fix183') && html.includes('data-a168-tab="serviceexpert"') && html.includes('data-a168-panel="serviceexpert"') && html.includes('id="a183AdvancedServiceLab"');
  const fix183Pwa = sw.includes('academy-advanced-service-lab-fix183.js?v=6.8.0-fix183') && sw.includes('academy-advanced-service-lab-fix183.css?v=6.8.0-fix183') && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fs.existsSync(fix183RuntimePath) || !fs.existsSync(fix183CssPath) || !fix183Html || !fix183Pwa || fix183Meta.hotfix !== 'FIX183' || fix183Meta.productVersion !== '6.8.0' || fix183Meta.lessons !== 20 || fix183Meta.quizQuestions !== 60 || fix183Meta.cases !== 15 || fix183Meta.projects !== 10 || fix183Meta.glossaryTerms !== 40 || fix183Meta.examQuestions !== 16 || fix183Meta.newViews !== 0 || fix183Meta.expectedExistingViews !== 35 || fix183Meta.expectedExistingAcademyTabs !== 18 || fix183Meta.newD1Database !== false || fix183Meta.newD1Tables !== false || fix183Meta.d1SchemaMigrations !== false || fix183Meta.hardwareAccess !== false || fix183Meta.networkAccess !== false || fix183Meta.localStorageOnly !== true) throw new Error('FIX183: brak nowego panelu, plików, PWA lub bezpiecznych metadanych; publikacja zablokowana.');
  log('FIX183: 20 lekcji, 60 pytań, 15 przypadków, 10 projektów, 40 haseł, egzamin 16 pytań; 18. zakładka i PWA potwierdzone bez nowego widoku i migracji D1.');

  const fix184Meta = localRelease.academyExpertDiagnosticsFix184 || {};
  const fix184RuntimePath = path.join(WEB,'assets','academy-expert-diagnostics-fix184.js');
  const fix184CssPath = path.join(WEB,'assets','academy-expert-diagnostics-fix184.css');
  const fix184Assets = ['academy-expert-diagnostics-fix184.js?v=6.8.0-fix184','academy-expert-diagnostics-fix184.css?v=6.8.0-fix184'];
  const fix184HtmlValid = fix184Assets.every(x=>html.includes(x)) && html.includes('data-a168-tab="expertdiag"') && html.includes('data-a168-panel="expertdiag"') && html.includes('id="a184ExpertDiagnostics"') && (html.match(/data-a168-tab="[a-z]+"/g)||[]).length===20;
  const fix184PwaValid = fix184Assets.every(x=>sw.includes(x.split('?')[0])) && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fs.existsSync(fix184RuntimePath) || !fs.existsSync(fix184CssPath) || !fix184HtmlValid || !fix184PwaValid || fix184Meta.hotfix!=='FIX184' || fix184Meta.productVersion!=='6.8.0' || fix184Meta.lessons!==20 || fix184Meta.quizQuestions!==60 || fix184Meta.cases!==15 || fix184Meta.projects!==10 || fix184Meta.glossaryTerms!==40 || fix184Meta.examQuestions!==20 || fix184Meta.expectedExistingAcademyTabs!==19 || fix184Meta.expectedExistingViews!==35 || fix184Meta.newViews!==0 || fix184Meta.newD1Database!==false || fix184Meta.d1SchemaMigrations!==false || fix184Meta.hardwareAccess!==false || fix184Meta.networkAccess!==false || fix184Meta.commandsExecuted!==false || fix184Meta.localStorageOnly!==true) throw new Error('FIX184: watcher blokuje publikację — panel, pliki PWA lub metadane nie są kompletne.');
  log('FIX184: panel, runtime/CSS, 19. zakładka, release metadata i cache PWA potwierdzone lokalnie.');
  const fix185Meta = localRelease.academyPerformanceFirmwareFix185 || {};
  const fix185RuntimePath = path.join(WEB,'assets','academy-performance-firmware-fix185.js');
  const fix185CssPath = path.join(WEB,'assets','academy-performance-firmware-fix185.css');
  const fix185DataPath = path.join(WEB,'assets','academy-performance-firmware-fix185-data.json');
  const fix185Assets = ['academy-performance-firmware-fix185.js?v=6.8.0-fix185','academy-performance-firmware-fix185.css?v=6.8.0-fix185'];
  const fix185HtmlValid = fix185Assets.every(x=>html.includes(x)) && html.includes('data-a168-tab="perfdiag"') && html.includes('data-a168-panel="perfdiag"') && html.includes('id="a185ExpertPerformance"') && (html.match(/data-a168-tab="[a-z]+"/g)||[]).length===20;
  const fix185PwaValid = fix185Assets.every(x=>sw.includes(x.split('?')[0])) && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fs.existsSync(fix185RuntimePath) || !fs.existsSync(fix185CssPath) || !fs.existsSync(fix185DataPath) || !fix185HtmlValid || !fix185PwaValid || fix185Meta.hotfix!=='FIX185' || fix185Meta.productVersion!=='6.8.0' || fix185Meta.lessons!==20 || fix185Meta.quizQuestions!==60 || fix185Meta.cases!==15 || fix185Meta.projects!==10 || fix185Meta.glossaryTerms!==40 || fix185Meta.examQuestions!==20 || fix185Meta.tools!==8 || fix185Meta.expectedExistingAcademyTabs!==20 || fix185Meta.expectedExistingViews!==35 || fix185Meta.newViews!==0 || fix185Meta.newD1Database!==false || fix185Meta.newD1Tables!==false || fix185Meta.d1SchemaMigrations!==false || fix185Meta.hardwareAccess!==false || fix185Meta.networkAccess!==false || fix185Meta.commandsExecuted!==false || fix185Meta.firmwareWrite!==false || fix185Meta.localStorageOnly!==true) throw new Error('FIX185: brak panelu, plików PWA lub bezpiecznych metadanych; publikacja zablokowana.');
  log('FIX185: panel ETW/PCIe/Storage/PCB/Firmware, 20 lekcji, 60 pytań, 15 przypadków, 10 projektów, 40 haseł, 8 narzędzi i 20. zakładka potwierdzone lokalnie.');
  const fix186Meta = localRelease.academyPracticalLabFix186 || {};
  const fix186RuntimePath = path.join(WEB,'assets','academy-practical-lab-fix186.js');
  const fix186CssPath = path.join(WEB,'assets','academy-practical-lab-fix186.css');
  const fix186Assets = ['academy-practical-lab-fix186.js?v=6.8.0-fix186','academy-practical-lab-fix186.css?v=6.8.0-fix186'];
  const fix186HtmlValid = fix186Assets.every(x=>html.includes(x)) && html.includes('id="a186PracticalLab"') && html.includes('data-a168-tab="perfdiag"') && html.includes('data-a168-panel="perfdiag"') && (html.match(/data-a168-tab="[a-z]+"/g)||[]).length===20 && (html.match(/id="view-[^"]+"/g)||[]).length===35;
  const fix186PwaValid = fix186Assets.every(x=>sw.includes(x.split('?')[0]));
  const fix186Runtime = fs.existsSync(fix186RuntimePath) ? fs.readFileSync(fix186RuntimePath,'utf8') : '';
  const fix186PcbApiPath = path.join(ROOT,'functions','api','academy','fix186','pcb-analysis.js');
  const fix186PcbApiSource = fs.existsSync(fix186PcbApiPath) ? fs.readFileSync(fix186PcbApiPath,'utf8') : '';
  const fix186PcbApiValid = ['IMAGE_CONSENT_REQUIRED','imageStored: false','sameOrigin(request)','MAX_IMAGE_BASE64'].every(x=>fix186PcbApiSource.includes(x));
  const fix186ToolsValid = fs.existsSync(path.join(ROOT,'tools','FIX186_COLLECTOR.ps1')) && fs.existsSync(path.join(ROOT,'WYKONAJ_LABORATORIUM_FIX186.cmd')) && fs.existsSync(path.join(ROOT,'scripts','run-tests-fix186.mjs')) && fs.existsSync(path.join(ROOT,'scripts','test-fix186-practical-lab.mjs')) && fs.existsSync(path.join(ROOT,'scripts','test-fix186-pcb-analysis-api.mjs')) && fs.existsSync(path.join(ROOT,'scripts','test-fix194-three-oauth-providers.mjs')) && fix186PcbApiValid;
  const fix186RuntimeValid = ['normalizeImportedFile','analyzeEvents','safeGeneratedCase','ACADEMY_FIX186_TOOLS','/api/chat','/api/academy/fix186/pcb-analysis','a186PcbAiConsent','a186PcbAiAnalyze','automaticElectricalDiagnosis:false'].every(x=>fix186Runtime.includes(x));
  if (!fs.existsSync(fix186RuntimePath) || !fs.existsSync(fix186CssPath) || !fix186HtmlValid || !fix186PwaValid || !fix186ToolsValid || !fix186RuntimeValid || fix186Meta.hotfix!=='FIX186' || fix186Meta.productVersion!=='6.8.0' || fix186Meta.expectedExistingAcademyTabs!==20 || fix186Meta.expectedExistingViews!==35 || fix186Meta.newMainTabs!==0 || fix186Meta.newViews!==0 || fix186Meta.newD1Database!==false || fix186Meta.newD1Tables!==false || fix186Meta.d1SchemaMigrations!==false || fix186Meta.rawLogsUploadedToServer!==false || fix186Meta.rawLogsStoredInLocalStorage!==false || fix186Meta.firmwareWrite!==false || fix186Meta.diskWrite!==false || fix186Meta.remoteHardwareControl!==false || fix186Meta.uefiCapsulePayloadSignatureVerifiedByGenericTool!==false || fix186Meta.pcbAiEndpoint!=='/api/academy/fix186/pcb-analysis' || fix186Meta.pcbAiRequiresExplicitConsent!==true || fix186Meta.pcbImagesStored!==false || fix186Meta.pcbAutomaticElectricalDiagnosis!==false || fix186Meta.productionPublished!==false ) throw new Error('FIX186: watcher blokuje publikację — laboratorium, importer, kolektor, testy, PWA lub metadane bezpieczeństwa są niekompletne.');
  log('FIX186: lokalny panel i jego runtime, kolektor Windows, testy, metadata release i PWA potwierdzone; bez nowych widoków/D1 i bez flashowania.');

  // FIX198–FIX202: wymagaj nowego kolektora Windows, geometrii 3D, Hyper-V, analityki nauczyciela i synchronizacji wszystkich dozwolonych stanów.
  const fix202Meta = localRelease.academyFullStateSyncFix202 || {};
  const fix199Meta = localRelease.academyTrue3dWorkshopFix199 || {};
  const fix200Meta = localRelease.academyHyperVSandboxFix200 || {};
  const fix201Meta = localRelease.academyTeacherDashboardFix201 || {};
  const fix198Meta = localRelease.academyHardwareSnapshotFix198 || {};
  const fix202StateApi = fs.readFileSync(path.join(ROOT,'functions','api','state.js'),'utf8');
  const fix202AssetPaths = ['assets/academy-workshop-3d-fix199.js','assets/academy-workshop-3d-fix199.css','assets/academy-hardware-import-fix198.js','assets/academy-hardware-import-fix198.css','assets/academy-teacher-dashboard-fix201.css','assets/cloud-academy.js'];
  const fix202AssetAudit = verifyHtmlAssetsInServiceWorker({ html, serviceWorker: sw, webRoot: WEB, assets: fix202AssetPaths });
  const fix202AssetsValid = fix202AssetAudit.ok;
  const fix202Files = ['tools/FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1','WYKONAJ_DIAGNOSTYKE_SPRZETU_FIX198.cmd','tools/FIX200_CREATE_ISOLATED_HYPERV_VM.ps1','tools/FIX200_START_ISOLATED_HYPERV_VM.ps1','tools/FIX200_REMOVE_ISOLATED_HYPERV_VM.ps1','scripts/run-tests-fix202.mjs','scripts/test-fix202-publisher-guard.mjs','TESTY_FIX198_FIX202.cmd','scripts/test-fix198-windows-hardware.mjs','scripts/test-fix199-real-3d-workshop.mjs','scripts/test-fix200-hyperv-sandbox.mjs','scripts/test-fix201-teacher-dashboard.mjs','scripts/test-fix202-full-state-sync.mjs','scripts/fix230-pwa-asset-guard.cjs','WEB_PUBLISH/assets/academy-hardware-import-fix198.js','WEB_PUBLISH/assets/academy-hardware-import-fix198.css','WEB_PUBLISH/assets/academy-workshop-3d-fix199.js','WEB_PUBLISH/assets/academy-workshop-3d-fix199.css','WEB_PUBLISH/assets/academy-teacher-dashboard-fix201.css'];
  const fix202SyncKeys = ['academyCompletedLessons','academyGuideSteps','academyChecklist','academyBookmarks','academyLanguage','academyLab45ESD','academyLab45Stock','academyLab45Inspector','academyLab45Assignments','academyLab45PowerDone','academyLab45Recovery','academyLabTraining','academyLabModels','academyLabExamLast','academyLabLastTriage','nauka.academy.fix162.v1'];
  const fix202Missing = fix202Files.filter(file=>!fs.existsSync(path.join(ROOT,file))).map(file=>`plik ${file}`);
  if (!fix202AssetsValid) fix202Missing.push(...fix202AssetAudit.errors);
  if (!html.includes('id="a162TeacherDashboard"')) fix202Missing.push('panel nauczyciela a162TeacherDashboard');
  if (!html.includes('id="f197BoardCanvas"')) fix202Missing.push('model 3D f197BoardCanvas');
  if (!fix202SyncKeys.every(key=>fix202StateApi.includes(`'${key}'`))) fix202Missing.push('jedno lub więcej z 16 kluczy synchronizacji');
  if (fix202Meta.hotfix!=='FIX202' || fix202Meta.synchronizedStateKeys!==16) fix202Missing.push('metadane synchronizacji FIX202');
  if (fix199Meta.hotfix!=='FIX199' || fix199Meta.polygonFacesGenerated<90) fix202Missing.push('metadane geometrii FIX199');
  if (fix200Meta.hotfix!=='FIX200' || fix200Meta.networkAdaptersRemovedAndVerified!==true) fix202Missing.push('metadane izolacji Hyper-V FIX200');
  if (fix201Meta.hotfix!=='FIX201' || fix201Meta.teacherOnlyMetrics!==true) fix202Missing.push('metadane panelu nauczyciela FIX201');
  if (fix198Meta.hotfix!=='FIX198' || fix198Meta.nativeReadOnlyHardwareAccess!==true) fix202Missing.push('metadane kolektora FIX198');
  if (fix202Missing.length) throw new Error(`FIX198–FIX202: publikacja zablokowana. Brakujące lub niezgodne elementy: ${fix202Missing.join('; ')}.`);
  log('FIX198–FIX202: odczyt sprzętu Windows (lokalny skrypt), rzeczywisty renderer geometrii 3D, przygotowanie odizolowanej VM Hyper-V, statystyki klasy i 16 kluczy synchronizacji potwierdzone. Testy Windows/Hyper-V nadal wymagają uruchomienia na właściwym komputerze.');
  // FIX203–FIX209: membership/attendance, chunk sync, hardware triage, WebGL, Hyper-V audit, server exams and admin health.
  const fix203Api = fs.readFileSync(path.join(ROOT,'functions','api','classroom.js'),'utf8');
  const fix204Api = fs.readFileSync(path.join(ROOT,'functions','api','state.js'),'utf8');
  const fix205Runtime = fs.readFileSync(path.join(WEB,'assets','academy-hardware-import-fix198.js'),'utf8');
  const fix206Runtime = fs.readFileSync(path.join(WEB,'assets','academy-workshop-3d-fix199.js'),'utf8');
  const fix208Api = fs.readFileSync(path.join(ROOT,'functions','api','certificates.js'),'utf8');
  const fix209Api = fs.readFileSync(path.join(ROOT,'functions','api','admin','health.js'),'utf8');
  const fix203Meta = releaseJson.academyClassMembershipAttendanceFix203 || {};
  const fix204Meta = releaseJson.academyChunkedStateSyncFix204 || {};
  const fix205Meta = releaseJson.academyHardwareAssessmentFix205 || {};
  const fix206Meta = releaseJson.academyWebglWorkshopFix206 || {};
  const fix207Meta = releaseJson.academyHyperVStaticTriageFix207 || {};
  const fix208Meta = releaseJson.academyServerGradedExamFix208 || {};
  const fix209Meta = releaseJson.academyAdminHealthFix209 || {};
  const fix203Files = ['migrations/0018_academy_user_state_chunks_fix204.sql','migrations/0019_server_graded_exams_fix208.sql','tools/FIX207_VERIFY_HYPERV_ISOLATION.ps1','tools/FIX207_STATIC_FILE_TRIAGE.ps1','VERIFY_LABORATORIUM_FIX207.cmd','ANALIZA_PLIKU_FIX207.cmd','scripts/test-fix203-class-roster-attendance.mjs','scripts/test-fix204-chunked-state-sync.mjs','scripts/test-fix205-hardware-assessment.mjs','scripts/test-fix206-webgl-workshop.mjs','scripts/test-fix207-hyperv-hardening.mjs','scripts/test-fix208-server-graded-exam.mjs','scripts/test-fix209-admin-health.mjs','scripts/test-fix203-209-publisher-guard.mjs','scripts/run-tests-fix209.mjs','TESTY_FIX203_FIX209.cmd','CHANGELOG_6.8.0_FIX203_209.txt','FIX203_209_IMPLEMENTATION_AUDIT.txt','README_FIX203_CLASSROOM.md','README_FIX204_CHUNK_SYNC.md','README_FIX205_HARDWARE_ASSESSMENT.md','README_FIX206_WEBGL.md','README_FIX207_SAFE_TRIAGE.md','README_FIX208_EXAMS.md','README_FIX209_ADMIN_HEALTH.md','WEB_PUBLISH/assets/academy-admin-center-fix209.js','WEB_PUBLISH/assets/academy-admin-center-fix209.css'];
  const fix203AssetPaths = ['assets/academy-teacher-dashboard-fix201.css','assets/academy-hardware-import-fix198.js','assets/academy-hardware-import-fix198.css','assets/academy-workshop-3d-fix199.js','assets/academy-workshop-3d-fix199.css','assets/academy-admin-center-fix209.js','assets/academy-admin-center-fix209.css','assets/cloud-academy.js'];
  const fix203RuntimeValid = fix203Api.includes('academy_classroom_member') && fix203Api.includes('academy_classroom_attendance') && fix203Api.includes("action === 'join'") && fix203Api.includes("action === 'attendance'") && html.includes('id="a162AttendanceDate"');
  const fix204RuntimeValid = fix204Api.includes('academy_user_state_chunks') && fix204Api.includes('MAX_STATE_CHARS') && fix204Api.includes('STATE_CHUNKS_INVALID') && fs.readFileSync(path.join(WEB,'assets','cloud-academy.js'),'utf8').includes('raw.length>360000');
  const fix205RuntimeValid = fix205Runtime.includes('NaukaFix205AssessHardware') && fix205Runtime.includes('WHEA') && fix205Runtime.includes('SMART');
  const fix206RuntimeValid = fix206Runtime.includes("getContext('webgl2'") && fix206Runtime.includes('gl.compileShader') && fix206Runtime.includes('gl.drawArrays') && fix206Runtime.includes('createScene');
  const fix207RuntimeValid = fs.readFileSync(path.join(ROOT,'tools','FIX207_VERIFY_HYPERV_ISOLATION.ps1'),'utf8').includes('NO_GUEST_INTEGRATION_SERVICES') && fs.readFileSync(path.join(ROOT,'tools','FIX207_STATIC_FILE_TRIAGE.ps1'),'utf8').includes('executionPerformed=$false');
  const fix208RuntimeValid = fix208Api.includes("action==='start'") && fix208Api.includes("action==='submit'") && fix208Api.includes('EXAM_ACTION_INVALID') && fix208Api.includes('question_payload');
  const fix209RuntimeValid = fix209Api.includes('checkAdmin(request,env)') && fix209Api.includes('secretsReturned:false') && html.includes('id="a209RunHealth"') && html.includes('id="a209HealthOutput"');
  const fix203AssetAudit = verifyHtmlAssetsInServiceWorker({ html, serviceWorker: sw, webRoot: WEB, assets: fix203AssetPaths });
  const fix203PwaValid = fix203AssetAudit.ok;
  const fix203CoreMissing = fix203Files.some(file=>!fs.existsSync(path.join(ROOT,file))) || !fix203PwaValid || !fix203RuntimeValid || !fix204RuntimeValid || !fix205RuntimeValid || !fix206RuntimeValid || !fix207RuntimeValid || !fix208RuntimeValid || !fix209RuntimeValid || fix203Meta.hotfix!=='FIX203' || fix204Meta.maximumStateJsonCharacters!==360000 || fix205Meta.automatedVerdict!==false || fix206Meta.renderer!=='WebGL 2 / WebGL 1 with Canvas 2D fallback' || fix207Meta.staticFileExecution!==false || fix208Meta.serverSideGrading!==true || fix209Meta.adminTokenStored!==false;
  if (fix203CoreMissing) {
    const fix203PwaDetails = fix203PwaValid ? '' : ' Niezgodność HTML/PWA: ' + fix203AssetAudit.errors.join('; ') + '.';
    throw new Error('FIX203–FIX209: brakuje integracji klas, porcji D1, diagnostyki, WebGL, audytu Hyper-V, egzaminu serwerowego lub panelu administratora; publikacja zablokowana.' + fix203PwaDetails);
  }
  log('FIX203–FIX209: członkostwo i obecności klas, synchronizacja porcji do 360 KB, sygnały diagnostyczne, renderer WebGL, audyt izolacji Hyper-V, ocena egzaminu po stronie serwera i kontrola administratora są podłączone. Testy Windows/Hyper-V wymagają uruchomienia w Windows; produkcyjne OAuth/Cloudflare wymagają odrębnej weryfikacji.');


  // FIX210–FIX218: D1 backup, account security, classroom announcements, offline retry, hardware and Hyper-V audits, server exams and admin aggregates.
  const fix210Files=['tools/FIX210_BACKUP_D1_BEFORE_MIGRATION.ps1','BACKUP_D1_FIX210.cmd','migrations/0020_account_security_events_fix211.sql','functions/api/auth/security-events.js','tools/FIX215_WINDOWS_DEEP_DIAGNOSTIC.ps1','DIAGNOSTYKA_WINDOWS_FIX215.cmd','tools/FIX216_HYPERV_SECURITY_AUDIT.ps1','AUDYT_HYPERV_FIX216.cmd','CHANGELOG_6.8.0_FIX210_218.txt','FIX210_218_IMPLEMENTATION_AUDIT.txt','scripts/fix210-release-preflight.mjs','scripts/run-tests-fix210-218.mjs','scripts/test-fix210-218-implementation.mjs','scripts/test-fix210-218-publisher-guard.mjs','TESTY_FIX210_FIX218.cmd','README_FIX210_D1_BACKUP.md','README_FIX211_ACCOUNT_SECURITY.md','README_FIX212_CLASSROOM.md','README_FIX213_OFFLINE_QUEUE.md','README_FIX214_HARDWARE_SENSORS.md','README_FIX215_WINDOWS_DIAGNOSTICS.md','README_FIX216_HYPERV_AUDIT.md','README_FIX217_EXAM_BANK.md','README_FIX218_ADMIN_ANALYTICS.md','functions/api/auth/email/verify.js','functions/api/auth/password/reset.js','WEB_PUBLISH/assets/academy-platform-fix210-218.js','WEB_PUBLISH/assets/academy-platform-fix210-218.css'];
  const fix210Css='academy-platform-fix210-218.css?v=6.8.0-fix218',fix210Js='academy-platform-fix210-218.js?v=6.8.0-fix228';
  const fix217Api=fs.readFileSync(path.join(ROOT,'functions','api','certificates.js'),'utf8');
  const fix212Api=fs.readFileSync(path.join(ROOT,'functions','api','classroom.js'),'utf8');
  const fix218Api=fs.readFileSync(path.join(ROOT,'functions','api','admin','health.js'),'utf8');
  const fix210Meta=localRelease.academyFix210||{},fix218Meta=localRelease.academyFix218||{};
  const fix217FinalQuestionPresent = /\bid\s*:\s*['"]pc-050['"]/.test(fix217Api); // FIX219: accept valid JS formatting with or without whitespace.
  const fix210Missing=[];
  for (const file of fix210Files) if (!fs.existsSync(path.join(ROOT,file))) fix210Missing.push(`plik ${file}`);
  if(!html.includes(fix210Css)) fix210Missing.push('CSS FIX210–FIX218 w HTML');
  if(!html.includes(fix210Js)) fix210Missing.push('JS FIX210–FIX218 w HTML');
  if(!sw.includes(fix210Css)) fix210Missing.push('CSS FIX210–FIX218 w PWA');
  if(!sw.includes(fix210Js)) fix210Missing.push('JS FIX210–FIX218 w PWA');
  if(!fix212Api.includes('academy_classroom_announcement')) fix210Missing.push('API ogłoszeń klasowych');
  if(!fix217FinalQuestionPresent) fix210Missing.push('końcowe pytanie pc-050 w banku egzaminacyjnym');
  if(!fix218Api.includes('personalDataReturned:false')) fix210Missing.push('ochrona danych panelu administratora');
  if(fix210Meta.hotfix!=='FIX210') fix210Missing.push('metadane FIX210');
  if(fix218Meta.hotfix!=='FIX218') fix210Missing.push('metadane FIX218');
  if(fix210Missing.length) throw new Error(`FIX210–FIX218: publikacja zablokowana. Brakujące elementy: ${fix210Missing.join('; ')}.`);
  log('FIX210–FIX218: pliki i zasoby PWA potwierdzone. Przed produkcją wymagane są kopia D1, migracja 0020 i testy rzeczywistego środowiska.');
  const fix219Required=['scripts/test-fix219-publisher-preflight.mjs','scripts/run-tests-fix219.mjs','TESTY_FIX219.cmd','README_FIX219_PUBLISHER_GUARD.md','CHANGELOG_6.8.0_FIX219.txt'];
  const fix219Missing=fix219Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  if(fix219Missing.length || !localRelease.academyFix219 || localRelease.academyFix219.hotfix!=='FIX219') throw new Error(`FIX219: niekompletna poprawka strażnika publikacji. Braki: ${fix219Missing.join('; ') || 'metadane FIX219'}.`);

  // FIX220–FIX228: release gate is mirrored in publisher and auto-watcher.
  const fix220to228Files=['migrations/0021_state_revision_cas_fix221.sql','migrations/0022_admin_exam_bank_fix222.sql','functions/api/admin/exam-bank.js','scripts/post-deploy-smoke-fix220.mjs','scripts/test-fix220-post-deploy-smoke.mjs','scripts/test-fix221-222-migrations.py','scripts/test-fix220-228-implementation.mjs','scripts/test-fix220-228-publisher-guard.mjs','scripts/test-fix221-state-revision-contract.mjs','scripts/test-fix222-exam-bank-contract.mjs','scripts/test-fix223-security-report-contract.mjs','scripts/test-fix224-226-local-tools-contract.mjs','scripts/test-fix225-glb-import.mjs','scripts/test-fix227-228-cert-admin-contract.mjs','scripts/run-tests-fix220-228.mjs','TESTY_FIX220_FIX228.cmd','tools/FIX224_LIVE_SENSOR_MONITOR.ps1','MONITOR_CZUJNIKOW_FIX224.cmd','tools/FIX226_HYPERV_LAB_MANAGER.ps1','ZARZADZANIE_LABORATORIUM_FIX226.cmd','README_FIX220_D1_BACKUP.md','README_FIX221_STATE_SYNC.md','README_FIX222_EXAM_BANK.md','README_FIX223_ACCOUNT_REPORT.md','README_FIX224_LIVE_SENSORS.md','README_FIX225_GLB_IMPORT.md','README_FIX226_HYPERV_MANAGER.md','README_FIX227_CERT_VERIFY.md','README_FIX228_ADMIN_ANALYTICS.md','CHANGELOG_6.8.0_FIX220_228.txt','FIX220_228_IMPLEMENTATION_AUDIT.txt'];
  const fix220to228Missing=fix220to228Files.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  for(const [asset,needle] of [['academy-fix220-228.css','academy-fix220-228.css?v=6.8.0-fix228'],['academy-fix222-exam-bank.js','academy-fix222-exam-bank.js?v=6.8.0-fix222'],['academy-workshop-3d-fix199.js','academy-workshop-3d-fix199.js?v=6.8.0-fix225-glb-import']]){if(!html.includes(needle))fix220to228Missing.push(`HTML ${asset}`);if(!sw.includes(asset))fix220to228Missing.push(`PWA ${asset}`);}
  if(!localRelease.academyFix220to228||localRelease.academyFix220to228.hotfix!=='FIX220–FIX228'||localRelease.academyFix220to228.productVersion!=='6.8.0')fix220to228Missing.push('metadane release FIX220–FIX228');
  if(fix220to228Missing.length)throw new Error(`FIX220–FIX228: publikacja zablokowana. Brakujące elementy: ${fix220to228Missing.join('; ')}.`);
  log('FIX220–FIX228: zasoby, migracje, testy i metadane wydania potwierdzone.');

  // FIX229: cache-busting zasobu weryfikacji certyfikatów.
  const fix229Required=['README_FIX229_PWA_CERT_CACHE.md','CHANGELOG_6.8.0_FIX229.txt','scripts/test-fix229-certificate-cache.mjs','scripts/test-fix229-publisher-guard.mjs','scripts/run-tests-fix220-229.mjs','TESTY_FIX220_FIX229.cmd'];
  const fix229Missing=fix229Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  const fix229Asset='academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification';
  if(!html.includes(fix229Asset))fix229Missing.push('HTML zasób certyfikatów FIX229');
  if(!sw.includes(`/${fix229Asset}`))fix229Missing.push('PWA zasób certyfikatów FIX229');
  if(!localRelease.academyFix229||localRelease.academyFix229.hotfix!=='FIX229'||localRelease.academyFix229.productVersion!=='6.8.0')fix229Missing.push('metadane FIX229');
  if(fix229Missing.length)throw new Error(`FIX229: brakujące elementy wydania: ${fix229Missing.join('; ')}.`);
  log('FIX229: cache certyfikatu odświeżony w HTML i PWA; kontrola wydania PASS.');

  // FIX230: porównuj aktualne, wersjonowane odwołania HTML i PWA zamiast historycznych numerów FIX.
  const fix230Required=['scripts/fix230-pwa-asset-guard.cjs','scripts/test-fix230-pwa-asset-guard.mjs','scripts/test-fix230-publisher-guard.mjs','scripts/run-tests-fix220-230.mjs','TESTY_FIX220_FIX230.cmd','README_FIX230_PUBLISHER_ASSET_PARITY.md','CHANGELOG_6.8.0_FIX230.txt','FIX230_IMPLEMENTATION_AUDIT.txt'];
  const fix230Missing=fix230Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  const fix230AssetPaths=['assets/academy-workshop-3d-fix199.js','assets/academy-workshop-3d-fix199.css','assets/academy-hardware-import-fix198.js','assets/academy-hardware-import-fix198.css','assets/academy-teacher-dashboard-fix201.css','assets/cloud-academy.js','assets/academy-admin-center-fix209.js','assets/academy-admin-center-fix209.css'];
  const fix230AssetAudit=verifyHtmlAssetsInServiceWorker({html,serviceWorker:sw,webRoot:WEB,assets:fix230AssetPaths});
  if(!fix230AssetAudit.ok)fix230Missing.push(...fix230AssetAudit.errors);
  if(!localRelease.academyFix230||localRelease.academyFix230.hotfix!=='FIX230'||localRelease.academyFix230.productVersion!=='6.8.0')fix230Missing.push('metadane FIX230');
  if(fix230Missing.length)throw new Error(`FIX230: kontrola zgodności zasobów HTML/PWA nie przeszła. Braki: ${fix230Missing.join('; ')}.`);
  log('FIX230: aktualne wersje zasobów FIX198–FIX209 są zgodne pomiędzy HTML, plikami i Service Worker.');


  // FIX231–FIX239: notifications, privacy export, guardian consent, offline snapshots and deployment smoke tests.
  const fix231239Required=["migrations/0023_platform_experience_fix231_239.sql", "functions/_notifications.js", "functions/_webpush.js", "functions/api/notifications.js", "functions/api/guardians.js", "functions/api/content-reports.js", "functions/api/admin/content-reports.js", "scripts/post-deploy-smoke-fix239.mjs", "scripts/audit-content-quality-fix236.mjs", "scripts/test-fix231-239-platform.mjs", "scripts/test-fix232-web-push.mjs", "scripts/test-fix239-post-deploy-smoke-contract.mjs", "scripts/test-fix231-239-migration.py", "scripts/test-fix231-239-publisher-guard.mjs", "scripts/test-fix231-239-pwa-assets.mjs", "scripts/run-tests-fix220-239.mjs", "TESTY_FIX220_FIX239.cmd", "GENERUJ_KLUCZE_PUSH_FIX232.cmd", "BACKUP_D1_FIX235.cmd", "VERIFY_D1_BACKUP_FIX235.cmd", "RESTORE_D1_STAGING_FIX235.cmd", "tools/FIX235_VERIFY_D1_BACKUP.ps1", "tools/FIX235_RESTORE_D1_STAGING_ONLY.ps1", "scripts/generate-vapid-keys-fix232.mjs", "README_FIX231_DATA_EXPORT.md", "README_FIX232_NOTIFICATIONS.md", "README_FIX233_LOCALIZATION.md", "README_FIX234_ACCESSIBILITY.md", "README_FIX235_BACKUP_RESTORE.md", "README_FIX236_CONTENT_QUALITY.md", "README_FIX237_GUARDIAN_PORTAL.md", "README_FIX238_OFFLINE.md", "README_FIX239_POST_DEPLOY_TESTS.md", "CHANGELOG_6.8.0_FIX231_239.txt", "FIX231_239_IMPLEMENTATION_AUDIT.txt"];
  const fix231239Missing=fix231239Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  const fix231239Assets=['assets/platform-enhancements-fix231-239.css','assets/platform-enhancements-fix231-239.js'];
  const fix231239Audit=verifyHtmlAssetsInServiceWorker({html,serviceWorker:sw,webRoot:WEB,assets:fix231239Assets});
  if(!fix231239Audit.ok)fix231239Missing.push(...fix231239Audit.errors);
  if(!localRelease.academyFix231to239||localRelease.academyFix231to239.hotfix!=='FIX231–FIX239'||localRelease.academyFix231to239.productVersion!=='6.8.0')fix231239Missing.push('metadane FIX231–FIX239');
  for(let fix=231;fix<=239;fix++){const key=`academyFix${fix}`;if(localRelease[key]?.hotfix!==`FIX${fix}`||localRelease[key]?.productVersion!=='6.8.0')fix231239Missing.push(`metadane ${key}`);}
  if(!html.includes('platform-enhancements-fix231-239.js?v=6.8.0-fix239')||!sw.includes('platform-enhancements-fix231-239.js?v=6.8.0-fix239'))fix231239Missing.push('zgodność zasobu UI FIX239 w HTML/Service Worker');
  if(fix231239Missing.length)throw new Error(`FIX231–FIX239: publikacja zablokowana. Braki: ${fix231239Missing.join('; ')}.`);
  log('FIX231–FIX239: migracja 0023, powiadomienia, eksport, opiekunowie, dostępność, offline i smoke test są zgodne.');

  // FIX240: watcher must require the publisher scope regression test and metadata.
  const fix240Required=['scripts/test-fix240-publisher-scope.mjs','scripts/run-tests-fix240.mjs','TESTY_FIX240.cmd','README_FIX240_PUBLISHER_SCOPE.md','CHANGELOG_6.8.0_FIX240.txt','FIX240_IMPLEMENTATION_AUDIT.txt'];
  const fix240Missing=fix240Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  if(!localRelease.academyFix240||localRelease.academyFix240.hotfix!=='FIX240'||localRelease.academyFix240.productVersion!=='6.8.0')fix240Missing.push('metadane FIX240');
  if(fix240Missing.length)throw new Error(`FIX240: niekompletna poprawka zakresu publikatora. Braki: ${fix240Missing.join('; ')}.`);
  log('FIX240: watcher potwierdził test regresyjny zakresu publikatora.');


  // FIX241: reject invalid Pages Function JavaScript before deploy.
  const fix241Required=['scripts/test-fix241-functions-syntax.mjs','scripts/test-fix241-guardian-sql.py','scripts/run-tests-fix241.mjs','TESTY_FIX241.cmd','README_FIX241_GUARDIAN_FUNCTION_SYNTAX.md','CHANGELOG_6.8.0_FIX241.txt','FIX241_IMPLEMENTATION_AUDIT.txt'];
  const fix241Missing=fix241Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  if(!fs.existsSync(path.join(ROOT,'functions','api','guardians.js')))fix241Missing.push('functions/api/guardians.js');
  if(!localRelease.academyFix241||localRelease.academyFix241.hotfix!=='FIX241'||localRelease.academyFix241.productVersion!=='6.8.0'||localRelease.academyFix241.pagesDeployPerformed!==false)fix241Missing.push('metadane FIX241');
  if(fix241Missing.length)throw new Error(`FIX241: kontrola składni funkcji Pages niekompletna. Braki: ${fix241Missing.join('; ')}.`);
  log('FIX241: wymagany test składni wszystkich funkcji Pages przed publikacją.');

  const fix176Meta = localRelease.academyGlobalAcademyFallbackFix176 || {};
  const fix176CssPath = path.join(WEB, 'assets', 'global-academy-fallback-fix176.css');
  const globalSuiteRuntime = fs.readFileSync(path.join(WEB, 'assets', 'global-academy-suite-fix60.js'), 'utf8');
  const fix176FallbackValid = html.includes('id="globalAcademyFallback"') && html.includes('id="globalAcademyFallbackStatus"') && html.includes('class="nav-item top-nav-item a176-top-launch"') && html.includes('global-academy-fallback-fix176.css?v=6.8.0-fix176') && sw.includes('global-academy-fallback-fix176.css') && globalSuiteRuntime.includes('FIX176 Global Academy mount failed; static navigation fallback restored.');
  if (!fs.existsSync(fix176CssPath) || !fix176FallbackValid || fix176Meta.hotfix !== 'FIX176' || fix176Meta.globalAcademyStaticFallback !== true || fix176Meta.runtimeMountErrorRecovery !== true || fix176Meta.newViews !== 0 || fix176Meta.newD1Database !== false || fix176Meta.d1SchemaMigrations !== false) throw new Error('FIX176: awaryjny ekran Global Academy lub bezpieczny zakres aktualizacji nie przechodzi kontroli.');
  log('FIX176: Centrum Wiedzy ma widoczną stronę awaryjną, odtworzenie po błędzie skryptu oraz skróty do kursów, diagnostyki i Akademii Mistrza.');


  const posterManifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','video-poster-manifest-fix83.json'),'utf8'));
  if (posterManifest.hotfix !== 'FIX83' || posterManifest.posterCount !== 10 || posterManifest.visualAudit.minimumDctPhashHammingDistance < 10) throw new Error('FIX83: manifest plakatów wideo nie przechodzi kontroli unikalności.');
  for (const poster of posterManifest.files) { const posterPath = path.join(WEB, poster.file.split('?')[0].replace(/^\//,'')); if (!fs.existsSync(posterPath) || crypto.createHash('sha256').update(fs.readFileSync(posterPath)).digest('hex') !== poster.sha256) throw new Error(`FIX83: poster ${poster.id} nie zgadza się z manifestem SHA-256.`); }
  if (!/<section[^>]*class=["']view-section active["'][^>]*id=["']view-home["']/i.test(html)) throw new Error('Pulpit Akademii nie jest aktywnym widokiem startowym.');
  const mustExist = [
    'theme-440.css','theme-450.css','theme-500.css','theme-520.css','theme-521.css','theme-522.css','theme-523.css','theme-530.css','theme-600.css','theme-630.css','scroll-navigation-630.js','ultra-cyber-530.js','ultimate-600.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','lesson-count-610.js','knowledge-hub-610.js','academy-dashboard-610.js','theme-controller-610.js','theme-610.css',
    'academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js',
    'device-model-catalog.js','community-models.js','labplus-engine.js','lab45-service-center.js',
    'neon-motion.js','visitor-dashboard.js','cloud-academy.js','progress-backup-621.js','progress-backup-621.css','measurement-log-640.js','measurement-log-640.css','master-workshop-630.js','master-workshop-630.css','master-workshop-630-extension.js','master-workshop-630-extension.css','master-academy-640-pro.js','master-academy-640-pro.css','master-academy-650-ultimate.js','master-academy-650-ultimate.css','master-academy-660-center.js','master-academy-660-center.css','academy-deployment-migration-refurb-fix181.js','academy-deployment-migration-refurb-fix181.css','academy-specialist-systems-fix182.js','academy-specialist-systems-fix182.css','academy-advanced-service-lab-fix183.js','academy-advanced-service-lab-fix183.css','academy-expert-diagnostics-fix184.js','academy-expert-diagnostics-fix184.css','academy-performance-firmware-fix185.js','academy-performance-firmware-fix185.css','academy-performance-firmware-fix185-data.json','academy-practical-lab-fix186.js','academy-practical-lab-fix186.css','practice-academy-fix27.js','practice-academy-fix27.css','cloud-academy.js','theme-531.css','pwa-icon.svg','nauka-centrum-fix40.js','nauka-centrum-fix40.css','akademia-serwisanta-fix41.js','akademia-serwisanta-fix41.css','real-workshop-fix42.js','real-workshop-fix42.css','knowledge-suite-fix43.js','knowledge-suite-fix43.css','master-service-center-fix44.js','master-service-center-fix44.css','knowledge-updates-fix44.json','professional-service-fix45.js','professional-service-fix45.css','master-control-fix47.js','master-control-fix47.css','ultimate-quality-fix49.js','ultimate-quality-fix49.css','global-academy-suite-fix60.js','global-academy-suite-fix60.css','global-academy-suite-manifest-fix60.json','visual-uniqueness-fix83.js','visual-uniqueness-manifest-fix83.json','video-poster-manifest-fix83.json','photo-catalog-fix109.js','photo-catalog-fix109.css','photo-catalog-fix111.js','photo-catalog-fix115.js','home-specialist-photo-layout-fix115.css','homepage-photo-prime-fix118.js','homepage-photo-prime-fix118.css'
  ];
  for (const asset of mustExist) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`Brak wymaganych assets/${asset}.`);
  const fix40Markup = ['view-learnpro','l40ContinueCard','l40BookmarkList','l40SearchForm','l40BenchCase','l40ExamPicker','l40CertificateList','l40AtlasResults','l40BoardForm','l40ExportOfflineHtml','l40OfflineImport','l40CacheDocuments','l40OfflineDocsStatus','l40ReportForm','l40ReportFromPractice','l40ReportHistory'];
  for (const id of fix40Markup) if (!html.includes(`id="${id}"`)) throw new Error(`FIX40: brak elementu ${id}; publikacja zablokowana.`);
  for (const pane of ['dashboard','search','bench','exams','atlas','offline','reports']) if (!html.includes(`data-l40-pane="${pane}"`)) throw new Error(`FIX40: brak panelu ${pane}.`);
  if (!html.includes('data-view="learnpro"') || !html.includes('assets/nauka-centrum-fix40.js?v=6.8.0-fix40') || !html.includes('assets/nauka-centrum-fix40.css?v=6.8.0-fix40')) throw new Error('FIX40: brak nawigacji lub zasobów w HTML.');
  const fix40Runtime = fs.readFileSync(path.join(WEB,'assets','nauka-centrum-fix40.js'),'utf8');
  const fix40Css = fs.readFileSync(path.join(WEB,'assets','nauka-centrum-fix40.css'),'utf8');
  for (const key of ['makeOfflinePackage','validateOfflinePackage','qrSvg','evaluateExam','cacheLibraryForOffline','fillReportFromLastPractice','runBenchCheck','ACADEMY_FREE_CHAT?.search','educationalOnly']) if (!fix40Runtime.includes(key)) throw new Error(`FIX40: brak wymaganej funkcji ${key}.`);
  for (const selector of ['.l40-hero','.l40-tabs','.l40-pane','.l40-atlas-grid','.l40-report-form']) if (!fix40Css.includes(selector)) throw new Error(`FIX40: brak CSS ${selector}.`);
  if (!fs.existsSync(path.join(ROOT,'scripts','test-nauka-centrum-fix40.mjs'))) throw new Error('FIX40: brak testu regresji.');
  const fix41RuntimePath = path.join(WEB,'assets','akademia-serwisanta-fix41.js');
  const fix41CssPath = path.join(WEB,'assets','akademia-serwisanta-fix41.css');
  if (!fs.existsSync(fix41RuntimePath) || !fs.existsSync(fix41CssPath) || !fs.existsSync(path.join(ROOT,'scripts','test-akademia-serwisanta-fix41.mjs'))) throw new Error('FIX41: brak runtime, CSS lub testu regresji.');
  const fix41Runtime = fs.readFileSync(fix41RuntimePath,'utf8');
  const fix41Css = fs.readFileSync(fix41CssPath,'utf8');
  if (!html.includes('data-l40-pane=\"academy41\"') || !html.includes('data-l40-tab=\"academy41\"') || !html.includes('akademia-serwisanta-fix41.js?v=6.8.0-fix41') || !html.includes('akademia-serwisanta-fix41.css?v=6.8.0-fix41')) throw new Error('FIX41: brak nowej zakładki lub zasobów w HTML.');
  if (!fix41Runtime.includes('PC ASSEMBLY SIMULATOR') || !fix41Runtime.includes('FAULT GENERATOR PRO') || !fix41Runtime.includes('localStorage') || !fix41Css.includes('.f41-overview-grid')) throw new Error('FIX41: kontrakt Akademii Serwisanta niekompletny.');
  const fix42RuntimePath = path.join(WEB,'assets','real-workshop-fix42.js');
  const fix42CssPath = path.join(WEB,'assets','real-workshop-fix42.css');
  if (!fs.existsSync(fix42RuntimePath) || !fs.existsSync(fix42CssPath) || !fs.existsSync(path.join(ROOT,'scripts','test-real-workshop-fix42.mjs'))) throw new Error('FIX42: brak runtime, CSS lub testu regresji.');
  const fix42Runtime = fs.readFileSync(fix42RuntimePath,'utf8');
  const fix42Css = fs.readFileSync(fix42CssPath,'utf8');
  if (!html.includes('data-l40-pane=\"workshop42\"') || !html.includes('data-l40-tab=\"workshop42\"') || !html.includes('real-workshop-fix42.js?v=6.8.0-fix42') || !html.includes('real-workshop-fix42.css?v=6.8.0-fix42')) throw new Error('FIX42: brak nowej zakładki lub zasobów w HTML.');
  if (!['parseBoardview','evaluateInstrument','evaluateSupply','waveformPoints','diagnose','checkCompatibility','makeJob','NP_NAUKA_FIX42'].every(token=>fix42Runtime.includes(token)) || !['.f42-board-wrap','.f42-grid','.f42-form','.f42-result'].every(token=>fix42Css.includes(token))) throw new Error('FIX42: kontrakt Real Workshop PRO jest niekompletny.');
  const fix43RuntimePath=path.join(WEB,'assets','knowledge-suite-fix43.js');
  const fix43CssPath=path.join(WEB,'assets','knowledge-suite-fix43.css');
  if(!fs.existsSync(fix43RuntimePath)||!fs.existsSync(fix43CssPath)||!fs.existsSync(path.join(ROOT,'scripts','test-knowledge-suite-fix43.mjs'))||!fs.existsSync(path.join(ROOT,'scripts','test-site-feedback-fix43-runtime.mjs'))) throw new Error('FIX43: brak modułu wiedzy/opinii lub testów.');
  const fix43Runtime=fs.readFileSync(fix43RuntimePath,'utf8');
  const fix43Css=fs.readFileSync(fix43CssPath,'utf8');
  if(!html.includes('id="view-fix43"')||!html.includes('id="view-feedback"')||!html.includes('data-view="fix43"')||!html.includes('data-view="feedback"')||!html.includes('knowledge-suite-fix43.js?v=6.8.0-fix43')||!html.includes('knowledge-suite-fix43.css?v=6.8.0-fix43')) throw new Error('FIX43: brak widoków i zasobów w HTML.');
  if(!['diagnoseBoard','evaluateSequence','parseSerialLine','checkBuild','buildEncryptedBackup','restoreEncryptedBackup','NP_NAUKA_FIX43'].every(token=>fix43Runtime.includes(token))||!['.f43-page-head','.f43-tabs','.f43-overview-grid','.f43-feedback-grid','.f43-stars'].every(token=>fix43Css.includes(token))) throw new Error('FIX43: kontrakt nowej akademii niekompletny.');
  const migration17=fs.readFileSync(path.join(ROOT,'migrations','0017_site_feedback_fix43.sql'),'utf8');
  if(!migration17.includes('CREATE TABLE IF NOT EXISTS academy_site_feedback')||/DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE\s+academy_users/i.test(migration17)) throw new Error('FIX43: migracja opinii musi być addytywna.');
  if(!fs.existsSync(path.join(FUNCTIONS,'api','site-feedback.js'))||!fs.existsSync(path.join(FUNCTIONS,'api','admin','site-feedback.js'))) throw new Error('FIX43: brak endpointów opinii.');
  const fix44RuntimePath=path.join(WEB,'assets','master-service-center-fix44.js');
  const fix44CssPath=path.join(WEB,'assets','master-service-center-fix44.css');
  const fix44Runtime=fs.existsSync(fix44RuntimePath)?fs.readFileSync(fix44RuntimePath,'utf8'):'';
  const fix44Css=fs.existsSync(fix44CssPath)?fs.readFileSync(fix44CssPath,'utf8'):'';
  const fix44ManifestPath=path.join(WEB,'assets','knowledge-updates-fix44.json');
  const fix44Manifest=fs.existsSync(fix44ManifestPath)?JSON.parse(fs.readFileSync(fix44ManifestPath,'utf8')):null;
  if(!fs.existsSync(fix44RuntimePath)||!fs.existsSync(fix44CssPath)||!fix44Manifest||!fs.existsSync(path.join(ROOT,'scripts','test-master-service-center-fix44.mjs'))) throw new Error('FIX44: brak Master Service Center, manifestu źródeł lub testów.');
  if(!html.includes('id="view-fix44"')||!html.includes('data-view="fix44"')||!html.includes('master-service-center-fix44.js?v=6.8.0-fix44')||!html.includes('master-service-center-fix44.css?v=6.8.0-fix44')||!sw.includes('master-service-center-fix44.js')||!sw.includes('master-service-center-fix44.css')) throw new Error('FIX44: brak widoku, zasobów lub cache PWA.');
  const fix44RuntimeLower = fix44Runtime.toLowerCase();
  const fix44RequiredTokens = ['Laptop Identification PRO','BIOS Database 360','Thermal Diagnostic PRO','CPU GPU Architecture Academy','Battery & Charging Lab','Data Recovery Academy','Network & Router Academy','3D Electronics Explorer','Repair Case Marketplace','Service Manager','AI Learning Coach','Quality Center','Repair Simulator WORLD','Universal Technical Library','Global Knowledge Update','NP_NAUKA_FIX44'];
  if(!fix44RequiredTokens.every(token=>fix44RuntimeLower.includes(token.toLowerCase()))||!['.f44-page-head','.f44-tabs','.f44-grid','.f44-board-wrap','.f44-qa-results'].every(token=>fix44Css.includes(token))) throw new Error('FIX44: kontrakt funkcji i stylów niekompletny.');
  if(!fs.existsSync(path.join(ROOT,'scripts','test-watcher-fix44-case-contract-fix46.mjs'))) throw new Error('FIX46: brak testu zgodności kontraktu FIX44 bez względu na wielkość liter.');
  if(!Array.isArray(fix44Manifest.sources)||fix44Manifest.sources.length<8||!/^[a-f0-9]{64}$/.test(fix44Manifest.integrity||'')) throw new Error('FIX44: manifest wiedzy nie ma prawidłowej struktury i SHA-256.');
  const fix45RuntimePath=path.join(WEB,'assets','professional-service-fix45.js');
  const fix45CssPath=path.join(WEB,'assets','professional-service-fix45.css');
  const fix45Runtime=fs.existsSync(fix45RuntimePath)?fs.readFileSync(fix45RuntimePath,'utf8'):'';
  const fix45Css=fs.existsSync(fix45CssPath)?fs.readFileSync(fix45CssPath,'utf8'):'';
  if(!fs.existsSync(fix45RuntimePath)||!fs.existsSync(fix45CssPath)||!fs.existsSync(path.join(ROOT,'scripts','test-professional-service-fix45.mjs'))||!fs.existsSync(path.join(ROOT,'scripts','test-watcher-service-worker-tdz-fix45.mjs'))) throw new Error('FIX45: brak modułu, CSS lub testów regresji.');
  if(!html.includes('id="view-fix45"')||!html.includes('data-view="fix45"')||!html.includes('professional-service-fix45.js?v=6.8.0-fix45')||!html.includes('professional-service-fix45.css?v=6.8.0-fix45')||!sw.includes('professional-service-fix45.js')||!sw.includes('professional-service-fix45.css')||!sw.includes('fix45-professional-service-20261104')) throw new Error('FIX45: widok, zasoby lub cache PWA nie są kompletne.');
  for(const token of ['browserInventory','parseHardwareId','evaluatePsuRails','evaluateQuality','diagnose','runSafeBenchmark','NP_NAUKA_FIX45']) if(!fix45Runtime.includes(token)) throw new Error(`FIX45: brak funkcji ${token}.`);
  for(const selector of ['.f45-page-head','.f45-tabs','.f45-grid','.f45-form','.f45-qa']) if(!fix45Css.includes(selector)) throw new Error(`FIX45: brak stylu ${selector}.`);
  const fix47RuntimePath=path.join(WEB,'assets','master-control-fix47.js');
  const fix47CssPath=path.join(WEB,'assets','master-control-fix47.css');
  const fix47TestPath=path.join(ROOT,'scripts','test-master-control-fix47.mjs');
  const fix47ContractTestPath=path.join(ROOT,'scripts','test-watcher-fix47-contract.mjs');
  const fix48CacheTdzTestPath=path.join(ROOT,'scripts','test-watcher-cache-name-tdz-fix48.mjs');
  const fix47Runtime=fs.existsSync(fix47RuntimePath)?fs.readFileSync(fix47RuntimePath,'utf8'):'';
  const fix47Css=fs.existsSync(fix47CssPath)?fs.readFileSync(fix47CssPath,'utf8'):'';
  if(!fs.existsSync(fix47RuntimePath)||!fs.existsSync(fix47CssPath)||!fs.existsSync(fix47TestPath)||!fs.existsSync(fix47ContractTestPath)) throw new Error('FIX47: brak Master Control Center, CSS lub testów regresji.');
  if(!fs.existsSync(fix48CacheTdzTestPath)) throw new Error('FIX48: brak testu kolejności inicjalizacji CACHE_NAME w watcherze.');
  if(!html.includes('id="view-fix47"')||!html.includes('data-view="fix47"')||!html.includes('master-control-fix47.js?v=6.8.0-fix47')||!html.includes('master-control-fix47.css?v=6.8.0-fix47')||!sw.includes('master-control-fix47.js')||!sw.includes('master-control-fix47.css')||swCacheName !== 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115') throw new Error('FIX47: widok, zasoby lub cache PWA są niekompletne.');
  verifyFix51Release(ROOT); // verifyFix50Release(ROOT) remains available for the historical contract.
  log('FIX49: wspólny manifest, Service Worker, assety i testy wydania są zgodne.');
  for(const token of ['NP_NAUKA_FIX47','runStaticChecks','runAssetAudit','loadRemoteFeedback','updateFeedbackStatus','compatibility','mentorPlan','addOrder','completeProject','addCoursePlan','exportBackupObject']) if(!fix47Runtime.includes(token)) throw new Error(`FIX47: brak wymaganej funkcji ${token}.`);
  for(const selector of ['.f47-page-head','.f47-tabs','.f47-grid','.f47-check-list','.f47-project-list']) if(!fix47Css.includes(selector)) throw new Error(`FIX47: brak CSS ${selector}.`);
  for (const file of ['AUDYT_STANOWISKA_FIX17.ps1','URUCHOM_AUDYT_STANOWISKA_FIX17.cmd']) if (!fs.existsSync(path.join(ROOT,file))) throw new Error(`Brak dodatku lokalnego ${file}.`);
  for (const asset of ['ultimate-workshop-620.js','ultimate-workshop-620.css','nauka-od-a-do-z.css','lab-device-bridge-630.js','lab-device-bridge-630.css','theme-630.css','scroll-navigation-630.js','advanced-learning-studio-620.js','advanced-learning-studio-620.css','homepage-showcase-640.js','homepage-showcase-640.css','home-refresh-fix30.css','photo-unique-thumbnails-fix30.js']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`Brak zasobu 6.2.0 assets/${asset}.`);
  const homeShowcaseJs = fs.readFileSync(path.join(WEB,'assets','homepage-showcase-640.js'),'utf8');
  const homeShowcaseCss = fs.readFileSync(path.join(WEB,'assets','homepage-showcase-640.css'),'utf8');
  const homeShowcaseGuard = verifyHomepageShowcase(html, homeShowcaseJs, homeShowcaseCss);
  log(`Pokaz FIX80 i Centrum Nauki: ${homeShowcaseGuard.slides} slajdów, ${homeShowcaseGuard.uniqueIllustrations} różnych ilustracji SVG, bez ponownego użycia zdjęć.`);
  const photoUiCss = fs.readFileSync(path.join(WEB,'assets','theme-630.css'),'utf8');
  const photoUiJs = fs.readFileSync(path.join(WEB,'assets','lesson-art.js'),'utf8');
  const appUiJs = fs.readFileSync(path.join(WEB,'assets','app.js'),'utf8');
  const longVideoUiJs = fs.readFileSync(path.join(WEB,'assets','long-video-catalog-620.js'),'utf8');
  const studioRuntime = fs.readFileSync(path.join(WEB,'assets','advanced-learning-studio-620.js'),'utf8');
  const studioCss = fs.readFileSync(path.join(WEB,'assets','advanced-learning-studio-620.css'),'utf8');
  if (!html.includes('id="longVideoGallery"') || !appUiJs.includes('data-repair-photo=') || !appUiJs.includes('data-long-video-done') || !longVideoUiJs.includes('window.ACADEMY_LONG_VIDEOS') || !html.includes('advanced-learning-studio-620.js?v=6.2.0-fix7') || !studioRuntime.includes('id="lab44-studio"') || !studioRuntime.includes('alsScopeCanvas') || !studioCss.includes('.als-studio')) throw new Error('Brak biblioteki unikalnych zdjęć, długich kursów lub studia praktycznego FIX7.');
  const longVideoItems = [...longVideoUiJs.matchAll(/\{id:'(LONG-[^']+)',photoId:'([^']+)'/g)];
  if (longVideoItems.length < 12 || new Set(longVideoItems.map(item => item[2])).size !== longVideoItems.length) throw new Error('Katalog FIX7 musi zawierać co najmniej 12 szkoleń z unikalnymi okładkami.');
  const photoEngineRuntimeMarker = "api.uniquePhotoEngineVersion='6.8.0-fix51-visual-assets-reuse'";
  const photoEngineRuntimeValid = photoUiJs.includes(photoEngineRuntimeMarker) && photoUiJs.includes('uniquePhotoEnginePolicy=') && photoUiJs.includes('PHOTO_SLOTS = 3') && photoUiJs.includes('perceptualHashBestEffort:true') && photoUiJs.includes('localFirst:true') && photoUiJs.includes('offlineFallback:true');
  const visualRuntime = fs.readFileSync(path.join(WEB,'assets','visual-assets-fix51.js'),'utf8');
  const visualAcademyRuntime = fs.readFileSync(path.join(WEB,'assets','visual-academy-fix51.js'),'utf8');
  const visualManifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','visual-asset-manifest-fix51.json'),'utf8'));
  if (!photoUiCss.includes('position:fixed!important') || !photoUiCss.includes('#np630BackTop') || !photoEngineRuntimeValid || !photoUiJs.includes('api.openverse.org/v1/images/') || !photoUiJs.includes('commons.wikimedia.org/w/api.php') || !photoUiJs.includes('license_type') || !photoUiJs.includes('imageDHash') || /data:image\/svg\+xml/i.test(photoUiJs)) throw new Error('Brak stałej nawigacji lub poprawnego silnika fotografii.');
  if (!html.includes('visual-assets-fix51.js') || !html.includes('visual-academy-fix51.js') || !html.includes('visual-academy-fix51.css') || visualManifest.assets?.length !== 18 || !visualRuntime.includes('reuseAcrossLessons:false') || !visualAcademyRuntime.includes('fix51ScopeCanvas') || !sw.includes('artwork-fix51/18-connector-pinout.svg')) throw new Error('FIX51 Visual Academy: biblioteka wizualna, symulatory lub cache PWA są niekompletne.');
  for (const id of ['view-measurementpro','view-modelcenter','np62-meter-mode','np62-model-search','npmlMeasurementLog','npmlForm','npmlRows','npmlExportCsv']) if (!html.includes(`id="${id}"`)) throw new Error(`Brak modułu edukacyjnego 6.2.0/FIX11: ${id}.`);
  const measurementRuntime = fs.readFileSync(path.join(WEB,'assets','measurement-log-640.js'),'utf8');
  if (!measurementRuntime.includes('NP_MEASUREMENT_LOG') || !measurementRuntime.includes('validateEntry') || !measurementRuntime.includes('academyMeasurementLog') || !measurementRuntime.includes('function csv')) throw new Error('Brak walidowanego dziennika pomiarów FIX11.');
  const masterWorkshopRuntime = fs.readFileSync(path.join(WEB,'assets','master-workshop-630.js'),'utf8');
  const masterWorkshopCss = fs.readFileSync(path.join(WEB,'assets','master-workshop-630.css'),'utf8');
  const masterAcademyRuntime = fs.readFileSync(path.join(WEB,'assets','master-workshop-630-extension.js'),'utf8');
  const masterAcademyCss = fs.readFileSync(path.join(WEB,'assets','master-workshop-630-extension.css'),'utf8');
  for (const id of ['view-masterworkshop','nwmMasterWorkshop','nwmDomainGrid','nwmTopicDetail','nwmCasePicker','nwmExamPicker','nwmCaseForm','nwmNoteForm','nwmDatasheetSearch']) if (!html.includes(`id="${id}"`)) throw new Error(`Brak Warsztatu Mistrza FIX12: ${id}.`);
  for (const asset of ['academy-pro-modules-fix148.js','academy-pro-modules-fix148.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX148: brak zasobu Centrum technika: ${asset}.`);
  for (const asset of ['academy-master-extension-fix149.js','academy-master-extension-fix149.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX149: brak zasobu rozszerzenia Akademii: ${asset}.`);
  for (const asset of ['academy-practical-core-fix155.js','academy-practical-suite-fix155.js','academy-practical-suite-fix155.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX155: brak zasobu Akademii Praktycznej: ${asset}.`);
  for (const asset of ['academy-master-curriculum-core-fix162.js','academy-master-curriculum-fix162.js','academy-master-curriculum-fix162.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX162: brak zasobu Akademii Mistrza: ${asset}.`);
  for (const token of ['a162Extension','a162PartComplete','a162Measure','a162BuildCheck','a162SolderCheck','a162AiForm','a162ClassCreate','a162CertIssue','a162CertVerify','a162Search','a162ChallengeAnswers']) if (!html.includes(token)) throw new Error(`FIX162: brakuje modułu ${token}.`);
  const fix162Curriculum=localRelease.academyMasterCurriculumFix162||{};
  if (fix162Curriculum.hotfix!=='FIX162'||fix162Curriculum.productVersion!=='6.8.0'||fix162Curriculum.newViews!==0||fix162Curriculum.d1SchemaMigrations!==false||fix162Curriculum.newD1Tables!==false||fix162Curriculum.modules?.length!==11) throw new Error('FIX162: nieprawidłowy kontrakt modułów i D1.');
  for (const asset of ['academy-master-curriculum-core-fix162.js?v=6.8.0-fix162','academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification','academy-master-curriculum-fix162.css?v=6.8.0-fix162']) if (!html.includes(asset)||!sw.includes(`/${asset}`)) throw new Error(`FIX162: brak zasobu HTML/PWA: ${asset}.`);
  for (const api of ['classroom.js','certificates.js']) if (!fs.existsSync(path.join(ROOT,'functions','api',api))) throw new Error(`FIX162: brak API ${api}.`);
  const chatApiSource=fs.readFileSync(path.join(ROOT,'functions','api','chat.js'),'utf8');
  // Match the production runtime's env?.GEMINI_API_KEY as well as direct env.GEMINI_API_KEY access.
  const chatApiReadsGeminiKey = /\benv\s*(?:\?\.|\.)\s*GEMINI_API_KEY\b/.test(chatApiSource);
  const publisherGuardMeta=localRelease.academyGeminiPublisherGuardFix166;
  if(!chatApiSource.includes('generativelanguage.googleapis.com/v1/interactions')||!chatApiReadsGeminiKey||!chatApiSource.includes('topicRestricted')||chatApiSource.includes('Api-Revision')||chatApiSource.includes('api.openai.com/v1/responses')||chatApiSource.includes('env.AI.run')) throw new Error('FIX166: /api/chat musi odczytywać sekret Gemini (także przez optional chaining), używać Interactions API v1 i blokować alternatywnego dostawcę.');
  if(publisherGuardMeta?.hotfix!=='FIX166'||publisherGuardMeta?.publisherOnly!==true||publisherGuardMeta?.websiteRuntimeHotfix!=='FIX165'||publisherGuardMeta?.serviceWorkerCacheChanged!==false||publisherGuardMeta?.newD1Database!==false||publisherGuardMeta?.newD1Tables!==false||publisherGuardMeta?.d1SchemaMigrations!==false) throw new Error('FIX166: nieprawidłowy kontrakt poprawki strażnika publikacji.');
  const geminiSetupCmdPath=path.join(ROOT,'USTAW_KLUCZ_GEMINI.cmd');
  const geminiSetupPsPath=path.join(ROOT,'scripts','configure-gemini-secret.ps1');
  const geminiSetupCmd=fs.existsSync(geminiSetupCmdPath)?fs.readFileSync(geminiSetupCmdPath,'utf8'):'';
  const geminiSetupPs=fs.existsSync(geminiSetupPsPath)?fs.readFileSync(geminiSetupPsPath,'utf8'):'';
  const cmdOnlyGuard=localRelease.academyGeminiCmdOnlyGuardFix167;
  if(!fs.existsSync(path.join(ROOT,'scripts','configure-gemini-secret.js'))
    ||!geminiSetupCmd.includes('configure-gemini-secret.ps1')
    ||!geminiSetupCmd.includes('powershell.exe')
    ||!geminiSetupPs.includes('Read-Host -Prompt')
    ||!geminiSetupPs.includes('-AsSecureString')
    ||!geminiSetupPs.includes('--stdin-secret')
    ||!geminiSetupPs.includes('StandardInput.WriteLine($PlainValue)')
    ||cmdOnlyGuard?.hotfix!=='FIX167'
    ||cmdOnlyGuard?.keyEntry!=='CMD only via PowerShell Read-Host -AsSecureString'
    ||cmdOnlyGuard?.websiteKeyInput!==false
    ||cmdOnlyGuard?.keyFileStorage!==false
    ||cmdOnlyGuard?.publisherOnly!==true
    ||cmdOnlyGuard?.serviceWorkerCacheChanged!==false
    ||cmdOnlyGuard?.newD1Database!==false
    ||cmdOnlyGuard?.d1SchemaMigrations!==false) throw new Error('FIX167: konfigurator klucza musi być wyłącznie w CMD; WWW nie może wymagać pola Gemini.');
  const geminiMeta=localRelease.academyGeminiChatFix165;
  if(localRelease.latestHotfix!=='FIX176'||geminiMeta?.hotfix!=='FIX165'||geminiMeta?.providerFallback!==false||geminiMeta?.newD1Database!==false||geminiMeta?.d1SchemaMigrations!==false||!String(geminiMeta?.keyValidation||'').includes('GET /v1beta/models/gemini-3.8-flash')||!String(geminiMeta?.chatEndpoint||'').includes('/v1/interactions')) throw new Error('FIX165: nieprawidłowy kontrakt Gemini stable v1 / szybka walidacja / istniejąca baza D1.');
  for (const token of ['a155Extension','a155CaseStart','a155BiosCheck','a155HardwareChoices','a155ExamStart','a155SubnetCalc','a155PortfolioForm','a155TutorAsk','a155TeacherForm']) if (!html.includes(token)) throw new Error(`FIX155: brakuje modułu ${token}.`);
  const fix155Suite = localRelease.academyPracticalSuiteFix155 || {};
  if (fix155Suite.hotfix !== 'FIX155' || fix155Suite.productVersion !== '6.8.0' || fix155Suite.newViews !== 0 || fix155Suite.d1Migrations !== false || fix155Suite.dataMigrations !== false || fix155Suite.modules?.length !== 8 || fix155Suite.externalAi !== false) throw new Error('FIX155: nieprawidłowy kontrakt Akademii Praktycznej.');
  if (!html.includes('academy-practical-core-fix155.js?v=6.8.0-fix155') || !html.includes('academy-practical-suite-fix155.js?v=6.8.0-fix155') || !html.includes('academy-practical-suite-fix155.css?v=6.8.0-fix155')) throw new Error('FIX155: brak podłączenia zasobów w stronie.');
  if (!sw.includes('academy-practical-core-fix155.js') || !sw.includes('academy-practical-suite-fix155.js') || !sw.includes('academy-practical-suite-fix155.css')) throw new Error('FIX155: moduły nie są uwzględnione w cache PWA.');
  if (!html.includes('academy-pro-modules-fix148.js?v=6.8.0-fix148') || !html.includes('academy-pro-modules-fix148.css?v=6.8.0-fix148') || !sw.includes('academy-pro-modules-fix148.js') || !sw.includes('academy-pro-modules-fix148.css')) throw new Error('FIX148: nowe moduły nie są prawidłowo dołączone do HTML i PWA.');
  if (!html.includes('academy-master-extension-fix149.js?v=6.8.0-fix149') || !html.includes('academy-master-extension-fix149.css?v=6.8.0-fix149') || !sw.includes('academy-master-extension-fix149.js') || !sw.includes('academy-master-extension-fix149.css')) throw new Error('FIX149: rozszerzenie nie jest prawidłowo dołączone do HTML i PWA.');
  const fix149Metadata = localRelease.academyMasterExtensionFix149 || {};
  if (fix149Metadata.hotfix !== 'FIX149' || fix149Metadata.productVersion !== '6.8.0' || fix149Metadata.newViews !== 0 || fix149Metadata.d1Migrations !== false || fix149Metadata.dataMigrations !== false || fix149Metadata.modules?.length !== 5) throw new Error('FIX149: kontrakt modułów rozszerzenia Akademii jest niezgodny.');
  for (const token of ['a149ContestStart','a149ScopeCanvas','a149DataChecklist','a149DocsCatalog','a149OfflineDownload']) if (!html.includes(token)) throw new Error(`FIX149: brakuje funkcji ${token}.`);
  for (const key of ['NP_MASTER_WORKSHOP_CONTENT','function decodeSmd','NPAcademyWorkshopDB','indexedDB.open','NPA-MASTER-WORKSHOP-BACKUP']) if (!masterWorkshopRuntime.includes(key)) throw new Error(`Brak funkcji Warsztatu Mistrza FIX12: ${key}.`);
  if (!masterWorkshopCss.includes('.nwm-hero') || !html.includes('master-workshop-630.js?v=6.2.0-fix12') || !html.includes('master-workshop-630.css?v=6.2.0-fix12')) throw new Error('Brak zasobów WWW Warsztatu Mistrza FIX12.');
  for (const id of ['n63LabType','n63LabWorkspace','n63ComponentList','n63DiagnosisForm','n63PathGrid','n63JobForm','n63PartForm','n63CertificateList','n63ExportBackup','n63ImportBackup','n63ReplacementSearch','n63ReplacementList','n63ReplacementDetail','n63ReplacementCount','n63XpSummary','n63XpBar']) if (!html.includes(`id="${id}"`)) throw new Error(`Brak wymaganej funkcji Akademii FIX14: ${id}.`);
  if (!html.includes('master-workshop-630-extension.js?v=6.8.0-fix119') || !html.includes('master-workshop-630-extension.css?v=6.8.0-fix119') || !masterAcademyRuntime.includes('NPA_MASTER_ACADEMY_630') || !masterAcademyRuntime.includes('function runDiagnosis') || !masterAcademyRuntime.includes('validateJob') || !masterAcademyRuntime.includes('replacementData') || !masterAcademyRuntime.includes("soldering:") || !masterAcademyCss.includes('.n63-lab-top')) throw new Error('Akademia FIX14 nie ma kompletnego skryptu, CSS lub powiązanych paneli.');
  const ultimateAcademyRuntime = fs.readFileSync(path.join(WEB,'assets','master-academy-640-pro.js'),'utf8');
  const ultimateAcademyCss = fs.readFileSync(path.join(WEB,'assets','master-academy-640-pro.css'),'utf8');
  for (const id of ['n64PcbCase','n64BiosA','n64ImageFile','n64LogFile','n64CompatRun','n64IpCalc','n64QcSave','n64AiForm','n64DocsInput','n64ExamPicker']) if (!html.includes(`id=\"${id}\"`)) throw new Error(`Brak modułu FIX15: ${id}.`);
  for (const key of ['NPA_MASTER_ACADEMY_640','function inspectBios','function parseIPv4Address','NPA-MASTER-ACADEMY-FIX15','IndexedDB document library']) if (!ultimateAcademyRuntime.includes(key)) throw new Error(`Brak funkcji Ultimate Service Academy FIX15: ${key}.`);
  if (!html.includes('master-academy-640-pro.js?v=6.4.0-fix15') || !html.includes('master-academy-640-pro.css?v=6.4.0-fix15') || !ultimateAcademyCss.includes('.n64-subnav') || !ultimateAcademyCss.includes('@media(max-width:600px)')) throw new Error('Niekompletne zasoby lub responsywny interfejs FIX15.');
  const fix16Runtime = fs.readFileSync(path.join(WEB,'assets','master-academy-650-ultimate.js'),'utf8');
  const fix16Css = fs.readFileSync(path.join(WEB,'assets','master-academy-650-ultimate.css'),'utf8');
  if (!html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') || !html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') || !fix16Runtime.includes('NPA_MASTER_ACADEMY_650') || !fix16Runtime.includes('AES-GCM') || !fix16Runtime.includes('PBKDF2') || !fix16Css.includes('.n65-measure-grid')) throw new Error('Niekompletne moduły ULTIMATE REPAIR CENTER FIX16.');
  const practiceRuntime = fs.readFileSync(path.join(WEB,'assets','practice-academy-fix27.js'),'utf8');
  const practiceCss = fs.readFileSync(path.join(WEB,'assets','practice-academy-fix27.css'),'utf8');
  for (const id of ['view-practicepro','p27ProgressSummary','p27BoardParts','p27ChallengePicker','p27DocInput','p27BenchCalculate','p27MentorSend','p27AcademyGrid','p27ExamPicker','p27PortfolioExport','p27InstructorForm','p27KnowledgeSearch']) if (!html.includes(`id=\"${id}\"`)) throw new Error(`Brak Centrum Praktyki FIX27: ${id}.`);
  for (const key of ['indexedDB','DB_NAME','p27ChallengePicker','p27DocInput','p27BenchCalculate','p27MentorSend','p27AcademyGrid','p27ExamPicker','p27PortfolioExport','p27InstructorForm','p27KnowledgeSearch']) if (!practiceRuntime.includes(key)) throw new Error(`Brak interakcji Centrum Praktyki FIX27: ${key}.`);
  if (!practiceCss.includes('.p27-hero') || !practiceCss.includes('.p27-tabs') || !practiceCss.includes('.p27-academy-grid')) throw new Error('Brak arkusza CSS Centrum Praktyki FIX27.');
  if (/view-servicepro|np62-ticket-form|lab44-workorders|labWorkorderForm|labExportWorkorders/.test(html)) throw new Error('W platformie edukacyjnej wykryto formularz zlecenia serwisowego.');
  const stateApiPath = path.join(FUNCTIONS, 'api', 'state.js');
  const stateApi = fs.existsSync(stateApiPath) ? fs.readFileSync(stateApiPath, 'utf8') : '';
  if (!stateApi || stateApi.includes('academyLabWorkorders')) throw new Error('API synchronizacji nadal dopuszcza stare karty zleceń.');

  for (const file of ['service-worker.js','manifest.webmanifest','media/photo-sources-online.json','assets/long-video-catalog-620.js','media/videos/akademia-dlaczego-warto-wspierac.mp4','media/videos/akademia-dlaczego-warto-wspierac.vtt','media/video_posters/akademia-wsparcie-poster.jpg']) if (!fs.existsSync(path.join(WEB,file))) throw new Error(`Brak wymaganego pliku ${file}.`);
  const badge = html.match(/id=["']lessonTotalBadge["']>\s*(\d+)/i);
  if (!badge || Number(badge[1]) !== 1083 || !html.includes('academy-ultra-lessons-3.js')) throw new Error('Nie znaleziono wszystkich 1083 lekcji.');
  const lessonPack610 = fs.readFileSync(path.join(WEB,'assets','academy-master-lessons-610.js'),'utf8');
  if ((lessonPack610.match(/\"id\":\"MASTER-610-/g)||[]).length !== 60) throw new Error('Pakiet 60 lekcji 6.2.0 jest niekompletny.');
  if (!html.includes('id=\"view-knowledge\"') || !html.includes('id=\"k610DomainGrid\"')) throw new Error('Brak mapy wiedzy 6.2.0.');
  for (const asset of ['theme-610.css','theme-controller-610.js','knowledge-hub-610.js','academy-dashboard-610.js','lesson-count-610.js']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`Brak zasobu 6.2.0: ${asset}.`);
  const pack3 = fs.readFileSync(path.join(WEB,'assets','academy-ultra-lessons-3.js'),'utf8');
  if (!pack3.includes('ULTRA-311') || (pack3.match(/"id":"ULTRA-/g)||[]).length !== 100) throw new Error('Trzeci pakiet lekcji jest niekompletny.');
  const ultimateRuntime = fs.readFileSync(path.join(WEB,'assets','ultimate-600.js'),'utf8');
  const ultimateCss = fs.readFileSync(path.join(WEB,'assets','theme-600.css'),'utf8');
  const lessonPack4 = fs.readFileSync(path.join(WEB,'assets','academy-ultimate-lessons-600.js'),'utf8');
  for (const id of ['view-repairmaster','view-ultimate3d','view-admin','u6RepairForm','u6BoardSvg','u6AdminConnect','u6AdminLessonForm','u6AdminDrafts']) if (!html.includes(`id=\"${id}\"`)) throw new Error(`Brak modułu ULTIMATE 6.2.0: ${id}.`);
  for (const key of ['setupBackground','boardSetup','repairMasterSetup','adminSetup','adminContentStudioSetup','ACADEMY_FREE_CHAT','/api/admin/models','/api/admin/knowledge']) if (!ultimateRuntime.includes(key)) throw new Error(`Brak funkcji ULTIMATE 6.2.0: ${key}.`);
  if ((lessonPack4.match(/\"id\":\"ULTIMATE-/g)||[]).length !== 200) throw new Error('Pakiet 200 nowych lekcji jest niekompletny.');
  if (!ultimateCss.includes('u6-command') || !ultimateCss.includes('u6-board-viewport')) throw new Error('Brak warstwy wizualnej ULTIMATE 6.2.0.');
  const auth = fs.readFileSync(path.join(FUNCTIONS,'api','session.js'),'utf8');
  const passwordKdfPath = path.join(FUNCTIONS,'_password-kdf.js');
  const passwordResetPath = path.join(FUNCTIONS,'api','auth','password','reset.js');
  if (!fs.existsSync(passwordKdfPath) || !fs.existsSync(passwordResetPath)) throw new Error('Brak wspólnego KDF FIX30 dla rejestracji/logowania/resetu.');
  const passwordKdfSource = fs.readFileSync(passwordKdfPath,'utf8');
  const passwordResetSource = fs.readFileSync(passwordResetPath,'utf8');
  assertSharedPasswordKdfContract({ accountApi: auth, kdfSource: passwordKdfSource, resetApi: passwordResetSource }, 'AUTO_PUBLISH_WATCHER');
  const authUi = fs.readFileSync(path.join(WEB,'assets','cloud-academy.js'),'utf8');
  const authMigration = fs.readFileSync(path.join(ROOT,'migrations','0006_accounts_and_device_models.sql'),'utf8');
  for (const key of ["from '../_password-kdf.js'",'createPasswordSalt','derivePassword','isSupportedPasswordSalt','registerEmailAccount','loginEmailAccount',"purpose === 'register'","purpose === 'login'",'accountSchemaStatus']) if (!auth.includes(key)) throw new Error(`Brak rejestracji kont lub importu wspólnego KDF: ${key}.`);
  for (const key of ['email_normalized','password_salt','password_hash','academy_device_model_submissions','academy_device_models']) if (!authMigration.includes(key)) throw new Error(`Brak migracji kont/modeli: ${key}.`);
  if (!html.includes('id="emailAuthForm"') || !authUi.includes('submitEmailAuth')) throw new Error('Brak aktywnego formularza rejestracji/logowania.');
  for (const id of ['emailAuthBackendState','emailAuthRetry','emailAuthTogglePassword','emailAuthToggleConfirm','emailAuthPasswordMeter','authPassLength','authPassMatch']) if (!html.includes(`id="${id}"`) || !authUi.includes(id)) throw new Error(`Brak poprawki rejestracji konta ${id}.`);
  if (!authUi.includes("sessionCheck=await api('/session')") || !auth.includes('ACCOUNT_EXISTS')) throw new Error('Brak weryfikacji sesji po rejestracji lub obsługi istniejącego konta.');
  const modelsApi = fs.readFileSync(path.join(FUNCTIONS,'api','models.js'),'utf8');
  const adminApi = fs.readFileSync(path.join(FUNCTIONS,'api','admin','models.js'),'utf8');
  const catalog = fs.readFileSync(path.join(WEB,'assets','device-model-catalog.js'),'utf8');
  for (const key of ['onRequestGet','onRequestPost','rightsConfirmed','shareConsent']) if (!modelsApi.includes(key)) throw new Error(`Brak społeczności modeli: ${key}.`);
  if (!adminApi.includes('checkAdmin') || !html.includes('id="deviceModelDirectory"') || !html.includes('id="deviceModelForm"')) throw new Error('Brak katalogu modeli lub moderacji społeczności.');
  for (const model of ['T480','EliteBook 840 G8','Latitude 5420','ZenBook 14 UX425','Nitro 5 AN515-57','GF63 Thin 11SC','Surface Pro 8','MacBook Air M1 A2337','Galaxy Book3 Pro 360 NP960QFG','Panasonic TOUGHBOOK FZ-55','Alienware m16 R2','Getac B360 G2','VAIO SX14 VJS146','TUXEDO InfinityBook Pro 14 Gen9','XMG CORE 15 M24','Eurocom Sky Z7 R2','Star Labs StarBook Mk V']) if (!catalog.includes(model)) throw new Error(`Brak modelu katalogowego ${model}.`);
  const visitsApi = fs.readFileSync(path.join(FUNCTIONS,'api','visits.js'),'utf8');
  const dashboard = fs.readFileSync(path.join(WEB,'assets','visitor-dashboard.js'),'utf8');
  for (const key of ['total_visits','total_page_views','today_visits','week_visits','unique_visitors','registered_profiles','email_accounts','approved_device_models','completed_lesson_records']) if (!visitsApi.includes(key)) throw new Error(`Brak globalnej statystyki ${key}.`);
  for (const id of ['metricGlobalVisits','metricGlobalViews','metricTodayVisits','metricWeekVisits','metricRegisteredProfiles','metricEmailAccounts','metricCompletedLessons','metricApprovedModels','metricLessonTotal','metricBrandTotal','metricModelTotal','metricVideoTotal']) if (!dashboard.includes(id)) throw new Error(`Brak licznika ${id}.`);
  if (!html.includes('id="academyGlobalStats"') || !html.includes('id="visitorChart"') || !html.includes('id="globalVisitsNotice"') || !html.includes('id="metricUniqueVisitors"') || !html.includes('id="metricPendingModels"')) throw new Error('Brak widocznego panelu statystyk.');
  const statsDashboard = fs.readFileSync(path.join(WEB,'assets','visitor-dashboard.js'),'utf8');
  for (const id of ['metricMonthVisits','metricTodayViews','metricWeekViews','metricLearnersWithProgress','metricTrackedLessonOpens','metricTrackedVideoOpens','metricTrackedLessonCompletions']) if (!statsDashboard.includes(id) || !html.includes(`id="${id}"`)) throw new Error(`Brak licznika ${id}.`);
  if (!html.includes('id="metricBrandTotal">33') || !html.includes('id="metricModelTotal">150')) throw new Error('Nieprawidłowe liczby producentów lub modeli referencyjnych.');
  if (!html.includes('akademia-dlaczego-warto-wspierac.mp4') || !/dlaczego\s+warto\s+wspierać\s+(?:Akademię|platformę)/i.test(html)) throw new Error('Brak filmu i sekcji Dlaczego warto wspierać.');
  for (const id of ['supportWhyTitle','supportImpact','supportImpactTitle','supportFaq']) if (!html.includes(`id=\"${id}\"`)) throw new Error(`Brak elementu strony wsparcia: ${id}.`);
  if (!html.includes('akademia-dlaczego-warto-wspierac.vtt')) throw new Error('Brak polskich napisów do filmu wsparcia.');
  for (const id of ['supportWhyTitle','supportImpact','supportImpactTitle','supportFaq']) if (!html.includes(`id=\"${id}\"`)) throw new Error(`Brak elementu wsparcia: ${id}.`);
  if (!html.includes('data-nav=\"community\"') || !html.includes('data-nav=\"courses\"')) throw new Error('Brak alternatywnych sposobów wsparcia.');
  if (!sw.includes("url.pathname.startsWith('/Biblioteka/')") || swCacheName !== 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115' || !sw.includes('master-control-fix47.js') || !sw.includes('master-control-fix47.css') || !sw.includes('knowledge-suite-fix43.js') || !sw.includes('knowledge-suite-fix43.css') || !sw.includes('real-workshop-fix42.js') || !sw.includes('real-workshop-fix42.css') || !sw.includes('akademia-serwisanta-fix41.js') || !sw.includes('akademia-serwisanta-fix41.css') || !sw.includes('nauka-centrum-fix40.js') || !sw.includes('nauka-centrum-fix40.css') || !sw.includes("'/media/videos/akademia-dlaczego-warto-wspierac.mp4'") || !sw.includes("'/media/video_posters/akademia-wsparcie-poster.jpg'") || !sw.includes("'/media/videos/akademia-dlaczego-warto-wspierac.vtt'") || !sw.includes('PHOTO_CACHE_NAME') || !sw.includes('isCuratedPhotoHost') || sw.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123') || sw.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122')) {
    throw new Error(`Lokalny Service Worker ma nieaktualny cache PWA lub nie zawiera kompletu mediów wsparcia: ${swCacheName || 'brak'}. Publikacja zatrzymana przed wdrożeniem.`);
  }
  for (const asset of ['support-expansion-fix35.css','support-enhancements-fix35.js','theme-521.css','theme-522.css','theme-523.css','theme-530.css','theme-600.css','ultra-cyber-530.js','ultimate-600.js','academy-ultimate-lessons-600.js','academy-ultra-lessons-3.js','theme-630.css','scroll-navigation-630.js','homepage-showcase-640.js','homepage-showcase-640.css','device-model-catalog.js','community-models.js','akademia-dlaczego-warto-wspierac.mp4']) if (!sw.includes(asset)) throw new Error(`PWA nie buforuje ${asset}.`);
  const motion = fs.readFileSync(path.join(WEB,'assets','neon-motion.js'),'utf8');
  const theme610 = fs.readFileSync(path.join(WEB,'assets','theme-controller-610.js'),'utf8');
  for (const key of ['prefers-reduced-motion','requestFullscreen','fullscreenToggle','fullscreenchange','appearanceOwner']) if (!motion.includes(key)) throw new Error(`Brak obsługi ruchu/pełnego ekranu: ${key}.`);
  for (const key of ['nm610Panel','appearanceToggle','data-skin-choice','academyCircuitCanvas','dataset.skin','focus-mode','ACADEMY_THEME_API','syncCanvasMotion']) if (!theme610.includes(key)) throw new Error(`Brak panelu wyglądu 6.2.0: ${key}.`);
  if (motion.includes("getElementById('appearanceToggle')") || motion.includes('academyExperiencePanel')) throw new Error('Wykryto drugi kontroler panelu wyglądu.');
  const theme610Css = fs.readFileSync(path.join(WEB,'assets','theme-610.css'),'utf8');
  for (const skin of ['blue','purple','green']) if (!theme610Css.includes(`body[data-skin=\"${skin}\"]`)) throw new Error(`Brak skórki ${skin}.`);
  if (!html.includes('id=\"u530CommandCenter\"') || !html.includes('id=\"u530CommunityHub\"') || !html.includes('id=\"u530AccountHub\"')) throw new Error('Brak ULTRA CYBER LAB 6.2.0: punkty montażowe pulpitu, społeczności lub konta.');
  const u530 = fs.readFileSync(path.join(WEB,'assets','ultra-cyber-530.js'),'utf8');
  for (const key of ['u530CommandCenter','u530CommunityHub','u530AccountHub','data-u530-part','u530Arrange','u530StepProgress','ACADEMY_DEVICE_CATALOG']) if (!u530.includes(key)) throw new Error(`Brak funkcji ULTRA CYBER LAB: ${key}.`);
  const cards = (html.match(/data-diagnostic-course=/g)||[]).length;
  if (cards < 12) throw new Error(`Katalog diagnostyczny ${cards}/12.`);
  log(`Lokalny build potwierdzony: ${match[1]}; 1083 lekcje; konta, modele, statystyki globalne, film wsparcia; ${cards} kart diagnostycznych.`);
  const oauthSource=fs.readFileSync(path.join(FUNCTIONS,'_oauth.js'),'utf8');
  const oauthUi=fs.readFileSync(path.join(WEB,'assets','cloud-academy.js'),'utf8');
  if (!['google','facebook','microsoft','github','discord'].every(provider=>oauthSource.includes(`'${provider}'`)) || !oauthUi.includes('loadLinkedLoginMethods') || !oauthUi.includes('loadAccountSessions') || !fs.existsSync(path.join(ROOT,'scripts','configure-oauth-secrets.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','identities.js')) || !fs.existsSync(path.join(ROOT,'migrations','0008_social_login_x_github.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0009_discord_social_login.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0010_account_terms_and_oauth_consent.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0011_totp_two_factor.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0012_email_verification_and_password_reset.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0013_account_runtime_guard.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0014_account_limiter_key_repair.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0015_account_limiter_v3.sql')) || !fs.existsSync(path.join(FUNCTIONS,'_mail.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','email.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','email','verify.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','password','forgot.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','password','reset.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','totp.js')) || !fs.existsSync(path.join(FUNCTIONS,'api','auth','totp','verify.js')) || !oauthSource.includes('createTotpChallenge') || !oauthUi.includes('loadTotpSecurity') || !fs.existsSync(path.join(FUNCTIONS,'api','auth','sessions.js'))) throw new Error('Brak logowania społecznościowego FIX18 lub migracji 0008.');
  // deploy() consumes this summary. Without a return, localRelease is undefined
  // and the watcher crashes while reading localRelease.build before deployment.
  return { build: match[1], cards, lessons: 1083 };
}
async function verifyPublishedRelease() {
  let last = 'brak odpowiedzi';
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const url = `${STABLE_URL}/?view=home&academy_release=${RELEASE}&_=${Date.now()}`;
      const response = await fetch(url, { cache: 'no-store', headers: { accept: 'text/html', 'cache-control': 'no-cache, no-store', pragma: 'no-cache' } });
      const html = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status} dla stałego adresu produkcyjnego; oczekiwano HTTP 200.`);
      const match = html.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i);
      // Check the actual published script payloads, not just the HTML script tags.
      // This catches stale Cloudflare caches that could keep serving the FIX6 photo engine.
      const photoAssetUrl = `${STABLE_URL}/assets/lesson-art.js?v=6.8.0-fix51-visual-assets-reuse&verify=${Date.now()}`;
      const studioAssetUrl = `${STABLE_URL}/assets/advanced-learning-studio-620.js?v=6.2.0-fix7&verify=${Date.now()}`;
      const showcaseAssetUrl = `${STABLE_URL}/assets/homepage-showcase-640.js?v=6.2.0-fix8&verify=${Date.now()}`;
      const measurementAssetUrl = `${STABLE_URL}/assets/measurement-log-640.js?v=6.2.0-fix11&verify=${Date.now()}`;
      const masterWorkshopAssetUrl = `${STABLE_URL}/assets/master-workshop-630.js?v=6.2.0-fix12&verify=${Date.now()}`;
      const masterWorkshopCssUrl = `${STABLE_URL}/assets/master-workshop-630.css?v=6.2.0-fix12&verify=${Date.now()}`;
      const masterAcademyAssetUrl = `${STABLE_URL}/assets/master-workshop-630-extension.js?v=6.8.0-fix119&verify=${Date.now()}`;
      const masterAcademyCssUrl = `${STABLE_URL}/assets/master-workshop-630-extension.css?v=6.8.0-fix119&verify=${Date.now()}`;
      const ultimateAcademyAssetUrl = `${STABLE_URL}/assets/master-academy-640-pro.js?v=6.4.0-fix15&verify=${Date.now()}`;
      const ultimateAcademyCssUrl = `${STABLE_URL}/assets/master-academy-640-pro.css?v=6.4.0-fix15&verify=${Date.now()}`;
      const fix16AssetUrl = `${STABLE_URL}/assets/master-academy-650-ultimate.js?v=6.5.0-fix16&verify=${Date.now()}`;
      const fix16CssUrl = `${STABLE_URL}/assets/master-academy-650-ultimate.css?v=6.5.0-fix16&verify=${Date.now()}`;
      const fix17AssetUrl = `${STABLE_URL}/assets/master-academy-660-center.js?v=6.6.0-fix17&verify=${Date.now()}`;
      const fix17CssUrl = `${STABLE_URL}/assets/master-academy-660-center.css?v=6.6.0-fix17&verify=${Date.now()}`;
      const practiceAssetUrl = `${STABLE_URL}/assets/practice-academy-fix27.js?v=6.8.0-fix28&verify=${Date.now()}`;
      const practiceCssUrl = `${STABLE_URL}/assets/practice-academy-fix27.css?v=6.8.0-fix28&verify=${Date.now()}`;
      const supportVideoUrl = `${STABLE_URL}/media/videos/akademia-dlaczego-warto-wspierac.mp4?v=6.8.0-fix127-fix9-clean-video&verify=${Date.now()}`;
      const [photoAssetResponse, studioAssetResponse, showcaseAssetResponse, measurementAssetResponse, masterWorkshopAssetResponse, masterWorkshopCssResponse, masterAcademyAssetResponse, masterAcademyCssResponse, ultimateAcademyAssetResponse, ultimateAcademyCssResponse, fix16AssetResponse, fix16CssResponse, fix17AssetResponse, fix17CssResponse, practiceAssetResponse, practiceCssResponse, supportVideoCheck] = await Promise.all([
        fetch(photoAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(studioAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(showcaseAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(measurementAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(masterWorkshopAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(masterWorkshopCssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(masterAcademyAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(masterAcademyCssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(ultimateAcademyAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(ultimateAcademyCssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(fix16AssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(fix16CssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(fix17AssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(fix17CssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(practiceAssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(practiceCssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        checkPublicMediaAsset(supportVideoUrl)
      ]);
      const remotePhotoAsset = await photoAssetResponse.text();
      const remoteStudioAsset = await studioAssetResponse.text();
      const remoteShowcaseAsset = await showcaseAssetResponse.text();
      const remoteMeasurementAsset = await measurementAssetResponse.text();
      const remoteMasterWorkshopAsset = await masterWorkshopAssetResponse.text();
      const remoteMasterWorkshopCss = await masterWorkshopCssResponse.text();
      const remoteMasterAcademyAsset = await masterAcademyAssetResponse.text();
      const remoteMasterAcademyCss = await masterAcademyCssResponse.text();
      const remoteUltimateAcademyAsset = await ultimateAcademyAssetResponse.text();
      const remoteUltimateAcademyCss = await ultimateAcademyCssResponse.text();
      const remoteFix16Asset = await fix16AssetResponse.text();
      const remoteFix16Css = await fix16CssResponse.text();
      const remoteFix17Asset = await fix17AssetResponse.text();
      const remoteFix17Css = await fix17CssResponse.text();
      const remotePracticeAsset = await practiceAssetResponse.text();
      const remotePracticeCss = await practiceCssResponse.text();
      const remotePhotoEngineValid = photoAssetResponse.ok && remotePhotoAsset.includes("api.uniquePhotoEngineVersion='6.8.0-fix51-visual-assets-reuse'") && remotePhotoAsset.includes('perceptualHashBestEffort:true') && remotePhotoAsset.includes('localFirst:true') && remotePhotoAsset.includes('offlineFallback:true') && remotePhotoAsset.includes('imageDHash');
      const remoteStudioValid = studioAssetResponse.ok && remoteStudioAsset.includes('alsScopeCanvas') && remoteStudioAsset.includes('alsPsuVolt') && remoteStudioAsset.includes('alsExamForm');
      const remoteShowcaseValid = showcaseAssetResponse.ok && remoteShowcaseAsset.includes('NAUKA OD A DO Z — strona główna') && remoteShowcaseAsset.includes('dailyPlan') && remoteShowcaseAsset.includes('prefers-reduced-motion');
      const remoteSupportVideoFresh = supportVideoCheck.ok === true;
      const remoteMeasurementLogValid = measurementAssetResponse.ok && remoteMeasurementAsset.includes('NP_MEASUREMENT_LOG') && remoteMeasurementAsset.includes('validateEntry') && remoteMeasurementAsset.includes('academyMeasurementLog') && remoteMeasurementAsset.includes('function csv');
      const remoteMasterWorkshopValid = masterWorkshopAssetResponse.ok && remoteMasterWorkshopAsset.includes('NP_MASTER_WORKSHOP_CONTENT') && remoteMasterWorkshopAsset.includes('NPAcademyWorkshopDB') && remoteMasterWorkshopAsset.includes('function decodeSmd');
      const remoteMasterWorkshopCssValid = masterWorkshopCssResponse.ok && remoteMasterWorkshopCss.includes('.nwm-hero') && remoteMasterWorkshopCss.includes('.nwm-answer');
      const remoteMasterAcademyValid = masterAcademyAssetResponse.ok && remoteMasterAcademyAsset.includes('NPA_MASTER_ACADEMY_630') && remoteMasterAcademyAsset.includes('function runDiagnosis') && remoteMasterAcademyAsset.includes('validateJob') && remoteMasterAcademyAsset.includes('replacementData') && remoteMasterAcademyAsset.includes("soldering:");
      const remoteMasterAcademyCssValid = masterAcademyCssResponse.ok && remoteMasterAcademyCss.includes('.n63-lab-top') && remoteMasterAcademyCss.includes('.n63-component-list') && remoteMasterAcademyCss.includes('.n63-xp-panel');
      const remoteUltimateAcademyValid = ultimateAcademyAssetResponse.ok && remoteUltimateAcademyAsset.includes('NPA_MASTER_ACADEMY_640') && remoteUltimateAcademyAsset.includes('function inspectBios') && remoteUltimateAcademyAsset.includes('function parseIPv4Address') && remoteUltimateAcademyAsset.includes('NPA-MASTER-ACADEMY-FIX15');
      const remoteUltimateAcademyCssValid = ultimateAcademyCssResponse.ok && remoteUltimateAcademyCss.includes('.n64-subnav') && remoteUltimateAcademyCss.includes('.n64-exam-grid');
      const remoteFix16Valid = fix16AssetResponse.ok && remoteFix16Asset.includes('NPA_MASTER_ACADEMY_650') && remoteFix16Asset.includes('AES-GCM') && remoteFix16Asset.includes('PBKDF2') && remoteFix16Asset.includes('measurementResult');
      const remoteFix16CssValid = fix16CssResponse.ok && remoteFix16Css.includes('.n65-measure-grid') && remoteFix16Css.includes('.n65-board-stage');
      const remoteFix17Valid = fix17AssetResponse.ok && remoteFix17Asset.includes('NPA_MASTER_CENTER_660') && remoteFix17Asset.includes('function analyzeSymptom') && remoteFix17Asset.includes('function parseDelimited') && remoteFix17Asset.includes('NPA-MASTER-CENTER-FIX17') && ['sequence','netlist','instruments','brain','audit','orders','practical','privacy'].every(tab=>remoteFix17Asset.includes(`data-m64-pane=\"${tab}\"`));
      const remoteFix17CssValid = fix17CssResponse.ok && remoteFix17Css.includes('.n66-pane') && remoteFix17Css.includes('.n66-stage') && remoteFix17Css.includes('.n66-wave-chart');
      const remotePracticeAcademyValid = practiceAssetResponse.ok && remotePracticeAsset.includes('p27ChallengePicker') && remotePracticeAsset.includes('p27MentorSend') && remotePracticeAsset.includes('indexedDB') && practiceCssResponse.ok && remotePracticeCss.includes('.p27-hero') && remotePracticeCss.includes('.p27-academy-grid');
      const supportExpansionCssUrl = `${STABLE_URL}/assets/support-expansion-fix35.css?v=6.8.0-fix35&verify=${Date.now()}`;
      const supportEnhancementsJsUrl = `${STABLE_URL}/assets/support-enhancements-fix35.js?v=6.8.0-fix35&verify=${Date.now()}`;
      const supportCommunityCssUrl = `${STABLE_URL}/assets/support-community-fix36.css?v=6.8.0-fix36&verify=${Date.now()}`;
      const supportCommunityJsUrl = `${STABLE_URL}/assets/support-community-fix36.js?v=6.8.0-fix36&verify=${Date.now()}`;
      const homeRefreshUrl = `${STABLE_URL}/assets/home-refresh-fix30.css?v=6.8.0-fix30&verify=${Date.now()}`;
      const uniquePhotoUrl = `${STABLE_URL}/assets/photo-unique-thumbnails-fix30.js?v=6.8.0-fix30&verify=${Date.now()}`;
      const [supportExpansionCssResponse, supportEnhancementsJsResponse, supportCommunityCssResponse, supportCommunityJsResponse, homeRefreshResponse, uniquePhotoResponse] = await Promise.all([
        fetch(supportExpansionCssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(supportEnhancementsJsUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(supportCommunityCssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(supportCommunityJsUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(homeRefreshUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(uniquePhotoUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteSupportExpansionCss, remoteSupportEnhancementsJs, remoteSupportCommunityCss, remoteSupportCommunityJs] = await Promise.all([supportExpansionCssResponse.text(),supportEnhancementsJsResponse.text(),supportCommunityCssResponse.text(),supportCommunityJsResponse.text()]);
      const supportApiRoutes=['/api/support/proposals','/api/support/thanks','/api/support/updates','/api/support/transparency'];
      const supportApiResponses=await Promise.all(supportApiRoutes.map(route=>fetch(`${STABLE_URL}${route}?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})));
      const supportApiStatuses=supportApiResponses.map(r=>r.status);
      const remoteSupportApiValid=supportApiResponses.every(r=>r.ok);
      const supportUpdatesPayload=await supportApiResponses[2].clone().json().catch(()=>null);
      const remoteSupportUpdatesContractValid=verifySupportUpdatesPayload(supportUpdatesPayload);
      const remoteServiceWorkerResponse=await fetch(`${STABLE_URL}/service-worker.js?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}});
      const remoteServiceWorker=await remoteServiceWorkerResponse.text();
      const remoteCacheName=remoteServiceWorker.match(/const\s+CACHE_NAME\s*=\s*['\"]([^'\"]+)['\"]/i)?.[1]||''; // FIX110; historical token remoteCacheName.includes('fix94-topic-verified-photo-20261107')
      const [remoteFix186JsResponse,remoteFix186CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/academy-practical-lab-fix186.js?v=6.8.0-fix186&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/academy-practical-lab-fix186.css?v=6.8.0-fix186&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix186Js,remoteFix186Css] = await Promise.all([remoteFix186JsResponse.text(),remoteFix186CssResponse.text()]);
      const [remotePracticalCoreResponse,remotePracticalSuiteResponse,remotePracticalCssResponse]=await Promise.all([
        fetch(`${STABLE_URL}/assets/academy-practical-core-fix155.js?v=6.8.0-fix155&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/academy-practical-suite-fix155.js?v=6.8.0-fix155&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/academy-practical-suite-fix155.css?v=6.8.0-fix155&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remotePracticalCore,remotePracticalSuite,remotePracticalCss]=await Promise.all([remotePracticalCoreResponse.text(),remotePracticalSuiteResponse.text(),remotePracticalCssResponse.text()]);
      const remotePracticalSuiteValid=remotePracticalCoreResponse.ok&&remotePracticalSuiteResponse.ok&&remotePracticalCssResponse.ok
        && remotePracticalCore.includes('ACADEMY_FIX155_CORE')
        && remotePracticalSuite.includes('ACADEMY_FIX155_API')
        && ['a155CaseStart','a155BiosCheck','a155HardwareChoices','a155ExamStart','a155SubnetCalc','a155PortfolioForm','a155TutorAsk','a155TeacherForm'].every(token=>remotePracticalSuite.includes(token))
        && remotePracticalCss.includes('#a155Extension');
      const [remoteCurriculumCoreResponse,remoteCurriculumSuiteResponse,remoteCurriculumCssResponse,remoteClassroomApiResponse,remoteCertificateApiResponse]=await Promise.all([
        fetch(`${STABLE_URL}/assets/academy-master-curriculum-core-fix162.js?v=6.8.0-fix162&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/academy-master-curriculum-fix162.css?v=6.8.0-fix162&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/api/classroom?code=ABCDEFGHJK&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/api/certificates?id=NAU-2026-000000000000&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteCurriculumCore,remoteCurriculumSuite,remoteCurriculumCss,remoteClassroomApiBody,remoteCertificateApiBody]=await Promise.all([remoteCurriculumCoreResponse.text(),remoteCurriculumSuiteResponse.text(),remoteCurriculumCssResponse.text(),remoteClassroomApiResponse.clone().json().catch(()=>null),remoteCertificateApiResponse.clone().json().catch(()=>null)]);
      const remoteCurriculumAssetsValid=remoteCurriculumCoreResponse.ok&&remoteCurriculumSuiteResponse.ok&&remoteCurriculumCssResponse.ok
        &&remoteCurriculumCore.includes('ACADEMY_FIX162_CORE')&&remoteCurriculumSuite.includes('/api/classroom')&&remoteCurriculumSuite.includes('/api/certificates')
        &&['a162PartComplete','a162Measure','a162BuildCheck','a162SolderCheck','a162AiForm','a162ClassCreate','a162CertIssue','a162CertVerify','a162ChallengeAnswers'].every(token=>remoteCurriculumSuite.includes(token))
        &&remoteCurriculumCss.includes('.a162-wrap');
      const remoteClassroomApiValid=remoteClassroomApiResponse.status===401&&remoteClassroomApiBody?.error==='SESSION_AND_CONSENT_REQUIRED';
      const remoteCertificateApiValid=remoteCertificateApiResponse.status===404&&remoteCertificateApiBody?.error==='CERTIFICATE_NOT_FOUND';
      const remoteMasterOnlineApisValid=remoteClassroomApiValid&&remoteCertificateApiValid;
      const [remoteSupportPosterResponse,remoteSupportCaptionsResponse]=await Promise.all([
        fetch(`${STABLE_URL}/media/video_posters/akademia-wsparcie-poster.jpg?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/media/videos/akademia-dlaczego-warto-wspierac.vtt?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteSupportPosterBuffer,remoteSupportCaptions]=await Promise.all([remoteSupportPosterResponse.arrayBuffer(),remoteSupportCaptionsResponse.text()]);
      const remoteSupportPosterValid=remoteSupportPosterResponse.ok && remoteSupportPosterBuffer.byteLength>1000 && String(remoteSupportPosterResponse.headers.get('content-type')||'').toLowerCase().includes('image/jpeg');
      const remoteSupportCaptionsValid=remoteSupportCaptionsResponse.ok && remoteSupportCaptions.startsWith('WEBVTT') && remoteSupportCaptions.includes('Dziękujemy');
      const remoteSupportPwaValid=remoteServiceWorkerResponse.ok && remoteCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115' && remoteServiceWorker.includes('academy-professional-repair-fix175.js') && remoteServiceWorker.includes('academy-professional-repair-fix175.css') && remoteServiceWorker.includes('academy-pro-modules-fix148.js') && remoteServiceWorker.includes('academy-pro-modules-fix148.css') && remoteServiceWorker.includes('academy-master-extension-fix149.js') && remoteServiceWorker.includes('academy-master-extension-fix149.css') && remoteServiceWorker.includes('academy-practical-core-fix155.js') && remoteServiceWorker.includes('academy-practical-suite-fix155.js') && remoteServiceWorker.includes('academy-practical-suite-fix155.css') && remoteServiceWorker.includes('PHOTO_CACHE_NAME') && remoteServiceWorker.includes('isCuratedPhotoHost') && !remoteServiceWorker.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123') && remoteServiceWorker.includes("'/media/videos/akademia-dlaczego-warto-wspierac.mp4'") && remoteServiceWorker.includes("'/media/video_posters/akademia-wsparcie-poster.jpg'") && remoteServiceWorker.includes("'/media/videos/akademia-dlaczego-warto-wspierac.vtt'") && remoteSupportPosterValid && remoteSupportCaptionsValid && remoteCurriculumAssetsValid && remoteMasterOnlineApisValid && remoteServiceWorker.includes('academy-master-curriculum-core-fix162.js') && remoteServiceWorker.includes('academy-master-curriculum-fix162.js') && remoteServiceWorker.includes('academy-master-curriculum-fix162.css') && remoteServiceWorker.includes('academy-deployment-migration-refurb-fix181.js') && remoteServiceWorker.includes('academy-deployment-migration-refurb-fix181.css') && remoteServiceWorker.includes('academy-specialist-systems-fix182.js') && remoteServiceWorker.includes('academy-specialist-systems-fix182.css') && remoteServiceWorker.includes('academy-advanced-service-lab-fix183.js') && remoteServiceWorker.includes('academy-advanced-service-lab-fix183.css') && remoteServiceWorker.includes('support-community-fix36.css') && remoteServiceWorker.includes('support-community-fix36.js') && remoteServiceWorker.includes('knowledge-suite-fix43.js') && remoteServiceWorker.includes('knowledge-suite-fix43.css') && remoteServiceWorker.includes('nauka-centrum-fix40.js') && remoteServiceWorker.includes('nauka-centrum-fix40.css');
      const remoteSupportExpansionValid = supportExpansionCssResponse.ok && supportEnhancementsJsResponse.ok && ['.support-jump-nav','.support-roadmap-grid','.support-ways-grid','.support-payment-review','.support-contact','.support-contribution-grid','.support-contribution-note','.support-blik-official-link'].every(selector=>remoteSupportExpansionCss.includes(selector)) && remoteSupportEnhancementsJs.includes('supportShareButton') && remoteSupportEnhancementsJs.includes('navigator.share') && remoteSupportEnhancementsJs.includes('navigator.clipboard');
      const remoteSupportCommunityValid = supportCommunityCssResponse.ok && supportCommunityJsResponse.ok && remoteSupportApiValid && remoteSupportUpdatesContractValid && remoteSupportPwaValid && ['.support-release-timeline','.support-proposal-card','.support-case-layout','.support-cost-row','.support-thanks-card','.support-announcement-card','.support-admin-forms','.support-unread-bar','.support-jump-nav #supportDataRefresh'].every(selector=>remoteSupportCommunityCss.includes(selector)) && ['/support/proposals','/support/thanks','/support/updates','/support/transparency','/admin/support','/knowledge?mine=1','markAnnouncementsRead','lastSeenAt','refreshSupportData'].every(token=>remoteSupportCommunityJs.includes(token));
      const [remoteHomeRefreshCss, remoteUniquePhotoJs] = await Promise.all([homeRefreshResponse.text(),uniquePhotoResponse.text()]);
      let remoteHomeRefreshContract = null;
      let remoteHomeRefreshContractError = '';
      try { remoteHomeRefreshContract = verifyHomeRefreshAssets(remoteHomeRefreshCss, remoteUniquePhotoJs); }
      catch (error) { remoteHomeRefreshContractError = error.message; }
      const remoteHomeRefreshValid = homeRefreshResponse.ok && uniquePhotoResponse.ok && Boolean(remoteHomeRefreshContract);
      const [remoteFix40JsResponse, remoteFix40CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/nauka-centrum-fix40.js?v=6.8.0-fix40&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/nauka-centrum-fix40.css?v=6.8.0-fix40&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix40Js, remoteFix40Css] = await Promise.all([remoteFix40JsResponse.text(),remoteFix40CssResponse.text()]);
      const remoteFix40Valid = remoteFix40JsResponse.ok && remoteFix40CssResponse.ok
        && ['makeOfflinePackage','validateOfflinePackage','qrSvg','evaluateExam','cacheLibraryForOffline','fillReportFromLastPractice','runBenchCheck','ACADEMY_FREE_CHAT?.search'].every(token=>remoteFix40Js.includes(token))
        && remoteServiceWorker.includes("url.pathname.startsWith('/Biblioteka/')")
        && ['.l40-hero','.l40-tabs','.l40-pane','.l40-atlas-grid','.l40-report-form'].every(token=>remoteFix40Css.includes(token));
      const [remoteFix41JsResponse, remoteFix41CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/akademia-serwisanta-fix41.js?v=6.8.0-fix41&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/akademia-serwisanta-fix41.css?v=6.8.0-fix41&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix41Js, remoteFix41Css] = await Promise.all([remoteFix41JsResponse.text(),remoteFix41CssResponse.text()]);
      const remoteFix41Valid = remoteFix41JsResponse.ok && remoteFix41CssResponse.ok && ['calculateAssembly','evaluateFault','evaluateMeasurement','evaluateChallenge','searchKnowledge','NP_NAUKA_FIX41'].every(token=>remoteFix41Js.includes(token)) && ['.f41-overview-grid','.f41-launch-grid','.f41-form-grid','.f41-fault-layout'].every(token=>remoteFix41Css.includes(token)) && remoteServiceWorker.includes('akademia-serwisanta-fix41.js') && remoteServiceWorker.includes('akademia-serwisanta-fix41.css');
      const [remoteFix42JsResponse, remoteFix42CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/real-workshop-fix42.js?v=6.8.0-fix42&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/real-workshop-fix42.css?v=6.8.0-fix42&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix42Js, remoteFix42Css] = await Promise.all([remoteFix42JsResponse.text(),remoteFix42CssResponse.text()]);
      const remoteFix42Valid = remoteFix42JsResponse.ok && remoteFix42CssResponse.ok && ['parseBoardview','evaluateInstrument','evaluateSupply','waveformPoints','diagnose','checkCompatibility','makeJob','NP_NAUKA_FIX42'].every(token=>remoteFix42Js.includes(token)) && ['.f42-board-wrap','.f42-grid','.f42-form','.f42-result'].every(token=>remoteFix42Css.includes(token)) && remoteServiceWorker.includes('real-workshop-fix42.js') && remoteServiceWorker.includes('real-workshop-fix42.css') && remoteServiceWorker.includes('fix42-real-workshop-20261104');
      const [remoteFix43JsResponse, remoteFix43CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/knowledge-suite-fix43.js?v=6.8.0-fix43&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/knowledge-suite-fix43.css?v=6.8.0-fix43&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix43Js, remoteFix43Css] = await Promise.all([remoteFix43JsResponse.text(),remoteFix43CssResponse.text()]);
      const remoteFix43Valid = remoteFix43JsResponse.ok && remoteFix43CssResponse.ok && ['diagnoseBoard','evaluateSequence','parseSerialLine','checkBuild','buildEncryptedBackup','restoreEncryptedBackup','NP_NAUKA_FIX43'].every(token=>remoteFix43Js.includes(token)) && ['.f43-page-head','.f43-tabs','.f43-overview-grid','.f43-feedback-grid','.f43-stars'].every(token=>remoteFix43Css.includes(token)) && remoteServiceWorker.includes('knowledge-suite-fix43.js') && remoteServiceWorker.includes('knowledge-suite-fix43.css') && remoteServiceWorker.includes('fix43-knowledge-feedback-20261104');
      const [remoteFix44JsResponse, remoteFix44CssResponse, remoteFix44ManifestResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/master-service-center-fix44.js?v=6.8.0-fix44&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/master-service-center-fix44.css?v=6.8.0-fix44&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/knowledge-updates-fix44.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix44Js, remoteFix44Css, remoteFix44Manifest] = await Promise.all([remoteFix44JsResponse.text(),remoteFix44CssResponse.text(),remoteFix44ManifestResponse.json().catch(()=>null)]);
      const remoteFix44Tokens = ['Laptop Identification PRO','BIOS Database 360','Thermal Diagnostic PRO','CPU GPU Architecture Academy','Battery & Charging Lab','Data Recovery Academy','Network & Router Academy','3D Electronics Explorer','Repair Case Marketplace','Service Manager','AI Learning Coach','Quality Center','Repair Simulator WORLD','Universal Technical Library','Global Knowledge Update','NP_NAUKA_FIX44'];
      const remoteFix44Tabs = ['overview','identify','bios','thermal','architecture','battery','recovery','network','explorer','cases','service','coach','qa','simulator','library','updates'];
      const remoteFix44Valid = remoteFix44JsResponse.ok && remoteFix44CssResponse.ok && remoteFix44ManifestResponse.ok
        && remoteFix44Tokens.every(token=>remoteFix44Js.toLowerCase().includes(token.toLowerCase()))
        && remoteFix44Tabs.every(tab=>html.includes(`data-f44-tab=\"${tab}\"`))
        && ['.f44-page-head','.f44-tabs','.f44-grid','.f44-board-wrap','.f44-qa-results'].every(token=>remoteFix44Css.includes(token))
        && Array.isArray(remoteFix44Manifest?.sources) && remoteFix44Manifest.sources.length>=8
        && /^[a-f0-9]{64}$/i.test(remoteFix44Manifest?.integrity||'')
        && remoteServiceWorker.includes('master-service-center-fix44.js') && remoteServiceWorker.includes('master-service-center-fix44.css') && remoteServiceWorker.includes('knowledge-updates-fix44.json') && remoteServiceWorker.includes('fix44-master-service-center-20261104');
      const [remoteFix45JsResponse, remoteFix45CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/professional-service-fix45.js?v=6.8.0-fix45&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/professional-service-fix45.css?v=6.8.0-fix45&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix45Js, remoteFix45Css] = await Promise.all([remoteFix45JsResponse.text(),remoteFix45CssResponse.text()]);
      const remoteFix45Valid = remoteFix45JsResponse.ok && remoteFix45CssResponse.ok
        && ['browserInventory','parseHardwareId','evaluatePsuRails','evaluateQuality','diagnose','runSafeBenchmark','NP_NAUKA_FIX45'].every(token=>remoteFix45Js.includes(token))
        && ['.f45-page-head','.f45-tabs','.f45-grid','.f45-form','.f45-qa'].every(token=>remoteFix45Css.includes(token))
        && html.includes('id="view-fix45"') && html.includes('data-view="fix45"')
        && remoteServiceWorker.includes('professional-service-fix45.js') && remoteServiceWorker.includes('professional-service-fix45.css') && remoteServiceWorker.includes('fix45-professional-service-20261104') && remoteServiceWorker.includes('fix46-publication-guard-20261104');
      const [remoteFix47JsResponse, remoteFix47CssResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/master-control-fix47.js?v=6.8.0-fix47&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/master-control-fix47.css?v=6.8.0-fix47&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix47Js, remoteFix47Css] = await Promise.all([remoteFix47JsResponse.text(),remoteFix47CssResponse.text()]);
      const remoteFix47Valid = remoteFix47JsResponse.ok && remoteFix47CssResponse.ok
        && ['NP_NAUKA_FIX47','runStaticChecks','runAssetAudit','loadRemoteFeedback','updateFeedbackStatus','compatibility','mentorPlan','addOrder','completeProject','addCoursePlan','exportBackupObject'].every(token=>remoteFix47Js.includes(token))
        && ['.f47-page-head','.f47-tabs','.f47-grid','.f47-check-list','.f47-project-list'].every(token=>remoteFix47Css.includes(token))
        && html.includes('id="view-fix47"') && html.includes('data-view="fix47"')
        && remoteServiceWorker.includes('master-control-fix47.js') && remoteServiceWorker.includes('master-control-fix47.css') && remoteServiceWorker.includes('fix47-master-control-center-20261104');
      const [remoteFix49JsResponse, remoteFix49CssResponse, remoteFix49ContractResponse, remoteReleaseResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/ultimate-quality-fix49.js?v=6.8.0-fix49&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/ultimate-quality-fix49.css?v=6.8.0-fix49&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/release-contract-fix49.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/release.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix49Js, remoteFix49Css, remoteFix49Contract, remoteRelease] = await Promise.all([remoteFix49JsResponse.text(),remoteFix49CssResponse.text(),remoteFix49ContractResponse.json().catch(()=>null),remoteReleaseResponse.json().catch(()=>null)]);
      const remoteFix49Valid = remoteFix49JsResponse.ok && remoteFix49CssResponse.ok && remoteFix49ContractResponse.ok && remoteReleaseResponse.ok
        && ['NP_NAUKA_FIX49','runBrowserSmoke','getErrorLog','analyzeMigrationSql','runSecurityAudit','buildDiagnosticBundle','createStagingPlan','createRollbackPlan','runReleaseGate','createPracticeRoom'].every(token=>remoteFix49Js.includes(token))
        && ['.f49-page-head','.f49-tabs','.f49-grid','.f49-status','.f49-check'].every(token=>remoteFix49Css.includes(token))
        && remoteFix49Contract?.fix === 'FIX49' && remoteFix49Contract?.build === '6.8.0-social-login-fix49-ultimate-quality-20261104'
        && remoteRelease?.build === EXPECTED_BUILD
        && html.includes('id="view-fix49"') && html.includes('data-view="fix49"')
        && remoteServiceWorker.includes('ultimate-quality-fix49.js') && remoteServiceWorker.includes('ultimate-quality-fix49.css') && remoteServiceWorker.includes('fix49-ultimate-quality-20261104');
      const remoteFix50ManifestResponse = await fetch(`${STABLE_URL}/release-contract-fix50.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}});
      const remoteFix50Manifest = await remoteFix50ManifestResponse.json().catch(()=>null);
      // FIX50 is retained as a historical immutable manifest; it is not the active build gate.
      const remoteFix50Valid = remoteFix50ManifestResponse.ok && remoteFix50Manifest?.fix === 'FIX50'
        && remoteFix50Manifest?.build === '6.8.0-fix50-photo-reliability-20261105'
        && remoteFix50Manifest?.photoEngineVersion === '6.8.0-fix50-local-first-cors-safe'
        && remoteServiceWorker.includes('fix50-photo-reliability-20261105');
      const [remoteFix51ManifestResponse, remoteVisualAssetRuntimeResponse, remoteVisualAcademyRuntimeResponse, remoteVisualAcademyCssResponse, remoteVisualManifestResponse] = await Promise.all([
        fetch(`${STABLE_URL}/release-contract-fix51.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/visual-assets-fix51.js?v=6.8.0-fix51&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/visual-academy-fix51.js?v=6.8.0-fix51&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/visual-academy-fix51.css?v=6.8.0-fix51&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/visual-asset-manifest-fix51.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix51Manifest, remoteVisualRuntime, remoteVisualUi, remoteVisualCss, remoteVisualManifest] = await Promise.all([
        remoteFix51ManifestResponse.json().catch(()=>null),
        remoteVisualAssetRuntimeResponse.text(),
        remoteVisualAcademyRuntimeResponse.text(),
        remoteVisualAcademyCssResponse.text(),
        remoteVisualManifestResponse.json().catch(()=>null)
      ]);
      let remoteVisualAssetsValid = false;
      let remoteVisualAssetCount = 0;
      let remoteVisualAssetsMissing = [];
      const remoteVisualAssetSet = collectFix51VisualAssetPaths(remoteFix51Manifest, remoteVisualManifest);
      remoteVisualAssetCount = remoteVisualAssetSet.paths.length;
      if (remoteFix51ManifestResponse.ok && remoteVisualManifestResponse.ok && remoteVisualAssetSet.valid) {
        const checks = await Promise.all(remoteVisualAssetSet.paths.map(asset => checkPublicVisualAsset(`${STABLE_URL}/${asset.replace(/^\//,'')}?verify=${Date.now()}`).catch(()=>false)));
        remoteVisualAssetsValid = verifyFix51VisualAssetProbes(remoteVisualAssetSet.paths, checks);
        remoteVisualAssetsMissing = remoteVisualAssetSet.paths.filter((asset, index) => checks[index] !== true);
      } else {
        remoteVisualAssetsMissing = remoteVisualAssetSet.errors;
      }
      const remoteFix51Valid = remoteFix51ManifestResponse.ok && remoteFix51Manifest?.fix === 'FIX51'
        && remoteFix51Manifest?.build === EXPECTED_BUILD && EXPECTED_BUILD === FIX51_BUILD
        && remoteFix51Manifest?.photoEngineVersion === '6.8.0-fix51-visual-assets-reuse'
        && remoteFix51Manifest?.visualAssetCount === 33 && remoteFix51Manifest?.illustrationCount === 18 && remoteFix51Manifest?.localPhotoCount === 12 && remoteFix51Manifest?.localPosterCount === 3
        && remoteVisualAssetRuntimeResponse.ok && remoteVisualRuntime.includes('reuseAcrossLessons:false')
        && remoteVisualAcademyRuntimeResponse.ok && remoteVisualUi.includes('fix51ScopeCanvas') && remoteVisualUi.includes('fix51MeterScenario')
        && remoteVisualAcademyCssResponse.ok && remoteVisualCss.includes('.fix51-visual-academy')
        && remoteVisualManifestResponse.ok && remoteVisualManifest?.assets?.length === 18
        && remoteVisualAssetsValid
        && html.includes('visual-assets-fix51.js') && html.includes('visual-academy-fix51.js') && html.includes('visual-academy-fix51.css')
        && remoteServiceWorker.includes('artwork-fix51/18-connector-pinout.svg');
      const remoteHtmlHasUltra = ['u530CommandCenter','u530CommunityHub','u530AccountHub','view-repairmaster','view-ultimate3d','view-admin','u6RepairForm','u6BoardSvg','u6AdminLessonForm','u6AdminDrafts'].every(id => html.includes(`id="${id}"`))
        && ['view-measurementpro','view-modelcenter','np62-meter-mode','np62-model-search','view-masterworkshop','nwmMasterWorkshop','nwmDomainGrid','nwmExamPicker','nwmCaseForm'].every(id => html.includes(`id="${id}"`))
        && !/view-servicepro|np62-ticket-form|lab44-workorders|labWorkorderForm|labExportWorkorders/.test(html)
        && /assets\/theme-530\.css/i.test(html)
        && /assets\/theme-600\.css/i.test(html)
        && /assets\/ultra-cyber-530\.js/i.test(html)
        && /assets\/ultimate-600\.js/i.test(html)
        && /assets\/academy-ultimate-lessons-600\.js/i.test(html);
      const cards = (html.match(/data-diagnostic-course=/g) || []).length;
      const labActive = /<section[^>]*class=["']view-section active["'][^>]*id=["']view-home["']/i.test(html);
      const labContent = /INTERAKTYWNA BAZA KOMPONENTÓW/i.test(html) && /Hot-air/i.test(html) && /CENTRUM SZKOLENIOWE \/ LIVE LAB/i.test(html) && /REAL PCB LAB \/ MICROSCOPY \/ MEASUREMENT/i.test(html) && /np62PhotoMain/i.test(html) && /np62CameraStart/i.test(html) && /academy-specialties/i.test(html) && /id=["']view-labplus["']/i.test(html) && /id=["']lab44-triage["']/i.test(html) && /labplus-engine.js/i.test(html) && /lab45-service-center.js/i.test(html) && /theme-440.css/i.test(html) && /theme-450.css/i.test(html);
      const pwaPresent = /manifest.webmanifest/i.test(html) && /lab45-service-center.js/i.test(html) && /academy-ultra-lessons-3.js/i.test(html) && /measurement-log-640.js/i.test(html) && /master-workshop-630.js/i.test(html);
      // Validate the published document structurally, not by brittle exact HTML fragments.
      // Cloudflare/minifiers may change whitespace, quote style or attribute order.
      const hasId = id => new RegExp('\\bid\\s*=\\s*([\"\\\'])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\1', 'i').test(html);
      const hasIdText = (id, value) => {
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('<[a-z][^>]*\\bid\\s*=\\s*([\"\\\'])' + escapedId + '\\1[^>]*>\\s*' + value + '(?:\\s|<)', 'i');
        return re.test(html);
      };
      const [remoteGlobalSuiteJsResponse, remoteGlobalSuiteCssResponse, remoteGlobalSuiteManifestResponse,
        remoteGlobalExpansionJsResponse, remoteGlobalExpansionCssResponse, remoteGlobalExpansionManifestResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/global-academy-suite-fix60.js?v=6.8.0-fix60&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-suite-fix60.css?v=6.8.0-fix60&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-suite-manifest-fix60.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-expansion-fix73.js?v=6.8.0-fix73&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-expansion-fix73.css?v=6.8.0-fix73&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-expansion-manifest-fix73.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteGlobalSuiteJs, remoteGlobalSuiteCss, remoteGlobalSuiteManifest,
        remoteGlobalExpansionJs, remoteGlobalExpansionCss, remoteGlobalExpansionManifest] = await Promise.all([
        remoteGlobalSuiteJsResponse.text(), remoteGlobalSuiteCssResponse.text(), remoteGlobalSuiteManifestResponse.json().catch(()=>null),
        remoteGlobalExpansionJsResponse.text(), remoteGlobalExpansionCssResponse.text(), remoteGlobalExpansionManifestResponse.json().catch(()=>null)
      ]);
      // FIX129: remote validation requires real equipment photographs with metadata no-people filtering.
      const [remoteFix77PhotoRuntimeResponse, remoteFix77CssResponse, remoteFix77ManifestResponse, remoteFix77AcademyDataResponse,
        remoteSitewideGuardResponse, remoteSitewideManifestResponse, remoteHomepageGuardResponse, remoteHomepageManifestResponse, remotePhotoPolicyRuntimeResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/photo-uniqueness-fix77.js?v=6.8.0-fix77&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-fix77.css?v=6.8.0-fix77&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/global-academy-fix77-manifest.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/academy-data.js?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/equipment-photo-policy-fix129.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/media/photo-sources-online.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/homepage-photo-prime-fix118.js?v=6.8.0-fix136&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/media/home-photo-library-fix118.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        // FIX178: this is also the single response reused by the later FIX115 catalog contract.
        fetch(`${STABLE_URL}/assets/photo-catalog-fix115.js?v=6.8.0-fix136&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteFix77PhotoRuntime, remoteFix77Css, remoteFix77Manifest, remoteFix77AcademyData, remoteSitewideGuard,
        remoteSitewideManifest, remoteHomepageGuard, remoteHomepageManifest, remotePhotoPolicyRuntime] = await Promise.all([
        remoteFix77PhotoRuntimeResponse.text(), remoteFix77CssResponse.text(), remoteFix77ManifestResponse.json().catch(()=>null), remoteFix77AcademyDataResponse.text(),
        remoteSitewideGuardResponse.text(), remoteSitewideManifestResponse.json().catch(()=>null),
        remoteHomepageGuardResponse.text(), remoteHomepageManifestResponse.json().catch(()=>null), remotePhotoPolicyRuntimeResponse.clone().text()
      ]);
      const remoteFix77LessonPaths = remoteFix77AcademyData.match(/assets\/artwork-fix77\/academy-data-\d{3}\.svg/g)||[];
      const remoteFix77LessonSamplePaths = [1,102,203].map(n=>`assets/artwork-fix77/academy-data-${String(n).padStart(3,'0')}.svg`);
      const remoteFix77LessonSampleChecks = await Promise.all(remoteFix77LessonSamplePaths.map(asset=>checkPublicVisualAsset(`${STABLE_URL}/${asset}?verify=${Date.now()}`).catch(()=>false)));
      const remoteFix77NewModuleHtml = html.match(/data-gax-open="(?:faultlab|electronics|boardview|compatibility|servicesim|cert)"/g) || [];
      const remoteGlobalAcademyFix77Valid = remoteFix77PhotoRuntimeResponse.ok && remoteFix77CssResponse.ok && remoteFix77ManifestResponse.ok && remoteFix77AcademyDataResponse.ok
        && remoteFix77Manifest?.hotfix === 'FIX77' && remoteFix77Manifest?.mainDashboardModules === 19
        && remoteFix77Manifest?.newModules?.length === 6 && remoteFix77Manifest?.uniqueLessonIllustrations === 203
        && remoteFix77LessonPaths.length === 203 && new Set(remoteFix77LessonPaths).size === 203
        && !/media\/[^\"']+\.(?:jpg|jpeg|png|webp)/i.test(remoteFix77AcademyData)
        && remoteFix77LessonSampleChecks.every(Boolean) && remoteFix77NewModuleHtml.length === 6
        && ['faultLabView','electronicsView','boardviewView','compatibilityView','serviceSimView','bindFaultLab','bindElectronics','bindBoardview','bindCompatibility','bindServiceSim'].every(token=>remoteGlobalExpansionJs.includes(token))
        && ['.gax-board-map','.gax-service-sim'].every(token=>remoteFix77Css.includes(token))
        && remoteServiceWorker.includes('global-academy-fix77.css') && remoteServiceWorker.includes('length:203')
        && html.includes('global-academy-fix77.css?v=6.8.0-fix77');

      const remoteHomepageVisualTags = [...html.matchAll(/<img\b[^>]*data-photo-id="([^"]+)"[^>]*>/gi)].map(m=>m[0]);
      const remoteHomepageVisualIds = remoteHomepageVisualTags.map(tag=>tag.match(/data-photo-id="([^"]+)"/)?.[1] || '');
      const remoteHomepageImageMap = new Map((remoteSitewideManifest?.photos || []).map(item=>[item.id,item]));
      const remoteHomepageMarkupValid = remoteHomepageVisualTags.length >= 19 && new Set(remoteHomepageVisualIds).size === remoteHomepageVisualIds.length;
      const remotePhotoPolicyFilterContract = verifyPhotoMetadataFilterRuntime({ responseOk: remotePhotoPolicyRuntimeResponse.ok, source: remotePhotoPolicyRuntime });
      const remoteHomepageAssetPaths = [];
      const remoteHomepageAssetChecks = [];
      const remoteSitewidePolicyValid = remoteSitewideGuardResponse.ok && remoteSitewideManifestResponse.ok && remotePhotoPolicyFilterContract.valid
        && remoteSitewideGuard.includes('npa-equipment-photo-policy-fix129-v1')
        && remoteSitewideManifest?.hotfix === 'FIX129'
        && remoteSitewideManifest?.dynamicProvider?.enabled === true
        && Object.keys(remoteSitewideManifest?.homepageSlotSeedMap || {}).length === 19
        && new Set(Object.values(remoteSitewideManifest?.homepageSlotSeedMap || {})).size === 19
        && remotePhotoPolicyFilterContract.valid
        && remoteServiceWorker.includes('PHOTO_CACHE_NAME')
        && remoteServiceWorker.includes('isCuratedPhotoHost')
        && !remoteServiceWorker.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123')
        && !remoteServiceWorker.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122');
      const remoteHomepagePolicyValid = remoteHomepageGuardResponse.ok && remoteHomepageManifestResponse.ok
        && remoteHomepageManifest?.hotfix === 'FIX135'
        && remoteHomepageManifest?.entries?.length === 19
        && remoteHomepageManifest?.uniqueSeeds === 19
        && remoteHomepageMarkupValid
        && html.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136')
        && remoteServiceWorker.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136')
        && remoteServiceWorker.includes('academy-photo-library-fix135');
      const remoteSitewideTechVisualsValid = remoteSitewidePolicyValid && remoteHomepagePolicyValid;
      const remoteGlobalAcademyExpansionMissingMarkers = getMissingGlobalAcademyExpansionMarkers(remoteGlobalExpansionJs);
      const remoteGlobalAcademyExpansionValid = remoteGlobalExpansionJsResponse.ok && remoteGlobalExpansionCssResponse.ok && remoteGlobalExpansionManifestResponse.ok
        && remoteGlobalAcademyExpansionMissingMarkers.length === 0
        && ['.gax-tab','.gax-3d-scene','.gax-exam','.gax-video-list','.gax-offline-note'].every(token=>remoteGlobalExpansionCss.includes(token))
        && remoteGlobalExpansionManifest?.build === '6.8.0-fix73-global-academy-expansion-20261106'
        && remoteGlobalExpansionManifest?.modules?.length === 10
        && remoteGlobalExpansionManifest?.integration?.addedTopLevelViews === 0
        && remoteGlobalExpansionManifest?.storage?.newD1Migrations === false
        && remoteGlobalExpansionManifest?.storage?.automaticCustomerDataUpload === false
        && html.includes('global-academy-expansion-fix73.js?v=6.8.0-fix73')
        && html.includes('global-academy-expansion-fix73.css?v=6.8.0-fix73')
        && remoteServiceWorker.includes('global-academy-expansion-fix73.js')
        && remoteServiceWorker.includes('global-academy-expansion-manifest-fix73.json');
      const [remoteHomeFix75CssResponse, remoteHomeFix75JsResponse, remoteHomeFix75ManifestResponse, remoteHomeFix75PhotoResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/home-learning-fix75.css?v=6.8.0-fix75&verify=${Date.now()}`, {cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/home-learning-fix75.js?v=6.8.0-fix75&verify=${Date.now()}`, {cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/home-learning-manifest-fix75.json?verify=${Date.now()}`, {cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/media/master-workshop-hotair-fix75.jpg?verify=${Date.now()}`, {cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteHomeFix75Css, remoteHomeFix75Js, remoteHomeFix75Manifest] = await Promise.all([
        remoteHomeFix75CssResponse.text(), remoteHomeFix75JsResponse.text(), remoteHomeFix75ManifestResponse.json().catch(()=>null)
      ]);
      const remoteHomeLearningFix75Valid = remoteHomeFix75CssResponse.ok && remoteHomeFix75JsResponse.ok
        && remoteHomeFix75ManifestResponse.ok && remoteHomeFix75PhotoResponse.ok
        && remoteHomeFix75Manifest?.hotfix === 'FIX77' && remoteHomeFix75Manifest?.homeModulePhotoCount === 13 && remoteHomeFix75Manifest?.homeModuleImageCount === 19 && remoteHomeFix75Manifest?.duplicatePhotoReuseAcrossSections === false && remoteHomeFix75Manifest?.dynamicOnlinePhotoPoolEnabled === false
        && remoteHomeFix75Manifest?.productVersion === '6.8.0'
        && remoteHomeFix75Js.includes('NPA_HOME_LEARNING_FIX75') && remoteHomeFix75Js.includes('aria-modal')
        && remoteHomeFix75Css.includes('#view-home .np75-specialist-grid')
        && html.includes('home-learning-fix75.css?v=6.8.0-fix75')
        && html.includes('home-learning-fix75.js?v=6.8.0-fix75')
        && remoteServiceWorker.includes('home-learning-fix75.js')
        && remoteServiceWorker.includes('master-workshop-hotair-fix75.jpg');
      const [remoteFix83RuntimeResponse, remoteFix83ManifestResponse, remotePosterManifestResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/visual-uniqueness-fix83.js?v=6.8.0-fix87&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/visual-uniqueness-manifest-fix83.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/video-poster-manifest-fix83.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteHomePrimeJsResponse, remoteHomePrimeCssResponse, remotePhotoCatalogCssResponse, remotePhotoLayoutCssResponse, remotePhotoSourcesResponse, remoteHomePhotoLibraryResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/homepage-photo-prime-fix118.js?v=6.8.0-fix136&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/homepage-photo-prime-fix118.css?v=6.8.0-fix118&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/photo-catalog-fix109.css?v=6.8.0-fix109&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/media/photo-sources-online.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/media/home-photo-library-fix118.json?verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      // FIX178: share the one catalog response already fetched for the metadata-filter contract.
      const remotePhotoCatalogJsResponse = remotePhotoPolicyRuntimeResponse;
      const remotePhotoCatalogJs = remotePhotoPolicyRuntime;
      const remoteMethodRendererResponse = await fetch(`${STABLE_URL}/assets/service-workshop.js?v=6.2.0&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}});
      const [remoteHomePrimeJs, remoteHomePrimeCss, remotePhotoCatalogCss, remotePhotoLayoutCss, remotePhotoSources, remoteHomePhotoLibrary, remoteMethodRenderer] = await Promise.all([
        remoteHomePrimeJsResponse.text(), remoteHomePrimeCssResponse.text(), remotePhotoCatalogCssResponse.text(), remotePhotoLayoutCssResponse.text(), remotePhotoSourcesResponse.json().catch(()=>null), remoteHomePhotoLibraryResponse.json().catch(()=>null), remoteMethodRendererResponse.text()
      ]);
      const remotePhotoVisualGuard = await remoteFix83RuntimeResponse.clone().text();
      const photoCatalogPublicationCheck = evaluatePhotoCatalogPublicationContractFix115({
        jsOk: remotePhotoCatalogJsResponse.ok,
        cssOk: remotePhotoCatalogCssResponse.ok && remotePhotoLayoutCssResponse.ok,
        manifestOk: remotePhotoSourcesResponse.ok,
        manifest: remotePhotoSources,
        js: remotePhotoCatalogJs,
        css: remotePhotoCatalogCss,
        layoutCss: remotePhotoLayoutCss,
        html,
        serviceWorker: remoteServiceWorker,
        remoteRelease,
        expectedPhotoCatalogBuild: EXPECTED_PHOTO_CATALOG_BUILD,
        methodRenderer: remoteMethodRenderer,
        visualPhotoGuard: remotePhotoVisualGuard,
        legacyPhotoGuard: remoteFix77PhotoRuntime,
        // FIX177: pass the fetched 19-slot library into the FIX176 publication contract.
        // Without this argument the validator sees an empty library and rejects an otherwise valid photo catalog.
        photoLibrary: remoteHomePhotoLibrary
      });
      // FIX111: active-view progressive loading, stale homepage seed release and preserved topic/licence uniqueness.
      const remotePhotoCatalogMissingChecks = photoCatalogPublicationCheck.missing;
      const expectedModulePhotoSlotsFix135 = ['home-module-repairmaster','home-module-components','home-module-ultimate3d','home-module-labplus','home-tech-slot-14','home-tech-slot-15','home-module-courses','home-module-checklists','home-module-modelcenter','home-tech-slot-19','home-module-knowledge','home-module-cloudchat','home-tech-slot-22','home-module-14','home-module-15','home-module-16','home-module-17','home-module-18','home-module-19'];
      const remoteModulePhotoCoverageValidFix135 = expectedModulePhotoSlotsFix135.every(id => { const seed = remoteSitewideManifest?.homepageSlotSeedMap?.[id]; const item = (remoteSitewideManifest?.photos || []).find(p => p.id === seed); return Boolean(item && new RegExp('data-photo-id=\"' + id + '\"[^>]*data-photo-kind=\"' + item.category + '\"').test(html)); })
        && remoteHomePhotoLibrary?.entries?.length === 19
        && remoteHomePhotoLibrary.entries.every(entry => expectedModulePhotoSlotsFix135.includes(entry.slotId));
      const remotePhotoPrimeValid = remoteHomePrimeJsResponse.ok && remoteHomePrimeCssResponse.ok
        && remoteHomePrimeJs.includes('NPA_HOME_PHOTO_PRIME_FIX118') && remoteHomePrimeJs.includes('photos[slotId]') && remoteHomePrimeJs.includes('photoCacheStats') && remoteHomePrimeJs.includes('curated-equipment-photographs-with-local-svg-fallback') && remoteHomePrimeJs.includes('EXPECTED_SLOTS = 19')
        && remotePhotoCatalogJs.includes('function registerPrimedHomepageAssignments(')
        && remotePhotoCatalogJs.includes('const primedAssignmentsRegistered = registerPrimedHomepageAssignments(primeResult)')
        && remoteHomePrimeJs.includes('homepageSlotSeedMap')
        && remoteHomePrimeCss.includes('#view-home .np30-module-photo>img')
        && remoteRelease?.homepagePhotoFirstRenderFix?.hotfix === 'FIX136' && remoteRelease?.homepagePhotoFirstRenderFix?.registeredAssignments === 19 && remoteRelease?.homepagePhotoFirstRenderFix?.homepageEnabled === true
        && html.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136')
        && remoteServiceWorker.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136')
        && remotePhotoCatalogJs.includes('function registerStaticHomepagePhotoAssignments()')
        && remoteHomePhotoLibrary?.hotfix === 'FIX135' && remoteHomePhotoLibrary?.entries?.length === 19
        && remoteModulePhotoCoverageValidFix135
        && remoteServiceWorker.includes('academy-photo-library-fix135') && !remoteServiceWorker.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123');
      if (!remotePhotoPrimeValid) remotePhotoCatalogMissingChecks.push('homepage_photo_library_and_static_assignment_FIX118');
      const remotePhotoProxySampleIds = ['multimeter-bench','ram-modules','gpu-msi-geforce-rtx3070'];
      const remotePhotoProxyResponses = await Promise.all(remotePhotoProxySampleIds.map(id =>
        fetch(`${STABLE_URL}/media/photos/${encodeURIComponent(id)}.jpg?verify=${Date.now()}`, { cache:'no-store', headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'} })
          .catch(error => ({ ok:false, status:0, headers:new Headers(), arrayBuffer:async()=>new ArrayBuffer(0), _error:String(error?.message||error) }))));
      const remotePhotoProxyChecks = await Promise.all(remotePhotoProxyResponses.map(async response => {
        if (!response.ok || !String(response.headers?.get('content-type') || '').toLowerCase().startsWith('image/')) return false;
        if (response.headers?.get('x-photo-delivery') !== 'FIX131-SAME-ORIGIN' || response.headers?.get('x-photo-proxy-fix') !== 'FIX134-SAFE-REDIRECTS') return false;
        try { const bytes = new Uint8Array(await response.arrayBuffer()); return bytes.length >= 512; } catch { return false; }
      }));
      const remotePhotoProxyValid = remotePhotoProxyChecks.length === remotePhotoProxySampleIds.length && remotePhotoProxyChecks.every(Boolean);
      const remotePhotoCatalogValid = photoCatalogPublicationCheck.valid && remotePhotoPrimeValid && remotePhotoProxyValid
        && remotePhotoSources?.dynamicProvider?.commonsQueryVariantsPerCategory === 3;
      const [remoteFix83Runtime, remoteFix83Manifest, remotePosterManifest] = await Promise.all([
        remoteFix83RuntimeResponse.text(), remoteFix83ManifestResponse.json().catch(()=>null), remotePosterManifestResponse.json().catch(()=>null)
      ]);
      const fix83RuntimeMarkersValid = ['uniqueVisualUrl','GDDR6','GDDR / BGA MEMORY','vram','MutationObserver','galleryItems','FIX93_CATALOG_IMAGE_ERROR_OWNER','isCatalogManagedSlot','.photo-credit-fix90, .np640-photo-credit, figcaption'].every(token=>remoteFix83Runtime.includes(token));
      const fix83Categories = Array.isArray(remoteFix83Manifest?.categories) ? remoteFix83Manifest.categories : [];
      const fix83VramRule = String(remoteFix83Manifest?.vramRule || '');
      const fix83VisualManifestValid = remoteFix83Manifest?.hotfix === 'FIX83'
        && remoteFix83Manifest?.galleryIllustrationCount === 54
        && fix83Categories.includes('vram') && fix83Categories.includes('ram')
        && fix83VramRule.includes('Separate GDDR/BGA packages on PCB')
        && fix83VramRule.includes('Never use DIMM/SO-DIMM imagery');
      const fix83PosterManifestValid = remotePosterManifest?.hotfix === 'FIX83' && remotePosterManifest?.posterCount === 10;
      const fix83HtmlReferenceValid = html.includes('visual-uniqueness-fix83.js?v=6.8.0-fix87')
        && html.includes('lesson-art.js?v=6.8.0-fix87')
        && html.includes('app.js?v=6.8.0-fix87-repair-visuals')
        && html.includes('repair-photo-layout-fix87.css?v=6.8.0-fix87');
      const fix83ServiceWorkerValid = remoteServiceWorker.includes('visual-uniqueness-fix83.js')
        && remoteServiceWorker.includes('visual-uniqueness-manifest-fix83.json')
        && remoteServiceWorker.includes('video-poster-manifest-fix83.json')
        && remoteServiceWorker.includes('LOCAL-ESD.jpg?v=6.8.0-fix83')
        && remoteServiceWorker.includes('LOCAL-NPU.jpg?v=6.8.0-fix83');
      const [remoteRepairLayoutCssResponse, remoteLessonArtResponse, remoteRepairAppResponse] = await Promise.all([
        fetch(`${STABLE_URL}/assets/repair-photo-layout-fix87.css?v=6.8.0-fix87&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/lesson-art.js?v=6.8.0-fix87&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),
        fetch(`${STABLE_URL}/assets/app.js?v=6.8.0-fix87-repair-visuals&verify=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}})
      ]);
      const [remoteRepairLayoutCss, remoteLessonArt, remoteRepairApp] = await Promise.all([
        remoteRepairLayoutCssResponse.text(), remoteLessonArtResponse.text(), remoteRepairAppResponse.text()
      ]);
      const repairPhotoLayoutValid = remoteRepairLayoutCssResponse.ok && remoteLessonArtResponse.ok && remoteRepairAppResponse.ok
        && remoteRepairLayoutCss.includes('width:100%!important') && remoteRepairLayoutCss.includes('aspect-ratio:16/9')
        && remoteRepairLayoutCss.includes('repair-photo-illustration')
        && remoteLessonArt.includes('uniqueVisualUrl: window.NPA_UNIQUE_VISUALS_FIX83?.uniqueVisualUrl')
        && remoteLessonArt.includes("localRepairPhotos(record,'card')")
        && remoteLessonArt.includes("localRepairPhotos(record,'detail')")
        && remoteLessonArt.includes('one-unique-card-illustration-plus-three-different-detail-illustrations')
        && remoteRepairApp.includes('data-photo-context=\"card\"')
        && remoteRepairApp.includes('data-photo-context=\"detail\"');
      const htmlHotfixes = [...html.matchAll(/<meta\s+name=[\"']academy-hotfix[\"']\s+content=[\"']([^\"']+)/gi)].map(match=>match[1]);
      const htmlHotfix = htmlHotfixes.at(-1) || '';
      const remotePracticalMetadataValid=remoteRelease?.academyPracticalSuiteFix155?.hotfix==='FIX155'
        && remoteRelease?.academyPracticalSuiteFix155?.modules?.length===8
        && remoteRelease?.academyPracticalSuiteFix155?.d1Migrations===false
        && remoteRelease?.academyPracticalSuiteFix155?.dataMigrations===false;
      const remoteCurriculumMetadataValid=remoteRelease?.academyMasterCurriculumFix162?.hotfix==='FIX162'
        && remoteRelease?.academyMasterCurriculumFix162?.modules?.length===11
        && remoteRelease?.academyMasterCurriculumFix162?.d1SchemaMigrations===false
        && remoteRelease?.academyMasterCurriculumFix162?.newD1Tables===false;
      const remoteSpecialistSystemsMetaValid=remoteRelease?.academySpecialistSystemsFix182?.hotfix==='FIX182'
        && remoteRelease?.academySpecialistSystemsFix182?.productVersion==='6.8.0'
        && remoteRelease?.academySpecialistSystemsFix182?.lessons===20
        && remoteRelease?.academySpecialistSystemsFix182?.quizQuestions===60
        && remoteRelease?.academySpecialistSystemsFix182?.cases===17
        && remoteRelease?.academySpecialistSystemsFix182?.projects===10
        && remoteRelease?.academySpecialistSystemsFix182?.glossaryTerms===40
        && remoteRelease?.academySpecialistSystemsFix182?.examQuestions===16
        && remoteRelease?.academySpecialistSystemsFix182?.newViews===0
        && remoteRelease?.academySpecialistSystemsFix182?.newD1Database===false
        && remoteRelease?.academySpecialistSystemsFix182?.d1SchemaMigrations===false
        && remoteRelease?.academySpecialistSystemsFix182?.hardwareAccess===false
        && remoteRelease?.academySpecialistSystemsFix182?.networkAccess===false
        && html.includes('academy-specialist-systems-fix182.js?v=6.8.0-fix182')
        && html.includes('academy-specialist-systems-fix182.css?v=6.8.0-fix182')
        && html.includes('data-a168-tab="specialist"')
        && remoteServiceWorker.includes('academy-specialist-systems-fix182.js')
        && remoteServiceWorker.includes('academy-specialist-systems-fix182.css');
      const remoteAdvancedServiceLabMetaValid=remoteRelease?.academyAdvancedServiceLabFix183?.hotfix==='FIX183'
        && remoteRelease?.academyAdvancedServiceLabFix183?.productVersion==='6.8.0'
        && remoteRelease?.academyAdvancedServiceLabFix183?.lessons===20
        && remoteRelease?.academyAdvancedServiceLabFix183?.quizQuestions===60
        && remoteRelease?.academyAdvancedServiceLabFix183?.cases===15
        && remoteRelease?.academyAdvancedServiceLabFix183?.projects===10
        && remoteRelease?.academyAdvancedServiceLabFix183?.glossaryTerms===40
        && remoteRelease?.academyAdvancedServiceLabFix183?.examQuestions===16
        && remoteRelease?.academyAdvancedServiceLabFix183?.newViews===0
        && remoteRelease?.academyAdvancedServiceLabFix183?.expectedExistingViews===35
        && remoteRelease?.academyAdvancedServiceLabFix183?.expectedExistingAcademyTabs===18
        && remoteRelease?.academyAdvancedServiceLabFix183?.newD1Database===false
        && remoteRelease?.academyAdvancedServiceLabFix183?.newD1Tables===false
        && remoteRelease?.academyAdvancedServiceLabFix183?.d1SchemaMigrations===false
        && remoteRelease?.academyAdvancedServiceLabFix183?.hardwareAccess===false
        && remoteRelease?.academyAdvancedServiceLabFix183?.networkAccess===false
        && remoteRelease?.academyAdvancedServiceLabFix183?.localStorageOnly===true
        && html.includes('academy-advanced-service-lab-fix183.js?v=6.8.0-fix183')
        && html.includes('academy-advanced-service-lab-fix183.css?v=6.8.0-fix183')
        && html.includes('data-a168-tab="serviceexpert"')
        && html.includes('id="a183AdvancedServiceLab"')
        && remoteServiceWorker.includes('academy-advanced-service-lab-fix183.js')
        && remoteServiceWorker.includes('academy-advanced-service-lab-fix183.css');
      const remoteExpertDiagnosticsMetaValid=remoteRelease?.academyExpertDiagnosticsFix184?.hotfix==='FIX184'
        && remoteRelease?.academyExpertDiagnosticsFix184?.productVersion==='6.8.0'
        && remoteRelease?.academyExpertDiagnosticsFix184?.lessons===20
        && remoteRelease?.academyExpertDiagnosticsFix184?.quizQuestions===60
        && remoteRelease?.academyExpertDiagnosticsFix184?.cases===15
        && remoteRelease?.academyExpertDiagnosticsFix184?.projects===10
        && remoteRelease?.academyExpertDiagnosticsFix184?.glossaryTerms===40
        && remoteRelease?.academyExpertDiagnosticsFix184?.examQuestions===20
        && remoteRelease?.academyExpertDiagnosticsFix184?.newViews===0
        && remoteRelease?.academyExpertDiagnosticsFix184?.expectedExistingViews===35
        && remoteRelease?.academyExpertDiagnosticsFix184?.expectedExistingAcademyTabs===19
        && remoteRelease?.academyExpertDiagnosticsFix184?.newD1Database===false
        && remoteRelease?.academyExpertDiagnosticsFix184?.newD1Tables===false
        && remoteRelease?.academyExpertDiagnosticsFix184?.d1SchemaMigrations===false
        && remoteRelease?.academyExpertDiagnosticsFix184?.hardwareAccess===false
        && remoteRelease?.academyExpertDiagnosticsFix184?.networkAccess===false
        && remoteRelease?.academyExpertDiagnosticsFix184?.commandsExecuted===false
        && remoteRelease?.academyExpertDiagnosticsFix184?.localStorageOnly===true
        && html.includes('academy-expert-diagnostics-fix184.js?v=6.8.0-fix184')
        && html.includes('academy-expert-diagnostics-fix184.css?v=6.8.0-fix184')
        && html.includes('data-a168-tab="expertdiag"')
        && html.includes('data-a168-panel="expertdiag"')
        && html.includes('id="a184ExpertDiagnostics"')
        && remoteServiceWorker.includes('academy-expert-diagnostics-fix184.js')
        && remoteServiceWorker.includes('academy-expert-diagnostics-fix184.css');

      const remotePerformanceFirmwareMetaValid = remoteRelease?.academyPerformanceFirmwareFix185?.hotfix==='FIX185'
        && remoteRelease?.academyPerformanceFirmwareFix185?.productVersion==='6.8.0'
        && remoteRelease?.academyPerformanceFirmwareFix185?.lessons===20
        && remoteRelease?.academyPerformanceFirmwareFix185?.quizQuestions===60
        && remoteRelease?.academyPerformanceFirmwareFix185?.cases===15
        && remoteRelease?.academyPerformanceFirmwareFix185?.projects===10
        && remoteRelease?.academyPerformanceFirmwareFix185?.glossaryTerms===40
        && remoteRelease?.academyPerformanceFirmwareFix185?.examQuestions===20
        && remoteRelease?.academyPerformanceFirmwareFix185?.tools===8
        && remoteRelease?.academyPerformanceFirmwareFix185?.expectedExistingAcademyTabs===20
        && remoteRelease?.academyPerformanceFirmwareFix185?.expectedExistingViews===35
        && remoteRelease?.academyPerformanceFirmwareFix185?.newViews===0
        && remoteRelease?.academyPerformanceFirmwareFix185?.newD1Database===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.newD1Tables===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.d1SchemaMigrations===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.hardwareAccess===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.networkAccess===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.commandsExecuted===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.firmwareWrite===false
        && remoteRelease?.academyPerformanceFirmwareFix185?.localStorageOnly===true;
      const remotePerformanceFirmwareHtmlValid = html.includes('data-a168-tab="perfdiag"') && html.includes('data-a168-panel="perfdiag"') && html.includes('id="a185ExpertPerformance"')
        && html.includes('academy-performance-firmware-fix185.js?v=6.8.0-fix185') && html.includes('academy-performance-firmware-fix185.css?v=6.8.0-fix185')
        && (html.match(/data-a168-tab="[a-z]+"/g)||[]).length===20;
      const remotePerformanceFirmwarePwaValid = remoteServiceWorker.includes('academy-performance-firmware-fix185.js') && remoteServiceWorker.includes('academy-performance-firmware-fix185.css');
      const remotePracticalLabMetaValid = remoteRelease?.academyPracticalLabFix186?.hotfix==='FIX186'
        && remoteRelease?.academyPracticalLabFix186?.productVersion==='6.8.0'
        && remoteRelease?.academyPracticalLabFix186?.expectedExistingAcademyTabs===20
        && remoteRelease?.academyPracticalLabFix186?.expectedExistingViews===35
        && remoteRelease?.academyPracticalLabFix186?.newMainTabs===0
        && remoteRelease?.academyPracticalLabFix186?.newViews===0
        && remoteRelease?.academyPracticalLabFix186?.newD1Database===false
        && remoteRelease?.academyPracticalLabFix186?.newD1Tables===false
        && remoteRelease?.academyPracticalLabFix186?.d1SchemaMigrations===false
        && remoteRelease?.academyPracticalLabFix186?.rawLogsUploadedToServer===false
        && remoteRelease?.academyPracticalLabFix186?.rawLogsStoredInLocalStorage===false
        && remoteRelease?.academyPracticalLabFix186?.firmwareWrite===false
        && remoteRelease?.academyPracticalLabFix186?.diskWrite===false
        && remoteRelease?.academyPracticalLabFix186?.remoteHardwareControl===false
        && remoteRelease?.academyPracticalLabFix186?.uefiCapsulePayloadSignatureVerifiedByGenericTool===false
        && remoteRelease?.academyPracticalLabFix186?.productionPublished===false;
      const remotePracticalLabHtmlValid = html.includes('id="a186PracticalLab"') && html.includes('data-a168-tab="perfdiag"')
        && html.includes('academy-practical-lab-fix186.js?v=6.8.0-fix186') && html.includes('academy-practical-lab-fix186.css?v=6.8.0-fix186')
        && (html.match(/data-a168-tab="[a-z]+"/g)||[]).length===20 && (html.match(/id="view-[^"]+"/g)||[]).length===35;
      const remotePracticalLabPwaValid = remoteServiceWorker.includes('academy-practical-lab-fix186.js?v=6.8.0-fix186') && remoteServiceWorker.includes('academy-practical-lab-fix186.css?v=6.8.0-fix186');
      const remotePracticalLabAssetsValid = remoteFix186JsResponse.ok && remoteFix186CssResponse.ok
        && ['ACADEMY_FIX186_TOOLS','normalizeImportedFile','analyzeEvents','safeGeneratedCase','/api/chat','automaticElectricalDiagnosis:false'].every(x=>remoteFix186Js.includes(x))
        && remoteFix186Css.includes('.a186-lab');
      const remotePcbAiProbeResponse = await fetch(`${STABLE_URL}/api/academy/fix186/pcb-analysis?verify=${Date.now()}`,{method:'POST',cache:'no-store',headers:{'content-type':'application/json','cache-control':'no-cache, no-store',pragma:'no-cache'},body:JSON.stringify({consent:false})});
      const remotePcbAiProbe = await remotePcbAiProbeResponse.json().catch(()=>({}));
      const remotePcbAiEndpointValid = remotePcbAiProbeResponse.status===400 && remotePcbAiProbe?.error==='IMAGE_CONSENT_REQUIRED';
      const remoteCurrentHotfixValid = Boolean(EXPECTED_HOTFIX && EXPECTED_HOTFIX_BUILD && EXPECTED_PHOTO_CATALOG_BUILD)
        && htmlHotfixes.includes(EXPECTED_HOTFIX)
        && remoteRelease?.latestHotfix === EXPECTED_HOTFIX
        && remoteRelease?.latestHotfixBuild === EXPECTED_HOTFIX_BUILD
        && remotePracticalMetadataValid && remotePracticalSuiteValid && remoteCurriculumMetadataValid && remoteSpecialistSystemsMetaValid && remoteAdvancedServiceLabMetaValid && remoteExpertDiagnosticsMetaValid && remotePerformanceFirmwareMetaValid && remotePerformanceFirmwareHtmlValid && remotePerformanceFirmwarePwaValid && remotePracticalLabMetaValid && remotePracticalLabHtmlValid && remotePracticalLabPwaValid && remotePracticalLabAssetsValid && remotePcbAiEndpointValid
        && remoteRelease?.visualRuntimeBuildTag === '6.8.0-fix87'
        && remoteRelease?.photoCatalogRuntimeBuildTag === EXPECTED_PHOTO_CATALOG_BUILD
        && remoteRelease?.deploymentMode === 'cloudflare-pages-direct-upload-production';
      const remoteGlobalAcademyFix83Valid = remoteFix83RuntimeResponse.ok && remoteFix83ManifestResponse.ok && remotePosterManifestResponse.ok
        && fix83RuntimeMarkersValid && fix83VisualManifestValid && fix83PosterManifestValid && fix83HtmlReferenceValid && fix83ServiceWorkerValid
        && repairPhotoLayoutValid && remotePhotoCatalogValid && remoteCurrentHotfixValid;
      const remoteGlobalDiagramPaths = Array.isArray(remoteGlobalSuiteManifest?.assets?.technicalIllustrationFiles)
        ? remoteGlobalSuiteManifest.assets.technicalIllustrationFiles.filter(x => typeof x === 'string' && /^assets\/artwork-fix(?:51|54)\/[a-z0-9-]+\.svg$/i.test(x)) : [];
      const remoteGlobalDiagramChecks = remoteGlobalDiagramPaths.length === 30
        ? await Promise.all(remoteGlobalDiagramPaths.map(asset => checkPublicVisualAsset(`${STABLE_URL}/${asset}?verify=${Date.now()}`).catch(()=>false))) : [];
      const remoteGlobalDiagramsValid = remoteGlobalDiagramPaths.length === 30 && remoteGlobalDiagramChecks.every(Boolean);
      const remoteGlobalAcademySuiteValid = remoteGlobalSuiteJsResponse.ok && remoteGlobalSuiteCssResponse.ok && remoteGlobalSuiteManifestResponse.ok
        && ['NPA_GLOBAL_ACADEMY_FIX60','runAudit','runSecurityCheck','/api/chat','ACADEMY_DEVICE_CATALOG','ACADEMY_LONG_VIDEOS','npaFix60WorkshopCasesV1','gasExamNext','gasSecurityCheck','npa-global-academy-fix60-packs'].every(token=>remoteGlobalSuiteJs.includes(token))
        && ['.gas-hero','.gas-tabs','.gas-feature-grid','.gas-media-grid','.gas-video-grid','.gas-security-grid','.gas-pack-grid'].every(token=>remoteGlobalSuiteCss.includes(token))
        && remoteGlobalSuiteManifest?.suite === 'GLOBAL ACADEMY PRO' && remoteGlobalSuiteManifest?.fixSeries?.length === 7
        && remoteGlobalSuiteManifest?.assets?.photos === 12 && remoteGlobalSuiteManifest?.assets?.videoPosters === 3
        && remoteGlobalSuiteManifest?.assets?.technicalIllustrations === 30 && remoteGlobalSuiteManifest?.assets?.visualTotal === 45
        && remoteGlobalSuiteManifest?.assets?.longVideoCatalogueEntries === 12 && remoteGlobalDiagramsValid
        && remoteGlobalAcademyExpansionValid
        && remoteHomeLearningFix75Valid
        && html.includes('id=\"view-globalacademy\"') && html.includes('global-academy-suite-fix60.js?v=6.8.0-fix60')
        && html.includes('global-academy-suite-fix60.css?v=6.8.0-fix60')
        && remoteServiceWorker.includes('global-academy-suite-fix60.js') && remoteServiceWorker.includes('global-academy-suite-fix60.css')
        && remoteServiceWorker.includes('artwork-fix54/30-keyboard-touchpad.svg');
      const academyFeatureChecks = {
        lessonCount: hasIdText('lessonTotalBadge', '1083'),
        emailAccountForm: hasId('emailAuthForm'),
        socialLoginFiveProviders: ['google','facebook','microsoft','github','discord'].every(provider=>html.includes(`data-oauth-start="${provider}"`)) && !html.includes('data-oauth-start="x"') && html.includes('linkedLoginMethodsList') && html.includes('accountSessionsList'),
        modelDirectory: hasId('deviceModelDirectory'),
        globalStats: hasId('academyGlobalStats'),
        uniqueVisitorsMetric: hasId('metricUniqueVisitors'),
        brandCount: hasIdText('metricBrandTotal', '33'),
        modelCount: hasIdText('metricModelTotal', '150'),
        monthVisits: hasId('metricMonthVisits'),
        todayViews: hasId('metricTodayViews'),
        weekViews: hasId('metricWeekViews'),
        learnersWithProgress: hasId('metricLearnersWithProgress'),
        trackedLessonOpens: hasId('metricTrackedLessonOpens'),
        trackedVideoOpens: hasId('metricTrackedVideoOpens'),
        trackedLessonCompletions: hasId('metricTrackedLessonCompletions'),
        workshopMeasurement: hasId('view-measurementpro') && hasId('np62-meter-mode'),
        noCustomerServiceIntake: !hasId('view-servicepro') && !hasId('np62-ticket-form') && !hasId('lab44-workorders'),
        workshopModelDirectory: hasId('view-modelcenter') && hasId('np62-model-search'),

        supportVideo: /akademia-dlaczego-warto-wspierac\.mp4\?v=6\.8\.0-fix127-fix9-clean-video/i.test(html) && html.includes('support-video-transcript') && !/<track\b[^>]*\bdefault(?:\s|>)/i.test(html) && remoteSupportVideoFresh,
        supportImpact: hasId('supportImpact'),
        supportFaq: hasId('supportFaq'),
        serviceMeasurementLog: hasId('npmlMeasurementLog') && hasId('npmlForm') && hasId('npmlRows') && hasId('npmlExportCsv') && remoteMeasurementLogValid,
        masterWorkshop: hasId('view-masterworkshop') && hasId('nwmMasterWorkshop') && hasId('nwmDomainGrid') && hasId('nwmCaseForm') && hasId('nwmExamPicker') && remoteMasterWorkshopValid && remoteMasterWorkshopCssValid,
        masterAcademyFix14: hasId('n63LabType') && hasId('n63ComponentList') && hasId('n63DiagnosisForm') && hasId('n63PathGrid') && hasId('n63JobForm') && hasId('n63CertificateList') && hasId('n63ReplacementList') && hasId('n63XpSummary') && html.includes('data-nwm-tab=\"replacement\"') && html.includes('data-nwm-panel=\"replacement\"') && html.includes('master-workshop-630-extension.js?v=6.8.0-fix119') && html.includes('master-workshop-630-extension.css?v=6.8.0-fix119') && remoteMasterAcademyValid && remoteMasterAcademyCssValid,
        ultimateServiceAcademyFix15: hasId('n64PcbCase') && hasId('n64BiosA') && hasId('n64ImageFile') && hasId('n64LogFile') && hasId('n64CompatRun') && hasId('n64IpCalc') && hasId('n64QcSave') && hasId('n64AiForm') && hasId('n64DocsInput') && hasId('n64ExamPicker') && html.includes('master-academy-640-pro.js?v=6.4.0-fix15') && html.includes('master-academy-640-pro.css?v=6.4.0-fix15') && remoteUltimateAcademyValid && remoteUltimateAcademyCssValid,
        ultimateRepairCenterFix16: html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') && html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') && ['codes','measurements','boardview','hardware','cases','trainer','academies','security'].every(tab=>remoteFix16Valid && remoteFix16Asset.includes(`data-m64-pane=\"${tab}\"`)) && remoteFix16Valid && remoteFix16CssValid,
        masterServiceCenterFix17: html.includes('master-academy-660-center.js?v=6.6.0-fix17') && html.includes('master-academy-660-center.css?v=6.6.0-fix17') && remoteFix17Valid && remoteFix17CssValid,
        practiceAcademyFix27: hasId('view-practicepro') && html.includes('practice-academy-fix27.js?v=6.8.0-fix28') && html.includes('practice-academy-fix27.css?v=6.8.0-fix28') && remotePracticeAcademyValid,
        uniqueRepairPhotoEngine: html.includes('lesson-art.js?v=6.8.0-fix51-visual-assets-reuse') && html.includes('app.js?v=6.8.0-fix51-visual-academy') && remotePhotoEngineValid,
        practicalLearningStudio: html.includes('advanced-learning-studio-620.js?v=6.2.0-fix7') && remoteStudioValid,
        longExternalVideoLibrary: html.includes('id="longVideoGallery"'),
        homepageSlideshow: html.includes('id="np640Showcase"') && (html.match(/class="np640-slide(?: is-active)?"/g)||[]).length === 6 && remoteShowcaseValid,
        homepageLearningCenter: html.includes('np640-learning-center') && html.includes('np640ResetPlan'),
        homePhotoNavigationFix30: html.includes('home-refresh-fix30.css?v=6.8.0-fix30') && html.includes('photo-unique-thumbnails-fix30.js?v=6.8.0-fix30') && html.includes('home-module-repairmaster') && remoteHomeRefreshValid,
        learningCenterFix40: hasId('view-learnpro') && ['dashboard','search','bench','exams','atlas','offline','reports'].every(tab=>html.includes(`data-l40-pane=\"${tab}\"`)) && html.includes('nauka-centrum-fix40.js?v=6.8.0-fix40') && html.includes('nauka-centrum-fix40.css?v=6.8.0-fix40') && remoteFix40Valid,
        serviceAcademyFix41: hasId('view-learnpro') && html.includes('data-l40-pane=\"academy41\"') && html.includes('data-l40-tab=\"academy41\"') && html.includes('akademia-serwisanta-fix41.js?v=6.8.0-fix41') && html.includes('akademia-serwisanta-fix41.css?v=6.8.0-fix41') && remoteFix41Valid,
        realWorkshopFix42: hasId('view-learnpro') && html.includes('data-l40-pane=\"workshop42\"') && html.includes('data-l40-tab=\"workshop42\"') && html.includes('real-workshop-fix42.js?v=6.8.0-fix42') && html.includes('real-workshop-fix42.css?v=6.8.0-fix42') && remoteFix42Valid,
        knowledgeSuiteFeedbackFix43: hasId('view-fix43') && hasId('view-feedback') && html.includes('data-view=\"feedback\"') && html.includes('knowledge-suite-fix43.js?v=6.8.0-fix43') && html.includes('knowledge-suite-fix43.css?v=6.8.0-fix43') && remoteFix43Valid,
        masterServiceCenterFix44: hasId('view-fix44') && html.includes('data-view=\"fix44\"') && html.includes('master-service-center-fix44.js?v=6.8.0-fix44') && html.includes('master-service-center-fix44.css?v=6.8.0-fix44') && remoteFix44Valid,
        professionalServiceCenterFix45: hasId('view-fix45') && html.includes('data-view=\"fix45\"') && html.includes('professional-service-fix45.js?v=6.8.0-fix45') && html.includes('professional-service-fix45.css?v=6.8.0-fix45') && remoteFix45Valid,
        masterControlCenterFix47: hasId('view-fix47') && html.includes('data-view=\"fix47\"') && html.includes('master-control-fix47.js?v=6.8.0-fix47') && html.includes('master-control-fix47.css?v=6.8.0-fix47') && remoteFix47Valid,
        ultimateQualityCenterFix49: hasId('view-fix49') && html.includes('data-view=\"fix49\"') && html.includes('ultimate-quality-fix49.js?v=6.8.0-fix49') && html.includes('ultimate-quality-fix49.css?v=6.8.0-fix49') && remoteFix49Valid,
        visualAcademyFix51: html.includes('visual-assets-fix51.js') && html.includes('visual-academy-fix51.js') && html.includes('visual-academy-fix51.css') && remoteFix51Valid,
        globalAcademySuiteFix60: html.includes('id=\"view-globalacademy\"') && html.includes('data-view=\"globalacademy\"') && remoteGlobalAcademySuiteValid,
        globalAcademyFix77: remoteGlobalAcademyFix77Valid,
        sitewideNoPeopleVisuals: remoteSitewideTechVisualsValid
      };
      const academyFeatures = Object.values(academyFeatureChecks).every(Boolean);
      const supportExpansionValid = html.includes('assets/support-expansion-fix35.css?v=6.8.0-fix35') && html.includes('assets/support-enhancements-fix35.js?v=6.8.0-fix35') && ['supportRoadmap','supportPayments','supportWays','supportContributionGuide'].every(id=>hasId(id)) && html.includes('https://www.blik.com/pierwsze-kroki-z-blikiem') && remoteSupportExpansionValid;
      const supportCommunityMarkupValid = html.includes('assets/support-community-fix36.css?v=6.8.0-fix36') && html.includes('assets/support-community-fix36.js?v=6.8.0-fix36') && ['supportReleaseJournal','supportCommunityCenter','supportProposalForm','supportProposalList','supportCaseCenter','supportCaseForm','supportMyCases','supportTransparencyCenter','supportCostsList','supportThanksCenter','supportThanksForm','supportFollowCenter','supportUpdatesSubscribe','supportAnnouncementsList','supportAdminCenter','supportCostAdminForm','supportAnnouncementAdminForm','supportAnnouncementUnread','supportMarkAnnouncementsRead','supportDataRefresh'].every(id=>hasId(id));
      const supportCommunityFeatureValid = supportCommunityMarkupValid && remoteSupportCommunityValid;
      const newPlatformBrand = html.includes('NAUKA OD A DO Z — DLA WSZYSTKICH') && html.includes('az-pathways') && html.includes('nauka-od-a-do-z.css') && html.includes('lab-device-bridge-630.js') && html.includes('theme-630.css') && html.includes('scroll-navigation-630.js') && html.includes('np630-photo-hero') && html.includes('np62SerialConnect') && html.includes('np62UsbConnect') && html.includes('lesson-art.js?v=6.8.0-fix51-visual-assets-reuse') && html.includes('advanced-learning-studio-620.js?v=6.2.0-fix7') && html.includes('homepage-showcase-640.js?v=6.2.0-fix8') && html.includes('fix9-clean-video') && html.includes('support-video-transcript') && html.includes('measurement-log-640.js?v=6.2.0-fix11') && html.includes('measurement-log-640.css?v=6.2.0-fix11') && html.includes('master-workshop-630.js?v=6.2.0-fix12') && html.includes('master-workshop-630.css?v=6.2.0-fix12') && html.includes('master-workshop-630-extension.js?v=6.8.0-fix119') && html.includes('master-workshop-630-extension.css?v=6.8.0-fix119') && html.includes('master-academy-640-pro.js?v=6.4.0-fix15') && html.includes('master-academy-640-pro.css?v=6.4.0-fix15') && html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') && html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') && html.includes('master-academy-660-center.js?v=6.6.0-fix17') && html.includes('master-academy-660-center.css?v=6.6.0-fix17') && html.includes('practice-academy-fix27.js?v=6.8.0-fix28') && html.includes('practice-academy-fix27.css?v=6.8.0-fix28') && html.includes('home-refresh-fix30.css?v=6.8.0-fix30') && html.includes('photo-unique-thumbnails-fix30.js?v=6.8.0-fix30');
      const academyFeaturesMissing = Object.entries(academyFeatureChecks).filter(([, ok]) => !ok).map(([name]) => name);
      if (response.ok && match && match[1] === EXPECTED_BUILD && remoteHtmlHasUltra && remotePhotoEngineValid && remoteStudioValid && remoteShowcaseValid && cards >= 12 && labActive && labContent && pwaPresent && academyFeatures && newPlatformBrand && supportExpansionValid && supportCommunityFeatureValid && remoteFix40Valid && remoteFix41Valid && remoteFix42Valid && remoteFix43Valid && remoteFix44Valid && remoteFix45Valid && remoteFix47Valid && remoteFix49Valid && remoteFix50Valid && remoteFix51Valid && remoteGlobalAcademyFix77Valid && remoteSitewideTechVisualsValid && remoteGlobalAcademyFix83Valid) {
        log(`PUBLICZNA STRONA POTWIERDZONA: ${match[1]} + hotfix ${htmlHotfix}, 1083 lekcje, 33 producentów, 150 modeli, laboratorium pomiarów, podgląd mikroskopu UVC, mostek USB/Serial, zakres wyłącznie edukacyjny bez przyjmowania zleceń serwisowych, katalog modeli, konto e-mail, statystyki, lokalne zdjęcia dla trzech slotów każdej usterki (FIX50), Studio praktyczne PRO, pokaz slajdów FIX8, centrum nauki, dziennik pomiarów FIX11, Warsztat Mistrza FIX12, Master Electronics & Repair Academy FIX14, Ultimate Service Academy FIX15, Ultimate Repair Center FIX16, Centrum Praktyki FIX27, Centrum Nauki FIX40, przebudowany film wsparcia FIX9, biblioteka 203 ilustracji lekcji, 36 lokalnych ilustracji awaryjnych strony głównej oraz 19 fotografii sprzętu FIX129 z filtrem metadanych bez osób i dłoni; ${cards} kart diagnostycznych; HTTP ${response.status}.`);
        return true;
      }
      last = `HTTP ${response.status}; build=${match ? match[1] : 'brak'}; hotfix=${htmlHotfix || 'brak'}; cards=${cards}; ultra=${remoteHtmlHasUltra}; labActive=${labActive}; labContent=${labContent}; pwa=${pwaPresent}; academyFeatures=${academyFeatures}; newPlatformBrand=${newPlatformBrand}; remotePhotoEngineValid=${remotePhotoEngineValid}; remoteStudioValid=${remoteStudioValid}; remoteSupportVideoFresh=${remoteSupportVideoFresh}; remoteSupportVideoBytes=${supportVideoCheck.bytes||0}; remoteMeasurementLogValid=${remoteMeasurementLogValid}; remoteMasterWorkshopValid=${remoteMasterWorkshopValid}; remoteMasterWorkshopCssValid=${remoteMasterWorkshopCssValid}; remoteMasterAcademyValid=${remoteMasterAcademyValid}; remoteMasterAcademyCssValid=${remoteMasterAcademyCssValid}; remoteUltimateAcademyValid=${remoteUltimateAcademyValid}; remoteUltimateAcademyCssValid=${remoteUltimateAcademyCssValid}; remotePracticeAcademyValid=${remotePracticeAcademyValid}; remoteHomeRefreshValid=${remoteHomeRefreshValid}; remoteSupportExpansionValid=${remoteSupportExpansionValid}; remoteSupportCommunityValid=${remoteSupportCommunityValid}; remoteFix40Valid=${remoteFix40Valid}; remoteFix41Valid=${remoteFix41Valid}; remoteFix42Valid=${remoteFix42Valid}; remoteFix43Valid=${remoteFix43Valid}; remoteFix44Valid=${remoteFix44Valid}; remoteFix45Valid=${remoteFix45Valid}; remoteFix47Valid=${remoteFix47Valid}; remoteFix49Valid=${remoteFix49Valid}; remoteFix50Valid=${remoteFix50Valid}; remoteFix51Valid=${remoteFix51Valid}; remoteVisualAssetsValid=${remoteVisualAssetsValid}; remoteVisualAssetCount=${remoteVisualAssetCount}; remoteVisualAssetsMissing=${remoteVisualAssetsMissing.join('|') || 'none'}; remoteGlobalAcademySuiteValid=${remoteGlobalAcademySuiteValid}; remoteGlobalAcademyFix77Valid=${remoteGlobalAcademyFix77Valid}; fix77RuntimeHttp=${remoteFix77PhotoRuntimeResponse.status}; fix77CssHttp=${remoteFix77CssResponse.status}; fix77ManifestHttp=${remoteFix77ManifestResponse.status}; fix77LessonSamples=${remoteFix77LessonSampleChecks.length}; fix77IllustrationRefs=${remoteFix77LessonPaths.length}; sitewideNoPeopleVisualsValid=${remoteSitewideTechVisualsValid}; sitewidePolicyValid=${remoteSitewidePolicyValid}; homepagePolicyValid=${remoteHomepagePolicyValid}; homepageMarkupValid=${remoteHomepageMarkupValid}; sitewideSchema=${remoteSitewideManifest?.hotfix || 'brak'}; sitewideSeedCount=${Object.keys(remoteSitewideManifest?.homepageSlotSeedMap || {}).length}; sitewideUniqueSeeds=${new Set(Object.values(remoteSitewideManifest?.homepageSlotSeedMap || {})).size}; homepageLibraryHotfix=${remoteHomepageManifest?.hotfix || 'brak'}; homepagePhotoEntries=${remoteHomepageManifest?.entries?.length || 0}; homepageUniqueSeeds=${remoteHomepageManifest?.uniqueSeeds || 0}; sitewideGuardHttp=${remoteSitewideGuardResponse.status}; sitewideManifestHttp=${remoteSitewideManifestResponse.status}; photoPolicyRuntimeHttp=${remotePhotoPolicyRuntimeResponse.status}; photoPolicyFilterValid=${remotePhotoPolicyFilterContract.valid}; photoPolicyFilterMissing=${remotePhotoPolicyFilterContract.missing.join('|') || 'none'}; homepageGuardHttp=${remoteHomepageGuardResponse.status}; homepageManifestHttp=${remoteHomepageManifestResponse.status}; homepageHtmlPhotoTags=${remoteHomepageVisualTags.length}; homepageUniquePhotoIds=${new Set(remoteHomepageVisualIds).size}; homepageSvgProbes=${remoteHomepageAssetChecks.length}; globalSuiteJsHttp=${remoteGlobalSuiteJsResponse.status}; globalSuiteCssHttp=${remoteGlobalSuiteCssResponse.status}; globalSuiteManifestHttp=${remoteGlobalSuiteManifestResponse.status}; globalDiagramPaths=${remoteGlobalDiagramPaths.length}; globalDiagramsValid=${remoteGlobalDiagramsValid}; remoteGlobalAcademyExpansionValid=${remoteGlobalAcademyExpansionValid}; remoteHomeLearningFix75Valid=${remoteHomeLearningFix75Valid}; globalExpansionJsHttp=${remoteGlobalExpansionJsResponse.status}; globalExpansionCssHttp=${remoteGlobalExpansionCssResponse.status}; globalExpansionManifestHttp=${remoteGlobalExpansionManifestResponse.status}; globalExpansionModules=${remoteGlobalExpansionManifest?.modules?.length || 0}; globalExpansionMissingMarkers=${remoteGlobalAcademyExpansionMissingMarkers.join('|') || 'none'}; fix50ManifestHttp=${remoteFix50ManifestResponse.status}; fix51ManifestHttp=${remoteFix51ManifestResponse.status}; fix49JsHttp=${remoteFix49JsResponse.status}; fix49CssHttp=${remoteFix49CssResponse.status}; fix49ManifestHttp=${remoteFix49ContractResponse.status}; fix49ReleaseHttp=${remoteReleaseResponse.status}; fix47JsHttp=${remoteFix47JsResponse.status}; fix47CssHttp=${remoteFix47CssResponse.status}; fix45JsHttp=${remoteFix45JsResponse.status}; fix45CssHttp=${remoteFix45CssResponse.status}; fix44JsHttp=${remoteFix44JsResponse.status}; fix44CssHttp=${remoteFix44CssResponse.status}; fix44ManifestHttp=${remoteFix44ManifestResponse.status}; fix43JsHttp=${remoteFix43JsResponse.status}; fix43CssHttp=${remoteFix43CssResponse.status}; fix42JsHttp=${remoteFix42JsResponse.status}; fix42CssHttp=${remoteFix42CssResponse.status}; fix41JsHttp=${remoteFix41JsResponse.status}; fix41CssHttp=${remoteFix41CssResponse.status}; fix40JsHttp=${remoteFix40JsResponse.status}; fix40CssHttp=${remoteFix40CssResponse.status}; supportCommunityMarkupValid=${supportCommunityMarkupValid}; supportCommunityFeatureValid=${supportCommunityFeatureValid}; supportUpdatesContractValid=${remoteSupportUpdatesContractValid}; supportApiHttp=${supportApiStatuses.join(',')}; remoteSupportApiValid=${remoteSupportApiValid}; remoteSupportPwaValid=${remoteSupportPwaValid}; supportServiceWorkerHttp=${remoteServiceWorkerResponse.status}; supportCommunityCssHttp=${supportCommunityCssResponse.status}; supportCommunityJsHttp=${supportCommunityJsResponse.status}; supportCssHttp=${supportExpansionCssResponse.status}; supportJsHttp=${supportEnhancementsJsResponse.status}; homeCssHttp=${homeRefreshResponse.status}; homeCssBytes=${Buffer.byteLength(remoteHomeRefreshCss)}; photoJsHttp=${uniquePhotoResponse.status}; photoJsBytes=${Buffer.byteLength(remoteUniquePhotoJs)}; homeRefreshGuard=${remoteHomeRefreshContractError || 'OK'}; fix83RuntimeHttp=${remoteFix83RuntimeResponse.status}; fix83VisualManifestHttp=${remoteFix83ManifestResponse.status}; fix83PosterManifestHttp=${remotePosterManifestResponse.status}; fix83RuntimeMarkersValid=${fix83RuntimeMarkersValid}; fix83VisualManifestValid=${fix83VisualManifestValid}; fix83PosterManifestValid=${fix83PosterManifestValid}; fix83HtmlReferenceValid=${fix83HtmlReferenceValid}; fix83ServiceWorkerValid=${fix83ServiceWorkerValid}; remotePhotoCatalogValid=${remotePhotoCatalogValid}; photoProxyHttp=${remotePhotoProxyResponses.map(x=>x.status).join(',')}; photoProxyDiagnostics=${remotePhotoProxyResponses.map((x,i)=>`${remotePhotoProxySampleIds[i]}:${x.headers?.get('x-photo-delivery')||'no-header'}:proxy=${x.headers?.get('x-photo-proxy-fix')||'-'}:upstream=${x.headers?.get('x-photo-upstream-status')||'-'}:type=${x.headers?.get('x-photo-upstream-type')||'-'}:final=${x.headers?.get('x-photo-final-host')||'-'}:redirects=${x.headers?.get('x-photo-redirect-count')||'-'}:error=${x.headers?.get('x-photo-error')||'-'}`).join(',')}; photoProxyValid=${remotePhotoProxyValid}; photoCatalogJsHttp=${remotePhotoCatalogJsResponse.status}; photoCatalogCssHttp=${remotePhotoCatalogCssResponse.status}; methodRendererHttp=${remoteMethodRendererResponse.status}; photoSourcesHttp=${remotePhotoSourcesResponse.status}; photoSourcesEnabled=${remotePhotoSources?.dynamicProvider?.enabled}; photoCatalogMissingChecks=${remotePhotoCatalogMissingChecks.join('|') || 'none'}; modulePhotoCoverageValid=${remoteModulePhotoCoverageValidFix135}; expectedPhotoCatalogBuild=${EXPECTED_PHOTO_CATALOG_BUILD || 'brak'}; remoteCurrentHotfixValid=${remoteCurrentHotfixValid}; remoteSpecialistSystemsMetaValid=${remoteSpecialistSystemsMetaValid}; repairPhotoLayoutValid=${repairPhotoLayoutValid}; repairLayoutCssHttp=${remoteRepairLayoutCssResponse.status}; repairLessonArtHttp=${remoteLessonArtResponse.status}; repairAppHttp=${remoteRepairAppResponse.status}; remoteGlobalAcademyFix83Valid=${remoteGlobalAcademyFix83Valid}; academyFeaturesMissing=${academyFeaturesMissing.join(',') || 'none'}`;
    } catch (error) { last = error.message; }
    if (attempt < 12) {
      log(`Czekam na aktualizację stałego adresu produkcyjnego (${attempt}/12): ${last}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error(`Cloudflare potwierdził przesłanie deploymentu, ale stały adres ${STABLE_URL} nadal nie zwraca wersji ${RELEASE}: ${last}. Nie otwieram starego adresu preview.`);
}
function openStablePage() {
  const url = `${STABLE_URL}/?view=home&academy_release=${RELEASE}`;
  log(`Właściwy adres produkcyjny (używaj tego adresu, nie hash.pages.dev): ${url}`);
  if (stablePageOpened) return;
  stablePageOpened = true;
  if (process.platform === 'win32') {
    try {
      const child = spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
      log('Otwieram stały adres produkcyjny w domyślnej przeglądarce.');
    } catch (error) { log(`Nie udało się automatycznie otworzyć przeglądarki: ${error.message}`); }
  }
}

async function verifyAccountApi() {
  const response = await fetch(`${STABLE_URL}/api/session?check=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.enabled !== true || data.accountRegistrationAvailable !== true || data.accountSchemaReady !== true || (data.accountSchemaMissing||[]).length) {
    throw new Error(`Schemat kont e-mail/hasło nie jest gotowy: HTTP ${response.status}; schema=${data.accountSchemaReady}; missing=${(data.accountSchemaMissing||data.missingColumns||[]).join(',') || 'brak szczegółów'}. Wymagana jest m.in. migracja 0015; istniejące konta nie będą kasowane.`);
  }
  const authResponse=await fetch(`${STABLE_URL}/api/auth/status?check=${Date.now()}`,{cache:'no-store',headers:{accept:'application/json','cache-control':'no-cache'}});
  const auth=await authResponse.json().catch(()=>({}));
  const providers=['google','facebook','microsoft','github','discord'];
  if(!authResponse.ok||!auth.schemaReady||auth.accountSchemaReady!==true||auth.accountLimiterTable!=='academy_account_rate_limits_v3'||(auth.accountSchemaMissing||[]).length||auth.build!== EXPECTED_BUILD||!auth.providers||!providers.every(provider=>typeof auth.providers[provider]==='boolean')||auth.callbackUrl!==`${STABLE_URL}/api/auth/callback`||!Array.isArray(auth.emailDeliveryMissing)) throw new Error(`Status OAuth/kont FIX39 niepoprawny: HTTP ${authResponse.status}; schemaReady=${auth.schemaReady}; accountSchemaReady=${auth.accountSchemaReady}; build=${auth.build||'brak'}; braki=${(auth.accountSchemaMissing||[]).join(',')}; sprawdź migracje 0008–0016 i funkcję /api/auth/status.`);
  if (accountNegativeProbePassedForBuild !== auth.build) {
    const negative = await fetch(`${STABLE_URL}/api/session`, { method:'POST', cache:'no-store', headers:{ origin:STABLE_URL, 'content-type':'application/json', accept:'application/json' }, body:JSON.stringify({ purpose:'login', email:'qa-login-check@example.invalid', password:'TestInvalidOnly-2026!' }) });
    const negativeData = await negative.json().catch(()=>({}));
    if (negative.status!==401 || !['LOGIN_FAILED','INVALID_CREDENTIALS'].includes(negativeData.error)) throw new Error(`Negatywny test logowania FIX30 nie zwrócił 401: HTTP ${negative.status}, kod=${negativeData.error||'brak'}, ref=${negativeData.reference||'brak'}. Nie utworzono konta; sprawdź dziennik diagnostyczny endpointu oraz tabelę academy_account_rate_limits_v3; stage=${negativeData.stage||'brak'}.`);
    accountNegativeProbePassedForBuild = auth.build;
    log('Test negatywny logowania OK: fikcyjny adres .invalid zwraca HTTP 401; nie utworzono ani nie zmieniono konta.');
  } else {
    log('Negatywny test logowania FIX30 był już zaliczony dla tego buildu; pominięto powtórną próbę, aby nie zużywać limitu logowań.');
  }
  log(`Status kont/OAuth FIX30 OK; pięciu aktywnych dostawców (${providers.filter(provider=>auth.providers[provider]).join(', ')||'wymagają konfiguracji sekretów'}).`);
}
async function verifyModelsApi() {
  const response = await fetch(`${STABLE_URL}/api/models?check=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data.items) || !Array.isArray(data.brands)) {
    throw new Error(`API społeczności modeli nie odpowiada: HTTP ${response.status}. Sprawdź binding D1 i tabele migracji 0006.`);
  }
  log(`Test katalogu społeczności OK: API zwróciło ${data.items.length} zatwierdzonych wpisów dokładnych modeli.`);
}

async function verifyChatApi() {
  const response = await fetch(`${STABLE_URL}/api/chat?check=${Date.now()}`, { cache: 'no-store', headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) throw new Error(`Endpoint /api/chat nie odpowiada poprawnie: HTTP ${response.status}.`);
  if (data.topicRestricted !== true || data.provider !== 'gemini' || !data.geminiConfigured || typeof data.allowedTopic !== 'string') {
    throw new Error('Nauczyciel Gemini nie jest gotowy: sprawdź sekret GEMINI_API_KEY w istniejącym Cloudflare Pages. Klucz wprowadza się wyłącznie w CMD.');
  }
  log(`NAUCZYCIEL GEMINI GOTOWY (${data.geminiModel}). Zakres odpowiedzi: ${data.allowedTopic}. Bez OpenAI i bez Workers AI.`);
}

async function verifyGlobalVisitsApi() {
  let last = 'brak odpowiedzi';
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const healthUrl = `${STABLE_URL}/api/health?check=${Date.now()}`;
      const healthResponse = await fetch(healthUrl, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
      const health = await healthResponse.json().catch(() => ({}));
      if (healthResponse.ok && health.database === true && health.globalVisits === true) {
        log('Test API OK: istniejąca baza D1 działa, licznik globalnych wizyt jest aktywny (health).');
        return;
      }

      // Older deployed health handlers may omit globalVisits even though the
      // actual visits endpoint and D1 aggregate table are healthy. Verify the
      // real public API before declaring a deployment failure.
      const visitsUrl = `${STABLE_URL}/api/visits?check=${Date.now()}`;
      const visitsResponse = await fetch(visitsUrl, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
      const visits = await visitsResponse.json().catch(() => ({}));
      const metrics = visits && typeof visits.metrics === 'object' && visits.metrics !== null ? visits.metrics : null;
      const aggregateOk = visitsResponse.ok && visits.ok === true && metrics &&
        ['total_visits', 'total_page_views', 'today_visits', 'today_page_views', 'week_visits', 'week_page_views', 'month_visits', 'unique_visitors', 'registered_profiles', 'email_accounts', 'active_profiles_30d', 'learners_with_progress', 'tracked_lesson_opens', 'tracked_video_opens', 'tracked_lesson_completions', 'approved_repair_cases', 'approved_device_models', 'pending_device_models', 'completed_lesson_records'].every(key => Number.isFinite(Number(metrics[key])));
      if (aggregateOk) {
        log('Test API OK: endpoint /api/visits zwraca globalne agregaty z istniejącej bazy D1. Endpoint health nie udostępnia pola globalVisits, ale właściwy licznik działa.');
        return;
      }
      last = `health HTTP ${healthResponse.status}, database=${health.database}, globalVisits=${health.globalVisits}; visits HTTP ${visitsResponse.status}, ok=${visits.ok}, metrics=${metrics ? 'present' : 'missing'}`;
    } catch (error) { last = error.message; }
    if (attempt < 6) {
      log(`Czekam na aktywację API po wdrożeniu (${attempt}/6): ${last}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error(`Wdrożenie wysłane, ale nie potwierdzono globalnego API wizyt: ${last}. Sprawdź /api/health, /api/visits i binding D1; baza nie będzie tworzona ponownie.`);
}
function scheduleRetry(reason) {
  if (stopping || retryTimer) return;
  if (retryCount >= 2) {
    stopping = true;
    if (poller) clearInterval(poller);
    if (debounceTimer) clearTimeout(debounceTimer);
    log(`[STOP] Trzy próby publikacji/weryfikacji nie powiodły się. Nie wykonuję kolejnych wdrożeń w pętli. Sprawdź stały adres ${STABLE_URL} i gałąź produkcyjną; po poprawie uruchom ten sam plik startowy ponownie.`);
    process.exitCode = 2;
    return;
  }
  retryCount++;
  const delay = Math.min(30000 * (2 ** Math.min(retryCount - 1, 4)), 300000);
  log(`Ponowienie ${retryCount} za ${Math.round(delay / 1000)} sekund. Powód: ${reason}.`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    deploy('ponowienie po błędzie');
  }, delay);
}
async function deploy(reason) {
  if (deployRunning) { pending = true; return; }
  deployRunning = true;
  let succeeded = false;
  let before = '';
  try {
    const localRelease = verifyLocalRelease();
    log(`Kontrola pakietu przed publikacją: ${localRelease.build}; ${localRelease.cards} kart Diagnostyki.`);
    before = deploymentSignature();
    if (!fs.existsSync(path.join(WEB, 'index.html'))) throw new Error('Brak WEB_PUBLISH\\index.html.');
    if (!before) throw new Error('WEB_PUBLISH jest pusty.');
    log(`Kontrola katalogu WWW OK. Powód: ${reason}.`);
    await verifyExistingProject();
    verifyProductionD1Binding();
    await run(['whoami']);
    // FIX86: w Direct Upload brak --branch oznacza domyślną produkcyjną gałąź projektu.
    // Jawne --branch wskazuje deployment Preview (np. main.<projekt>.pages.dev), nie produkcyjny alias.
    if (PAGES_PROJECT_MODE !== 'DIRECT_UPLOAD') throw new Error('FIX86: tryb projektu nie został potwierdzony jako Direct Upload; publikacja zablokowana.');
    if (!BRANCH) throw new Error('FIX86: nie udało się odczytać domyślnej Production Branch projektu; publikacja zablokowana.');
    const productionDeployArgs = buildDirectUploadProductionArgs({
      directory: WEB,
      projectName: PROJECT,
      commitMessage: `Nauka od A do Z 6.8.0 FIX108 — Direct Upload production; domyślna gałąź ${BRANCH}; ${new Date().toISOString()}`
    });
    log(`FIX108 Direct Upload production (mechanizm FIX86): pomijam --branch i --env; Wrangler użyje produkcyjnej gałęzi projektu "${BRANCH}".`);
    const deploymentResult = await run(productionDeployArgs);
    const deploymentUrl = extractDeploymentUrl(deploymentResult.stdout, PROJECT);
    if (deploymentUrl) log(`FIX85: Wrangler zwrócił adres konkretnego deploymentu: ${deploymentUrl} (to adres diagnostyczny, nie zamiennik stałej domeny).`);
    else log('FIX85: Wrangler nie zwrócił rozpoznawalnego adresu deploymentu; nadal wymagane jest potwierdzenie stałej domeny produkcyjnej.');
    log('WRANGLER ZAKOŃCZYŁ PRZESYŁANIE. Weryfikuję teraz stały adres produkcyjny i wszystkie zasoby FIX83.');
    // Confirm the stable production HTML and FIX83 assets; a hash.pages.dev URL alone is not success.
    await verifyPublishedRelease();
    await verifyGlobalVisitsApi();
    await verifyAccountApi();
    await verifyModelsApi();
    await verifyChatApi();
    openStablePage();
    succeeded = true;
    retryCount = 0;
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  } catch (e) {
    log(`BŁĄD — nic więcej nie wysłano: ${e.message}`);
    scheduleRetry(e.message);
  } finally {
    let after = '';
    try { after = deploymentSignature(); } catch (e) { log(`PUBLIKACJA ZABLOKOWANA KONTROLĄ: ${e.message}`); }
    // Oznaczaj wersję jako opublikowaną tylko po sukcesie. Po błędzie retry
    // nadal ponawia wysyłkę nawet wtedy, gdy pliki się nie zmieniły.
    if (succeeded) lastSignature = after;
    deployRunning = false;
    if ((pending || (before && after && after !== before)) && !stopping) {
      pending = false;
      log('Wykryto zmianę w trakcie wdrożenia — zaplanowano kolejną synchronizację.');
      schedule('zmiana podczas poprzedniego wdrożenia');
    }
  }
}
function schedule(reason) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { debounceTimer = null; deploy(reason); }, DEBOUNCE_MS);
}
function scan() {
  if (stopping) return;
  try {
    const sig = deploymentSignature();
    if (lastGuardError) { log('Kontrola katalogu WWW ponownie przechodzi poprawnie.'); lastGuardError = ''; }
    if (!lastSignature) {
      // Pierwsza synchronizacja ma być zawsze wykonana.
      lastSignature = sig || '__INITIAL_SYNC__';
      deploy('start obserwatora — synchronizacja początkowa');
      return;
    }
    if (sig !== lastSignature && !deployRunning) {
      retryCount = 0;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      log('Wykryto zmianę w WEB_PUBLISH — czekam 10 sekund bezczynności.');
      schedule('wykryta zmiana plików WWW');
    } else if (deployRunning && sig !== lastSignature) {
      pending = true;
    }
  } catch (e) {
    if (e.message !== lastGuardError) { log(`PUBLIKACJA ZABLOKOWANA KONTROLĄ: ${e.message}`); lastGuardError = e.message; }
  }
}
if (!fs.existsSync(WRANGLER_JS)) {
  log(`Brak lokalnego pliku Wrangler JS: ${WRANGLER_JS}`);
  log('Oczekiwana instalacja: TOOLS_CLOUDFLARE\\node_modules\\wrangler\\bin\\wrangler.js');
  process.exit(2);
}
if (!fs.existsSync(WEB) || !fs.existsSync(path.join(WEB, 'index.html'))) { log('Brak WEB_PUBLISH/index.html.'); process.exit(2); }
try { const release = verifyLocalRelease(); log(`Wykryto lokalny pełny projekt ${release.build} z ${release.cards} kartami diagnostycznymi.`); } catch (error) { log(`BŁĄD PAKIETU: ${error.message}`); process.exit(2); }
if (FULL_FUNCTIONS_MODE && !fs.existsSync(FUNCTIONS)) { log('Brak katalogu functions/. Przywróć pliki funkcji z pełnej paczki.'); process.exit(2); }
if (!FULL_FUNCTIONS_MODE) log('TRYB STATYCZNY: brak jednoznacznego pliku Wrangler (wrangler.jsonc/json/toml). Publikuję tylko WEB_PUBLISH; synchronizacja D1 i Pages Functions pozostają nieaktywne. Nie tworzę nowej bazy.');
log('AUTO-PUBLISH 6.8.0 FIX49 — obserwuję WEB_PUBLISH i Pages Functions.');
log('Cel: ' + PROJECT + ' / Production Branch zostanie odczytana z ustawień Cloudflare Pages / konto ' + ACCOUNT + '.');
log('Wrangler przez node.exe. Monitoruję tylko WEB_PUBLISH' + (FULL_FUNCTIONS_MODE ? `, Pages Functions i ${path.basename(WRANGLER_CONFIG)}.` : '.'));
log('Pierwsza synchronizacja rozpoczyna się teraz; kolejne zmiany po 10 sekundach bezczynności.');
scan();
poller = setInterval(scan, POLL_MS);
process.on('SIGINT', () => {
  stopping = true;
  clearInterval(poller);
  if (debounceTimer) clearTimeout(debounceTimer);
  if (retryTimer) clearTimeout(retryTimer);
  log('Obserwator zatrzymany przez użytkownika.');
  process.exit(0);
});
