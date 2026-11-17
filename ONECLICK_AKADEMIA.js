// NAUKA OD A DO Z — PUBLISHER FIX137: FIXED ACTIVE PHOTO-CACHE CONTRACT FOR WEBSITE FIX136
// FIX118: static HTML photo URLs, persistent PWA Cache Storage for Pexels/Wikimedia images, static-slot assignment adoption and 21-card quality diagnostics.
// FIX99: aktywny widok, widoczny wrapper ukrytego IMG i progresywna kolejka 147 metod; limit API i unikalność pozostają aktywne.
// FIX88: wspólny walidator biblioteki FIX83 oparty o visualRuntimeBuildTag; FIX84: jawny node:crypto dla SHA-256 posterów; zgodność wsteczna: 6.8.0 FIX79, FIX83, FIX82, FIX81 i FIX80.
// FIX118 preserves the existing Cloudflare Pages project, D1 binding, migrations and product version 6.8.0.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto'); // FIX84: jawny moduł Node.js, nie globalny Web Crypto.
const { spawn } = require('child_process');
const { getProductionD1Binding, collectD1TableNames, selectAutomaticD1Candidate, scoreD1Tables } = require('./scripts/cloudflare-pages-d1');
const { writeTomlProductionD1Bindings, ensureJsonProductionD1Bindings, hasProductionD1Binding } = require('./scripts/wrangler-production-d1');
const { assertSharedPasswordKdfContract } = require('./scripts/password-kdf-contract-fix26');
const { verifySupportViewStructure } = require('./scripts/support-view-guard-fix35');
const { verifyHomepageShowcase } = require('./scripts/homepage-showcase-guard');
const { verifyHomepageStaticPhotoContractFix97 } = require('./scripts/homepage-static-photo-contract-fix97.cjs');
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix106 } = require('./scripts/photo-catalog-publication-contract-fix106.cjs');
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix111 } = require('./scripts/photo-catalog-publication-contract-fix111.cjs');
const { evaluatePhotoCatalogPublicationContract: evaluatePhotoCatalogPublicationContractFix115 } = require('./scripts/photo-catalog-publication-contract-fix115.cjs');
const { verifyFix83VisualLibrary } = require('./scripts/fix83-visual-library-guard-fix88.cjs');
const { readServiceWorkerContract, verifyFix50Release } = require('./scripts/release-contract-fix50.cjs');
const { verifyFix51Release } = require('./scripts/release-contract-fix51.cjs');
const { evaluateHomepagePhotoCacheContract } = require('./scripts/photo-cache-contract-fix137.cjs');
const { parsePendingMigrationList, auditPendingMigrationFiles } = require('./scripts/pending-migration-guard-fix49.cjs');
const { verifyHtmlAssetsInServiceWorker } = require('./scripts/fix230-pwa-asset-guard.cjs');
const ROOT = __dirname;
const FIX51_BUILD = '6.8.0-fix51-visual-academy-pro-20261105';
const PROJECT = 'naprawa-pc-akademia-serwisu-pro';
const ACCOUNT = '4ddfc3803a4f0c4457ccae083f18b975';
// Production Branch is resolved by AUTO_PUBLISH_WATCHER.js from the existing Cloudflare Pages project.
const DB_NAME = 'naprawapc-orders'; // Potwierdzona przez użytkownika pozycja 1 z logu 3.8.5.
const AUTO_D1_TARGET_ID = '6ac0a922-639c-43ee-ba33-5da14c25a533'; // UUID bazy wybranej przez użytkownika w logu 31.10.2026.
const WEB = path.join(ROOT, 'WEB_PUBLISH');
const FUNCTIONS = path.join(ROOT, 'functions');
const WRANGLER = path.join(ROOT, 'TOOLS_CLOUDFLARE', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const CONFIG_JSONC = path.join(ROOT, 'wrangler.jsonc');
const CONFIG_JSON = path.join(ROOT, 'wrangler.json');
const CONFIG_TOML = path.join(ROOT, 'wrangler.toml');
let ACTIVE_CONFIG = null;
let ACTIVE_CONFIG_KIND = null;
const STABLE_URL = `https://${PROJECT}.pages.dev`;
function log(s) { process.stdout.write(`[${new Date().toLocaleString()}] ${s}\n`); }
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
function parseJsonc(file) { return JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))); }
function uncommentTomlLine(line) {
  let quote = '', escaped = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\' && quote === '"') escaped = true;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#') return line.slice(0, i);
  }
  return line;
}
function parseTomlValue(raw) {
  const v = raw.trim();
  if (!v) return '';
  if (v[0] === '"') { try { return JSON.parse(v); } catch { throw new Error(`Niepoprawny ciąg TOML: ${v}`); } }
  if (v[0] === "'") {
    if (v[v.length - 1] !== "'") throw new Error(`Niepoprawny ciąg TOML: ${v}`);
    return v.slice(1, -1);
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    const parts = []; let token = '', q = '', esc = false;
    for (const c of inner) {
      if (q) { token += c; if (esc) esc = false; else if (c === '\\' && q === '"') esc = true; else if (c === q) q = ''; }
      else if (c === '"' || c === "'") { q = c; token += c; }
      else if (c === ',') { parts.push(parseTomlValue(token)); token = ''; }
      else token += c;
    }
    if (token.trim()) parts.push(parseTomlValue(token));
    return parts;
  }
  return v;
}
function parseToml(text) {
  const result = {}; let current = result; 
  for (const original of String(text).replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = uncommentTomlLine(original).trim();
    if (!line) continue;
    const arrayMatch = line.match(/^\[\[\s*([A-Za-z0-9_.-]+)\s*\]\]$/);
    if (arrayMatch) {
      const parts = arrayMatch[1].split('.'); let target = result;
      for (const part of parts.slice(0, -1)) target = target[part] ||= {};
      const key = parts[parts.length - 1]; target[key] ||= [];
      if (!Array.isArray(target[key])) throw new Error(`Niepoprawna tablica TOML: ${arrayMatch[1]}`);
      current = {}; target[key].push(current);
      continue;
    }
    const tableMatch = line.match(/^\[\s*([A-Za-z0-9_.-]+)\s*\]$/);
    if (tableMatch) {
      current = result;
      for (const part of tableMatch[1].split('.')) current = current[part] ||= {};
      continue;
    }
    const keyMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!keyMatch) continue;
    current[keyMatch[1]] = parseTomlValue(keyMatch[2]);
  }
  return result;
}
function parseActiveConfig(file, kind) {
  return kind === 'toml' ? parseToml(fs.readFileSync(file, 'utf8')) : parseJsonc(file);
}
function backupFile(file, label) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `${file}.before-6.2.0-${stamp}.bak`;
  fs.copyFileSync(file, backup);
  log(`Kopia konfiguracji ${label}: ${path.basename(backup)}`);
}
function upsertTomlBindingTable(original, tableName, bindingName) {
  const lines = String(original || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = `[${tableName}]`;
  const starts = [];
  for (let i = 0; i < lines.length; i++) if (uncommentTomlLine(lines[i]).trim() === header) starts.push(i);
  if (starts.length > 1) throw new Error(`Powielona sekcja TOML ${header}; nie zmieniam konfiguracji.`);
  if (starts.length === 1) {
    const start = starts[0]; let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) if (/^\s*\[\[?.+\]\]?\s*$/.test(uncommentTomlLine(lines[i]).trim())) { end = i; break; }
    const matches = [];
    for (let i = start + 1; i < end; i++) if (/^binding\s*=/.test(uncommentTomlLine(lines[i]).trim())) matches.push(i);
    if (matches.length > 1) throw new Error(`Powielone pole binding w ${header}.`);
    if (matches.length === 1) {
      const current = parseTomlValue(uncommentTomlLine(lines[matches[0]]).split('=').slice(1).join('='));
      if (current && current !== bindingName) throw new Error(`Sekcja ${header} wskazuje binding ${current}, oczekiwano ${bindingName}.`);
      lines[matches[0]] = `binding = ${JSON.stringify(bindingName)}`;
    } else lines.splice(end, 0, `binding = ${JSON.stringify(bindingName)}`);
  } else {
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push('', header, `binding = ${JSON.stringify(bindingName)}`);
  }
  return lines.join('\r\n');
}
function writeTomlAiBindings(original) {
  let text = String(original || '');
  text = upsertTomlBindingTable(text, 'ai', 'AI');
  text = upsertTomlBindingTable(text, 'env.production.ai', 'AI');
  return text;
}
function ensureJsonAiBindings(cfg) {
  let changed = false;
  const set = (obj, key, value, label) => {
    obj[key] ||= {};
    if (!obj[key] || typeof obj[key] !== 'object' || Array.isArray(obj[key])) throw new Error(`Niepoprawna sekcja ${label} w Wrangler JSON.`);
    const current = obj[key].binding;
    if (current && current !== value) throw new Error(`Sekcja ${label} ma binding ${current}; wymagany jest ${value}.`);
    if (current !== value) { obj[key].binding = value; changed = true; }
  };
  set(cfg, 'ai', 'AI', 'ai');
  cfg.env ||= {};
  if (!cfg.env || typeof cfg.env !== 'object' || Array.isArray(cfg.env)) throw new Error('Niepoprawna sekcja env w Wrangler JSON.');
  cfg.env.production ||= {};
  if (!cfg.env.production || typeof cfg.env.production !== 'object' || Array.isArray(cfg.env.production)) throw new Error('Niepoprawna sekcja env.production w Wrangler JSON.');
  set(cfg.env.production, 'ai', 'AI', 'env.production.ai');
  return changed;
}
function writeTomlConfig(file, original, cfg, dbEntry, dbChanged) {
  let text = original.replace(/^\uFEFF/, '');
  const setRoot = (key, value) => {
    const lines = text.split(/\r?\n/);
    let inRoot = true, found = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = uncommentTomlLine(lines[i]).trim();
      if (/^\[.*\]$/.test(trimmed)) inRoot = false;
      if (inRoot && new RegExp(`^${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*=`).test(trimmed)) {
        lines[i] = `${key} = ${JSON.stringify(value)}`; found = true; break;
      }
    }
    if (!found) {
      let firstSection = lines.findIndex(l => /^\s*\[.*\]\s*$/.test(uncommentTomlLine(l)));
      const line = `${key} = ${JSON.stringify(value)}`;
      if (firstSection < 0) lines.push(line); else lines.splice(firstSection, 0, line);
    }
    text = lines.join('\r\n');
  };
  setRoot('pages_build_output_dir', cfg.pages_build_output_dir);
  setRoot('compatibility_date', cfg.compatibility_date);
  if (dbEntry) text = writeTomlProductionD1Bindings(text, dbEntry);
  text = writeTomlAiBindings(text);
  return text.replace(/\r?\n/g, '\r\n').replace(/\r\n*$/, '\r\n');
}
function saveActiveConfig(cfg, { dbEntry = null, dbChanged = false } = {}) {
  if (!ACTIVE_CONFIG || !ACTIVE_CONFIG_KIND) throw new Error('Nie wybrano aktywnego pliku Wrangler.');
  backupFile(ACTIVE_CONFIG, ACTIVE_CONFIG_KIND);
  if (ACTIVE_CONFIG_KIND === 'toml') {
    const original = fs.readFileSync(ACTIVE_CONFIG, 'utf8');
    fs.writeFileSync(ACTIVE_CONFIG, writeTomlConfig(ACTIVE_CONFIG, original, cfg, dbEntry, dbChanged), 'utf8');
  } else {
    fs.writeFileSync(ACTIVE_CONFIG, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  }
}
function detectConfig() {
  const choices = [
    [CONFIG_JSONC, 'jsonc'],
    [CONFIG_JSON, 'json'],
    [CONFIG_TOML, 'toml']
  ].filter(([file]) => fs.existsSync(file));
  if (choices.length > 1) throw new Error(`Znaleziono kilka plików Wrangler (${choices.map(x => path.basename(x[0])).join(', ')}). Zachowuję je bez zmian; usuń/odłóż nieaktywną kopię po wykonaniu kopii bezpieczeństwa, aby Wrangler nie wybrał niejednoznacznej konfiguracji.`);
  if (!choices.length) return null;
  [ACTIVE_CONFIG, ACTIVE_CONFIG_KIND] = choices[0];
  return ACTIVE_CONFIG_KIND;
}
function extractJson(text) {
  const value = String(text || '').replace(/^\uFEFF/, '').trim();
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== '[' && value[i] !== '{') continue;
    try { return JSON.parse(value.slice(i)); } catch { /* keep searching */ }
  }
  throw new Error('Wrangler nie zwrócił poprawnego JSON.');
}
function asRows(parsed, keys) {
  if (Array.isArray(parsed)) return parsed;
  for (const key of keys) if (Array.isArray(parsed?.[key])) return parsed[key];
  for (const key of ['result', 'data']) if (parsed?.[key] && typeof parsed[key] === 'object') {
    for (const nested of keys) if (Array.isArray(parsed[key][nested])) return parsed[key][nested];
  }
  return [];
}
function value(row, names) {
  if (!row || typeof row !== 'object') return '';
  const norm = v => String(v).toLowerCase().replace(/[\s_-]+/g, '');
  for (const key of names) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
    const found = Object.keys(row).find(k => norm(k) === norm(key));
    if (found && row[found] !== undefined && row[found] !== null) return row[found];
  }
  return '';
}
function runLocalNodeScript(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return Promise.reject(new Error(`Brak lokalnego skryptu kontrolnego: ${relativePath}`));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [absolutePath], { cwd: ROOT, windowsHide: true, shell: false, env: { ...process.env, CI: '1' }, stdio: 'inherit' });
    child.on('error', error => reject(new Error(`Nie można uruchomić ${relativePath}: ${error.message}`)));
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${relativePath} zakończył kodem ${code}; publikacja zablokowana przed kopią/migracją D1.`)));
  });
}

function spawnWrangler(args, { capture = false, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WRANGLER, ...args.map(String)], {
      cwd: ROOT, windowsHide: true, shell: false,
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CI: '1', ...env },
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });
    let stdout = '', stderr = '';
    if (capture) {
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });
    }
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(capture ? stdout + '\n' + stderr : '') : reject(new Error(`Wrangler kod ${code}: ${args.join(' ')}`)));
  });
}
async function ensureProject() {
  log('1/7 — Sprawdzam logowanie do właściwego konta Cloudflare…');
  const who = await spawnWrangler(['whoami'], { capture: true });
  if (!who.includes(ACCOUNT)) throw new Error('Wrangler jest zalogowany na inne konto niż konto Akademii. Zaloguj konto docelowe; niczego nie wysłano.');
  log('Konto Cloudflare potwierdzone.');
  log('2/7 — Sprawdzam, czy istniejący projekt Pages nadal istnieje…');
  const raw = await spawnWrangler(['pages', 'project', 'list', '--json'], { capture: true });
  const rows = asRows(extractJson(raw), ['result', 'projects', 'data', 'items']);
  const found = rows.find(r => String(value(r, ['name','project_name','Project Name'])).toLowerCase() === PROJECT.toLowerCase());
  if (!found) throw new Error(`Nie znaleziono istniejącego projektu ${PROJECT}. Nie tworzę nowego projektu.`);
  log(`Potwierdzono projekt ${PROJECT} na koncie ${ACCOUNT}.`);
}
async function obtainConfig() {
  log('3/7 — Sprawdzam konfigurację istniejącego projektu i binding D1…');
  let kind = detectConfig();
  if (!kind) {
    log('Brak pliku Wrangler. Pobieram konfigurację z ISTNIEJĄCEGO Pages — bez tworzenia projektu ani bazy…');
    await spawnWrangler(['pages', 'download', 'config', PROJECT]);
    kind = detectConfig();
  }
  if (!kind) throw new Error('Wrangler pobrał konfigurację, ale nie znaleziono wrangler.toml, wrangler.json ani wrangler.jsonc. Niczego nie wdrażam.');
  log(`Wykryto istniejący plik konfiguracji: ${path.basename(ACTIVE_CONFIG)} (${kind.toUpperCase()}).`);
  const cfg = parseActiveConfig(ACTIVE_CONFIG, kind);
  if (cfg.name !== PROJECT) throw new Error(`Konfiguracja wskazuje ${cfg.name || 'brak nazwy'}, a oczekiwano ${PROJECT}. Nie nadpisuję obcej konfiguracji.`);
  let changed = ensureJsonAiBindings(cfg);
  if (cfg.pages_build_output_dir !== './WEB_PUBLISH') { cfg.pages_build_output_dir = './WEB_PUBLISH'; changed = true; }
  if (!cfg.compatibility_date) { cfg.compatibility_date = '2026-10-31'; changed = true; }
  if (changed) {
    if (kind === 'toml') saveActiveConfig(cfg);
    else saveActiveConfig(cfg);
    log('Ustawiono katalog WEB_PUBLISH i datę zgodności, zachowując pozostałe ustawienia.');
  }
  return cfg;
}
async function getPagesProductionD1Binding() {
  // Wrangler odświeża i udostępnia aktualne poświadczenie lokalnego logowania.
  // Token pozostaje w pamięci procesu i nigdy nie jest wypisywany do logu.
  const authRaw = await spawnWrangler(['auth', 'token', '--json'], { capture: true });
  const auth = extractJson(authRaw);
  const headers = { Accept: 'application/json' };
  if (auth.type === 'api_key' && auth.key && auth.email) {
    headers['X-Auth-Key'] = String(auth.key);
    headers['X-Auth-Email'] = String(auth.email);
  } else if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  } else {
    throw new Error('Wrangler auth token --json nie zwrócił obsługiwanych poświadczeń.');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/pages/projects/${PROJECT}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, { method: 'GET', headers, signal: controller.signal });
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      const messages = Array.isArray(payload.errors) ? payload.errors.map(e => e.message).filter(Boolean).join('; ') : '';
      throw new Error(`Cloudflare Pages API HTTP ${response.status}${messages ? `: ${messages}` : ''}`);
    }
    return getProductionD1Binding(payload, 'DB');
  } finally {
    clearTimeout(timeout);
    delete headers.Authorization;
    delete headers['X-Auth-Key'];
    delete headers['X-Auth-Email'];
  }
}
async function probeAcademyDatabase(dbName) {
  // Wyłącznie odczyt metadanych SQLite; służy tylko jako diagnostyka schematu.
  const sql = "SELECT COUNT(*) AS academy_schema_score FROM sqlite_master WHERE type='table' AND name IN ('academy_users','academy_sessions','academy_conversations','academy_messages','academy_knowledge','academy_site_daily_visits')";
  const raw = await spawnWrangler(['d1', 'execute', dbName, '--remote', '--command', sql, '--json'], { capture: true });
  const match = raw.match(/"academy_schema_score"\s*:\s*(\d+)/i)
    || raw.match(/academy_schema_score\s*[|:]\s*(\d+)/i);
  if (!match) throw new Error(`Nie można odczytać wyniku kontroli schematu bazy ${dbName}.`);
  return Number(match[1]);
}
async function listDatabaseTables(dbName) {
  const sql = "SELECT type, name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name";
  const raw = await spawnWrangler(['d1', 'execute', dbName, '--remote', '--command', sql, '--json'], { capture: true });
  return collectD1TableNames(extractJson(raw));
}
async function ensureExistingDatabase(cfg) {
  log('4/7 — Automatycznie ustalam istniejącą bazę D1 po bindingu Pages i schemacie danych…');
  const listRaw = await spawnWrangler(['d1', 'list', '--json'], { capture: true });
  const dbRows = asRows(extractJson(listRaw), ['result','databases','data','items']);
  const configured = Array.isArray(cfg.d1_databases) ? cfg.d1_databases.find(x => x.binding === 'DB') : null;
  const configuredId = String(configured?.database_id || '').trim().toLowerCase();
  const dbNameOf = r => String(value(r, ['name','database_name','Database Name']) || '').trim();
  const dbIdOf = r => String(value(r, ['uuid','database_id','id','Database ID']) || '').trim();

  let remoteBinding = null;
  try {
    remoteBinding = await getPagesProductionD1Binding();
    if (remoteBinding.status === 'found') {
      log(`Pages API potwierdziło produkcyjny binding DB: ${remoteBinding.id}.`);
    } else {
      log(`Pages API: ${remoteBinding.reason || remoteBinding.status}.`);
    }
  } catch (e) {
    log(`Nie udało się odczytać bindingu Pages API (${e.message}). Nie będę zgadywać docelowej bazy.`);
  }

  let existing = null;
  if (remoteBinding?.status === 'found') {
    if (configuredId && configuredId !== remoteBinding.id.toLowerCase()) {
      throw new Error(`Konflikt ID: lokalny Wrangler ma ${configuredId}, a produkcyjny Pages wskazuje ${remoteBinding.id}. Nie zmieniam żadnej bazy.`);
    }
    existing = dbRows.find(r => dbIdOf(r).toLowerCase() === remoteBinding.id.toLowerCase());
    if (!existing) {
      const names = dbRows.map(dbNameOf).filter(Boolean);
      throw new Error(`Pages binding DB wskazuje ID ${remoteBinding.id}, którego nie ma na liście konta. Dostępne D1: ${names.join(', ') || 'brak'}.`);
    }
    log(`Używam bazy wskazanej przez produkcyjny binding Pages: ${dbNameOf(existing)} (${dbIdOf(existing)}).`);
  } else if (remoteBinding?.status === 'other-bindings') {
    throw new Error(`${remoteBinding.reason} Zachowuję istniejące bindingi bez zmian.`);
  } else if (remoteBinding?.status === 'invalid') {
    throw new Error(`Cloudflare zwrócił niepoprawny binding D1: ${remoteBinding.reason}`);
  } else if (remoteBinding?.status === 'unavailable' || !remoteBinding) {
    if (!configuredId) {
      throw new Error('Nie można odczytać konfiguracji produkcyjnego Pages. Dla bezpieczeństwa nie wybieram bazy przy nieznanym stanie bindingu.');
    }
  }

  if (!existing && configuredId) {
    existing = dbRows.find(r => dbIdOf(r).toLowerCase() === configuredId);
    if (!existing) {
      const names = dbRows.map(dbNameOf).filter(Boolean);
      throw new Error(`Lokalny database_id=${configured.database_id} nie występuje na koncie. Dostępne D1: ${names.join(', ')}.`);
    }
    log(`Używam istniejącej bazy wskazanej przez lokalny wrangler.toml: ${dbNameOf(existing)} (${dbIdOf(existing)}).`);
  }

  if (!existing && remoteBinding?.status === 'missing' && !configuredId) {
    const candidates = dbRows.filter(r => dbNameOf(r) && dbIdOf(r));
    const inspected = [];
    log(`Binding DB nie istnieje. Automatycznie sprawdzam schemat ${candidates.length} istniejących baz (wyłącznie SELECT)…`);
    for (const row of candidates) {
      const name = dbNameOf(row);
      const tables = await listDatabaseTables(name);
      const scores = scoreD1Tables(tables);
      const item = { row, name, id: dbIdOf(row), tables, ...scores };
      inspected.push(item);
      log(`D1 ${name}: ${tables.length} tabel; academy=${scores.academyScore}/6; learning=${scores.learningScore}/7${scores.strongLearning ? '; rozpoznano moduł nauki' : ''}.`);
    }

    const automatic = selectAutomaticD1Candidate(inspected, AUTO_D1_TARGET_ID);
    if (automatic.status !== 'selected' || !automatic.candidate) {
      const details = inspected.map(x => `${x.name} (${x.id}; ${x.learningScore}/7 learning, ${x.academyScore}/6 academy)`).join('; ');
      throw new Error(`Automatyczne wykrywanie D1 nie wyłoniło jednego bezpiecznego celu: ${automatic.reason}. Sprawdzone bazy: ${details || 'brak'}. Nie wykonano zmian.`);
    }
    existing = automatic.candidate.row;
    log(`AUTOMATYCZNY WYBÓR D1: ${automatic.candidate.name} (${automatic.candidate.id}). Powód: ${automatic.reason}.`);
    log('Wybór jest zgodny z wcześniejszym wskazaniem użytkownika; nie pojawią się pytania o numer ani potwierdzenie.');
  }

  if (!existing) {
    const names = dbRows.map(dbNameOf).filter(Boolean);
    throw new Error(`Nie znaleziono bezpiecznej istniejącej bazy D1. Pages status=${remoteBinding?.status || 'nieznany'}; dostępne: ${names.join(', ') || 'brak'}. Nie tworzę nowej bazy i nie pytam o ręczny wybór.`);
  }

  const dbName = dbNameOf(existing);
  const dbId = dbIdOf(existing);
  if (!dbName || !dbId) throw new Error('Cloudflare nie zwrócił pełnej nazwy i UUID istniejącej bazy D1.');
  if (configuredId && configuredId !== dbId.toLowerCase()) {
    throw new Error('ID lokalnego bindingu DB różni się od potwierdzonej bazy. Publikacja zatrzymana.');
  }

  const dbEntry = { binding: 'DB', database_name: dbName, database_id: dbId };
  // Cloudflare Pages production does NOT inherit top-level D1 bindings.
  // Keep the base binding for local tooling and define the same UUID explicitly
  // under env.production, which is the config consumed by production Pages.
  const dbChanged = ensureJsonProductionD1Bindings(cfg, dbEntry);
  if (dbChanged) {
    saveActiveConfig(cfg, { dbEntry, dbChanged: true });
    log('Uzupełniono binding DB zarówno na poziomie głównym, jak i env.production.');
  } else {
    log('Binding DB jest już poprawny na poziomie głównym i env.production.');
  }
  const savedCfg = parseActiveConfig(ACTIVE_CONFIG, ACTIVE_CONFIG_KIND);
  if (!hasProductionD1Binding(savedCfg, 'DB', dbId)) {
    throw new Error(`Po zapisie konfiguracji nadal brakuje env.production.d1_databases.DB (${dbId}). Wdrożenie zablokowane.`);
  }
  log(`Potwierdzono istniejącą bazę D1: ${dbName} (${dbId}); binding DB jest gotowy dla produkcji Pages.`);
  log('Konfiguracja production zawiera jawny [[env.production.d1_databases]] — Wrangler nie powinien już zgłaszać braku dziedziczenia.');
  return dbName;
}
async function verifyPendingMigrations(dbName) {
  log('FIX49: pobieram tylko listę rzeczywiście niezaaplikowanych migracji D1 (bez wykonywania SQL)…');
  const raw = await spawnWrangler(['d1', 'migrations', 'list', dbName, '--remote'], { capture: true });
  const migrationDir = path.join(ROOT, 'migrations');
  const known = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir).filter(name => name.endsWith('.sql')) : [];
  const parsed = parsePendingMigrationList(raw, known);
  if (!parsed.pending.length) { log(`FIX49 migration gate: ${parsed.message}`); return { pending: [], safeCount: 0 }; }
  const audit = auditPendingMigrationFiles(parsed.pending, migrationDir);
  log(`FIX49 migration gate: ${audit.safeCount} oczekujących migracji addytywnych, bez operacji wysokiego ryzyka.`);
  return { pending: parsed.pending, safeCount: audit.safeCount };
}

async function migrateDatabase(dbName) {
  log('6/7 — Wykonuję kopię D1 i automatycznie stosuję oczekujące migracje…');
  const backupDir = path.join(ROOT, 'BACKUPS_D1');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `${dbName}_${stamp}.sql`);
  await spawnWrangler(['d1', 'export', dbName, '--remote', '--output', backupFilePath, '--skip-confirmation']);
  if (!fs.existsSync(backupFilePath) || fs.statSync(backupFilePath).size < 100) {
    throw new Error(`Nie powstała poprawna kopia D1: ${backupFilePath}. Migracje nie zostaną uruchomione.`);
  }
  log(`Kopia istniejącej bazy zapisana: ${path.relative(ROOT, backupFilePath)} (${(fs.statSync(backupFilePath).size / 1048576).toFixed(2)} MB).`);
  await spawnWrangler(['d1', 'migrations', 'apply', dbName, '--remote']);
  const sql = 'SELECT COUNT(*) AS days, COALESCE(SUM(visits),0) AS visits, COALESCE(SUM(page_views),0) AS page_views FROM academy_site_daily_visits';
  await spawnWrangler(['d1', 'execute', dbName, '--remote', '--command', sql, '--json']);
  await spawnWrangler(['d1', 'execute', dbName, '--remote', '--command', 'SELECT COUNT(*) AS rate_limit_rows FROM academy_account_rate_limits_v3', '--json']);
  log(`Migracje zakończone; tabela globalnych wizyt i limiter v3 odpowiadają w istniejącej bazie ${dbName}.`);
}
async function verifyWeb() {
  log('5/7 — Kontrola plików WWW, rejestracji, modeli, statystyk i materiałów…');
  const indexPath = path.join(WEB, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error('Brak WEB_PUBLISH/index.html.');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  // FIX120: load the Service Worker source before any FIX119 checks reference it.
  // Keep this declaration above all guards in verifyWeb() to avoid a const TDZ ReferenceError.
  const serviceWorkerVisualSource = fs.readFileSync(path.join(WEB, 'service-worker.js'), 'utf8');
  const supportViewGuard = verifySupportViewStructure(indexHtml);
  log(`Osobna zakładka wsparcia potwierdzona: ${supportViewGuard.supportNodes} elementy wsparcia w #view-support; ${supportViewGuard.viewCount} niezależnych widoków.`);
  const buildMatch = indexHtml.match(/<meta\s+name=["']academy-build["']\s+content=["']([^"']+)/i);
  if (!indexHtml.includes('NAUKA OD A DO Z — DLA WSZYSTKICH') || !indexHtml.includes('az-pathways') || !indexHtml.includes('np62PhotoMain') || !indexHtml.includes('np62CameraStart') || !indexHtml.includes('np62SerialConnect') || !indexHtml.includes('np62UsbConnect')) throw new Error('Brak nowej identyfikacji NAUKA OD A DO Z — DLA WSZYSTKICH.');
  const releasePath = path.join(WEB, 'release.json');
  if (!fs.existsSync(releasePath)) throw new Error('Brak WEB_PUBLISH/release.json.');
  const releaseJson = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
  const localRelease = releaseJson; // FIX107: lokalny obiekt release.json jest jawnie dostępny w zakresie verifyWeb().
  const releaseVersion = String(releaseJson.release || '');
  const expectedBuild = String(releaseJson.build || '');
  if (releaseVersion !== '6.8.0' || !expectedBuild.startsWith(`${releaseVersion}-`) || expectedBuild !== FIX51_BUILD) throw new Error('WEB_PUBLISH/release.json nie zgadza się z wersją 6.8.0 FIX51.');
  const fix83VisualGuard = verifyFix83VisualLibrary({ webDir: WEB, indexHtml, releaseJson });
  log(`FIX83/FIX88 biblioteka ilustracji potwierdzona: ${fix83VisualGuard.galleryIllustrationCount} tematów; VRAM GDDR/BGA oddzielnie od RAM DIMM; URL ${fix83VisualGuard.runtimeBuildTag}.`);
  const fix83PosterManifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','video-poster-manifest-fix83.json'),'utf8'));
  if (fix83PosterManifest.posterCount !== 10 || fix83PosterManifest.hotfix !== 'FIX83' || fix83PosterManifest.visualAudit.minimumDctPhashHammingDistance < 10) throw new Error('FIX83: lokalne postery filmów nie spełniają kontroli unikalności.');
  for (const poster of fix83PosterManifest.files) { const posterPath = path.join(WEB,poster.file.split('?')[0].replace(/^\//,'')); if (!fs.existsSync(posterPath) || crypto.createHash('sha256').update(fs.readFileSync(posterPath)).digest('hex') !== poster.sha256) throw new Error(`FIX83: poster ${poster.id} nie zgadza się z manifestem SHA-256.`); }
  if (!buildMatch || buildMatch[1] !== expectedBuild) throw new Error(`Nieprawidłowy academy-build: ${buildMatch ? buildMatch[1] : 'brak'}. Oczekiwano dokładnie ${expectedBuild}. Publikacja zatrzymana przed migracjami.`);
  for (const id of ['view-measurementpro','view-modelcenter','np62-meter-mode','np62-model-search','npmlMeasurementLog','npmlForm','npmlRows','npmlExportCsv']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`Brak modułu edukacyjnego 6.2.0: ${id}.`);
  if (/view-servicepro|np62-ticket-form|lab44-workorders|labWorkorderForm|labExportWorkorders/.test(indexHtml)) throw new Error('W platformie edukacyjnej wykryto formularz zlecenia serwisowego.');
  const stateApiPath = path.join(FUNCTIONS, 'api', 'state.js');
  const stateApi = fs.existsSync(stateApiPath) ? fs.readFileSync(stateApiPath, 'utf8') : '';
  if (!stateApi || stateApi.includes('academyLabWorkorders')) throw new Error('API synchronizacji nadal dopuszcza stare karty zleceń.');
  for (const asset of ['visual-assets-fix51.js','visual-academy-fix51.js','visual-academy-fix51.css','visual-asset-manifest-fix51.json','ultimate-workshop-620.js','ultimate-workshop-620.css','nauka-od-a-do-z.css','lab-device-bridge-630.js','lab-device-bridge-630.css','theme-630.css','scroll-navigation-630.js','homepage-showcase-640.js','homepage-showcase-640.css','long-video-catalog-620.js','advanced-learning-studio-620.js','progress-backup-621.js','progress-backup-621.css','measurement-log-640.js','measurement-log-640.css','advanced-learning-studio-620.css','home-refresh-fix30.css','photo-unique-thumbnails-fix30.js','photo-uniqueness-fix77.js','photo-uniqueness-manifest-fix77.json','global-academy-fix77.css','support-expansion-fix35.css','support-enhancements-fix35.js','academy-expanded-practice-fix136.js','practice-quiz-fix136.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`Brak zasobu Ultimate Workshop 6.2.0: ${asset}.`);
  for (const asset of ['academy-master-hub-fix145.js','academy-master-hub-fix145.css','academy-expanded-practice-fix145.js']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX145: brak wymaganego zasobu Akademii PRO: ${asset}.`);
  for (const asset of ['academy-pro-modules-fix148.js','academy-pro-modules-fix148.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX148: brak nowego modułu Centrum Mistrza: ${asset}.`);
  for (const asset of ['academy-master-extension-fix149.js','academy-master-extension-fix149.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX149: brak rozszerzenia Akademii Master: ${asset}.`);
  for (const token of ['a148AdvancedHub','a148BoardList','a148ServiceCase','a148ServiceStage','a148CompatForm','a148ReportForm','a148TeacherForm','a148FaultList','a148SolderSteps']) if (!indexHtml.includes(token)) throw new Error(`FIX148: brakuje nowego modułu/identyfikatora ${token}.`);
  for (const token of ['a149Extension','a149ContestStart','a149ContestQuestion','a149ScopeCanvas','a149DataChecklist','a149DocsCatalog','a149OfflineDownload']) if (!indexHtml.includes(token)) throw new Error(`FIX149: brakuje rozszerzenia/identyfikatora ${token}.`);
  const fix149Extension = releaseJson.academyMasterExtensionFix149 || {};
  if (fix149Extension.hotfix !== 'FIX149' || fix149Extension.productVersion !== releaseVersion || fix149Extension.newViews !== 0 || fix149Extension.d1Migrations !== false || fix149Extension.dataMigrations !== false || !Array.isArray(fix149Extension.modules) || fix149Extension.modules.length !== 5) throw new Error('FIX149: nieprawidłowy kontrakt pięciu nowych modułów / zakaz migracji / brak nowych widoków.');
  if (!indexHtml.includes('academy-master-extension-fix149.js?v=6.8.0-fix149') || !indexHtml.includes('academy-master-extension-fix149.css?v=6.8.0-fix149')) throw new Error('FIX149: nowe zasoby nie są podłączone do strony.');
  for (const asset of ['academy-practical-core-fix155.js','academy-practical-suite-fix155.js','academy-practical-suite-fix155.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX155: brak zasobu Akademii Praktycznej: ${asset}.`);
  for (const asset of ['academy-master-curriculum-core-fix162.js','academy-master-curriculum-fix162.js','academy-master-curriculum-fix162.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX162: brak zasobu Akademii Mistrza: ${asset}.`);
  for (const token of ['a162Extension','a162PartComplete','a162Measure','a162BuildCheck','a162SolderCheck','a162AiForm','a162ClassCreate','a162CertIssue','a162CertVerify','a162Search','a162ChallengeAnswers']) if (!indexHtml.includes(token)) throw new Error(`FIX162: brakuje modułu lub identyfikatora ${token}.`);
  const fix162Curriculum = releaseJson.academyMasterCurriculumFix162 || {};
  if (fix162Curriculum.hotfix !== 'FIX162' || fix162Curriculum.productVersion !== releaseVersion || fix162Curriculum.view !== 'view-academypro' || fix162Curriculum.newViews !== 0 || fix162Curriculum.d1SchemaMigrations !== false || fix162Curriculum.newD1Tables !== false || fix162Curriculum.modules?.length !== 11) throw new Error('FIX162: nieprawidłowy kontrakt modułów Master Technician / istniejące D1 bez migracji.');
  for (const asset of ['academy-master-curriculum-core-fix162.js?v=6.8.0-fix162','academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification','academy-master-curriculum-fix162.css?v=6.8.0-fix162']) if (!indexHtml.includes(asset)) throw new Error(`FIX162: zasób nie jest podłączony do strony: ${asset}.`);
  for (const api of ['classroom.js','certificates.js']) if (!fs.existsSync(path.join(FUNCTIONS,'api',api))) throw new Error(`FIX162: brak API online: functions/api/${api}.`);
  const classroomApi = fs.readFileSync(path.join(FUNCTIONS,'api','classroom.js'),'utf8');
  const certificateApi = fs.readFileSync(path.join(FUNCTIONS,'api','certificates.js'),'utf8');
  if (!classroomApi.includes('academy_classroom_created') || !classroomApi.includes('academy_classroom_submission') || !classroomApi.includes('requireConsent') || !certificateApi.includes('academy_certificate_issued') || !certificateApi.includes('requireConsent')) throw new Error('FIX162: funkcje klas/certyfikatów nie zachowują ochrony sesji i zapisu do istniejącej D1.');
  for (const token of ['a155Extension','a155CaseStart','a155BiosCheck','a155HardwareChoices','a155ExamStart','a155SubnetCalc','a155PortfolioForm','a155TutorAsk','a155TeacherForm']) if (!indexHtml.includes(token)) throw new Error(`FIX155: brakuje modułu lub identyfikatora ${token}.`);
  const fix155Suite = releaseJson.academyPracticalSuiteFix155 || {};
  if (fix155Suite.hotfix !== 'FIX155' || fix155Suite.productVersion !== releaseVersion || fix155Suite.view !== 'view-academypro' || fix155Suite.newViews !== 0 || fix155Suite.d1Migrations !== false || fix155Suite.dataMigrations !== false || fix155Suite.modules?.length !== 8 || fix155Suite.externalAi !== false) throw new Error('FIX155: nieprawidłowy kontrakt ośmiu modułów / zakresu danych / bezpiecznej symulacji.');
  for (const asset of ['academy-practical-core-fix155.js?v=6.8.0-fix155','academy-practical-suite-fix155.js?v=6.8.0-fix155','academy-practical-suite-fix155.css?v=6.8.0-fix155']) if (!indexHtml.includes(asset)) throw new Error(`FIX155: zasób nie jest podłączony do strony: ${asset}.`);
  const homeShowcaseJs = fs.readFileSync(path.join(WEB,'assets','homepage-showcase-640.js'),'utf8');
  const homeShowcaseCss = fs.readFileSync(path.join(WEB,'assets','homepage-showcase-640.css'),'utf8');
  const homeShowcaseGuard = verifyHomepageShowcase(indexHtml, homeShowcaseJs, homeShowcaseCss, ROOT);
  const fix142HeroImage = path.join(WEB, 'media', 'hero-usbc-power-delivery-fix142.jpg');
  if (!indexHtml.includes('src="media/hero-usbc-power-delivery-fix142.jpg"') || !indexHtml.includes('data-photo-local-fallback="assets/artwork-fix77/hero-main.svg"') || !fs.existsSync(fix142HeroImage)) throw new Error('FIX142: lokalne zdjęcie HERO USB-C lub jego fallback nie są gotowe do publikacji.');
  log(`FIX142: lokalne zdjęcie HERO USB-C potwierdzone; ${homeShowcaseGuard.slides} slajdów, 36 fallbacków SVG i ${homeShowcaseGuard.photoSlots} zachowanych slotów modułów.`);
  const photoLockScript = fs.readFileSync(path.join(WEB,'assets','photo-unique-thumbnails-fix30.js'),'utf8');
  const homeRefreshCss = fs.readFileSync(path.join(WEB,'assets','home-refresh-fix30.css'),'utf8');
  const photoUniquenessScript = fs.readFileSync(path.join(WEB,'assets','photo-uniqueness-fix77.js'),'utf8');
  if (!photoUniquenessScript.includes("'media/hero-usbc-power-delivery-fix142.jpg'")) throw new Error('FIX144: globalny strażnik FIX77 musi dopuszczać lokalne zdjęcie HERO USB-C; bez tego zastępuje je ilustracją SVG.');
  log('FIX144: globalny strażnik FIX77 dopuszcza lokalne zdjęcie HERO USB-C; pozostała kontrola unikalności zdjęć pozostaje aktywna.');
  const visualPhotoGuardScript = fs.readFileSync(path.join(WEB,'assets','visual-uniqueness-fix83.js'),'utf8');
  const photoUniquenessManifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','photo-uniqueness-manifest-fix77.json'),'utf8'));
  const photoSourcesFix129 = JSON.parse(fs.readFileSync(path.join(WEB,'media','photo-sources-online.json'),'utf8'));
  const photoLibraryFix129 = JSON.parse(fs.readFileSync(path.join(WEB,'media','home-photo-library-fix118.json'),'utf8'));
  const photoPolicyFix129 = JSON.parse(fs.readFileSync(path.join(WEB,'assets','equipment-photo-policy-fix129.json'),'utf8'));
  const photoPrimeRuntimeFix129 = fs.readFileSync(path.join(WEB,'assets','homepage-photo-prime-fix118.js'),'utf8');
  const photoCatalogRuntimeFix129 = fs.readFileSync(path.join(WEB,'assets','photo-catalog-fix115.js'),'utf8');
  const forbiddenPhotoSourcesInShell = ['sitewide-tech-visuals-fix123.js?v=6.8.0-fix123','homepage-tech-only-fix122.js?v=6.8.0-fix122'];
  if (releaseJson.latestHotfix !== 'FIX176' || releaseJson.latestHotfixBuild !== '6.8.0-fix176-global-academy-rescue-and-master-launch-20261115' || !indexHtml.includes('content="FIX149"') || !indexHtml.includes('content="FIX155"') || !indexHtml.includes('content="FIX165"') || !indexHtml.includes('content="FIX175"')) throw new Error('FIX175: release metadata and HTML must identify the active academy; historical FIX149/FIX155/FIX165 markers remain.');
  const photoProxyFunction = fs.readFileSync(path.join(ROOT,'functions','media','photos','[id].js'),'utf8');
  const photoProxyHelper = fs.readFileSync(path.join(ROOT,'functions','_photo-proxy-fix131.js'),'utf8');
  if (!photoProxyFunction.includes('serveCuratedPhotoFix131') || !photoProxyHelper.includes('PHOTO_SOURCES_FIX131') || !photoProxyHelper.includes('ALLOWED_HOSTS') || !photoProxyHelper.includes('X-Photo-Delivery') || !photoProxyHelper.includes('FIX134-SAFE-REDIRECTS') || !photoProxyHelper.includes("redirect: 'manual'") || !photoProxyHelper.includes('MAX_SAFE_REDIRECTS = 4') || photoProxyHelper.includes("redirect: 'error'")) throw new Error('FIX134: same-origin photo proxy must use supported manual redirects, a four-hop cap and the fixed host allowlist.');
  if (Object.values(photoSourcesFix129.homepageSlotSeedMap || {}).some(id => !String(photoSourcesFix129.photos.find(item=>item.id===id)?.asset || '').startsWith('/media/photos/'))) throw new Error('FIX131: curated photo manifest still uses a direct third-party image URL.');
  if (Object.keys(photoSourcesFix129.homepageSlotSeedMap || {}).length !== 19 || new Set(Object.values(photoSourcesFix129.homepageSlotSeedMap || {})).size !== 19 || photoLibraryFix129.entries?.length !== 19 || photoLibraryFix129.uniqueSeeds !== 19 || photoPolicyFix129.hotfix !== 'FIX129' || photoPolicyFix129.peopleVisible !== false || photoPolicyFix129.handsVisible !== false) throw new Error('FIX129: the 19 unique, equipment-only homepage photo assignments are incomplete.');
  const modulePhotoIdsFix135 = ['home-module-repairmaster','home-module-components','home-module-ultimate3d','home-module-labplus','home-tech-slot-14','home-tech-slot-15','home-module-courses','home-module-checklists','home-module-modelcenter','home-tech-slot-19','home-module-knowledge','home-module-cloudchat','home-tech-slot-22','home-module-14','home-module-15','home-module-16','home-module-17','home-module-18','home-module-19'];
  const modulePhotoKindsFix135 = new Map(modulePhotoIdsFix135.map(id => [id, (photoSourcesFix129.photos || []).find(p => p.id === photoSourcesFix129.homepageSlotSeedMap[id])?.category]));
  if (modulePhotoIdsFix135.some(id => !photoSourcesFix129.homepageSlotSeedMap[id] || !modulePhotoKindsFix135.get(id) || !new RegExp('data-photo-id=\"' + id + '\"[^>]*data-photo-kind=\"' + modulePhotoKindsFix135.get(id) + '\"').test(indexHtml)) || photoLibraryFix129.entries.some(e => !modulePhotoIdsFix135.includes(e.slotId))) throw new Error('FIX135: every homepage module must own one unique photo and an explicit matching data-photo-kind; specialist slots must not consume the 19 curated module seeds.');
  if (photoPrimeRuntimeFix129.includes('FIX122 homepage technical-visual lock') || !photoPrimeRuntimeFix129.includes('curated-equipment-photographs-with-local-svg-fallback') || !photoCatalogRuntimeFix129.includes('hasHumanSubjectMetadata') || !photoCatalogRuntimeFix129.includes('FIX129')) throw new Error('FIX129: photo runtime has an old homepage lock or misses the no-people metadata filter.');
  const photoCacheContractFix137 = evaluateHomepagePhotoCacheContract({
    html: indexHtml,
    serviceWorkerSource: serviceWorkerVisualSource,
    release: releaseJson,
    photoLibrary: photoLibraryFix129,
    forbiddenTokens: forbiddenPhotoSourcesInShell
  });
  if (!photoCacheContractFix137.ok) throw new Error(`FIX137: kontrakt cache zdjęć nie jest poprawny: ${photoCacheContractFix137.errors.join(' | ')}`);
  log(`FIX137: cache aplikacji ${photoCacheContractFix137.activeCoreCache} i zachowany cache zdjęć ${photoCacheContractFix137.activePhotoCache} są zgodne z metadanymi; brak starych skryptów blokujących zdjęcia.`);
  log(`FIX129: ${photoLibraryFix129.entries.length} unikalnych fotografii sprzętu podłączonych do strony głównej; SVG pozostaje wyłącznie awaryjnym trybem offline.`);
  for (const file of ['assets/electronics-simulator-fix119.js','assets/electronics-simulator-fix119.css','assets/electronics-simulator-fix119-manifest.json']) {
    if (!fs.existsSync(path.join(WEB,file))) throw new Error(`FIX119: brak wymaganego zasobu ${file}.`);
  }
  const electronicsCoreFix119 = fs.readFileSync(path.join(WEB,'assets','electronics-simulator-fix119.js'),'utf8');
  if (!indexHtml.includes('electronics-simulator-fix119.js?v=6.8.0-fix119') || !indexHtml.includes('master-workshop-630-extension.js?v=6.8.0-fix119') || !indexHtml.includes('master-workshop-630-extension.css?v=6.8.0-fix119') || !serviceWorkerVisualSource.includes('electronics-simulator-fix119.js?v=6.8.0-fix119') || !serviceWorkerVisualSource.includes('master-workshop-630-extension.js?v=6.8.0-fix119') || !serviceWorkerVisualSource.includes('master-workshop-630-extension.css?v=6.8.0-fix119') || !electronicsCoreFix119.includes('negotiatePd') || !electronicsCoreFix119.includes('buildScopePath')) throw new Error('FIX119: wspólny silnik elektroniki i Akademia FIX14 nie są kompletnie podłączone do HTML i PWA.');
  log('FIX119: wspólny silnik symulatorów, nawigacja i zasoby offline są podłączone; osobny cache zdjęć FIX118 zachowany.');
  const photoUiCss = fs.readFileSync(path.join(WEB,'assets','theme-630.css'),'utf8');
  const photoUiJs = fs.readFileSync(path.join(WEB,'assets','lesson-art.js'),'utf8');
  const photoEngineRuntimeMarker = "api.uniquePhotoEngineVersion='6.8.0-fix51-visual-assets-reuse'";
  const photoEngineRuntimeValid = photoUiJs.includes(photoEngineRuntimeMarker) && photoUiJs.includes('uniquePhotoEnginePolicy=') && photoUiJs.includes('PHOTO_SLOTS = 3') && photoUiJs.includes('perceptualHashBestEffort:true') && photoUiJs.includes('localFirst:true') && photoUiJs.includes('offlineFallback:true');
  const visualRuntime = fs.readFileSync(path.join(WEB,'assets','visual-assets-fix51.js'),'utf8');
  const visualAcademyRuntime = fs.readFileSync(path.join(WEB,'assets','visual-academy-fix51.js'),'utf8');
  const visualManifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','visual-asset-manifest-fix51.json'),'utf8'));
  if (!photoUiCss.includes('position:fixed!important') || !photoUiCss.includes('#np630BackTop') || !photoEngineRuntimeValid || !photoUiJs.includes('api.openverse.org/v1/images/') || !photoUiJs.includes('commons.wikimedia.org/w/api.php') || !photoUiJs.includes('license_type') || !photoUiJs.includes('imageDHash') || /data:image\/svg\+xml/i.test(photoUiJs)) throw new Error('Nawigacja, silnik fotografii i walidacja źródeł są niekompletne.');
  if (!indexHtml.includes('visual-assets-fix51.js') || !indexHtml.includes('visual-academy-fix51.js') || !indexHtml.includes('visual-academy-fix51.css') || visualManifest.assets?.length !== 18 || visualRuntime.indexOf('reuseAcrossLessons:false') < 0 || !visualAcademyRuntime.includes('fix51ScopeCanvas') || !serviceWorkerVisualSource.includes('artwork-fix51/18-connector-pinout.svg')) throw new Error('FIX51 Visual Academy: biblioteka zdjęć, 18 ilustracji, laboratoria lub cache PWA nie są kompletne.');
  const photoRegistry = JSON.parse(fs.readFileSync(path.join(WEB,'media','photo-sources-online.json'),'utf8'));
  const photoCatalogRuntimeFix115 = fs.readFileSync(path.join(WEB,'assets','photo-catalog-fix115.js'),'utf8');
  const photoCatalogStylesFix109 = fs.readFileSync(path.join(WEB,'assets','photo-catalog-fix109.css'),'utf8');
  const photoCatalogLayoutFix115 = fs.readFileSync(path.join(WEB,'assets','home-specialist-photo-layout-fix115.css'),'utf8');
  const methodRendererFix106 = fs.readFileSync(path.join(WEB,'assets','service-workshop.js'),'utf8');
  const photoCatalogContractFix115 = evaluatePhotoCatalogPublicationContractFix115({
    jsOk:true, cssOk:true, manifestOk:true, manifest:photoRegistry,
    js:photoCatalogRuntimeFix115, css:photoCatalogStylesFix109, layoutCss:photoCatalogLayoutFix115,
    html:indexHtml, serviceWorker:serviceWorkerVisualSource, remoteRelease:localRelease,
    expectedPhotoCatalogBuild:localRelease.photoCatalogRuntimeBuildTag,
    methodRenderer:methodRendererFix106, visualPhotoGuard:visualPhotoGuardScript,
    legacyPhotoGuard:photoUniquenessScript, photoLibrary:photoLibraryFix129
  });
  if (!photoCatalogContractFix115.valid) throw new Error(`FIX115: lokalny kontrakt zdjęć niekompletny: ${photoCatalogContractFix115.missing.join(', ')}`);
  log(`FIX129: ${photoCatalogContractFix115.seedPhotoCount} źródeł startowych; ${photoCatalogContractFix115.modulePhotoSlots} unikalnych przypisań fotograficznych strony głównej; metadane bez osób/dłoni, fallback SVG zachowany.`);
  const homepagePrimeFix116 = fs.readFileSync(path.join(WEB,'assets','homepage-photo-prime-fix118.js'),'utf8');
  const homepagePrimeCssFix116 = fs.readFileSync(path.join(WEB,'assets','homepage-photo-prime-fix118.css'),'utf8');
  if (!homepagePrimeFix116.includes('homepageSlotSeedMap') || !homepagePrimeFix116.includes('NPA_HOME_PHOTO_PRIME_FIX118') || !homepagePrimeFix116.includes('photos[slotId]') || !homepagePrimeFix116.includes('photoCacheStats') || !homepagePrimeFix116.includes('curated-equipment-photographs-with-local-svg-fallback') || !homepagePrimeCssFix116.includes('.photo-library-fix118') || !photoCatalogRuntimeFix115.includes('function registerPrimedHomepageAssignments(') || !photoCatalogRuntimeFix115.includes('assignments.set(id, accepted)') || !photoCatalogRuntimeFix115.includes('assignmentState[id] = accepted') || !photoCatalogRuntimeFix115.includes('const primedAssignmentsRegistered = registerPrimedHomepageAssignments(primeResult)') || !photoCatalogRuntimeFix115.includes('sameOriginCuratedPhoto') || !photoCatalogRuntimeFix115.includes('function registerStaticHomepagePhotoAssignments()') || !photoCatalogRuntimeFix115.includes('saveJson(ASSIGN_KEY, assignmentState)') || !photoCatalogRuntimeFix115.includes('const saved = assignments.get(img.dataset.photoId)') || releaseJson.homepagePhotoFirstRenderFix?.hotfix !== 'FIX136' || releaseJson.homepagePhotoFirstRenderFix?.registeredAssignments !== 19 || releaseJson.homepagePhotoFirstRenderFix?.homepageEnabled !== true || !indexHtml.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136') || !serviceWorkerVisualSource.includes('homepage-photo-prime-fix118.js?v=6.8.0-fix136') || !serviceWorkerVisualSource.includes('media/home-photo-library-fix118.json')) throw new Error('FIX129: homepage curated-photo assignments must remain enabled and registered in the catalog.');
  for (const file of ['assets/homepage-photo-prime-fix118.js','assets/homepage-photo-prime-fix118.css','media/home-photo-library-fix118.json']) if (!fs.existsSync(path.join(WEB,file))) throw new Error(`FIX118: missing ${file}`);
  log('FIX129: real equipment photos are enabled; people/hands are rejected by metadata and SVG is a fallback only.');
  for (const file of ['assets/photo-catalog-fix115.js','assets/photo-catalog-fix109.css','assets/home-specialist-photo-layout-fix115.css']) {
    if (!fs.existsSync(path.join(WEB,file))) throw new Error(`FIX115: brak wymaganego pliku katalogu zdjęć/układu: ${file}`);
  }
  if (!indexHtml.includes('assets/photo-catalog-fix115.js?v=6.8.0-fix136') || !indexHtml.includes('assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115') || !indexHtml.includes('assets/photo-catalog-fix109.css?v=6.8.0-fix109') || !serviceWorkerVisualSource.includes('photo-catalog-fix115.js?v=6.8.0-fix136') || !serviceWorkerVisualSource.includes('home-specialist-photo-layout-fix115.css?v=6.8.0-fix115') || !serviceWorkerVisualSource.includes('photo-catalog-fix109.css?v=6.8.0-fix109') || !serviceWorkerVisualSource.includes('media/photo-sources-online.json')) throw new Error('FIX115: runtime, arkusz układu i Service Worker muszą wskazywać nowy katalog zdjęć.');
  if (!indexHtml.includes('assets/photo-uniqueness-fix77.js?v=6.8.0-fix77') || !photoUniquenessScript.includes("fetch('/assets/photo-uniqueness-manifest-fix77.json'") || !visualRuntime.includes('reuseAcrossLessons:false') || !fs.existsSync(path.join(WEB,'assets','photo-uniqueness-manifest-fix77.json')) || !fs.existsSync(path.join(WEB,'assets','global-academy-fix77.css'))) throw new Error('FIX77/FIX78: globalna blokada zdjęć musi być podłączona przez runtime, a manifest dostępny lokalnie; wymagane pHash i style modułów.');
  const globalAcademyFix77Manifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','global-academy-fix77-manifest.json'),'utf8'));
  const globalAcademyFix77Runtime = fs.readFileSync(path.join(WEB,'assets','global-academy-expansion-fix73.js'),'utf8');
  const globalAcademyFix77Css = fs.readFileSync(path.join(WEB,'assets','global-academy-fix77.css'),'utf8');
  const academyDataFix77 = fs.readFileSync(path.join(WEB,'assets','academy-data.js'),'utf8');
  const academyDataImagePathsFix77 = [...academyDataFix77.matchAll(/assets\/artwork-fix77\/academy-data-\d{3}\.svg/g)].map(m=>m[0]);
  if (globalAcademyFix77Manifest.hotfix !== 'FIX77' || globalAcademyFix77Manifest.mainDashboardModules !== 19 || globalAcademyFix77Manifest.newModules?.length !== 6 || globalAcademyFix77Manifest.photoPolicy?.globalSingleAssignment !== true || globalAcademyFix77Manifest.uniqueLessonIllustrations !== 203 || academyDataImagePathsFix77.length !== 203 || new Set(academyDataImagePathsFix77).size !== 203 || /media\/[^\"']+\.(?:jpg|jpeg|png|webp)/i.test(academyDataFix77) || !['faultLabView','electronicsView','boardviewView','compatibilityView','serviceSimView','bindFaultLab','bindElectronics','bindBoardview','bindCompatibility','bindServiceSim'].every(token=>globalAcademyFix77Runtime.includes(token)) || !globalAcademyFix77Css.includes('.gax-board-map') || !globalAcademyFix77Css.includes('.gax-service-sim') || !serviceWorkerVisualSource.includes('length:203')) throw new Error('FIX77: sześć nowych modułów, 19 kafelków i style warsztatowe nie są kompletne.');
  for (const photo of ['laptop-board-inspection.jpg','ram-m2-installation-detail.jpg','cooling-cleaning.jpg','motherboard-multimeter-test.jpg']) if (!fs.existsSync(path.join(WEB,'media',photo))) throw new Error(`Brak fotografii warsztatowej: ${photo}.`);
  for (const file of ['service-worker.js','media/photo-sources-online.json','media/home-photo-library-fix118.json']) if (!fs.existsSync(path.join(WEB,file))) throw new Error(`Brak wymaganego pliku edukacyjnych zdjęć online: ${file}.`);
  for (const file of ['assets/photo-catalog-fix109.js','assets/photo-catalog-fix109.css']) if (!fs.existsSync(path.join(WEB,file))) throw new Error(`FIX93: brak aktywnego silnika fotografii: ${file}.`);
  if (!indexHtml.includes('assets/photo-catalog-fix115.js?v=6.8.0-fix136') || !indexHtml.includes('assets/home-specialist-photo-layout-fix115.css?v=6.8.0-fix115') || !serviceWorkerVisualSource.includes('photo-catalog-fix115.js?v=6.8.0-fix136') || !serviceWorkerVisualSource.includes('home-specialist-photo-layout-fix115.css?v=6.8.0-fix115') || !serviceWorkerVisualSource.includes('media/photo-sources-online.json')) throw new Error('FIX115: runtime, układ kart, manifest i PWA muszą wskazywać aktywny katalog zdjęć.');
  const backupRuntime = fs.readFileSync(path.join(WEB,'assets','progress-backup-621.js'),'utf8');
  const measurementLogRuntime = fs.readFileSync(path.join(WEB,'assets','measurement-log-640.js'),'utf8');
  if (!indexHtml.includes('assets/measurement-log-640.js?v=6.2.0-fix11') || !measurementLogRuntime.includes('NP_MEASUREMENT_LOG') || !measurementLogRuntime.includes('validateEntry') || !backupRuntime.includes('academyMeasurementLog')) throw new Error('Brak dziennika pomiarów FIX11 albo dołączenia wpisów do bezpiecznej kopii postępu.');
  const masterWorkshopRuntime = fs.readFileSync(path.join(WEB,'assets','master-workshop-630.js'),'utf8');
  const masterWorkshopCss = fs.readFileSync(path.join(WEB,'assets','master-workshop-630.css'),'utf8');
  for (const id of ['view-masterworkshop','nwmMasterWorkshop','nwmDomainGrid','nwmTopicDetail','nwmCasePicker','nwmExamPicker','nwmCaseForm','nwmNoteForm','nwmDatasheetSearch']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`Brak Warsztatu Mistrza FIX12: ${id}.`);
  for (const key of ['NP_MASTER_WORKSHOP_CONTENT','function decodeSmd','NPAcademyWorkshopDB','indexedDB.open','NPA-MASTER-WORKSHOP-BACKUP']) if (!masterWorkshopRuntime.includes(key)) throw new Error(`Brak funkcji Warsztatu Mistrza FIX12: ${key}.`);
  if (!masterWorkshopCss.includes('.nwm-hero') || !indexHtml.includes('master-workshop-630.js?v=6.2.0-fix12') || !indexHtml.includes('master-workshop-630.css?v=6.2.0-fix12')) throw new Error('Brak poprawnego załadowania zasobów Warsztatu Mistrza FIX12.');
  const masterAcademyRuntime = fs.readFileSync(path.join(WEB,'assets','master-workshop-630-extension.js'),'utf8');
  const masterAcademyCss = fs.readFileSync(path.join(WEB,'assets','master-workshop-630-extension.css'),'utf8');
  for (const id of ['n63LabType','n63LabWorkspace','n63ComponentList','n63DiagnosisForm','n63PathGrid','n63JobForm','n63PartForm','n63CertificateList','n63ExportBackup','n63ImportBackup','n63ReplacementSearch','n63ReplacementList','n63ReplacementDetail','n63ReplacementCount','n63XpSummary','n63XpBar']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`Brak nowego modułu FIX14: ${id}.`);
  if (!masterAcademyRuntime.includes('NPA_MASTER_ACADEMY_630') || !masterAcademyRuntime.includes('function runDiagnosis') || !masterAcademyRuntime.includes('normalizePathProgress') || !masterAcademyRuntime.includes('replacementData') || !masterAcademyRuntime.includes("soldering:") || !masterAcademyCss.includes('.n63-lab-top') || !indexHtml.includes('master-workshop-630-extension.js?v=6.8.0-fix119') || !indexHtml.includes('master-workshop-630-extension.css?v=6.8.0-fix119')) throw new Error('Brak kompletnej Akademii Master Electronics & Repair FIX14.');
  const ultimateAcademyRuntime = fs.readFileSync(path.join(WEB,'assets','master-academy-640-pro.js'),'utf8');
  const ultimateAcademyCss = fs.readFileSync(path.join(WEB,'assets','master-academy-640-pro.css'),'utf8');
  for (const id of ['n64PcbCase','n64BiosA','n64ImageFile','n64LogFile','n64CompatRun','n64IpCalc','n64QcSave','n64AiForm','n64DocsInput','n64ExamPicker']) if (!indexHtml.includes(`id=\"${id}\"`)) throw new Error(`Brak modułu FIX15: ${id}.`);
  for (const key of ['NPA_MASTER_ACADEMY_640','function inspectBios','function parseIPv4Address','NPA-MASTER-ACADEMY-FIX15','NPA_MASTER_ACADEMY_640']) if (!ultimateAcademyRuntime.includes(key)) throw new Error(`Brak funkcji Ultimate Service Academy FIX15: ${key}.`);
  if (!ultimateAcademyCss.includes('.n64-subnav') || !indexHtml.includes('master-academy-640-pro.js?v=6.4.0-fix15') || !indexHtml.includes('master-academy-640-pro.css?v=6.4.0-fix15')) throw new Error('Brak skryptu, stylów lub zakładek Ultimate Service Academy FIX15.');
  const fix16Runtime = fs.readFileSync(path.join(WEB,'assets','master-academy-650-ultimate.js'),'utf8');
  const fix16Css = fs.readFileSync(path.join(WEB,'assets','master-academy-650-ultimate.css'),'utf8');
  if (!indexHtml.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') || !indexHtml.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') || !fix16Runtime.includes('NPA_MASTER_ACADEMY_650') || !fix16Runtime.includes('AES-GCM') || !fix16Runtime.includes('PBKDF2') || !fix16Runtime.includes('data-m64-pane=\"measurements\"') || !fix16Css.includes('.n65-measure-grid')) throw new Error('Brak modułów ULTIMATE REPAIR CENTER FIX16.');
  const windowsAuditScriptPath = path.join(ROOT,'AUDYT_STANOWISKA_FIX17.ps1');
  const windowsAuditLauncherPath = path.join(ROOT,'URUCHOM_AUDYT_STANOWISKA_FIX17.cmd');
  if (!fs.existsSync(windowsAuditScriptPath) || !fs.existsSync(windowsAuditLauncherPath)) throw new Error('Brak lokalnego dodatku Windows Audit FIX17.');
  const windowsAuditScript = fs.readFileSync(windowsAuditScriptPath,'utf8');
  if (!windowsAuditScript.includes('NPA-WINDOWS-HARDWARE-AUDIT-FIX17') || !windowsAuditScript.includes('Win32_ComputerSystem') || !windowsAuditScript.includes('WmiMonitorID') || /Invoke-WebRequest|Invoke-RestMethod|Start-BitsTransfer|Set-CimInstance|Clear-Disk|Format-Volume|Initialize-Disk/i.test(windowsAuditScript)) throw new Error('Dodatek Windows Audit FIX17 nie spełnia kontraktu read-only.');
  const fix17Runtime = fs.readFileSync(path.join(WEB,'assets','master-academy-660-center.js'),'utf8');
  const fix17Css = fs.readFileSync(path.join(WEB,'assets','master-academy-660-center.css'),'utf8');
  if (!indexHtml.includes('master-academy-660-center.js?v=6.6.0-fix17') || !indexHtml.includes('master-academy-660-center.css?v=6.6.0-fix17') || !fix17Runtime.includes('NPA_MASTER_CENTER_660') || !fix17Runtime.includes('function analyzeSymptom') || !fix17Runtime.includes('function parseDelimited') || !fix17Runtime.includes('NPA-MASTER-CENTER-FIX17') || !fix17Css.includes('.n66-pane')) throw new Error('Brak modułów MASTER SERVICE CENTER FIX17.');
  const oauthRuntime = fs.readFileSync(path.join(FUNCTIONS,'_oauth.js'),'utf8');
  const oauthUi = fs.readFileSync(path.join(WEB,'assets','cloud-academy.js'),'utf8');
  const oauthStatusApiPath = path.join(FUNCTIONS,'api','auth','status.js');
  const oauthStatusApi = fs.readFileSync(oauthStatusApiPath,'utf8');
  const oauthVisualRuntime = fs.readFileSync(path.join(WEB,'assets','ultimate-600.js'),'utf8');
  const oauthVisualCss = fs.readFileSync(path.join(WEB,'assets','theme-530.css'),'utf8');
  if (!oauthStatusApi.includes('oauthSchemaStatus') || !oauthStatusApi.includes('providerDetails') || !oauthUi.includes('r.schemaReady') || !oauthUi.includes('r.providerDetails') || !oauthUi.includes('button.hidden=false') || oauthVisualRuntime.includes('hideInactiveOAuth') || /social-login-actions:has\(button:disabled\)[^{]*\{\s*display:none/i.test(oauthVisualCss)) throw new Error('OAuth FIX30 musi pokazywać wszystkie metody i raportować brakujące sekrety/migracje zamiast je ukrywać.');
  const identityApi = path.join(FUNCTIONS,'api','auth','identities.js');
  const migration8 = path.join(ROOT,'migrations','0008_social_login_x_github.sql');
  const migration9 = path.join(ROOT,'migrations','0009_discord_social_login.sql');
  const migration10 = path.join(ROOT,'migrations','0010_account_terms_and_oauth_consent.sql');
  const migration11 = path.join(ROOT,'migrations','0011_totp_two_factor.sql');
  const migration12 = path.join(ROOT,'migrations','0012_email_verification_and_password_reset.sql');
  const migration13 = path.join(ROOT,'migrations','0013_account_runtime_guard.sql');
  const migration14 = path.join(ROOT,'migrations','0014_account_limiter_key_repair.sql');
  const migration15 = path.join(ROOT,'migrations','0015_account_limiter_v3.sql');
  const totpApi = path.join(FUNCTIONS,'api','auth','totp.js');
  const totpVerifyApi = path.join(FUNCTIONS,'api','auth','totp','verify.js');
  const totpRuntime = fs.readFileSync(path.join(FUNCTIONS,'_totp.js'),'utf8');
  // Keep the two session-related routes distinct: /api/session owns account
  // register/login, while /api/auth/sessions manages logged-in device sessions.
  const sessionApi = path.join(FUNCTIONS,'api','auth','sessions.js');
  const accountLoginApi = path.join(FUNCTIONS,'api','session.js');
  const passwordKdfApi = path.join(FUNCTIONS,'_password-kdf.js');
  const passwordResetApi = path.join(FUNCTIONS,'api','auth','password','reset.js');
  if (!fs.existsSync(passwordKdfApi) || !fs.existsSync(passwordResetApi)) throw new Error('Brak wspólnego KDF FIX30 dla rejestracji/logowania/resetu.');
  const passwordKdfSource = fs.readFileSync(passwordKdfApi,'utf8');
  const passwordResetSource = fs.readFileSync(passwordResetApi,'utf8');
  const accountSessionRuntime = fs.readFileSync(accountLoginApi,'utf8');
  assertSharedPasswordKdfContract({ accountApi: accountSessionRuntime, kdfSource: passwordKdfSource, resetApi: passwordResetSource }, 'ONECLICK verifyWeb');
  const accountSchemaPath = path.join(FUNCTIONS,'_account-schema.js');
  const accountSchemaRuntime = fs.readFileSync(accountSchemaPath,'utf8');
  const accountLimiterRuntime = fs.readFileSync(path.join(FUNCTIONS,'_lib.js'),'utf8');
  const accountAuthChecks = {
    fiveOAuthProviders: ['google','facebook','microsoft','github','discord'].every(provider => oauthRuntime.includes(`'${provider}'`)) && oauthRuntime.includes("new Set(['google', 'facebook', 'microsoft', 'github', 'discord'])"),
    linkedLoginMethodsUi: oauthUi.includes('loadLinkedLoginMethods'),
    accountSessionsUi: oauthUi.includes('loadAccountSessions'),
    identityEndpoint: fs.existsSync(identityApi),
    activeSessionManagementEndpoint: fs.existsSync(sessionApi),
    accountLoginRegistrationEndpoint: fs.existsSync(accountLoginApi),
    migration0008: fs.existsSync(migration8),
    migration0009: fs.existsSync(migration9),
    migration0010: fs.existsSync(migration10),
    migration0011: fs.existsSync(migration11),
    migration0012: fs.existsSync(migration12),
    migration0013: fs.existsSync(migration13),
    migration0014: fs.existsSync(migration14),
    migration0015: fs.existsSync(migration15),
    limiterV3UsesFreshTable: accountSchemaRuntime.includes('academy_account_rate_limits_v3') && accountLimiterRuntime.includes('academy_account_rate_limits_v3'),
    loginStageDiagnostics: accountSessionRuntime.includes('accountStage') && accountSessionRuntime.includes('login-rate-limit-ip'),
    limiterV3ExactPrimaryKeyGuard: accountSchemaRuntime.includes('primaryKeyColumns.length !== 1') && accountSchemaRuntime.includes('academy_account_rate_limits_v3') && fs.readFileSync(migration15,'utf8').includes('bucket_key TEXT NOT NULL PRIMARY KEY'),
    accountSchemaModule: fs.existsSync(accountSchemaPath),
    accountSchemaChecksDedicatedLimiter: accountSchemaRuntime.includes('academy_account_rate_limits_v3'),
    rateLimiterUsesDedicatedTable: accountLimiterRuntime.includes('academy_account_rate_limits_v3'),
    accountLoginApiReportsSchemaStatus: accountSessionRuntime.includes('accountSchemaStatus'),
    accountAuthStatusReportsLimiterV3: oauthStatusApi.includes("accountLimiterTable: 'academy_account_rate_limits_v3'"),
    loginValidationIsPresent: accountSessionRuntime.includes("validateEmailAndPassword(body, 'login')"),
    registrationValidationIsPresent: accountSessionRuntime.includes("validateEmailAndPassword(body, 'register')"),
    mailHelper: fs.existsSync(path.join(FUNCTIONS,'_mail.js')),
    emailEndpoint: fs.existsSync(path.join(FUNCTIONS,'api','auth','email.js')),
    emailVerificationEndpoint: fs.existsSync(path.join(FUNCTIONS,'api','auth','email','verify.js')),
    passwordForgotEndpoint: fs.existsSync(path.join(FUNCTIONS,'api','auth','password','forgot.js')),
    passwordResetEndpoint: fs.existsSync(path.join(FUNCTIONS,'api','auth','password','reset.js')),
    totpEndpoint: fs.existsSync(totpApi),
    totpVerificationEndpoint: fs.existsSync(totpVerifyApi),
    totpAESGCM: totpRuntime.includes('AES-GCM'),
    totpVerificationRuntime: totpRuntime.includes('verifyTotp'),
    oauthTotpChallenge: oauthRuntime.includes('createTotpChallenge'),
    totpSecurityUi: oauthUi.includes('loadTotpSecurity'),
    totpChallengeUi: oauthUi.includes('showTotpChallenge'),
    totpSettingsPanel: indexHtml.includes('id="accountTotpPanel"'),
    totpLoginChallengePanel: indexHtml.includes('id="emailAuthTotpChallenge"'),
    localOAuthSecretConfigurator: fs.existsSync(path.join(ROOT,'scripts','configure-oauth-secrets.js')),
    xOAuthButtonExcluded: !indexHtml.includes('data-oauth-start="x"'),
    githubOAuthButton: indexHtml.includes('data-oauth-start="github"'),
    discordOAuthButton: indexHtml.includes('data-oauth-start="discord"'),
    accountSessionsList: indexHtml.includes('id="accountSessionsList"')
  };
  const missingAccountAuth = Object.entries(accountAuthChecks).filter(([,ok]) => !ok).map(([name]) => name);
  if (missingAccountAuth.length) throw new Error(`Brak pełnej integracji OAuth + 2FA + e-mail FIX30 lub poprawki kont. Brakujące kontrole: ${missingAccountAuth.join(', ')}.`);

  if (!indexHtml.includes('id="npbProgressBackup"') || !indexHtml.includes('id="npbExportBackup"') || !indexHtml.includes('id="npbImportBackup"') || !backupRuntime.includes('NAUKA_OD_A_DO_Z_LOCAL_PROGRESS') || !backupRuntime.includes('MAX_BYTES = 5 * 1024 * 1024')) throw new Error('Brak bezpiecznej kopii postępu nauki FIX10.');
  const repairAppRuntime = fs.readFileSync(path.join(WEB,'assets','app.js'),'utf8');
  const longVideoRuntime = fs.readFileSync(path.join(WEB,'assets','long-video-catalog-620.js'),'utf8');
  const studioRuntime = fs.readFileSync(path.join(WEB,'assets','advanced-learning-studio-620.js'),'utf8');
  const studioCss = fs.readFileSync(path.join(WEB,'assets','advanced-learning-studio-620.css'),'utf8');
  if (!indexHtml.includes('id="longVideoGallery"') || !indexHtml.includes('assets/advanced-learning-studio-620.js?v=6.2.0-fix7') || !studioRuntime.includes('id="lab44-studio"') || !studioRuntime.includes('alsScopeCanvas') || !studioRuntime.includes('alsSetVolt') || !studioRuntime.includes('alsExamForm') || !studioCss.includes('.als-studio') || !repairAppRuntime.includes('data-repair-photo=') || !repairAppRuntime.includes('data-long-video-done') || !longVideoRuntime.includes('window.ACADEMY_LONG_VIDEOS')) throw new Error('Brak rozbudowanego laboratorium edukacyjnego, unikalnych fotografii lub długich szkoleń wideo FIX7.');
  const longVideoItems = [...longVideoRuntime.matchAll(/\{id:'(LONG-[^']+)',photoId:'([^']+)'/g)];
  if (longVideoItems.length < 12 || new Set(longVideoItems.map(item => item[2])).size !== longVideoItems.length) throw new Error('Katalog FIX7 wymaga co najmniej 12 szkoleń z osobnymi fotografiami okładkowymi.');
  const workshopRuntime = fs.readFileSync(path.join(WEB,'assets','ultimate-workshop-620.js'),'utf8');
  for (const key of ['np62-model-search','np62-meter-mode','np62-current']) if (!workshopRuntime.includes(key)) throw new Error(`Niekompletny moduł Ultimate Workshop 6.2.0: ${key}.`);

  if (!/<section[^>]*class=["']view-section active["'][^>]*id=["']view-home["']/i.test(indexHtml)) throw new Error('Pulpit Akademii nie jest domyślnym aktywnym widokiem.');

  const requiredAssets = [
    'theme-440.css','theme-450.css','theme-500.css','theme-520.css','theme-521.css','theme-522.css','theme-523.css','theme-530.css','theme-600.css','theme-630.css','scroll-navigation-630.js','ultra-cyber-530.js','ultimate-600.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js','lesson-count-610.js','knowledge-hub-610.js','academy-dashboard-610.js','theme-controller-610.js','theme-610.css',
    'academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js',
    'device-model-catalog.js','community-models.js','labplus-engine.js','lab45-service-center.js',
    'neon-motion.js','visitor-dashboard.js','cloud-academy.js','pwa-icon.svg','lab-device-bridge-630.js','lab-device-bridge-630.css','progress-backup-621.js','progress-backup-621.css','measurement-log-640.js','measurement-log-640.css','master-workshop-630.js','master-workshop-630.css','master-workshop-630-extension.js','master-workshop-630-extension.css','master-academy-640-pro.js','master-academy-640-pro.css','master-academy-650-ultimate.js','master-academy-650-ultimate.css','nauka-centrum-fix40.js','nauka-centrum-fix40.css','akademia-serwisanta-fix41.js','akademia-serwisanta-fix41.css','real-workshop-fix42.js','real-workshop-fix42.css','knowledge-suite-fix43.js','knowledge-suite-fix43.css','master-service-center-fix44.js','master-service-center-fix44.css','knowledge-updates-fix44.json','professional-service-fix45.js','professional-service-fix45.css','master-control-fix47.js','master-control-fix47.css','ultimate-quality-fix49.js','ultimate-quality-fix49.css'
  ];
  for (const asset of requiredAssets) if (!fs.existsSync(path.join(WEB, 'assets', asset))) throw new Error(`Brak wymaganego modułu WWW: assets/${asset}.`);
  for (const file of ['service-worker.js','manifest.webmanifest','release.json','media/videos/akademia-dlaczego-warto-wspierac.mp4','media/video_posters/akademia-wsparcie-poster.jpg','media/videos/akademia-dlaczego-warto-wspierac.vtt']) {
    if (!fs.existsSync(path.join(WEB, file))) throw new Error(`Brak wymaganego pliku: ${file}.`);
  }
  const lessonBadge = indexHtml.match(/id=["']lessonTotalBadge["']>\s*(\d+)/i);
  if (!lessonBadge || Number(lessonBadge[1]) !== 1083 || !indexHtml.includes('assets/academy-ultra-lessons-3.js')) throw new Error('HTML nie wskazuje 1083 lekcji (1078 istniejących + 5 z FIX145) i trzeciego pakietu szkoleniowego.');
  const lessonPack610 = fs.readFileSync(path.join(WEB,'assets','academy-master-lessons-610.js'),'utf8');
  if ((lessonPack610.match(/\"id\":\"MASTER-610-/g)||[]).length !== 60) throw new Error('Pakiet 60 lekcji 6.2.0 jest niekompletny.');
  if (!indexHtml.includes('id=\"view-knowledge\"') || !indexHtml.includes('id=\"k610DomainGrid\"')) throw new Error('Brak mapy wiedzy 6.2.0.');
  for (const asset of ['theme-610.css','theme-controller-610.js','knowledge-hub-610.js','academy-dashboard-610.js','lesson-count-610.js']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`Brak zasobu 6.2.0: ${asset}.`);
  const lessonPack3 = fs.readFileSync(path.join(WEB,'assets','academy-ultra-lessons-3.js'),'utf8');
  if (!lessonPack3.includes('ULTRA-311') || (lessonPack3.match(/"id":"ULTRA-/g) || []).length !== 100) throw new Error('Pakiet 100 nowych lekcji jest niekompletny.');
  const lessonPack4 = fs.readFileSync(path.join(WEB,'assets','academy-ultimate-lessons-600.js'),'utf8');
  if ((lessonPack4.match(/"id":"ULTIMATE-/g) || []).length !== 200) throw new Error('Pakiet 200 nowych lekcji jest niekompletny.');
  const ultimateRuntime = fs.readFileSync(path.join(WEB,'assets','ultimate-600.js'),'utf8');
  const ultimateCss = fs.readFileSync(path.join(WEB,'assets','theme-600.css'),'utf8');
  for (const id of ['view-repairmaster','view-ultimate3d','view-admin','u6RepairForm','u6BoardSvg','u6AdminConnect','u6AdminLessonForm','u6AdminDrafts']) if (!indexHtml.includes(`id=\"${id}\"`)) throw new Error(`Brak modułu ULTIMATE 6.2.0: ${id}.`);
  for (const key of ['setupBackground','boardSetup','repairMasterSetup','adminSetup','adminContentStudioSetup','ACADEMY_FREE_CHAT','/api/admin/models','/api/admin/knowledge']) if (!ultimateRuntime.includes(key)) throw new Error(`Brak funkcji ULTIMATE 6.2.0: ${key}.`);
  if (!ultimateCss.includes('u6-command') || !ultimateCss.includes('u6-board-viewport')) throw new Error('Brak nowej warstwy wizualnej ULTIMATE 6.2.0.');


  const motion = fs.readFileSync(path.join(WEB,'assets','neon-motion.js'),'utf8');
  const themeController = fs.readFileSync(path.join(WEB,'assets','theme-controller-610.js'),'utf8');
  const theme610Css = fs.readFileSync(path.join(WEB,'assets','theme-610.css'),'utf8');
  const skinTheme = fs.readFileSync(path.join(WEB,'assets','theme-500.css'),'utf8');
  const theme = fs.readFileSync(path.join(WEB,'assets','theme-521.css'),'utf8');
  for (const key of ['prefers-reduced-motion','requestFullscreen','fullscreenToggle','fullscreenchange','appearanceOwner']) if (!motion.includes(key)) throw new Error(`Brak obsługi NEON MOTION bridge: ${key}.`);
  for (const key of ['nm610Panel','appearanceToggle','data-skin-choice','academyCircuitCanvas','dataset.skin','focus-mode','ACADEMY_THEME_API','syncCanvasMotion']) if (!themeController.includes(key)) throw new Error(`Brak aktywnego kontrolera wyglądu 6.2.0: ${key}.`);
  for (const skin of ['blue','purple','green']) if (!theme610Css.includes(`body[data-skin="${skin}"]`)) throw new Error(`Brak definicji skórki ${skin} w theme-610.css.`);
  for (const skin of ['violet','matrix','arctic','titanium']) if (!skinTheme.includes(`body[data-skin="${skin}"]`)) throw new Error(`Brak zgodności wstecznej skórki ${skin} w theme-500.css.`);
  if (motion.includes("getElementById('appearanceToggle')") || motion.includes('academyExperiencePanel')) throw new Error('Wykryto drugi kontroler wyglądu — tylko theme-controller-610.js może obsługiwać panel.');
  if (!theme.includes('support-story')) throw new Error('Brak dodatkowych stylów strony wsparcia w theme-521.css.');

  const authApi = fs.readFileSync(path.join(FUNCTIONS,'api','session.js'),'utf8');
  const authUi = fs.readFileSync(path.join(WEB,'assets','cloud-academy.js'),'utf8');
  const authMigration = fs.readFileSync(path.join(ROOT,'migrations','0006_accounts_and_device_models.sql'),'utf8');
  for (const key of ["from '../_password-kdf.js'",'createPasswordSalt','derivePassword','isSupportedPasswordSalt','registerEmailAccount','loginEmailAccount',"purpose === 'register'","purpose === 'login'",'accountSchemaStatus']) if (!authApi.includes(key)) throw new Error(`Brak rejestracji/logowania e-mail lub importu wspólnego KDF: ${key}.`);
  for (const key of ['email_normalized','password_salt','password_hash','academy_device_model_submissions','academy_device_models']) if (!authMigration.includes(key)) throw new Error(`Migracja kont/modeli nie zawiera: ${key}.`);
  if (!indexHtml.includes('id="emailAuthForm"') || !authUi.includes('submitEmailAuth') || !authUi.includes('emailAuthForm')) throw new Error('Formularz rejestracji kont nie jest podłączony.');
  for (const id of ['emailAuthBackendState','emailAuthRetry','emailAuthTogglePassword','emailAuthToggleConfirm','emailAuthPasswordMeter','authPassLength','authPassMatch']) if (!indexHtml.includes(`id="${id}"`) || !authUi.includes(id)) throw new Error(`Brak ulepszenia formularza konta: ${id}.`);
  for (const key of ["sessionCheck=await api('/session')",'accountRegistrationAvailable','ACCOUNT_EXISTS','emailAuthBackendState']) if (!authUi.includes(key)) throw new Error(`Brak kontroli przepływu konta: ${key}.`);
  if (indexHtml.includes('w tej wersji e-mail nie jest potwierdzany') || indexHtml.includes('w tej wersji adres e-mail nie jest potwierdzany') || !indexHtml.includes('Resend') || !passwordKdfSource.includes('PBKDF2') || !passwordKdfSource.includes('PBKDF2_ITERATIONS = 100000') || !indexHtml.includes('Minimum 12 znaków') || !indexHtml.includes('id="emailForgotPanel"') || !indexHtml.includes('id="emailPasswordResetPanel"') || !indexHtml.includes('id="accountEmailSecurityPanel"') || !oauthUi.includes('requestPasswordReset') || !oauthUi.includes('submitPasswordReset') || !oauthUi.includes('loadEmailSecurity')) throw new Error('Brak aktywnej obsługi potwierdzenia e-mail, resetu hasła lub wspólnego KDF Cloudflare FIX30.');

  const modelApi = fs.readFileSync(path.join(FUNCTIONS,'api','models.js'),'utf8');
  const modelAdmin = fs.readFileSync(path.join(FUNCTIONS,'api','admin','models.js'),'utf8');
  const modelCatalog = fs.readFileSync(path.join(WEB,'assets','device-model-catalog.js'),'utf8');
  for (const key of ['onRequestGet','onRequestPost','rightsConfirmed','shareConsent']) if (!modelApi.includes(key)) throw new Error(`Brak API społeczności modeli: ${key}.`);
  if (!modelAdmin.includes('checkAdmin') || !indexHtml.includes('id="deviceModelDirectory"') || !indexHtml.includes('id="deviceModelForm"')) throw new Error('Brak katalogu i moderacji modeli społeczności.');
  for (const model of ['T480','EliteBook 840 G8','Latitude 5420','ZenBook 14 UX425','Nitro 5 AN515-57','GF63 Thin 11SC','Surface Pro 8','MacBook Air M1 A2337','Galaxy Book3 Pro 360 NP960QFG','LG gram 16Z90R','Panasonic TOUGHBOOK FZ-55','Lenovo ThinkCentre M720q Tiny','Alienware m16 R2','Getac B360 G2','VAIO SX14 VJS146','TUXEDO InfinityBook Pro 14 Gen9','XMG CORE 15 M24','Eurocom Sky Z7 R2','Star Labs StarBook Mk V']) if (!modelCatalog.includes(model)) throw new Error(`Brak modelu referencyjnego: ${model}.`);
  if (!indexHtml.includes('id="metricBrandTotal">33') || !indexHtml.includes('id="metricModelTotal">150')) throw new Error('Licznik producentów lub modeli nie odpowiada katalogowi 6.2.0.');

  const visitsApiPath = path.join(FUNCTIONS,'api','visits.js');
  if (!fs.existsSync(visitsApiPath)) throw new Error('Brak endpointu /api/visits.');
  const visitsApi = fs.readFileSync(visitsApiPath,'utf8');
  const dashboard = fs.readFileSync(path.join(WEB,'assets','visitor-dashboard.js'),'utf8');
  for (const key of ['total_visits','total_page_views','today_visits','week_visits','unique_visitors','registered_profiles','email_accounts','approved_device_models','completed_lesson_records']) if (!visitsApi.includes(key)) throw new Error(`Brak statystyki globalnej: ${key}.`);
  for (const id of ['metricGlobalVisits','metricUniqueVisitors','metricGlobalViews','metricTodayVisits','metricWeekVisits','metricActiveProfiles','metricRegisteredProfiles','metricEmailAccounts','metricCompletedLessons','metricApprovedCases','metricApprovedModels','metricPendingModels','metricMonthVisits','metricTodayViews','metricWeekViews','metricLearnersWithProgress','metricTrackedLessonOpens','metricTrackedVideoOpens','metricTrackedLessonCompletions','metricLessonTotal','metricLearningPaths','metricBrandTotal','metricModelTotal','metricVideoTotal']) if (!dashboard.includes(id)) throw new Error(`Brak licznika w panelu statystyk: ${id}.`);
  for (const id of ['academyGlobalStats','globalVisitStatus','visitorChart','globalVisitsNotice']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`Brak panelu statystyk: ${id}.`);
  const visitMigration = fs.readFileSync(path.join(ROOT,'migrations','0007_global_unique_visitors.sql'),'utf8');
  if (!visitMigration.includes('CREATE TABLE IF NOT EXISTS academy_site_unique_visitors') || !visitMigration.includes('INSERT OR IGNORE INTO academy_site_unique_visitors') || !visitMigration.includes('FROM academy_site_visit_sessions') || /DROP\s+TABLE|DELETE\s+FROM\s+academy_site_daily_visits/i.test(visitMigration)) throw new Error('Migracja 0007 musi tylko dodać/backfillować tabelę unikalnych sesji i zachować dotychczasowe agregaty.');

  const supportCssPath = path.join(WEB,'assets','support-expansion-fix35.css');
  const supportJsPath = path.join(WEB,'assets','support-enhancements-fix35.js');
  const supportCss = fs.readFileSync(supportCssPath,'utf8');
  const supportJs = fs.readFileSync(supportJsPath,'utf8');
  for (const id of ['supportRoadmap','supportUpdates','supportWays','supportContributionGuide','supportPayments','supportContact','supportShareButton','supportShareStatus']) if (!indexHtml.includes(`id=\"${id}\"`)) throw new Error(`FIX39: brakuje rozbudowanej sekcji wsparcia ${id}.`);
  for (const selector of ['.support-jump-nav','.support-principles-grid','.support-roadmap-grid','.support-updates-grid','.support-ways-grid','.support-payment-steps','.support-payment-review','.support-contact','.support-contribution-grid','.support-contribution-note','.support-blik-official-link']) if (!supportCss.includes(selector)) throw new Error(`FIX39: brak stylu rozbudowanej strony wsparcia ${selector}.`);
  if (!supportJs.includes('supportShareButton') || !supportJs.includes('navigator.share') || !supportJs.includes('navigator.clipboard')) throw new Error('FIX39: udostępnianie platformy nie ma bezpiecznego fallbacku.');
  if (!/id=\"blikNumber\">78640187<\/strong>/.test(indexHtml) || !indexHtml.includes('https://pay.sumup.com/b2c/QON3J042') || !indexHtml.includes('nie wpisuj jej jako kodu BLIK') || !indexHtml.includes('https://www.blik.com/pierwsze-kroki-z-blikiem')) throw new Error('FIX39: dane metod płatności lub ostrzeżenie o formacie BLIK są niekompletne.');
  if (!indexHtml.includes('assets/support-expansion-fix35.css?v=6.8.0-fix35') || !indexHtml.includes('assets/support-enhancements-fix35.js?v=6.8.0-fix35')) throw new Error('FIX39: strona nie ładuje rozszerzenia wsparcia.');
  const supportCommunityCssPath=path.join(WEB,'assets','support-community-fix36.css');
  const supportCommunityJsPath=path.join(WEB,'assets','support-community-fix36.js');
  const supportCommunityCss=fs.readFileSync(supportCommunityCssPath,'utf8');
  const supportCommunityJs=fs.readFileSync(supportCommunityJsPath,'utf8');
  for(const id of ['supportReleaseJournal','supportCommunityCenter','supportProposalForm','supportProposalList','supportCaseCenter','supportCaseForm','supportMyCases','supportTransparencyCenter','supportCostsList','supportThanksCenter','supportThanksForm','supportFollowCenter','supportUpdatesSubscribe','supportAnnouncementsList','supportAdminCenter','supportCostAdminForm','supportAnnouncementAdminForm','supportAnnouncementUnread','supportMarkAnnouncementsRead','supportDataRefresh']) if(!indexHtml.includes(`id=\"${id}\"`)) throw new Error(`FIX39: brak elementu centrum społeczności ${id}.`);
  for(const token of ['/support/proposals','/support/thanks','/support/updates','/support/transparency','/admin/support','/knowledge?mine=1']) if(!supportCommunityJs.includes(token)) throw new Error(`FIX39: brak integracji API ${token}.`);
  for(const selector of ['.support-release-timeline','.support-proposal-card','.support-case-layout','.support-cost-row','.support-thanks-card','.support-announcement-card','.support-admin-forms','.support-unread-bar','.support-jump-nav #supportDataRefresh']) if(!supportCommunityCss.includes(selector)) throw new Error(`FIX39: brak stylu ${selector}.`);
  if(!supportCommunityJs.includes('navigator') && supportCommunityJs.includes('notification')) throw new Error('FIX39: nie deklaruj nieobsługiwanych powiadomień push.');
  const migration16=fs.readFileSync(path.join(ROOT,'migrations','0016_support_community_center.sql'),'utf8');
  for(const table of ['academy_support_proposals','academy_support_proposal_votes','academy_support_thanks','academy_support_subscriptions','academy_support_costs','academy_support_announcements']) if(!migration16.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) throw new Error(`FIX39: migracja 0016 nie tworzy ${table}.`);
  for(const contract of ['UNIQUE(proposal_id,user_id)','show_public INTEGER NOT NULL DEFAULT 0','last_seen_at TEXT','amount_minor INTEGER NOT NULL CHECK(amount_minor > 0)','evidence_url TEXT NOT NULL DEFAULT']) if(!migration16.includes(contract)) throw new Error(`FIX39: migracja centrum społeczności nie ma kontraktu ${contract}.`);
  if(/DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE\s+academy_users/i.test(migration16)) throw new Error('FIX39: migracja centrum społeczności nie może usuwać ani modyfikować istniejących tabel kont.');
  for(const route of ['support/proposals.js','support/thanks.js','support/updates.js','support/transparency.js','admin/support.js']) if(!fs.existsSync(path.join(FUNCTIONS,'api',route))) throw new Error(`FIX39: brak API ${route}.`);
  for(const testFile of ['scripts/test-support-community-fix36.mjs','scripts/test-support-community-runtime-fix36.mjs']) if(!fs.existsSync(path.join(ROOT,testFile))) throw new Error(`FIX39: brak wymaganej kontroli ${testFile}.`);
  for(const testFile of ['scripts/test-release-620-contract.js','scripts/test-release-contract-consistency-fix37.mjs','scripts/test-release-contract-consistency-fix38.mjs','scripts/test-release-contract-consistency-fix39.mjs','scripts/test-support-community-guard-fix39.mjs','scripts/test-unique-repair-photos-long-videos-fix5.js','scripts/test-photo-engine-publisher-marker-fix38.mjs','scripts/test-photo-reliability-fix50.mjs','scripts/test-release-contract-fix50.mjs','scripts/test-electronics-simulators-fix119.mjs','scripts/test-visual-academy-fix51.mjs','scripts/test-preview-server-fix51.mjs','scripts/test-release-contract-fix51.mjs','scripts/test-watcher-fix51-asset-count-fix53.mjs','scripts/test-nauka-centrum-fix40.mjs','scripts/test-akademia-serwisanta-fix41.mjs','scripts/test-real-workshop-fix42.mjs','scripts/test-knowledge-suite-fix43.mjs','scripts/test-site-feedback-fix43-runtime.mjs','scripts/test-master-service-center-fix44.mjs','scripts/test-professional-service-fix45.mjs','scripts/test-watcher-service-worker-tdz-fix45.mjs','scripts/test-watcher-fix44-case-contract-fix46.mjs','scripts/test-master-control-fix47.mjs','scripts/test-watcher-fix47-contract.mjs','scripts/test-watcher-cache-name-tdz-fix48.mjs','scripts/test-ultimate-quality-fix49.mjs','scripts/test-release-contract-fix49.mjs','scripts/test-pending-migration-guard-fix49.mjs','scripts/security-audit-fix49.mjs','scripts/migration-audit-fix49.mjs','scripts/pending-migration-guard-fix49.cjs','scripts/test-pending-migration-guard-fix49.mjs','scripts/run-browser-e2e-fix49.mjs','scripts/test-view-count-fix61.mjs','scripts/test-migration-inventory-compat-fix62.mjs','scripts/migration-inventory-compat-fix62.mjs','scripts/test-global-academy-expansion-fix73.mjs','scripts/test-global-academy-http-fix73.mjs','scripts/test-home-learning-fix77.mjs','scripts/test-global-academy-fix77.mjs','scripts/test-global-academy-http-fix77.mjs','scripts/test-global-academy-http-proxy-fix113.mjs','scripts/test-oneclick-fix77.mjs','scripts/test-fix78-photo-manifest-guard.mjs','scripts/test-pages-production-direct-upload-fix81.mjs','scripts/test-pages-production-branch-fix85.mjs','scripts/test-fix82-global-academy-marker.mjs','scripts/test-fix83-unique-visuals.mjs','scripts/test-fix84-node-crypto.mjs','scripts/test-homepage-showcase-fix80.mjs','scripts/test-watcher-homepage-showcase-fix32.mjs','scripts/test-homepage-showcase-fix8.js','scripts/test-service-worker-fix79.mjs','scripts/run-tests-fix77.mjs','scripts/run-tests-fix78.mjs','WYKONAJ_TESTY_FIX77.cmd','WYKONAJ_TESTY_FIX78.cmd','WYKONAJ_TESTY_FIX79.cmd','WYKONAJ_TESTY_FIX80.cmd','scripts/run-tests-fix80.mjs','scripts/test-syntax-root-fix74.mjs','scripts/test-syntax-fix64-fix73.mjs']) if(!fs.existsSync(path.join(ROOT,testFile))) throw new Error(`FIX47: brak kompatybilnego kontraktu wydania ${testFile}.`);
  const supportUpdatesApiSource=fs.readFileSync(path.join(FUNCTIONS,'api','support','updates.js'),'utf8');
  if(!supportCommunityJs.includes('consent') || !supportCommunityJs.includes('showPublic') || !supportCommunityJs.includes('markAnnouncementsRead') || !supportCommunityJs.includes('refreshSupportData') || !supportCommunityJs.includes('lastSeenAt') || !fs.readFileSync(path.join(ROOT,'functions/api/support/thanks.js'),'utf8').includes('PUBLIC_CONSENT_REQUIRED') || !supportUpdatesApiSource.includes('last_seen_at') || !supportUpdatesApiSource.includes('lastSeenAt')) throw new Error('FIX39: brakuje ochrony zgody lub zgodności lastSeenAt klienta z last_seen_at w API.');
  if (!/dlaczego\s+warto\s+wspierać\s+(?:Akademię|platformę)/i.test(indexHtml) || !/akademia-dlaczego-warto-wspierac\.mp4/i.test(indexHtml) || !/akademia-dlaczego-warto-wspierac\.vtt/i.test(indexHtml) || !indexHtml.includes('support-video-transcript') || !indexHtml.includes('fix9-clean-video') || /<track\b[^>]*\bdefault(?:\s|>)/i.test(indexHtml)) throw new Error('Film wsparcia FIX9 musi mieć odświeżony obraz, transkrypcję i napisy wyłączone domyślnie.');
  const supportVideoPath = path.join(WEB,'media/videos/akademia-dlaczego-warto-wspierac.mp4');
  const supportVideoStat = fs.existsSync(supportVideoPath) ? fs.statSync(supportVideoPath) : null;
  const supportVideoSha256 = supportVideoStat ? crypto.createHash('sha256').update(fs.readFileSync(supportVideoPath)).digest('hex') : '';
  const expectedSupportVideoSha256 = 'cdf3f63405b388bb040619ecf42127e644280a88b30d0d961fd8a8fc8c0c8b2a';
  if (!supportVideoStat || supportVideoStat.size < 1000000 || supportVideoSha256 !== expectedSupportVideoSha256) throw new Error(`FIX127: film wsparcia jest brakujący, za mały albo niezgodny z poprawionym renderem. Otrzymano ${supportVideoStat?.size || 0} B, SHA-256 ${supportVideoSha256 || 'brak'}; oczekiwano co najmniej 1000000 B i SHA-256 ${expectedSupportVideoSha256}. Zastosuj FIX127.`);
  for (const id of ['supportWhyTitle','supportImpact','supportImpactTitle','supportFaq']) if (!indexHtml.includes(`id=\"${id}\"`)) throw new Error(`Brak elementu strony wsparcia: ${id}.`);
  const supportVideo = fs.readFileSync(path.join(WEB,'media/videos/akademia-dlaczego-warto-wspierac.vtt'),'utf8');
  if (!supportVideo.includes('Każda wpłata jest dobrowolna') || !supportVideo.includes('Dziękujemy')) throw new Error('Napisy filmu wsparcia są niekompletne.');
  const { source: sw, cacheName: swCacheName } = readServiceWorkerContract(path.join(WEB,'service-worker.js'));
  verifyFix51Release(ROOT); // verifyFix50Release(ROOT) remains available for the immutable historical FIX50 snapshot.
  const hasSupportVideoInCore = sw.includes("'/media/videos/akademia-dlaczego-warto-wspierac.mp4'");
  const hasSupportPosterInCore = sw.includes("'/media/video_posters/akademia-wsparcie-poster.jpg'");
  const hasSupportCaptionsInCore = sw.includes("'/media/videos/akademia-dlaczego-warto-wspierac.vtt'");
  const hasSupportExpansionAssets = sw.includes('support-expansion-fix35.css') && sw.includes('support-enhancements-fix35.js');
  // FIX110: active cache contract. Historical compatibility token: swCacheName.includes('fix94-topic-verified-photo-20261107').
  const expectedServiceWorkerCache = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!sw.includes('/assets/academy-pro-modules-fix148.js?v=6.8.0-fix148') || !sw.includes('/assets/academy-pro-modules-fix148.css?v=6.8.0-fix148')) throw new Error('FIX148: nowe moduły nie są uwzględnione w pamięci offline PWA.');
  if (!sw.includes('/assets/academy-master-extension-fix149.js?v=6.8.0-fix149') || !sw.includes('/assets/academy-master-extension-fix149.css?v=6.8.0-fix149')) throw new Error('FIX149: rozszerzenie Akademii nie jest uwzględnione w pamięci offline PWA.');
  for (const asset of ['academy-practical-core-fix155.js?v=6.8.0-fix155','academy-practical-suite-fix155.js?v=6.8.0-fix155','academy-practical-suite-fix155.css?v=6.8.0-fix155']) if (!sw.includes(`/${asset}`)) throw new Error(`FIX155: brak zasobu Akademii Praktycznej w pamięci offline PWA: ${asset}.`);
  for (const asset of ['academy-master-curriculum-core-fix162.js?v=6.8.0-fix162','academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification','academy-master-curriculum-fix162.css?v=6.8.0-fix162']) if (!sw.includes(`/${asset}`)) throw new Error(`FIX162: brak zasobu Akademii Mistrza w pamięci offline PWA: ${asset}.`);
  if (!sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'") || !sw.includes("const PHOTO_CACHE_NAME = 'academy-photo-library-fix135'")) throw new Error('FIX175: nieprawidłowy cache PWA lub usunięty cache zdjęć FIX135.');
  const supportCoreMissing = [
    !hasSupportVideoInCore && 'film MP4',
    !hasSupportPosterInCore && 'plakat JPG',
    !hasSupportCaptionsInCore && 'napisy VTT',
    !hasSupportExpansionAssets && 'rozszerzenie wsparcia',
    !sw.includes('support-community-fix36.css') && 'CSS społeczności',
    !sw.includes('support-community-fix36.js') && 'JS społeczności',
    !sw.includes('master-control-fix47.js') && 'JS panelu',
    !sw.includes('master-control-fix47.css') && 'CSS panelu'
  ].filter(Boolean);
  if (swCacheName !== expectedServiceWorkerCache || !sw.includes('PHOTO_CACHE_NAME') || !sw.includes('isCuratedPhotoHost') || sw.includes('FIX123_LOCAL_IMAGE_FALLBACK') || sw.includes('sitewide-tech-visuals-fix123.js?v=6.8.0-fix123') || sw.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122') || supportCoreMissing.length) {
    const reasons = [...(swCacheName !== expectedServiceWorkerCache ? [`CACHE_NAME oczekiwany ${expectedServiceWorkerCache}, znaleziono ${swCacheName || 'brak'}`] : []), ...supportCoreMissing];
    throw new Error(`Service Worker PWA nie spełnia kontraktu zdjęć FIX129: ${reasons.join('; ')}. Publikacja zatrzymana przed migracjami.`);
  }
  const fix40RuntimePath = path.join(WEB,'assets','nauka-centrum-fix40.js');
  const fix40CssPath = path.join(WEB,'assets','nauka-centrum-fix40.css');
  const fix40Runtime = fs.readFileSync(fix40RuntimePath,'utf8');
  const fix40Css = fs.readFileSync(fix40CssPath,'utf8');
  for (const pane of ['dashboard','search','bench','exams','atlas','offline','reports']) if (!indexHtml.includes(`data-l40-pane="${pane}"`) || !fix40Runtime.includes(`'${pane}'`)) throw new Error(`FIX40: brak działającej sekcji Centrum Nauki ${pane}.`);
  for (const id of ['view-learnpro','l40ContinueCard','l40BookmarkList','l40SearchForm','l40BenchCase','l40ExamPicker','l40CertificateList','l40AtlasResults','l40BoardForm','l40ExportOfflineHtml','l40OfflineImport','l40ReportForm','l40ReportFromPractice','l40ReportHistory']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`FIX40: brak elementu interfejsu ${id}.`);
  for (const key of ['makeOfflinePackage','validateOfflinePackage','qrSvg','evaluateExam','cacheLibraryForOffline','fillReportFromLastPractice','runBenchCheck','ACADEMY_FREE_CHAT?.search','ACADEMY_OPEN_SOURCE','localStorage','educationalOnly']) if (!fix40Runtime.includes(key)) throw new Error(`FIX40: brak funkcji/ochrony ${key}.`);
  for (const id of ['l40CacheDocuments','l40OfflineDocsStatus']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`FIX40: brak kontrolki dokumentów offline ${id}.`);
  for (const selector of ['.l40-hero','.l40-tabs','.l40-pane','.l40-atlas-grid','.l40-report-form']) if (!fix40Css.includes(selector)) throw new Error(`FIX40: brak stylu ${selector}.`);
  if (!indexHtml.includes('assets/nauka-centrum-fix40.js?v=6.8.0-fix40') || !indexHtml.includes('assets/nauka-centrum-fix40.css?v=6.8.0-fix40') || !sw.includes('nauka-centrum-fix40.js') || !sw.includes('nauka-centrum-fix40.css') || !sw.includes("url.pathname.startsWith('/Biblioteka/')")) throw new Error('FIX40: zasoby FIX40 lub cache biblioteki offline nie są poprawnie skonfigurowane.');
  const fix40Test = path.join(ROOT,'scripts','test-nauka-centrum-fix40.mjs');
  if (!fs.existsSync(fix40Test)) throw new Error('FIX40: brak testu regresji scripts/test-nauka-centrum-fix40.mjs.');
  const fix41RuntimePath = path.join(WEB,'assets','akademia-serwisanta-fix41.js');
  const fix41CssPath = path.join(WEB,'assets','akademia-serwisanta-fix41.css');
  const fix41Test = path.join(ROOT,'scripts','test-akademia-serwisanta-fix41.mjs');
  if (!fs.existsSync(fix41RuntimePath) || !fs.existsSync(fix41CssPath) || !fs.existsSync(fix41Test)) throw new Error('FIX41: brak runtime, CSS lub testu regresji Akademii Serwisanta.');
  const fix41Runtime = fs.readFileSync(fix41RuntimePath,'utf8');
  const fix41Css = fs.readFileSync(fix41CssPath,'utf8');
  if (!indexHtml.includes('data-l40-pane=\"academy41\"') || !indexHtml.includes('data-l40-tab=\"academy41\"') || !indexHtml.includes('akademia-serwisanta-fix41.js?v=6.8.0-fix41') || !indexHtml.includes('akademia-serwisanta-fix41.css?v=6.8.0-fix41') || !sw.includes('akademia-serwisanta-fix41.js') || !sw.includes('akademia-serwisanta-fix41.css')) throw new Error('FIX41: HTML, cache PWA lub metadane nowego modułu nie są spójne.');
  for (const token of ['calculateAssembly','evaluateFault','evaluateMeasurement','evaluateChallenge','searchKnowledge','NP_NAUKA_FIX41']) if (!fix41Runtime.includes(token)) throw new Error(`FIX41: brak funkcji ${token}.`);
  for (const selector of ['.f41-overview-grid','.f41-launch-grid','.f41-form-grid','.f41-fault-layout']) if (!fix41Css.includes(selector)) throw new Error(`FIX41: brak CSS ${selector}.`);
  const fix42RuntimePath = path.join(WEB,'assets','real-workshop-fix42.js');
  const fix42CssPath = path.join(WEB,'assets','real-workshop-fix42.css');
  const fix42TestPath = path.join(ROOT,'scripts','test-real-workshop-fix42.mjs');
  if (!fs.existsSync(fix42RuntimePath) || !fs.existsSync(fix42CssPath) || !fs.existsSync(fix42TestPath)) throw new Error('FIX42: brak runtime, CSS lub testu regresji warsztatu.');
  const fix42Runtime = fs.readFileSync(fix42RuntimePath,'utf8');
  const fix42Css = fs.readFileSync(fix42CssPath,'utf8');
  if (!indexHtml.includes('data-l40-pane=\"workshop42\"') || !indexHtml.includes('data-l40-tab=\"workshop42\"') || !indexHtml.includes('real-workshop-fix42.js?v=6.8.0-fix42') || !indexHtml.includes('real-workshop-fix42.css?v=6.8.0-fix42') || !sw.includes('real-workshop-fix42.js') || !sw.includes('real-workshop-fix42.css')) throw new Error('FIX42: HTML, cache PWA lub metadane warsztatu nie są spójne.');
  for (const token of ['parseBoardview','evaluateInstrument','evaluateSupply','waveformPoints','diagnose','checkCompatibility','makeJob','NP_NAUKA_FIX42']) if (!fix42Runtime.includes(token)) throw new Error(`FIX42: brak funkcji ${token}.`);
  for (const selector of ['.f42-board-wrap','.f42-grid','.f42-form','.f42-result']) if (!fix42Css.includes(selector)) throw new Error(`FIX42: brak CSS ${selector}.`);
  const fix43RuntimePath = path.join(WEB,'assets','knowledge-suite-fix43.js');
  const fix43CssPath = path.join(WEB,'assets','knowledge-suite-fix43.css');
  if (!fs.existsSync(fix43RuntimePath) || !fs.existsSync(fix43CssPath) || !fs.existsSync(path.join(ROOT,'scripts','test-knowledge-suite-fix43.mjs')) || !fs.existsSync(path.join(ROOT,'scripts','test-site-feedback-fix43-runtime.mjs'))) throw new Error('FIX43: brak modułu, stylów lub testów.');
  const fix43Runtime = fs.readFileSync(fix43RuntimePath,'utf8');
  const fix43Css = fs.readFileSync(fix43CssPath,'utf8');
  if (!indexHtml.includes('id="view-fix43"') || !indexHtml.includes('id="view-feedback"') || !indexHtml.includes('data-view="fix43"') || !indexHtml.includes('data-view="feedback"') || !indexHtml.includes('knowledge-suite-fix43.js?v=6.8.0-fix43') || !indexHtml.includes('knowledge-suite-fix43.css?v=6.8.0-fix43') || !sw.includes('knowledge-suite-fix43.js') || !sw.includes('knowledge-suite-fix43.css')) throw new Error('FIX43: widoki, zasoby lub cache PWA nie są kompletne.');
  for (const token of ['diagnoseBoard','evaluateSequence','parseSerialLine','checkBuild','buildEncryptedBackup','restoreEncryptedBackup','view-feedback','f43FeedbackForm','/api/site-feedback']) if (!fix43Runtime.includes(token) && !indexHtml.includes(token)) throw new Error(`FIX43: brak funkcji ${token}.`);
  for (const selector of ['.f43-page-head','.f43-tabs','.f43-overview-grid','.f43-feedback-grid','.f43-stars']) if (!fix43Css.includes(selector)) throw new Error(`FIX43: brak stylu ${selector}.`);
  const fix44RuntimePath = path.join(WEB,'assets','master-service-center-fix44.js');
  const fix44CssPath = path.join(WEB,'assets','master-service-center-fix44.css');
  const fix44Runtime = fs.existsSync(fix44RuntimePath) ? fs.readFileSync(fix44RuntimePath,'utf8') : '';
  const fix44Css = fs.existsSync(fix44CssPath) ? fs.readFileSync(fix44CssPath,'utf8') : '';
  if (!fs.existsSync(fix44RuntimePath) || !fs.existsSync(fix44CssPath) || !indexHtml.includes('id="view-fix44"') || !indexHtml.includes('data-view="fix44"') || !indexHtml.includes('master-service-center-fix44.js?v=6.8.0-fix44') || !indexHtml.includes('master-service-center-fix44.css?v=6.8.0-fix44') || !sw.includes('master-service-center-fix44.js') || !sw.includes('master-service-center-fix44.css')) throw new Error('FIX44: brak Master Service Center lub zasobów PWA.');
  for (const token of ['Laptop Identification PRO','BIOS Database 360','Thermal Diagnostic PRO','CPU GPU Architecture Academy','Battery & Charging Lab','Data Recovery Academy','Network & Router Academy','3D Electronics Explorer','Repair Case Marketplace','Service Manager','AI Learning Coach','Quality Center','Repair Simulator WORLD','Universal Technical Library','Global Knowledge Update','NP_NAUKA_FIX44']) if (!fix44Runtime.toLowerCase().includes(token.toLowerCase()) && !indexHtml.toLowerCase().includes(token.toLowerCase())) throw new Error(`FIX44: brak funkcji ${token}.`);
  for (const selector of ['.f44-page-head','.f44-tabs','.f44-grid','.f44-board-wrap','.f44-qa-results']) if (!fix44Css.includes(selector)) throw new Error(`FIX44: brak stylu ${selector}.`);
  if (!fs.existsSync(path.join(ROOT,'scripts','test-master-service-center-fix44.mjs'))) throw new Error('FIX44: brak testu regresji.');
  if (!fs.existsSync(path.join(ROOT,'scripts','test-watcher-fix44-case-contract-fix46.mjs'))) throw new Error('FIX46: brak historycznego testu zgodności kontraktu FIX44.');
  const fix44Manifest = JSON.parse(fs.readFileSync(path.join(WEB,'assets','knowledge-updates-fix44.json'),'utf8'));
  if (!fix44Manifest.integrity || !Array.isArray(fix44Manifest.sources) || fix44Manifest.sources.length < 8) throw new Error('FIX44: brak integralnego indeksu źródeł.');
  const fix45RuntimePath = path.join(WEB,'assets','professional-service-fix45.js');
  const fix45CssPath = path.join(WEB,'assets','professional-service-fix45.css');
  const fix45Runtime = fs.existsSync(fix45RuntimePath) ? fs.readFileSync(fix45RuntimePath,'utf8') : '';
  const fix45Css = fs.existsSync(fix45CssPath) ? fs.readFileSync(fix45CssPath,'utf8') : '';
  if (!fs.existsSync(fix45RuntimePath) || !fs.existsSync(fix45CssPath) || !indexHtml.includes('id=\"view-fix45\"') || !indexHtml.includes('data-view=\"fix45\"') || !indexHtml.includes('professional-service-fix45.js?v=6.8.0-fix45') || !indexHtml.includes('professional-service-fix45.css?v=6.8.0-fix45') || !sw.includes('professional-service-fix45.js') || !sw.includes('professional-service-fix45.css') || !sw.includes('fix45-professional-service-20261104')) throw new Error('FIX45: brak widoku, zasobów lub cache PWA.');
  for (const token of ['browserInventory','parseHardwareId','evaluatePsuRails','evaluateQuality','diagnose','runSafeBenchmark','NP_NAUKA_FIX45']) if (!fix45Runtime.includes(token)) throw new Error(`FIX45: brak funkcji ${token}.`);
  for (const selector of ['.f45-page-head','.f45-tabs','.f45-grid','.f45-form','.f45-qa']) if (!fix45Css.includes(selector)) throw new Error(`FIX45: brak stylu ${selector}.`);
  const fix47RuntimePath = path.join(WEB,'assets','master-control-fix47.js');
  const fix47CssPath = path.join(WEB,'assets','master-control-fix47.css');
  const fix47Runtime = fs.existsSync(fix47RuntimePath) ? fs.readFileSync(fix47RuntimePath,'utf8') : '';
  const fix47Css = fs.existsSync(fix47CssPath) ? fs.readFileSync(fix47CssPath,'utf8') : '';
  if (!fs.existsSync(fix47RuntimePath) || !fs.existsSync(fix47CssPath) || !indexHtml.includes('id="view-fix47"') || !indexHtml.includes('data-view="fix47"') || !indexHtml.includes('master-control-fix47.js?v=6.8.0-fix47') || !indexHtml.includes('master-control-fix47.css?v=6.8.0-fix47') || !sw.includes('master-control-fix47.js') || !sw.includes('master-control-fix47.css') || swCacheName !== expectedServiceWorkerCache) throw new Error('FIX47: brak widoku Master Control Center, assetów lub aktualnego cache PWA.');
  for (const token of ['NP_NAUKA_FIX47','runStaticChecks','runAssetAudit','loadRemoteFeedback','updateFeedbackStatus','compatibility','mentorPlan','addOrder','completeProject','addCoursePlan','exportBackupObject']) if (!fix47Runtime.includes(token)) throw new Error(`FIX47: brak funkcji ${token}.`);
  for (const selector of ['.f47-page-head','.f47-tabs','.f47-grid','.f47-check-list','.f47-project-list']) if (!fix47Css.includes(selector)) throw new Error(`FIX47: brak CSS ${selector}.`);
  const migration17 = fs.readFileSync(path.join(ROOT,'migrations','0017_site_feedback_fix43.sql'),'utf8');
  if (!migration17.includes('CREATE TABLE IF NOT EXISTS academy_site_feedback') || /DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE\s+academy_users/i.test(migration17)) throw new Error('FIX43: migracja opinii musi być addytywna.');
  for (const route of ['site-feedback.js','admin/site-feedback.js']) if (!fs.existsSync(path.join(FUNCTIONS,'api',route))) throw new Error(`FIX43: brak API ${route}.`);
  const fix40TestSource = fs.readFileSync(fix40Test,'utf8');
  if (!fix40TestSource.includes('validateOfflinePackage') || !fix40TestSource.includes('qrSvg') || !fix40TestSource.includes('assert')) throw new Error('FIX40: test regresji nie kontroluje kluczowych modułów.');

  const practiceRuntimePath = path.join(WEB,'assets','practice-academy-fix27.js');
  const practiceCssPath = path.join(WEB,'assets','practice-academy-fix27.css');
  if (!fs.existsSync(practiceRuntimePath) || !fs.existsSync(practiceCssPath) || !indexHtml.includes('id=\"view-practicepro\"') || !indexHtml.includes('assets/practice-academy-fix27.js?v=6.8.0-fix28') || !indexHtml.includes('assets/practice-academy-fix27.css?v=6.8.0-fix28')) throw new Error('Brak kompletnego Centrum Praktyki FIX27.');
  const practiceRuntime = fs.readFileSync(practiceRuntimePath,'utf8');
  const practiceCss = fs.readFileSync(practiceCssPath,'utf8');
  for (const key of ['p27BoardParts','p27ChallengePicker','p27DocInput','p27BenchCalculate','p27MentorSend','p27AcademyGrid','p27ExamPicker','p27PortfolioExport','p27InstructorForm','p27KnowledgeSearch','indexedDB','DB_NAME']) if (!practiceRuntime.includes(key)) throw new Error(`Niekompletne Centrum Praktyki FIX27: ${key}.`);
  for (const key of ['.p27-hero','.p27-tabs','.p27-board-layout','.p27-case-grid','.p27-doc-layout','.p27-bench-layout','.p27-academy-grid','.p27-progress-map']) if (!practiceCss.includes(key)) throw new Error(`Brak stylu Centrum Praktyki FIX27: ${key}.`);
  for (const asset of ['practice-academy-fix27.js','practice-academy-fix27.css']) if (!sw.includes(asset)) throw new Error(`PWA FIX27 nie buforuje nowego modułu: ${asset}.`);
  for (const asset of ['support-expansion-fix35.css','support-enhancements-fix35.js','theme-521.css','theme-522.css','theme-523.css','theme-530.css','theme-600.css','ultra-cyber-530.js','ultimate-600.js','academy-ultimate-lessons-600.js','academy-ultra-lessons-3.js','theme-630.css','scroll-navigation-630.js','device-model-catalog.js','community-models.js','akademia-dlaczego-warto-wspierac.mp4','homepage-showcase-640.js','homepage-showcase-640.css','progress-backup-621.js','progress-backup-621.css','measurement-log-640.js','measurement-log-640.css','master-workshop-630.js','master-workshop-630.css','master-workshop-630-extension.js','master-workshop-630-extension.css','master-academy-640-pro.js','master-academy-640-pro.css','master-academy-650-ultimate.js','master-academy-650-ultimate.css']) if (!sw.includes(asset)) throw new Error(`Tryb offline nie buforuje: ${asset}.`);

  const u530Theme = fs.readFileSync(path.join(WEB,'assets','theme-530.css'),'utf8');
  const u530Runtime = fs.readFileSync(path.join(WEB,'assets','ultra-cyber-530.js'),'utf8');
  for (const id of ['u530CommandCenter','u530CommunityHub','u530AccountHub']) if (!indexHtml.includes(`id="${id}"`)) throw new Error(`Brak punktu montażowego ULTRA CYBER LAB: ${id}.`);
  for (const key of ['u530CommandCenter','u530CommunityHub','u530AccountHub','data-u530-part','u530Arrange','u530StepProgress']) if (!u530Runtime.includes(key)) throw new Error(`Brak interakcji ULTRA CYBER LAB: ${key}.`);
  for (const key of ['u530-board','u530-widget','body[data-skin="violet"]','body[data-skin="matrix"]','body[data-skin="arctic"]','body[data-skin="titanium"]']) if (!u530Theme.includes(key)) throw new Error(`Brak stylu ULTRA CYBER LAB: ${key}.`);
  if (!indexHtml.includes('assets/theme-530.css') || !indexHtml.includes('assets/ultra-cyber-530.js')) throw new Error('HTML nie ładuje zasobów ULTRA CYBER LAB 6.2.0.');

  const serviceCenter = fs.readFileSync(path.join(WEB,'assets','lab45-service-center.js'),'utf8');
  for (const key of ['powerScenarios','pdProfiles','recoveryPlans','esdItems','renderStock','renderMarks','renderAssignments','cloudSync','collectAll']) if (!serviceCenter.includes(key)) throw new Error(`Brak modułu laboratorium: ${key}.`);
  const appRuntime = fs.readFileSync(path.join(WEB,'assets','app.js'),'utf8');
  for (const key of ['ACADEMY_SHOW_VIEW','ACADEMY_OPEN_REPAIR',"$('#startDiagnosis')?.addEventListener","$('#sidebarClose')?.addEventListener",'quickRepairs']) if (!appRuntime.includes(key)) throw new Error(`Brak obsługi nawigacji: ${key}.`);
  if (!indexHtml.includes('id="openAllRepairs"') || !indexHtml.includes('id="sidebarClose"') || !indexHtml.includes('data-open-repair')) throw new Error('Niekompletna nawigacja procedur.');
  const diagnosticCards = (indexHtml.match(/data-diagnostic-course=/g) || []).length;
  if (diagnosticCards < 12) throw new Error(`Katalog diagnostyczny zawiera tylko ${diagnosticCards}/12 kart.`);

  const chatApiPath = path.join(FUNCTIONS,'api','chat.js');
  const chatApi = fs.readFileSync(chatApiPath,'utf8');
  // The runtime intentionally uses env?.GEMINI_API_KEY; accept both optional and direct property access.
  const chatApiReadsGeminiKey = /\benv\s*(?:\?\.|\.)\s*GEMINI_API_KEY\b/.test(chatApi);
  const geminiPublisherGuardFix166 = releaseJson.academyGeminiPublisherGuardFix166 || {};
  if (!chatApi.includes('generativelanguage.googleapis.com/v1/interactions') || !chatApiReadsGeminiKey || !chatApi.includes('topicRestricted') || chatApi.includes('api.openai.com/v1/responses') || chatApi.includes('env.AI.run') || chatApi.includes('Api-Revision')) throw new Error('FIX166: czat musi używać Gemini Interactions API v1, odczytywać GEMINI_API_KEY (także przez optional chaining) i blokować dostawcę zapasowego.');
  if (geminiPublisherGuardFix166.hotfix !== 'FIX166' || geminiPublisherGuardFix166.publisherOnly !== true || geminiPublisherGuardFix166.websiteRuntimeHotfix !== 'FIX165' || geminiPublisherGuardFix166.serviceWorkerCacheChanged !== false || geminiPublisherGuardFix166.newD1Database !== false || geminiPublisherGuardFix166.newD1Tables !== false || geminiPublisherGuardFix166.d1SchemaMigrations !== false) throw new Error('FIX166: metadane poprawki strażnika publikacji są nieprawidłowe.');
  const geminiMetaFix165 = releaseJson.academyGeminiChatFix165 || {};
  if (geminiMetaFix165.hotfix !== 'FIX165' || geminiMetaFix165.providerFallback !== false || geminiMetaFix165.newD1Database !== false || geminiMetaFix165.d1SchemaMigrations !== false || !String(geminiMetaFix165.keyValidation || '').includes('GET /v1beta/models/gemini-3.8-flash') || !String(geminiMetaFix165.chatEndpoint || '').includes('/v1/interactions')) throw new Error('FIX165: metadane integracji Gemini i zakresu istniejącego D1 są nieprawidłowe.');
  if (!fs.existsSync(path.join(ROOT,'scripts','configure-gemini-secret.js')) || !fs.existsSync(path.join(ROOT,'scripts','configure-gemini-secret.ps1')) || !fs.existsSync(path.join(ROOT,'scripts','test-gemini-fast-key-check-fix165.mjs'))) throw new Error('FIX165: brak konfiguratora Gemini CMD albo testu szybkiej walidacji.');
  const geminiSetupCmdPath = path.join(ROOT,'USTAW_KLUCZ_GEMINI.cmd');
  const geminiSetupPsPath = path.join(ROOT,'scripts','configure-gemini-secret.ps1');
  const geminiSetupCmd = fs.existsSync(geminiSetupCmdPath) ? fs.readFileSync(geminiSetupCmdPath,'utf8') : '';
  const geminiSetupPs = fs.existsSync(geminiSetupPsPath) ? fs.readFileSync(geminiSetupPsPath,'utf8') : '';
  const geminiCmdOnlyMeta = releaseJson.academyGeminiCmdOnlyGuardFix167 || {};
  if (!geminiSetupCmd.includes('configure-gemini-secret.ps1')
      || !geminiSetupCmd.includes('powershell.exe')
      || !geminiSetupPs.includes('Read-Host -Prompt')
      || !geminiSetupPs.includes('-AsSecureString')
      || !geminiSetupPs.includes('--stdin-secret')
      || !geminiSetupPs.includes('StandardInput.WriteLine($PlainValue)')
      || !fs.existsSync(path.join(ROOT,'scripts','configure-gemini-secret.js'))
      || geminiCmdOnlyMeta.hotfix !== 'FIX167'
      || geminiCmdOnlyMeta.keyEntry !== 'CMD only via PowerShell Read-Host -AsSecureString'
      || geminiCmdOnlyMeta.websiteKeyInput !== false
      || geminiCmdOnlyMeta.keyFileStorage !== false
      || geminiCmdOnlyMeta.publisherOnly !== true
      || geminiCmdOnlyMeta.serviceWorkerCacheChanged !== false
      || geminiCmdOnlyMeta.newD1Database !== false
      || geminiCmdOnlyMeta.d1SchemaMigrations !== false) {
    throw new Error('FIX167: konfiguracja klucza musi działać wyłącznie w CMD przez ukryte Read-Host -AsSecureString i stdin; strona WWW nie może wymagać pola klucza.');
  }

  const fix175Meta = releaseJson.academyProfessionalRepairFix175 || {};
  const fix175RuntimePath = path.join(WEB,'assets','academy-professional-repair-fix175.js');
  const fix175CssPath = path.join(WEB,'assets','academy-professional-repair-fix175.css');
  if (!fs.existsSync(fix175RuntimePath) || !fs.existsSync(fix175CssPath)) throw new Error('FIX175: brak pakietu laboratoriów i stylów.');
  const fix175Runtime = fs.readFileSync(fix175RuntimePath,'utf8');
  const fix175Css = fs.readFileSync(fix175CssPath,'utf8');
  for (const token of ['a168ProfessionalSuite','a168WinCheck','a168LapStep','a168RecoveryCheck','a168DriverLookup','a168PowerCheck','a168IntakeForm','a168FinalEvaluate','a168MasterStart','a168FaultGenerate','a168CodeSearch','a168CostCalc','a168JournalForm','a168ProfileSave']) if (!indexHtml.includes(token)) throw new Error(`FIX175: brak panelu/sterowania ${token}.`);
  for (const token of ['windowsScenarios','laptopTasks','recoveryCases','driverVendors','powerScenarios','finalProfiles','masterCases','estimateCost','lookupHardwareId','searchCodes','pickFault','evaluateMaster','localStorage']) if (!fix175Runtime.includes(token)) throw new Error(`FIX175: brak logiki modułu ${token}.`);
  for (const tab of ['windows','laptop','recovery','drivers','power','intake','final','master','fault','codes','cost','journal','ranking']) if (!indexHtml.includes(`data-a168-tab="${tab}"`) || !indexHtml.includes(`data-a168-panel="${tab}"`)) throw new Error(`FIX175: brak zakładki lub panelu ${tab}.`);
  if (fix175Meta.hotfix !== 'FIX175' || fix175Meta.productVersion !== '6.8.0' || fix175Meta.modules?.length !== 8 || fix175Meta.sharedTools?.length !== 5 || fix175Meta.newViews !== 0 || fix175Meta.newD1Database !== false || fix175Meta.newD1Tables !== false || fix175Meta.d1SchemaMigrations !== false || fix175Meta.hardwareAccess !== false || fix175Meta.simulatedTraining !== true) throw new Error('FIX175: metadane zakresu laboratoriów, bezpieczeństwa lub istniejącej bazy są nieprawidłowe.');
  if (!indexHtml.includes('class="a168-home-launch"') || !indexHtml.includes('class="nav-item a168-nav-item"') || !indexHtml.includes('data-a168-launch="master"') || !indexHtml.includes('a168-home-command-card') || !indexHtml.includes('var a168Launch = target.closest')) throw new Error('FIX175: brak bezpośredniego uruchamiania laboratoriów z pulpitu/menu.');
  for (const asset of ['academy-professional-repair-fix175.js?v=6.8.0-fix175','academy-professional-repair-fix175.css?v=6.8.0-fix175']) if (!indexHtml.includes(asset) || !sw.includes(asset.split('?')[0])) throw new Error(`FIX175: asset nie jest podłączony do HTML i PWA: ${asset}.`);
  const fix181Assets = ['academy-deployment-migration-refurb-fix181.js?v=6.8.0-fix181','academy-deployment-migration-refurb-fix181.css?v=6.8.0-fix181'];
  for (const asset of fix181Assets) if (!indexHtml.includes(asset) || !sw.includes(asset.split('?')[0]) || !fs.existsSync(path.join(WEB,'assets',asset.split('?')[0]))) throw new Error(`FIX181: asset nie jest podłączony do HTML/PWA lub brakuje pliku: ${asset}.`);
  if (!indexHtml.includes('data-a168-tab="deploy"') || !indexHtml.includes('id="a181DeploymentMigration"')) throw new Error('FIX181: nowy panel wdrażania/migracji/odnowy nie jest wpięty do istniejącej Akademii.');
  const fix182Meta = releaseJson.academySpecialistSystemsFix182 || {};
  const fix182Assets = ['academy-specialist-systems-fix182.js?v=6.8.0-fix182','academy-specialist-systems-fix182.css?v=6.8.0-fix182'];
  for (const asset of fix182Assets) if (!indexHtml.includes(asset) || !sw.includes(asset.split('?')[0]) || !fs.existsSync(path.join(WEB,'assets',asset.split('?')[0]))) throw new Error(`FIX182: asset nie jest podłączony do HTML/PWA lub brakuje pliku: ${asset}.`);
  if (!indexHtml.includes('data-a168-tab="specialist"') || !indexHtml.includes('data-a168-panel="specialist"') || !indexHtml.includes('id="a182SpecialistSystems"') || !indexHtml.includes('a182RedfishLoad')) throw new Error('FIX182: panel specjalizacji nie jest wpięty do istniejącej Akademii.');
  if (fix182Meta.hotfix !== 'FIX182' || fix182Meta.productVersion !== '6.8.0' || fix182Meta.lessons !== 20 || fix182Meta.quizQuestions !== 60 || fix182Meta.cases !== 17 || fix182Meta.projects !== 10 || fix182Meta.glossaryTerms !== 40 || fix182Meta.examQuestions !== 16 || fix182Meta.newViews !== 0 || fix182Meta.newD1Database !== false || fix182Meta.d1SchemaMigrations !== false || fix182Meta.hardwareAccess !== false || fix182Meta.networkAccess !== false || fix182Meta.localStorageOnly !== true) throw new Error('FIX182: metadane, zakres bezpieczeństwa lub kompatybilność istniejącej bazy są nieprawidłowe.');
  if ((indexHtml.match(/data-a168-tab="[a-z]+"/g)||[]).length !== 20) throw new Error('FIX182–FIX185: oczekiwano 20 zakładek rozszerzonej Akademii.');
  const fix183Meta = releaseJson.academyAdvancedServiceLabFix183 || {};
  const fix183Assets = ['academy-advanced-service-lab-fix183.js?v=6.8.0-fix183','academy-advanced-service-lab-fix183.css?v=6.8.0-fix183'];
  for (const asset of fix183Assets) if (!indexHtml.includes(asset) || !sw.includes(asset.split('?')[0]) || !fs.existsSync(path.join(WEB,'assets',asset.split('?')[0]))) throw new Error(`FIX183: asset nie jest podłączony do HTML/PWA lub brakuje pliku: ${asset}.`);
  if (!indexHtml.includes('data-a168-tab="serviceexpert"') || !indexHtml.includes('data-a168-panel="serviceexpert"') || !indexHtml.includes('id="a183AdvancedServiceLab"') || !indexHtml.includes('id="a183UpsCalc"') || !indexHtml.includes('id="a183RecoveryEstimate"')) throw new Error('FIX183: panel specjalizacji, symulatory lub nawigacja nie są wpięte do istniejącej Akademii.');
  if (fix183Meta.hotfix !== 'FIX183' || fix183Meta.productVersion !== '6.8.0' || fix183Meta.lessons !== 20 || fix183Meta.quizQuestions !== 60 || fix183Meta.cases !== 15 || fix183Meta.projects !== 10 || fix183Meta.glossaryTerms !== 40 || fix183Meta.examQuestions !== 16 || fix183Meta.newViews !== 0 || fix183Meta.expectedExistingViews !== 35 || fix183Meta.expectedExistingAcademyTabs !== 18 || fix183Meta.newD1Database !== false || fix183Meta.newD1Tables !== false || fix183Meta.d1SchemaMigrations !== false || fix183Meta.hardwareAccess !== false || fix183Meta.networkAccess !== false || fix183Meta.localStorageOnly !== true) throw new Error('FIX183: metadane, bezpieczeństwo albo zgodność istniejącej bazy są nieprawidłowe.');
  if ((indexHtml.match(/data-a168-tab="[a-z]+"/g)||[]).length !== 20) throw new Error('FIX184–FIX185: oczekiwano 20 zakładek istniejącej Akademii.');

  if (!fix175Css.includes('.a168-home-launch') || !fix175Css.includes('.a168-nav-item') || !fix175Css.includes('scroll-margin-top')) throw new Error('FIX175: brakuje stylów widocznego wejścia i przewijania do Akademii.');
  const fix184Meta = releaseJson.academyExpertDiagnosticsFix184 || {};
  const fix184Assets = ['academy-expert-diagnostics-fix184.js?v=6.8.0-fix184','academy-expert-diagnostics-fix184.css?v=6.8.0-fix184'];
  for (const asset of fix184Assets) if (!indexHtml.includes(asset) || !sw.includes(asset.split('?')[0]) || !fs.existsSync(path.join(WEB,'assets',asset.split('?')[0]))) throw new Error(`FIX184: asset nie jest podłączony do HTML/PWA lub brakuje pliku: ${asset}.`);
  const fix184Html = indexHtml.includes('data-a168-tab="expertdiag"') && indexHtml.includes('data-a168-panel="expertdiag"') && indexHtml.includes('id="a184ExpertDiagnostics"') && indexHtml.includes('id="a184SignalCalc"') && indexHtml.includes('id="a184PsBuild"');
  const fix184Pwa = sw.includes('academy-expert-diagnostics-fix184.js?v=6.8.0-fix184') && sw.includes('academy-expert-diagnostics-fix184.css?v=6.8.0-fix184') && swCacheName === 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115';
  if (!fix184Html || !fix184Pwa || fix184Meta.hotfix !== 'FIX184' || fix184Meta.productVersion !== '6.8.0' || fix184Meta.lessons !== 20 || fix184Meta.quizQuestions !== 60 || fix184Meta.cases !== 15 || fix184Meta.projects !== 10 || fix184Meta.glossaryTerms !== 40 || fix184Meta.examQuestions !== 20 || fix184Meta.newViews !== 0 || fix184Meta.expectedExistingViews !== 35 || fix184Meta.expectedExistingAcademyTabs !== 19 || fix184Meta.newD1Database !== false || fix184Meta.newD1Tables !== false || fix184Meta.d1SchemaMigrations !== false || fix184Meta.hardwareAccess !== false || fix184Meta.networkAccess !== false || fix184Meta.commandsExecuted !== false || fix184Meta.localStorageOnly !== true) throw new Error('FIX184: panel, pliki, PWA lub bezpieczne metadane nie przechodzą kontroli; publikacja zablokowana.');
  if ((indexHtml.match(/data-a168-tab="[a-z]+"/g)||[]).length !== 20) throw new Error('FIX184–FIX185: oczekiwano 20 zakładek istniejącej Akademii.');
  const fix185Meta = releaseJson.academyPerformanceFirmwareFix185 || {};
  const fix185RuntimePath = path.join(WEB, 'assets', 'academy-performance-firmware-fix185.js');
  const fix185CssPath = path.join(WEB, 'assets', 'academy-performance-firmware-fix185.css');
  const fix185Assets = ['academy-performance-firmware-fix185.js?v=6.8.0-fix185','academy-performance-firmware-fix185.css?v=6.8.0-fix185'];
  const fix185HtmlValid = fix185Assets.every(x=>indexHtml.includes(x)) && indexHtml.includes('data-a168-tab="perfdiag"') && indexHtml.includes('data-a168-panel="perfdiag"') && indexHtml.includes('id="a185ExpertPerformance"') && (indexHtml.match(/data-a168-tab="[a-z]+"/g)||[]).length===20;
  const fix185PwaValid = fix185Assets.every(x=>serviceWorkerVisualSource.includes(x)) && serviceWorkerVisualSource.includes('academy-performance-firmware-fix185.js') && serviceWorkerVisualSource.includes('academy-performance-firmware-fix185.css');
  if (!fs.existsSync(fix185RuntimePath) || !fs.existsSync(fix185CssPath) || !fix185HtmlValid || !fix185PwaValid || fix185Meta.hotfix!=='FIX185' || fix185Meta.productVersion!=='6.8.0' || fix185Meta.lessons!==20 || fix185Meta.quizQuestions!==60 || fix185Meta.cases!==15 || fix185Meta.projects!==10 || fix185Meta.glossaryTerms!==40 || fix185Meta.examQuestions!==20 || fix185Meta.tools!==8 || fix185Meta.expectedExistingAcademyTabs!==20 || fix185Meta.expectedExistingViews!==35 || fix185Meta.newViews!==0 || fix185Meta.newD1Database!==false || fix185Meta.newD1Tables!==false || fix185Meta.d1SchemaMigrations!==false || fix185Meta.hardwareAccess!==false || fix185Meta.networkAccess!==false || fix185Meta.commandsExecuted!==false || fix185Meta.firmwareWrite!==false || fix185Meta.localStorageOnly!==true) throw new Error('FIX185: panel, pliki PWA, metadane lub zasady bezpiecznej aktualizacji są niekompletne; publikacja zablokowana.');
  const fix186Meta = releaseJson.academyPracticalLabFix186 || {};
  const fix186RuntimePath = path.join(WEB,'assets','academy-practical-lab-fix186.js');
  const fix186CssPath = path.join(WEB,'assets','academy-practical-lab-fix186.css');
  const fix186Assets = ['academy-practical-lab-fix186.js?v=6.8.0-fix186','academy-practical-lab-fix186.css?v=6.8.0-fix186'];
  const fix186HtmlValid = fix186Assets.every(x=>indexHtml.includes(x)) && indexHtml.includes('id="a186PracticalLab"') && indexHtml.includes('data-a168-tab="perfdiag"') && indexHtml.includes('data-a168-panel="perfdiag"') && (indexHtml.match(/data-a168-tab="[a-z]+"/g)||[]).length===20 && (indexHtml.match(/id="view-[^"]+"/g)||[]).length===35;
  const fix186PwaValid = fix186Assets.every(x=>serviceWorkerVisualSource.includes(x.split('?')[0]));
  const fix186Runtime = fs.existsSync(fix186RuntimePath) ? fs.readFileSync(fix186RuntimePath,'utf8') : '';
  const fix186Required = ['normalizeImportedFile','analyzeEvents','safeGeneratedCase','ACADEMY_FIX186_TOOLS','/api/chat','/api/academy/fix186/pcb-analysis','a186PcbAiConsent','a186PcbAiAnalyze','a186PracticalExam','automaticElectricalDiagnosis:false'];
  const fix186Scripts = ['scripts/run-tests-fix186.mjs','scripts/test-fix186-practical-lab.mjs','scripts/test-fix186-pcb-analysis-api.mjs','scripts/test-fix194-three-oauth-providers.mjs'];
  const fix186PcbApiPath = path.join(ROOT,'functions','api','academy','fix186','pcb-analysis.js');
  const fix186PcbApi = fs.existsSync(fix186PcbApiPath) ? fs.readFileSync(fix186PcbApiPath,'utf8') : '';
  const fix186PcbApiValid = ['IMAGE_CONSENT_REQUIRED','imageStored: false','sameOrigin(request)','MAX_IMAGE_BASE64'].every(x=>fix186PcbApi.includes(x));
  const fix186Tools = fs.existsSync(path.join(ROOT,'tools','FIX186_COLLECTOR.ps1')) && fs.existsSync(path.join(ROOT,'WYKONAJ_LABORATORIUM_FIX186.cmd')) && fix186PcbApiValid;
  if (!fs.existsSync(fix186RuntimePath) || !fs.existsSync(fix186CssPath) || !fix186HtmlValid || !fix186PwaValid || !fix186Tools || fix186Scripts.some(x=>!fs.existsSync(path.join(ROOT,x))) || !fix186Required.every(x=>fix186Runtime.includes(x)) || fix186Meta.hotfix!=='FIX186' || fix186Meta.productVersion!=='6.8.0' || fix186Meta.expectedExistingAcademyTabs!==20 || fix186Meta.expectedExistingViews!==35 || fix186Meta.newMainTabs!==0 || fix186Meta.newViews!==0 || fix186Meta.newD1Database!==false || fix186Meta.newD1Tables!==false || fix186Meta.d1SchemaMigrations!==false || fix186Meta.rawLogsUploadedToServer!==false || fix186Meta.rawLogsStoredInLocalStorage!==false || fix186Meta.firmwareWrite!==false || fix186Meta.diskWrite!==false || fix186Meta.remoteHardwareControl!==false || fix186Meta.uefiCapsulePayloadSignatureVerifiedByGenericTool!==false || fix186Meta.pcbAiEndpoint!=='/api/academy/fix186/pcb-analysis' || fix186Meta.pcbAiRequiresExplicitConsent!==true || fix186Meta.pcbImagesStored!==false || fix186Meta.pcbAutomaticElectricalDiagnosis!==false || fix186Meta.productionPublished!==false ) throw new Error('FIX186: brak rzeczywistego panelu, narzędzi, testów, PWA lub metadanych bezpieczeństwa; publikacja zablokowana.');
  log('FIX186: laboratorium importu WPR/EVTX, Gemini, PCB, firmware i egzaminu praktycznego jest lokalnie podłączone do istniejącej zakładki; 20 zakładek / 35 widoków bez zmian.');

  // FIX198–FIX202: wymagaj nowego kolektora Windows, geometrii 3D, Hyper-V, analityki nauczyciela i synchronizacji wszystkich dozwolonych stanów.
  const fix202Meta = releaseJson.academyFullStateSyncFix202 || {};
  const fix199Meta = releaseJson.academyTrue3dWorkshopFix199 || {};
  const fix200Meta = releaseJson.academyHyperVSandboxFix200 || {};
  const fix201Meta = releaseJson.academyTeacherDashboardFix201 || {};
  const fix198Meta = releaseJson.academyHardwareSnapshotFix198 || {};
  const fix202StateApi = fs.readFileSync(path.join(ROOT,'functions','api','state.js'),'utf8');
  const fix202AssetPaths = ['assets/academy-workshop-3d-fix199.js','assets/academy-workshop-3d-fix199.css','assets/academy-hardware-import-fix198.js','assets/academy-hardware-import-fix198.css','assets/academy-teacher-dashboard-fix201.css','assets/cloud-academy.js'];
  const fix202AssetAudit = verifyHtmlAssetsInServiceWorker({ html: indexHtml, serviceWorker: sw, webRoot: WEB, assets: fix202AssetPaths });
  const fix202AssetsValid = fix202AssetAudit.ok;
  const fix202Files = ['tools/FIX198_WINDOWS_HARDWARE_COLLECTOR.ps1','WYKONAJ_DIAGNOSTYKE_SPRZETU_FIX198.cmd','tools/FIX200_CREATE_ISOLATED_HYPERV_VM.ps1','tools/FIX200_START_ISOLATED_HYPERV_VM.ps1','tools/FIX200_REMOVE_ISOLATED_HYPERV_VM.ps1','scripts/run-tests-fix202.mjs','scripts/test-fix202-publisher-guard.mjs','TESTY_FIX198_FIX202.cmd','scripts/test-fix198-windows-hardware.mjs','scripts/test-fix199-real-3d-workshop.mjs','scripts/test-fix200-hyperv-sandbox.mjs','scripts/test-fix201-teacher-dashboard.mjs','scripts/test-fix202-full-state-sync.mjs','scripts/fix230-pwa-asset-guard.cjs','WEB_PUBLISH/assets/academy-hardware-import-fix198.js','WEB_PUBLISH/assets/academy-hardware-import-fix198.css','WEB_PUBLISH/assets/academy-workshop-3d-fix199.js','WEB_PUBLISH/assets/academy-workshop-3d-fix199.css','WEB_PUBLISH/assets/academy-teacher-dashboard-fix201.css'];
  const fix202SyncKeys = ['academyCompletedLessons','academyGuideSteps','academyChecklist','academyBookmarks','academyLanguage','academyLab45ESD','academyLab45Stock','academyLab45Inspector','academyLab45Assignments','academyLab45PowerDone','academyLab45Recovery','academyLabTraining','academyLabModels','academyLabExamLast','academyLabLastTriage','nauka.academy.fix162.v1'];
  const fix202Missing = fix202Files.filter(file=>!fs.existsSync(path.join(ROOT,file))).map(file=>`plik ${file}`);
  if (!fix202AssetsValid) fix202Missing.push(...fix202AssetAudit.errors);
  if (!indexHtml.includes('id="a162TeacherDashboard"')) fix202Missing.push('panel nauczyciela a162TeacherDashboard');
  if (!indexHtml.includes('id="f197BoardCanvas"')) fix202Missing.push('model 3D f197BoardCanvas');
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
  const fix203RuntimeValid = fix203Api.includes('academy_classroom_member') && fix203Api.includes('academy_classroom_attendance') && fix203Api.includes("action === 'join'") && fix203Api.includes("action === 'attendance'") && indexHtml.includes('id="a162AttendanceDate"');
  const fix204RuntimeValid = fix204Api.includes('academy_user_state_chunks') && fix204Api.includes('MAX_STATE_CHARS') && fix204Api.includes('STATE_CHUNKS_INVALID') && fs.readFileSync(path.join(WEB,'assets','cloud-academy.js'),'utf8').includes('raw.length>360000');
  const fix205RuntimeValid = fix205Runtime.includes('NaukaFix205AssessHardware') && fix205Runtime.includes('WHEA') && fix205Runtime.includes('SMART');
  const fix206RuntimeValid = fix206Runtime.includes("getContext('webgl2'") && fix206Runtime.includes('gl.compileShader') && fix206Runtime.includes('gl.drawArrays') && fix206Runtime.includes('createScene');
  const fix207RuntimeValid = fs.readFileSync(path.join(ROOT,'tools','FIX207_VERIFY_HYPERV_ISOLATION.ps1'),'utf8').includes('NO_GUEST_INTEGRATION_SERVICES') && fs.readFileSync(path.join(ROOT,'tools','FIX207_STATIC_FILE_TRIAGE.ps1'),'utf8').includes('executionPerformed=$false');
  const fix208RuntimeValid = fix208Api.includes("action==='start'") && fix208Api.includes("action==='submit'") && fix208Api.includes('EXAM_ACTION_INVALID') && fix208Api.includes('question_payload');
  const fix209RuntimeValid = fix209Api.includes('checkAdmin(request,env)') && fix209Api.includes('secretsReturned:false') && indexHtml.includes('id="a209RunHealth"') && indexHtml.includes('id="a209HealthOutput"');
  const fix203AssetAudit = verifyHtmlAssetsInServiceWorker({ html: indexHtml, serviceWorker: sw, webRoot: WEB, assets: fix203AssetPaths });
  const fix203PwaValid = fix203AssetAudit.ok;
  const fix203CoreMissing = fix203Files.some(file=>!fs.existsSync(path.join(ROOT,file))) || !fix203PwaValid || !fix203RuntimeValid || !fix204RuntimeValid || !fix205RuntimeValid || !fix206RuntimeValid || !fix207RuntimeValid || !fix208RuntimeValid || !fix209RuntimeValid || fix203Meta.hotfix!=='FIX203' || fix204Meta.maximumStateJsonCharacters!==360000 || fix205Meta.automatedVerdict!==false || fix206Meta.renderer!=='WebGL 2 / WebGL 1 with Canvas 2D fallback' || fix207Meta.staticFileExecution!==false || fix208Meta.serverSideGrading!==true || fix209Meta.adminTokenStored!==false;
  if (fix203CoreMissing) {
    const fix203PwaDetails = fix203PwaValid ? '' : ' Niezgodność HTML/PWA: ' + fix203AssetAudit.errors.join('; ') + '.';
    throw new Error('FIX203–FIX209: brakuje integracji klas, porcji D1, diagnostyki, WebGL, audytu Hyper-V, egzaminu serwerowego lub panelu administratora; publikacja zablokowana.' + fix203PwaDetails);
  }
  log('FIX203–FIX209: członkostwo i obecności klas, synchronizacja porcji do 360 KB, sygnały diagnostyczne, renderer WebGL, audyt izolacji Hyper-V, ocena egzaminu po stronie serwera i kontrola administratora są podłączone. Testy Windows/Hyper-V wymagają uruchomienia w Windows; produkcyjne OAuth/Cloudflare wymagają odrębnej weryfikacji.');


  // FIX210–FIX218: kopia D1, historia bezpieczeństwa, ogłoszenia, kolejka offline, diagnostyka Windows, audyt Hyper-V, bank egzaminów i agregaty admina.
  const fix210Files=['tools/FIX210_BACKUP_D1_BEFORE_MIGRATION.ps1','BACKUP_D1_FIX210.cmd','migrations/0020_account_security_events_fix211.sql','functions/api/auth/security-events.js','tools/FIX215_WINDOWS_DEEP_DIAGNOSTIC.ps1','DIAGNOSTYKA_WINDOWS_FIX215.cmd','tools/FIX216_HYPERV_SECURITY_AUDIT.ps1','AUDYT_HYPERV_FIX216.cmd','CHANGELOG_6.8.0_FIX210_218.txt','FIX210_218_IMPLEMENTATION_AUDIT.txt','scripts/fix210-release-preflight.mjs','scripts/run-tests-fix210-218.mjs','scripts/test-fix210-218-implementation.mjs','scripts/test-fix210-218-publisher-guard.mjs','TESTY_FIX210_FIX218.cmd','README_FIX210_D1_BACKUP.md','README_FIX211_ACCOUNT_SECURITY.md','README_FIX212_CLASSROOM.md','README_FIX213_OFFLINE_QUEUE.md','README_FIX214_HARDWARE_SENSORS.md','README_FIX215_WINDOWS_DIAGNOSTICS.md','README_FIX216_HYPERV_AUDIT.md','README_FIX217_EXAM_BANK.md','README_FIX218_ADMIN_ANALYTICS.md','functions/api/auth/email/verify.js','functions/api/auth/password/reset.js','WEB_PUBLISH/assets/academy-platform-fix210-218.js','WEB_PUBLISH/assets/academy-platform-fix210-218.css'];
  const fix210Css='academy-platform-fix210-218.css?v=6.8.0-fix218',fix210Js='academy-platform-fix210-218.js?v=6.8.0-fix228';
  const fix217Api=fs.readFileSync(path.join(ROOT,'functions','api','certificates.js'),'utf8');
  const fix212Api=fs.readFileSync(path.join(ROOT,'functions','api','classroom.js'),'utf8');
  const fix218Api=fs.readFileSync(path.join(ROOT,'functions','api','admin','health.js'),'utf8');
  const fix210Meta=releaseJson.academyFix210||{},fix218Meta=releaseJson.academyFix218||{};
  const fix217FinalQuestionPresent = /\bid\s*:\s*['"]pc-050['"]/.test(fix217Api); // FIX219: accept valid JS formatting with or without whitespace.
  const fix210Missing=[];
  for (const file of fix210Files) if (!fs.existsSync(path.join(ROOT,file))) fix210Missing.push(`plik ${file}`);
  if(!indexHtml.includes(fix210Css)) fix210Missing.push('CSS FIX210–FIX218 w HTML');
  if(!indexHtml.includes(fix210Js)) fix210Missing.push('JS FIX210–FIX218 w HTML');
  if(!sw.includes(fix210Css)) fix210Missing.push('CSS FIX210–FIX218 w PWA');
  if(!sw.includes(fix210Js)) fix210Missing.push('JS FIX210–FIX218 w PWA');
  if(!fix212Api.includes('academy_classroom_announcement')) fix210Missing.push('API ogłoszeń klasowych');
  if(!fix217FinalQuestionPresent) fix210Missing.push('końcowe pytanie pc-050 w banku egzaminacyjnym');
  if(!fix218Api.includes('personalDataReturned:false')) fix210Missing.push('ochrona danych panelu administratora');
  if(fix210Meta.hotfix!=='FIX210') fix210Missing.push('metadane FIX210');
  if(fix218Meta.hotfix!=='FIX218') fix210Missing.push('metadane FIX218');
  if(fix210Missing.length) throw new Error(`FIX210–FIX218: publikacja zablokowana. Brakujące elementy: ${fix210Missing.join('; ')}.`);
  log('FIX210–FIX218: pliki, migracja bezpieczeństwa, ogłoszenia, egzamin serwerowy, analityka i zasoby PWA potwierdzone. Przed produkcją wymagane: export D1, migracja 0020 oraz testy rzeczywistego Cloudflare/Windows/Hyper-V.');
  const fix219Required=['scripts/test-fix219-publisher-preflight.mjs','scripts/run-tests-fix219.mjs','TESTY_FIX219.cmd','README_FIX219_PUBLISHER_GUARD.md','CHANGELOG_6.8.0_FIX219.txt'];
  const fix219Missing=fix219Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  if(fix219Missing.length || !releaseJson.academyFix219 || releaseJson.academyFix219.hotfix!=='FIX219') throw new Error(`FIX219: niekompletna poprawka strażnika publikacji. Braki: ${fix219Missing.join('; ') || 'metadane FIX219'}.`);

  // FIX220–FIX228: wymagaj kompletnego pakietu, migracji, testów i lokalnych zasobów przed publikacją.
  const fix220to228Files=['migrations/0021_state_revision_cas_fix221.sql','migrations/0022_admin_exam_bank_fix222.sql','functions/api/admin/exam-bank.js','scripts/post-deploy-smoke-fix220.mjs','scripts/test-fix220-post-deploy-smoke.mjs','scripts/test-fix221-222-migrations.py','scripts/test-fix220-228-implementation.mjs','scripts/test-fix220-228-publisher-guard.mjs','scripts/test-fix221-state-revision-contract.mjs','scripts/test-fix222-exam-bank-contract.mjs','scripts/test-fix223-security-report-contract.mjs','scripts/test-fix224-226-local-tools-contract.mjs','scripts/test-fix225-glb-import.mjs','scripts/test-fix227-228-cert-admin-contract.mjs','scripts/run-tests-fix220-228.mjs','TESTY_FIX220_FIX228.cmd','tools/FIX224_LIVE_SENSOR_MONITOR.ps1','MONITOR_CZUJNIKOW_FIX224.cmd','tools/FIX226_HYPERV_LAB_MANAGER.ps1','ZARZADZANIE_LABORATORIUM_FIX226.cmd','README_FIX220_D1_BACKUP.md','README_FIX221_STATE_SYNC.md','README_FIX222_EXAM_BANK.md','README_FIX223_ACCOUNT_REPORT.md','README_FIX224_LIVE_SENSORS.md','README_FIX225_GLB_IMPORT.md','README_FIX226_HYPERV_MANAGER.md','README_FIX227_CERT_VERIFY.md','README_FIX228_ADMIN_ANALYTICS.md','CHANGELOG_6.8.0_FIX220_228.txt','FIX220_228_IMPLEMENTATION_AUDIT.txt'];
  const fix220to228Missing=fix220to228Files.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  for(const [asset,needle] of [['academy-fix220-228.css','academy-fix220-228.css?v=6.8.0-fix228'],['academy-fix222-exam-bank.js','academy-fix222-exam-bank.js?v=6.8.0-fix222'],['academy-workshop-3d-fix199.js','academy-workshop-3d-fix199.js?v=6.8.0-fix225-glb-import']]){if(!indexHtml.includes(needle))fix220to228Missing.push(`HTML ${asset}`);if(!sw.includes(asset))fix220to228Missing.push(`PWA ${asset}`);}
  for(const migration of ['0021_state_revision_cas_fix221.sql','0022_admin_exam_bank_fix222.sql'])if(!fs.existsSync(path.join(ROOT,'migrations',migration)))fix220to228Missing.push(`migracja ${migration}`);
  if(!releaseJson.academyFix220to228||releaseJson.academyFix220to228.hotfix!=='FIX220–FIX228'||releaseJson.academyFix220to228.productVersion!=='6.8.0')fix220to228Missing.push('metadane release FIX220–FIX228');
  if(fix220to228Missing.length)throw new Error(`FIX220–FIX228: publikacja zablokowana. Brakujące elementy: ${fix220to228Missing.join('; ')}.`);
  log('FIX220–FIX228: migracje rewizji i banku pytań, smoke test, GLB lokalny, raport bezpieczeństwa, czujniki Windows, Hyper-V i statystyki administratora potwierdzone w pakiecie. Produkcyjne migracje/uruchomienia wymagają osobnej weryfikacji.');

  // FIX229: unieważnij cache starego widoku weryfikacji certyfikatów i wymagaj testu HTML/PWA.
  const fix229Required=['README_FIX229_PWA_CERT_CACHE.md','CHANGELOG_6.8.0_FIX229.txt','scripts/test-fix229-certificate-cache.mjs','scripts/test-fix229-publisher-guard.mjs','scripts/run-tests-fix220-229.mjs','TESTY_FIX220_FIX229.cmd'];
  const fix229Missing=fix229Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  const fix229Asset='academy-master-curriculum-fix162.js?v=6.8.0-fix229-cert-verification';
  if(!indexHtml.includes(fix229Asset))fix229Missing.push('HTML zasób weryfikacji certyfikatów FIX229');
  if(!sw.includes(`/${fix229Asset}`))fix229Missing.push('PWA precache weryfikacji certyfikatów FIX229');
  if(!releaseJson.academyFix229||releaseJson.academyFix229.hotfix!=='FIX229'||releaseJson.academyFix229.productVersion!=='6.8.0')fix229Missing.push('metadane FIX229');
  if(fix229Missing.length)throw new Error(`FIX229: publikacja zablokowana. Braki: ${fix229Missing.join('; ')}.`);
  log('FIX229: nowy URL zasobu certyfikatów jest zgodny w HTML/PWA; wymuszone odświeżenie skryptu po aktualizacji.');

  // FIX230: asset guard akceptuje nowe wersje zasobów, ale wymaga identycznych URL-i HTML/PWA.
  const fix230Required=['scripts/fix230-pwa-asset-guard.cjs','scripts/test-fix230-pwa-asset-guard.mjs','scripts/test-fix230-publisher-guard.mjs','scripts/run-tests-fix220-230.mjs','TESTY_FIX220_FIX230.cmd','README_FIX230_PUBLISHER_ASSET_PARITY.md','CHANGELOG_6.8.0_FIX230.txt','FIX230_IMPLEMENTATION_AUDIT.txt'];
  const fix230Missing=fix230Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  const fix230AssetPaths=['assets/academy-workshop-3d-fix199.js','assets/academy-workshop-3d-fix199.css','assets/academy-hardware-import-fix198.js','assets/academy-hardware-import-fix198.css','assets/academy-teacher-dashboard-fix201.css','assets/cloud-academy.js','assets/academy-admin-center-fix209.js','assets/academy-admin-center-fix209.css'];
  const fix230AssetAudit=verifyHtmlAssetsInServiceWorker({html:indexHtml,serviceWorker:sw,webRoot:WEB,assets:fix230AssetPaths});
  if(!fix230AssetAudit.ok)fix230Missing.push(...fix230AssetAudit.errors);
  if(!releaseJson.academyFix230||releaseJson.academyFix230.hotfix!=='FIX230'||releaseJson.academyFix230.productVersion!=='6.8.0')fix230Missing.push('metadane FIX230');
  if(fix230Missing.length)throw new Error(`FIX230: kontrola zgodności zasobów HTML/PWA nie przeszła. Braki: ${fix230Missing.join('; ')}.`);
  log('FIX230: aktualne wersje zasobów FIX198–FIX209 są zgodne pomiędzy HTML, plikami i Service Worker.');


  // FIX231–FIX239: notifications, privacy export, guardian consent, offline snapshots and deployment smoke tests.
  const fix231239Required=["migrations/0023_platform_experience_fix231_239.sql", "functions/_notifications.js", "functions/_webpush.js", "functions/api/notifications.js", "functions/api/guardians.js", "functions/api/content-reports.js", "functions/api/admin/content-reports.js", "scripts/post-deploy-smoke-fix239.mjs", "scripts/audit-content-quality-fix236.mjs", "scripts/test-fix231-239-platform.mjs", "scripts/test-fix232-web-push.mjs", "scripts/test-fix239-post-deploy-smoke-contract.mjs", "scripts/test-fix231-239-migration.py", "scripts/test-fix231-239-publisher-guard.mjs", "scripts/test-fix231-239-pwa-assets.mjs", "scripts/run-tests-fix220-239.mjs", "TESTY_FIX220_FIX239.cmd", "GENERUJ_KLUCZE_PUSH_FIX232.cmd", "BACKUP_D1_FIX235.cmd", "VERIFY_D1_BACKUP_FIX235.cmd", "RESTORE_D1_STAGING_FIX235.cmd", "tools/FIX235_VERIFY_D1_BACKUP.ps1", "tools/FIX235_RESTORE_D1_STAGING_ONLY.ps1", "scripts/generate-vapid-keys-fix232.mjs", "README_FIX231_DATA_EXPORT.md", "README_FIX232_NOTIFICATIONS.md", "README_FIX233_LOCALIZATION.md", "README_FIX234_ACCESSIBILITY.md", "README_FIX235_BACKUP_RESTORE.md", "README_FIX236_CONTENT_QUALITY.md", "README_FIX237_GUARDIAN_PORTAL.md", "README_FIX238_OFFLINE.md", "README_FIX239_POST_DEPLOY_TESTS.md", "CHANGELOG_6.8.0_FIX231_239.txt", "FIX231_239_IMPLEMENTATION_AUDIT.txt"];
  const fix231239Missing=fix231239Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  const fix231239Assets=['assets/platform-enhancements-fix231-239.css','assets/platform-enhancements-fix231-239.js'];
  const fix231239Audit=verifyHtmlAssetsInServiceWorker({html:indexHtml,serviceWorker:sw,webRoot:WEB,assets:fix231239Assets});
  if(!fix231239Audit.ok)fix231239Missing.push(...fix231239Audit.errors);
  if(!releaseJson.academyFix231to239||releaseJson.academyFix231to239.hotfix!=='FIX231–FIX239'||releaseJson.academyFix231to239.productVersion!=='6.8.0')fix231239Missing.push('metadane FIX231–FIX239');
  for(let fix=231;fix<=239;fix++){const key=`academyFix${fix}`;if(releaseJson[key]?.hotfix!==`FIX${fix}`||releaseJson[key]?.productVersion!=='6.8.0')fix231239Missing.push(`metadane ${key}`);}
  if(!indexHtml.includes('platform-enhancements-fix231-239.js?v=6.8.0-fix239')||!sw.includes('platform-enhancements-fix231-239.js?v=6.8.0-fix239'))fix231239Missing.push('zgodność zasobu UI FIX239 w HTML/Service Worker');
  if(fix231239Missing.length)throw new Error(`FIX231–FIX239: publikacja zablokowana. Braki: ${fix231239Missing.join('; ')}.`);
  log('FIX231–FIX239: migracja 0023, powiadomienia, eksport, opiekunowie, dostępność, offline i smoke test są zgodne.');

  // FIX240: protect the FIX231–FIX239 preflight from scope regressions.
  const fix240Required=['scripts/test-fix240-publisher-scope.mjs','scripts/run-tests-fix240.mjs','TESTY_FIX240.cmd','README_FIX240_PUBLISHER_SCOPE.md','CHANGELOG_6.8.0_FIX240.txt','FIX240_IMPLEMENTATION_AUDIT.txt'];
  const fix240Missing=fix240Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  if(!releaseJson.academyFix240||releaseJson.academyFix240.hotfix!=='FIX240'||releaseJson.academyFix240.productVersion!=='6.8.0')fix240Missing.push('metadane FIX240');
  if(fix240Missing.length)throw new Error(`FIX240: niekompletna poprawka zakresu publikatora. Braki: ${fix240Missing.join('; ')}.`);
  log('FIX240: zakresy zmiennych walidatora FIX231–FIX239 są zgodne; test regresyjny jest wymagany.');


  // FIX241: scan every Cloudflare Pages Function before Wrangler bundle/deploy.
  const fix241Required=['scripts/test-fix241-functions-syntax.mjs','scripts/test-fix241-guardian-sql.py','scripts/run-tests-fix241.mjs','TESTY_FIX241.cmd','README_FIX241_GUARDIAN_FUNCTION_SYNTAX.md','CHANGELOG_6.8.0_FIX241.txt','FIX241_IMPLEMENTATION_AUDIT.txt'];
  const fix241Missing=fix241Required.filter(file=>!fs.existsSync(path.join(ROOT,file)));
  if(!fs.existsSync(path.join(ROOT,'functions','api','guardians.js')))fix241Missing.push('functions/api/guardians.js');
  if(!releaseJson.academyFix241||releaseJson.academyFix241.hotfix!=='FIX241'||releaseJson.academyFix241.productVersion!=='6.8.0'||releaseJson.academyFix241.pagesDeployPerformed!==false)fix241Missing.push('metadane FIX241');
  if(fix241Missing.length)throw new Error(`FIX241: kontrola składni funkcji Pages niekompletna. Braki: ${fix241Missing.join('; ')}.`);
  log('FIX241: wymagany test składni wszystkich funkcji Pages przed uruchomieniem Wrangler.');

  const fix176Meta = releaseJson.academyGlobalAcademyFallbackFix176 || {};
  const fix176Css = path.join(WEB,'assets','global-academy-fallback-fix176.css');
  const globalFallback = indexHtml.includes('id="globalAcademyFallback"') && indexHtml.includes('id="globalAcademyFallbackStatus"') && indexHtml.includes('data-nav="academypro"') && indexHtml.includes('class="nav-item top-nav-item a176-top-launch"');
  const globalRuntime = fs.readFileSync(path.join(WEB,'assets','global-academy-suite-fix60.js'),'utf8');
  if (!fs.existsSync(fix176Css) || !indexHtml.includes('global-academy-fallback-fix176.css?v=6.8.0-fix176') || !sw.includes('global-academy-fallback-fix176.css') || !globalFallback || !globalRuntime.includes('FIX176 Global Academy mount failed; static navigation fallback restored.') || !globalRuntime.includes('const safeFallbackHtml=root.innerHTML') || fix176Meta.hotfix !== 'FIX176' || fix176Meta.globalAcademyStaticFallback !== true || fix176Meta.runtimeMountErrorRecovery !== true || fix176Meta.newViews !== 0 || fix176Meta.newD1Database !== false || fix176Meta.d1SchemaMigrations !== false) throw new Error('FIX176: awaryjny ekran Centrum Wiedzy, bezpośrednie wejście lub metadane bezpiecznej aktualizacji są niekompletne.');
  if ((indexHtml.match(/id="view-[^"]+"/g)||[]).length !== 35) throw new Error('FIX175: liczba widoków została zmieniona; oczekiwane 35.');
  if (releaseJson.currentLessonCatalog?.totalCatalogLessons !== 1083) throw new Error('FIX175: katalog 1083 lekcji został zmieniony.');

  const maxSize = 25 * 1024 * 1024;
  const walk = dir => {
    for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
      const full=path.join(dir,ent.name);
      if (ent.isSymbolicLink()) throw new Error(`Niedozwolony symlink: ${full}`);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile()) {
        if (fs.statSync(full).size > maxSize) throw new Error(`Plik WWW przekracza limit 25 MiB: ${path.relative(WEB,full)}`);
        if (/\.(exe|msi|dll|zip|7z|rar|bat|cmd|ps1|iso|dmp)$/i.test(ent.name)) throw new Error(`Niedozwolony typ pliku w WEB_PUBLISH: ${full}`);
      }
    }
  };
  walk(WEB);
  for (const script of ['scripts/run-tests-fix176.mjs', 'scripts/run-tests-fix181.mjs', 'scripts/test-fix177-publisher-photo-library-wiring.mjs', 'scripts/test-fix178-watcher-response-wiring.mjs', 'scripts/run-tests-fix182.mjs', 'scripts/run-tests-fix183.mjs', 'scripts/run-tests-fix184.mjs', 'scripts/test-fix184-expert-diagnostics.mjs', 'scripts/run-tests-fix185.mjs', 'scripts/test-fix185-performance-firmware.mjs', 'scripts/run-tests-fix186.mjs', 'scripts/test-fix186-practical-lab.mjs', 'scripts/test-fix194-three-oauth-providers.mjs', 'scripts/run-tests-fix210-218.mjs', 'scripts/test-fix219-publisher-preflight.mjs', 'scripts/run-tests-fix220-228.mjs','scripts/run-tests-fix220-229.mjs','scripts/test-fix229-certificate-cache.mjs','scripts/test-fix229-publisher-guard.mjs','scripts/run-tests-fix220-230.mjs','scripts/test-fix230-publisher-guard.mjs','scripts/test-fix240-publisher-scope.mjs','scripts/run-tests-fix241.mjs']) {
    log(`FIX135/FIX49 preflight: ${script}`);
    await runLocalNodeScript(script);
  }
  log(`Lokalny build potwierdzony: ${buildMatch[1]}, 1083 lekcje, formularz kont, katalog modeli, globalne statystyki i film wsparcia; ${diagnosticCards} kart diagnostycznych.`);
  log('Katalog WWW przeszedł wszystkie kontrole.');
  return { build:buildMatch[1], cards:diagnosticCards, lessons:1083 };
}
async function main() {
  console.log('======================================================');
  console.log('NAUKA OD A DO Z — PUBLISHER FIX167 — WEBSITE RELEASE 6.8.0 / GEMINI V1 / CMD-ONLY KEY GUARD');
  console.log('JEDEN START: GEMINI -> CLOUDFLARE -> ISTNIEJACA D1 -> WALIDACJA -> PUBLIKACJA -> AUTO-WATCH');
  console.log('======================================================');
  if (!fs.existsSync(WRANGLER)) throw new Error('Brak lokalnego Wrangler. Zainstaluj Node.js i Wrangler do TOOLS_CLOUDFLARE; niczego nie pobieram bez zgody.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0003_global_site_visits.sql'))) throw new Error('Brak migracji 0003_global_site_visits.sql.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0004_social_auth.sql'))) throw new Error('Brak migracji 0004_social_auth.sql.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0005_oauth_nonce.sql'))) throw new Error('Brak migracji 0005_oauth_nonce.sql dla bezpiecznego logowania OAuth.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0006_accounts_and_device_models.sql'))) throw new Error('Brak migracji 0006_accounts_and_device_models.sql dla rejestracji i katalogu modeli.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0007_global_unique_visitors.sql'))) throw new Error('Brak migracji 0007_global_unique_visitors.sql dla licznika anonimowych sesji.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0008_social_login_x_github.sql'))) throw new Error('Brak migracji 0008_social_login_x_github.sql dla X i GitHub.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0009_discord_social_login.sql'))) throw new Error('Brak migracji 0009_discord_social_login.sql dla Discord.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0010_account_terms_and_oauth_consent.sql'))) throw new Error('Brak migracji 0010_account_terms_and_oauth_consent.sql dla zgód konta.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0011_totp_two_factor.sql'))) throw new Error('Brak migracji 0011_totp_two_factor.sql dla 2FA.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0012_email_verification_and_password_reset.sql'))) throw new Error('Brak migracji 0012_email_verification_and_password_reset.sql dla weryfikacji e-mail i resetu hasła.');
  if (!fs.existsSync(path.join(ROOT, 'migrations', '0013_account_runtime_guard.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0014_account_limiter_key_repair.sql')) || !fs.existsSync(path.join(ROOT,'migrations','0015_account_limiter_v3.sql'))) throw new Error('Brak migracji 0013/0015 dla naprawy limitera kont FIX30.');
  if (!fs.existsSync(path.join(ROOT,'migrations','0016_support_community_center.sql'))) throw new Error('Brak addytywnej migracji 0016 centrum społeczności FIX36.');
  if (!fs.existsSync(path.join(ROOT,'migrations','0017_site_feedback_fix43.sql'))) throw new Error('Brak addytywnej migracji 0017 opinii FIX43.');
  for(const apiFile of ['support/proposals.js','support/thanks.js','support/updates.js','support/transparency.js','admin/support.js']) if(!fs.existsSync(path.join(FUNCTIONS,'api',apiFile))) throw new Error(`FIX39: brak wymaganej funkcji API ${apiFile}.`);
  if (!fs.existsSync(path.join(ROOT, 'scripts', 'cloudflare-pages-d1.js'))) throw new Error('Brak modułu automatycznego rozpoznawania bindingu Pages D1. Rozpakuj pełną paczkę 6.2.0.');
  if (!fs.existsSync(path.join(ROOT, 'scripts', 'configure-gemini-secret.js')) || !fs.existsSync(path.join(ROOT, 'scripts', 'configure-gemini-secret.ps1'))) throw new Error('Brak konfiguratora Gemini CMD. Rozpakuj pełną paczkę FIX167 (sekret istnieje już w Cloudflare).');
  await ensureProject();
  const cfg = await obtainConfig();
  const dbName = await ensureExistingDatabase(cfg);
  await verifyWeb();
  await verifyPendingMigrations(dbName);
  await migrateDatabase(dbName);
  log('7/7 — Uruchamiam automatyczną publikację do istniejącego projektu i obserwator zmian…');
  log(`Adres stały pozostaje: ${STABLE_URL}`);
  log('Od tej chwili nie trzeba uruchamiać innych plików CMD. Pozostaw to jedno okno otwarte. Ctrl+C zatrzymuje obserwator.');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'AUTO_PUBLISH_WATCHER.js')], {
      cwd: ROOT, windowsHide: false, shell: false,
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT },
      stdio: 'inherit'
    });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Obserwator zakończył kodem ${code}.`)));
  });
}
main().catch(error => {
  console.error(`\n[BLAD] ${error.stack || error.message || error}`);
  console.error('[STOP] Nie utworzono nowego projektu ani nowej bazy. Nie wykonano dalszej publikacji.');
  process.exitCode = 1;
});
