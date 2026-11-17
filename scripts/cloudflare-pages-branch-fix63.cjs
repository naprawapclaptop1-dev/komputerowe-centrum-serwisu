'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function decodeTomlString(raw) {
  const value = String(raw || '').trim();
  if (value.startsWith('"')) {
    try { return JSON.parse(value); } catch { return ''; }
  }
  if (value.startsWith("'")) return value.endsWith("'") ? value.slice(1, -1) : '';
  return '';
}

function resolveWranglerAuthFilePaths({ env = process.env, home = os.homedir() } = {}) {
  const profile = String(env.WRANGLER_AUTH_PROFILE || 'default').trim() || 'default';
  const candidates = [];
  if (env.APPDATA) candidates.push(path.join(env.APPDATA, 'xdg.config', '.wrangler', 'config', `${profile}.toml`));
  candidates.push(path.join(home, 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', `${profile}.toml`));
  candidates.push(path.join(home, '.wrangler', 'config', `${profile}.toml`));
  candidates.push(path.join(home, '.config', '.wrangler', 'config', `${profile}.toml`));
  return [...new Set(candidates)];
}

function readWranglerOAuthCredential({ env = process.env, home = os.homedir(), fsImpl = fs } = {}) {
  const apiToken = String(env.CLOUDFLARE_API_TOKEN || '').trim();
  if (apiToken) return { token: apiToken, source: 'CLOUDFLARE_API_TOKEN' };

  for (const file of resolveWranglerAuthFilePaths({ env, home })) {
    if (!fsImpl.existsSync(file)) continue;
    let source = '';
    try { source = fsImpl.readFileSync(file, 'utf8'); } catch { continue; }
    const match = source.match(/^\s*oauth_token\s*=\s*("(?:\\.|[^"\\])*"|'[^']*')\s*(?:#.*)?$/m);
    if (!match) continue;
    const token = decodeTomlString(match[1]).trim();
    if (token) return { token, source: 'Wrangler OAuth profile' };
  }
  return null;
}

async function resolveCloudflarePagesProductionBranch({ accountId, projectName, env = process.env, home = os.homedir(), fetchImpl = globalThis.fetch, fsImpl = fs, timeoutMs = 12000 } = {}) {
  if (!accountId || !projectName) throw new Error('Brak accountId lub projectName dla Cloudflare Pages API.');
  const credential = readWranglerOAuthCredential({ env, home, fsImpl });
  if (!credential) return { branch: '', source: 'none', credentialSource: 'none' };
  if (typeof fetchImpl !== 'function') throw new Error('Brak natywnego fetch do odczytu ustawień Cloudflare Pages.');

  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { authorization: `Bearer ${credential.token}`, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    throw new Error(`Nie udało się odczytać konfiguracji Cloudflare Pages API (${error?.name === 'TimeoutError' ? 'przekroczono limit czasu' : 'błąd połączenia'}).`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.success !== true) {
    const code = payload?.errors?.[0]?.code;
    throw new Error(`Cloudflare Pages API nie potwierdziło konfiguracji projektu (HTTP ${response.status}${code ? `, kod ${code}` : ''}). Token nie został wypisany ani zapisany.`);
  }
  const result = payload.result;
  if (!result || (result.name && String(result.name).toLowerCase() !== String(projectName).toLowerCase())) {
    throw new Error('Cloudflare Pages API zwróciło inny projekt niż oczekiwany; publikacja zablokowana.');
  }
  const branch = String(result.production_branch || '').trim();
  if (!branch) throw new Error('Cloudflare Pages API nie zwróciło pola production_branch.');
  return { branch, source: 'Cloudflare Pages API', credentialSource: credential.source };
}

module.exports = {
  decodeTomlString,
  resolveWranglerAuthFilePaths,
  readWranglerOAuthCredential,
  resolveCloudflarePagesProductionBranch
};
