import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { readWranglerOAuthCredential, resolveCloudflarePagesProductionBranch } = require('./cloudflare-pages-branch-fix63.cjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-branch-fix63-'));
try {
  const appData = path.join(tmp, 'AppData', 'Roaming');
  const profileDir = path.join(appData, 'xdg.config', '.wrangler', 'config');
  fs.mkdirSync(profileDir, { recursive: true });
  fs.writeFileSync(path.join(profileDir, 'default.toml'), 'oauth_token = "test-oauth-token-fix63"\nrefresh_token = "never-return-this"\nscopes = ["pages:write"]\n');

  const credential = readWranglerOAuthCredential({ env: { APPDATA: appData }, home: tmp });
  assert.equal(credential?.source, 'Wrangler OAuth profile');
  assert.equal(credential?.token, 'test-oauth-token-fix63');

  let request;
  const resolved = await resolveCloudflarePagesProductionBranch({
    accountId: 'account-test-123',
    projectName: 'naprawa-pc-akademia-serwisu-pro',
    env: { APPDATA: appData },
    home: tmp,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, json: async () => ({ success: true, result: { name: 'naprawa-pc-akademia-serwisu-pro', production_branch: 'main' } }) };
    }
  });
  assert.equal(resolved.branch, 'main');
  assert.equal(resolved.source, 'Cloudflare Pages API');
  assert.equal(request.url, 'https://api.cloudflare.com/client/v4/accounts/account-test-123/pages/projects/naprawa-pc-akademia-serwisu-pro');
  assert.equal(request.options.headers.authorization, 'Bearer test-oauth-token-fix63');
  assert.equal(request.options.method, 'GET');
  assert.ok(!JSON.stringify(resolved).includes('test-oauth-token-fix63'));
  console.log('[PASS] Odczytano Production Branch przez Pages API z istniejącego profilu OAuth Wrangler.');
  console.log('[PASS] Żądanie używa dokładnego konta i projektu; token nie trafia do wyniku.');

  let apiTokenUsed = '';
  const envResult = await resolveCloudflarePagesProductionBranch({
    accountId: 'a', projectName: 'p', env: { CLOUDFLARE_API_TOKEN: 'test-env-token', APPDATA: appData }, home: tmp,
    fetchImpl: async (_url, options) => { apiTokenUsed = options.headers.authorization; return { ok: true, status: 200, json: async () => ({ success: true, result: { name: 'p', production_branch: 'production' } }) }; }
  });
  assert.equal(apiTokenUsed, 'Bearer test-env-token');
  assert.equal(envResult.branch, 'production');
  console.log('[PASS] Jawny CLOUDFLARE_API_TOKEN ma pierwszeństwo przed profilem OAuth.');

  let networkCalled = false;
  const noCredentialHome = path.join(tmp, 'no-credentials');
  fs.mkdirSync(noCredentialHome, { recursive: true });
  const noCredential = await resolveCloudflarePagesProductionBranch({ accountId: 'a', projectName: 'p', env: {}, home: noCredentialHome, fetchImpl: async () => { networkCalled = true; throw new Error('must not call'); } });
  assert.equal(noCredential.branch, '');
  assert.equal(networkCalled, false);
  console.log('[PASS] Brak poświadczeń nie uruchamia żądania sieciowego i pozwala użyć ręcznego fallbacku.');

  await assert.rejects(() => resolveCloudflarePagesProductionBranch({ accountId: 'a', projectName: 'p', env: { CLOUDFLARE_API_TOKEN: 'fake' }, home: tmp, fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ success: false, errors: [{ code: 9109, message: 'forbidden' }] }) }) }), /HTTP 403, kod 9109/);
  await assert.rejects(() => resolveCloudflarePagesProductionBranch({ accountId: 'a', projectName: 'p', env: { CLOUDFLARE_API_TOKEN: 'fake' }, home: tmp, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ success: true, result: { name: 'p' } }) }) }), /nie zwróciło pola production_branch/);
  await assert.rejects(() => resolveCloudflarePagesProductionBranch({ accountId: 'a', projectName: 'expected', env: { CLOUDFLARE_API_TOKEN: 'fake' }, home: tmp, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ success: true, result: { name: 'other', production_branch: 'main' } }) }) }), /inny projekt/);
  console.log('[PASS] Brak pola, HTTP 403 i niezgodny projekt kończą się bezpiecznym błędem.');
  console.log('PRODUCTION BRANCH DISCOVERY FIX63: 5/5 PASS');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
