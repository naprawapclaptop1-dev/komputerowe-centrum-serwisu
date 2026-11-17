// Bezpieczny konfigurator Gemini API dla NAUKA OD A DO Z.
// Klucz jest wklejany ukrycie w tym samym oknie CMD, sprawdzany przez Gemini,
// a następnie przekazywany do Wrangler wyłącznie przez stdin jako sekret Pages.
// Nie jest zapisywany w plikach, argumentach procesu, konfiguracji ani logach.
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PROJECT = 'naprawa-pc-akademia-serwisu-pro';
const ACCOUNT = '4ddfc3803a4f0c4457ccae083f18b975';
const WRANGLER = path.join(ROOT, 'TOOLS_CLOUDFLARE', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const GEMINI_KEY_URL = 'https://aistudio.google.com/api-keys';
const GEMINI_MODEL_INFO_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-3.8-flash';

function redact(output, secret = '') {
  let value = String(output || '');
  if (secret) value = value.split(secret).join('[KLUCZ UKRYTY]');
  return value;
}

function runWrangler(args, input = undefined, secretToRedact = '') {
  const result = spawnSync(process.execPath, [WRANGLER, ...args], {
    cwd: ROOT,
    input,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, WRANGLER_SEND_METRICS: 'false' }
  });
  if (result.error) throw new Error(`Nie udało się uruchomić Wrangler: ${result.error.message}`);
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (result.status !== 0) {
    const safe = redact(output, secretToRedact).trim();
    throw new Error(`Wrangler zakończył się kodem ${result.status}. ${safe.slice(-1200)}`);
  }
  return redact(output, secretToRedact);
}

