import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const httpTestPath = path.join(ROOT, 'scripts', 'test-global-academy-http-fix77.mjs');
const source = fs.readFileSync(httpTestPath, 'utf8');
assert.match(source, /http\.request\s*\(/, 'Lokalny test HTTP musi używać bezpośredniego http.request().');
assert.doesNotMatch(source, /\bfetch\s*\(/, 'Lokalny test HTTP nie może używać globalnego fetch().');
assert.match(source, /server\.address\(\)/, 'Test musi odczytać adres uruchomionego serwera.');
assert.match(source, /Number\.isInteger\(port\).*port\s*>\s*0.*port\s*<=\s*65535/s, 'Test musi walidować zakres portu TCP.');
assert.match(source, /agent:\s*false/, 'Test musi wykonywać lokalne połączenie przez dedykowany agent bez proxy.');

// Używamy poprawnego składniowo, lecz niedostępnego proxy. Node 26 parsuje
// konfigurację proxy podczas tworzenia globalnego agenta; wadliwy port (np. 99999)
// zatrzymuje proces jeszcze przed uruchomieniem testu. Lokalny klient korzysta
// z agent:false, a NO_PROXY jawnie wyłącza proxy dla loopback.
const proxy = 'http://127.0.0.1:65534';
const env = {
  ...process.env,
  NODE_USE_ENV_PROXY: '1',
  HTTP_PROXY: proxy,
  http_proxy: proxy,
  HTTPS_PROXY: proxy,
  https_proxy: proxy,
  NO_PROXY: 'localhost,127.0.0.1',
  no_proxy: 'localhost,127.0.0.1'
};
const result = spawnSync(process.execPath, [httpTestPath], {
  cwd: ROOT,
  env,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 30000,
  maxBuffer: 4 * 1024 * 1024
});
const output = `${result.stdout || ''}${result.stderr || ''}`;
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
assert.match(env.HTTP_PROXY, /^http:\/\/[^/]+:\d+$/, 'HTTP_PROXY musi być poprawnym URL z portem 1–65535.');
assert.equal(env.NO_PROXY, 'localhost,127.0.0.1', 'NO_PROXY musi obejmować lokalny serwer.');
assert.ifError(result.error);
assert.equal(result.status, 0, `Test HTTP musi przejść przy aktywnym, poprawnie skonfigurowanym proxy i wyjątkach NO_PROXY dla loopback.\n${output}`);
console.log('[PASS] FIX113: lokalny HTTP omija skonfigurowane proxy dla loopback i sprawdza dynamiczny port.');
