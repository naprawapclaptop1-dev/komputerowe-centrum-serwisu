import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const bootstrap = read('PRZYGOTUJ_WRANGLER_FIX18.cmd');
assert.match(bootstrap, /wrangler@4\.156\.0/, 'Wrangler must be pinned to a known tested version');
assert.match(bootstrap, /npm\.cmd install --prefix/, 'Bootstrap must install into local TOOLS_CLOUDFLARE');
assert.match(bootstrap, /--no-save --no-package-lock --no-audit --no-fund/, 'Bootstrap must not mutate package manifests or perform audit network calls');
assert.match(bootstrap, /pages|Wrangler/i);
assert.match(bootstrap, /Nie uruchamiam publikacji ani migracji D1/i);
const canonicalLauncher = read('URUCHOM_AKADEMIE.cmd');
assert.ok(canonicalLauncher.includes('PRZYGOTUJ_WRANGLER_FIX18.cmd'), 'canonical launcher should bootstrap missing Wrangler automatically');
const aliasLauncher = read('URUCHOM_NAUKE_OD_A_DO_Z.cmd');
assert.match(aliasLauncher, /call .*URUCHOM_AKADEMIE\.cmd/i, 'legacy launcher must delegate to the canonical launcher');
for (const launcher of ['USTAW_KLUCZ_OPENAI.cmd','KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX18.cmd','KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX19B.cmd']) {
  const body = read(launcher);
  assert.ok(body.includes('PRZYGOTUJ_WRANGLER_FIX18.cmd'), `${launcher} should bootstrap missing Wrangler automatically`);
}
const wizard = read('scripts/configure-oauth-secrets.js');
assert.match(wizard, /TOOLS_CLOUDFLARE/);
const readme = read('README_FIX19B_SOCIAL_LOGIN_AND_EMAIL_SECURITY.txt');
assert.match(readme, /KONFIGURUJ_LOGOWANIE_SOCJALNE_FIX19B\.cmd/);
assert.match(readme, /przypiętą wersję 4\.156\.0/);
console.log('PASS: pinned Wrangler bootstrap, canonical launcher, alias and three setup integrations, and no implicit deploy/migration.');