function hasGeminiSecret(listOutput) {
  return /["']?name["']?\s*:\s*["']GEMINI_API_KEY["']/i.test(String(listOutput || ''))
    || /\bGEMINI_API_KEY\b/i.test(String(listOutput || ''));
}

function isValidGeminiKey(value) {
  return typeof value === 'string'
    && value.length >= 20
    && value.length <= 512
    && /^[A-Za-z0-9._-]+$/.test(value);
}

async function verifyGeminiKey(key, fetchImpl = fetch) {
  if (!isValidGeminiKey(key)) throw new Error('GEMINI_KEY_FORMAT_INVALID');
  let response;
  try {
    // Lekki test autoryzacji: pobiera metadane modelu, nie uruchamia generowania.
    // Dzięki temu pierwszy zapis klucza nie czeka na pełną odpowiedź modelu.
    response = await fetchImpl(`${GEMINI_MODEL_INFO_ENDPOINT}/${encodeURIComponent(GEMINI_MODEL)}`, {
      method: 'GET',
      headers: {
        'x-goog-api-key': key,
        'accept': 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new Error('GEMINI_VERIFY_TIMEOUT');
    const code = String(error?.cause?.code || error?.code || '');
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') throw new Error('GEMINI_VERIFY_DNS');
    if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ETIMEDOUT') throw new Error('GEMINI_VERIFY_NETWORK');
    throw new Error('GEMINI_VERIFY_NETWORK');
  }
  if (!response.ok) throw new Error(`GEMINI_VERIFY_HTTP_${response.status}`);
  const payload = await response.json().catch(() => ({}));
  const expectedName = `models/${GEMINI_MODEL}`;
  if (!payload || payload.name !== expectedName) throw new Error('GEMINI_VERIFY_BAD_RESPONSE');
  return true;
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function readSecretFromStdin() {
  return new Promise((resolve, reject) => {
    let value = '';
    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('end');
      process.stdin.removeAllListeners('error');
      const result = value.replace(/\r?\n[\s\S]*$/, '').trim();
      value = '';
      if (error) reject(error);
      else resolve(result);
    };
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { value += chunk; });
    process.stdin.once('end', () => finish());
    process.stdin.once('error', error => finish(error));
    process.stdin.resume();
  });
}

// Bezpośrednie uruchomienie Node nie przejmuje trybu raw konsoli.
// Interaktywny klucz wprowadza configure-gemini-secret.ps1 przez Read-Host -AsSecureString
// w tym samym oknie CMD, a następnie przekazuje go temu procesowi wyłącznie przez stdin.
function readSecretHidden() {
  return Promise.reject(new Error('INPUT_REQUIRES_SECURE_CMD_WRAPPER'));
}

function saveGeminiSecret(key) {
  if (!isValidGeminiKey(key)) throw new Error('Klucz Gemini ma nieprawidłowy format.');
  let payload = Buffer.from(JSON.stringify({ GEMINI_API_KEY: key }), 'utf8');
  try {
    runWrangler(['pages', 'secret', 'bulk', '--project-name', PROJECT, '--env', 'production'], payload, key);
    const verified = runWrangler(['pages', 'secret', 'list', '--project-name', PROJECT, '--env', 'production']);
    if (!hasGeminiSecret(verified)) throw new Error('Cloudflare nie potwierdził sekretu GEMINI_API_KEY.');
    return true;
  } finally {
    payload.fill(0);
    payload = null;
  }
}

function openKeyPage() {
  console.log(`[LINK] Oficjalne tworzenie klucza Gemini: ${GEMINI_KEY_URL}`);
  if (process.argv.includes('--stdin-secret') || process.env.AKADEMIA_GEMINI_SETUP_NO_BROWSER === '1' || process.platform !== 'win32') return;
  const child = spawn('cmd.exe', ['/d', '/s', '/c', `start "" "${GEMINI_KEY_URL}"`], { stdio: 'ignore', windowsHide: true, detached: true });
  child.on('error', () => console.log('[INFO] Otwórz powyższy link ręcznie w przeglądarce. Klucz wklej wyłącznie w tym CMD.'));
  child.unref();
}

async function main() {
  const force = process.argv.includes('--force');
  const checkOnly = process.argv.includes('--check-only');
  const stdinSecret = process.argv.includes('--stdin-secret');
  console.log('======================================================');
  console.log('NAUKA OD A DO Z — BEZPIECZNA KONFIGURACJA GEMINI');
  console.log('Klucz wklejasz WYŁĄCZNIE w tym oknie CMD. Wprowadzanie jest ukryte.');
  console.log('Klucz nie jest zapisywany do pliku ani wypisywany w logu.');
  console.log('======================================================');
  if (!fs.existsSync(WRANGLER)) throw new Error('Brak lokalnego Wrangler w TOOLS_CLOUDFLARE. Zachowaj katalog narzędzi z poprzedniej instalacji.');
  const identity = runWrangler(['whoami']);
  if (!identity.includes(ACCOUNT)) throw new Error('Wrangler nie jest zalogowany na właściwe konto Cloudflare platformy NAUKA OD A DO Z.');
  const currentSecrets = runWrangler(['pages', 'secret', 'list', '--project-name', PROJECT, '--env', 'production']);
  const alreadyConfigured = hasGeminiSecret(currentSecrets);
  if (checkOnly) {
    if (alreadyConfigured) {
      console.log('[OK] Sekret GEMINI_API_KEY istnieje w Cloudflare Pages Production. Nie pytam ponownie.');
      process.exitCode = 0;
    } else {
      console.log('[INFO] Brak sekretu GEMINI_API_KEY. Potrzebne jednorazowe wklejenie klucza w CMD.');
      process.exitCode = 2;
    }
    return;
  }
  if (alreadyConfigured && !force) {
    console.log('[OK] Sekret GEMINI_API_KEY istnieje w Cloudflare Pages Production. Nie pytam ponownie.');
    return;
  }
  if (alreadyConfigured) console.log('[INFO] Zmiana istniejącego sekretu GEMINI_API_KEY (--force).');
  if (!stdinSecret) openKeyPage();
  if (!stdinSecret) console.log('[INFO] Uruchom konfigurator przez START_FIX105 lub USTAW_KLUCZ_GEMINI.cmd.');
  let key = stdinSecret ? await readSecretFromStdin() : await readSecretHidden();
  try {
    if (!isValidGeminiKey(key)) throw new Error('Wklej cały klucz Gemini. Nie zapisano żadnych danych.');
    console.log('[INFO] Sprawdzam klucz bez zapisywania go…');
    if (process.env.AKADEMIA_GEMINI_SETUP_SKIP_VERIFY === '1') {
      console.log('[INFO] Tryb testowy: pomijam zewnętrzne sprawdzenie klucza.');
    } else {
      await verifyGeminiKey(key);
      console.log('[OK] Google Gemini potwierdziło klucz i dostęp do modelu.');
    }
    saveGeminiSecret(key);
    console.log('[OK] GEMINI_API_KEY zapisany i potwierdzony w Cloudflare Pages Production.');
    console.log('[OK] Klucz nie został pokazany, zapisany lokalnie ani umieszczony w logu.');
  } finally {
    key = '';
  }
}

if (require.main === module) {
  main().catch(error => {
    const code = String(error?.message || 'UNKNOWN');
    const messages = {
      GEMINI_KEY_FORMAT_INVALID: 'Format klucza Gemini jest nieprawidłowy.',
      GEMINI_VERIFY_TIMEOUT: 'Google API nie odpowiedziało w ciągu 15 sekund. Klucz nie został zapisany. Sprawdź dostęp do generativelanguage.googleapis.com, zaporę, antywirusa lub proxy.',
      GEMINI_VERIFY_DNS: 'Nie można odnaleźć serwera generativelanguage.googleapis.com. Sprawdź DNS i połączenie internetowe.',
      GEMINI_VERIFY_NETWORK: 'Połączenie z Google Gemini zostało przerwane lub odrzucone. Sprawdź zaporę Windows, antywirusa, proxy i dostęp do Internetu.',
      GEMINI_VERIFY_BAD_RESPONSE: 'Google zwróciło nieprawidłowe dane modelu. Klucz nie został zapisany.',
      INPUT_CANCELLED: 'Przerwano wprowadzanie klucza.',
      INPUT_REQUIRES_SECURE_CMD_WRAPPER: 'Uruchom START_FIX105 albo USTAW_KLUCZ_GEMINI.cmd. Wklejanie odbywa się w ukrytym polu w tym samym oknie CMD.'
    };
    const http = code.match(/^GEMINI_VERIFY_HTTP_(\d{3})$/);
    const safeMessage = messages[code] || (http ? `Gemini odrzuciło klucz lub dostęp do modelu (HTTP ${http[1]}). Sprawdź uprawnienia i wygeneruj klucz w Google AI Studio.` : redact(code));
    console.error(`[BŁĄD KONFIGURACJI GEMINI] ${safeMessage}`);
    process.exitCode = 1;
  });
}

module.exports = { hasGeminiSecret, isValidGeminiKey, verifyGeminiKey, readSecretHidden, readSecretFromStdin, safeEqual, redact, saveGeminiSecret, runWrangler };
