import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { oauthProviderStatus, startOAuth, completeOAuth } from '../functions/_oauth.js';
import { onRequestDelete as unlinkIdentity, onRequestGet as listIdentities } from '../functions/api/auth/identities.js';
import { onRequestDelete as revokeSessions, onRequestGet as listSessions } from '../functions/api/auth/sessions.js';
import { sha256Hex } from '../functions/_lib.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const db = new DatabaseSync(':memory:');
const migrationDir = resolve(root, 'migrations');
const baseMigrations = readdirSync(migrationDir).filter(x => /^000[1-7]_.*\.sql$/.test(x)).sort();
for (const file of baseMigrations) db.exec(readFileSync(resolve(migrationDir, file), 'utf8'));

class D1Statement {
  constructor(database, sql) { this.database = database; this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  first() { return this.database.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.database.prepare(this.sql).all(...this.args) }; }
  run() { const result = this.database.prepare(this.sql).run(...this.args); return { success: true, meta: { changes: Number(result.changes || 0) } }; }
}
const env = { DB: { prepare: sql => new D1Statement(db, sql) } };
const now = new Date().toISOString();
const userId = 'fix18-oauth-test-user';
db.prepare('INSERT INTO academy_users(id,nickname,created_at,last_seen_at,consent_at,consent_version,locale) VALUES(?,?,?,?,NULL,NULL,?)').run(userId,'Test-Technik',now,now,'pl');

// Seed the three original providers and an in-flight Microsoft state before migration 0008.
for (const provider of ['google','facebook','microsoft']) {
  db.prepare('INSERT INTO academy_auth_identities(provider,provider_subject,user_id,created_at) VALUES(?,?,?,?)').run(provider,`subject-${provider}`,userId,now);
}
db.prepare('INSERT INTO academy_oauth_states(state_hash,provider,code_verifier,nonce,nickname,link_user_id,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').run('state-before-fix18','microsoft','original-verifier','original-nonce','',userId,now,new Date(Date.now()+600000).toISOString());
db.exec(readFileSync(resolve(migrationDir,'0008_social_login_x_github.sql'),'utf8'));
if (db.prepare('SELECT COUNT(*) AS c FROM academy_auth_identities WHERE user_id=?').get(userId).c !== 3) throw new Error('Migracja 0008 nie zachowała istniejących kont Google/Facebook/Microsoft.');
if (db.prepare('SELECT code_verifier FROM academy_oauth_states WHERE state_hash=?').get('state-before-fix18')?.code_verifier !== 'original-verifier') throw new Error('Migracja 0008 nie zachowała istniejącego stanu OAuth.');
for (const provider of ['x','github']) {
  db.prepare('INSERT INTO academy_auth_identities(provider,provider_subject,user_id,created_at) VALUES(?,?,?,?)').run(provider,`subject-${provider}`,userId,now);
  db.prepare('INSERT INTO academy_oauth_states(state_hash,provider,code_verifier,nonce,nickname,link_user_id,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').run(`state-${provider}`,provider,`verifier-${provider}`,`nonce-${provider}`,'',userId,now,new Date(Date.now()+600000).toISOString());
}
db.exec(readFileSync(resolve(migrationDir,'0009_discord_social_login.sql'),'utf8'));
if (db.prepare('SELECT COUNT(*) AS c FROM academy_auth_identities WHERE user_id=?').get(userId).c !== 5) throw new Error('Migracja 0009 nie zachowała istniejących kont po migracji 0008.');
if (db.prepare('SELECT code_verifier FROM academy_oauth_states WHERE state_hash=?').get('state-before-fix18')?.code_verifier !== 'original-verifier') throw new Error('Migracja 0009 nie zachowała istniejącego stanu OAuth.');
db.exec(readFileSync(resolve(migrationDir,'0010_account_terms_and_oauth_consent.sql'),'utf8'));
db.exec(readFileSync(resolve(migrationDir,'0011_totp_two_factor.sql'),'utf8'));
db.exec(readFileSync(resolve(migrationDir,'0012_email_verification_and_password_reset.sql'),'utf8'));
db.exec(readFileSync(resolve(migrationDir,'0013_account_runtime_guard.sql'),'utf8'));
db.exec(readFileSync(resolve(migrationDir,'0014_account_limiter_key_repair.sql'),'utf8'));
db.exec(readFileSync(resolve(migrationDir,'0015_account_limiter_v3.sql'),'utf8'));
if (db.prepare('SELECT terms_accepted_at,terms_version FROM academy_users WHERE id=?').get(userId)?.terms_version !== null) throw new Error('Migracja 0010 nie zachowała historii kont bez przypisywania im wstecznej zgody.');
if (db.prepare('SELECT terms_accepted FROM academy_oauth_states WHERE state_hash=?').get('state-before-fix18')?.terms_accepted !== 0) throw new Error('Migracja 0010 nie ustawiła bezpiecznej wartości domyślnej dla starych stanów OAuth.');
db.prepare('INSERT INTO academy_auth_identities(provider,provider_subject,user_id,created_at) VALUES(?,?,?,?)').run('discord','subject-discord',userId,now);
db.prepare('INSERT INTO academy_oauth_states(state_hash,provider,code_verifier,nonce,nickname,link_user_id,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').run('state-discord','discord','verifier-discord','nonce-discord','',userId,now,new Date(Date.now()+600000).toISOString());
const providers = ['google','facebook','microsoft','github','discord'];
const identityCount = db.prepare('SELECT COUNT(*) AS c FROM academy_auth_identities WHERE user_id=?').get(userId).c;
const stateCount = db.prepare('SELECT COUNT(*) AS c FROM academy_oauth_states').get().c;
if (identityCount !== 6 || stateCount !== 4) throw new Error('Migracje 0008/0009 nie zachowały historycznych identyfikatorów OAuth lub stanów.');

const keys = {
  google: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],
  facebook: ['FACEBOOK_CLIENT_ID','FACEBOOK_CLIENT_SECRET'],
  microsoft: ['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET'],
  github: ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET'],
  discord: ['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET']
};
const configured = {};
for (const pair of Object.values(keys)) { configured[pair[0]] = `client-${pair[0]}`; configured[pair[1]] = `secret-${pair[1]}`; }
const status = oauthProviderStatus(configured);
if (!providers.every(provider => status[provider] === true) || Object.hasOwn(status,'x')) throw new Error('Status OAuth nie zwraca dokładnie pięciu metod (X ma być wyłączony).');
if (oauthProviderStatus({}).discord !== false) throw new Error('Nie skonfigurowany Discord nie może być pokazany jako aktywny.');

const missingTermsBefore = db.prepare('SELECT COUNT(*) AS c FROM academy_oauth_states').get().c;
const noTerms = await startOAuth(new Request('https://academy.test/api/auth/start?provider=google'), { ...env, ...configured });
if (noTerms.status !== 303 || !noTerms.headers.get('location')?.includes('terms_required') || db.prepare('SELECT COUNT(*) AS c FROM academy_oauth_states').get().c !== missingTermsBefore) throw new Error('Nowa rejestracja społecznościowa nie wymaga zgody na zasady.');
for (const provider of providers) {
  const request = new Request(`https://academy.test/api/auth/start?provider=${provider}&termsAccepted=1`, { headers: { 'cf-connecting-ip': '192.0.2.10' } });
  const response = await startOAuth(request, { ...env, ...configured });
  if (response.status !== 302) throw new Error(`${provider}: start OAuth nie zwrócił przekierowania 302.`);
  const location = new URL(response.headers.get('location'));
  const cookie = response.headers.get('set-cookie') || '';
  if (!location.searchParams.get('state') || !cookie.includes('HttpOnly') || !cookie.includes('Secure') || !cookie.includes('SameSite=Lax')) throw new Error(`${provider}: brak state lub bezpiecznego cookie.`);
  if (provider !== 'facebook' && location.searchParams.get('code_challenge_method') !== 'S256') throw new Error(`${provider}: brak PKCE S256.`);
  if (provider === 'discord' && (location.origin !== 'https://discord.com' || !location.searchParams.get('scope')?.includes('identify'))) throw new Error('Discord: błędny endpoint lub scope identify.');
  if (provider === 'github' && (location.origin !== 'https://github.com' || !location.searchParams.get('scope')?.includes('read:user'))) throw new Error('GitHub: błędny endpoint lub zakres read:user.');
}
const xDisabled = await startOAuth(new Request('https://academy.test/api/auth/start?provider=x&termsAccepted=1'), { ...env, ...configured });
if (xDisabled.status !== 400 || !(await xDisabled.json()).error?.includes('OAUTH_PROVIDER_INVALID')) throw new Error('X nie został zablokowany jako niedozwolony dostawca.');

const missingDiscord = await startOAuth(new Request('https://academy.test/api/auth/start?provider=discord'), env);
if (missingDiscord.status !== 303 || !missingDiscord.headers.get('location')?.includes('discord_not_configured')) throw new Error('Brak sekretów Discord nie jest bezpiecznie raportowany jako nieaktywna konfiguracja.');

// Execute one complete Discord signup against mocked provider endpoints and verify
// that the new account stores only the provider subject plus terms version/date.
const signupStart = await startOAuth(new Request('https://academy.test/api/auth/start?provider=discord&termsAccepted=1&nickname=Nowy-Technik', { headers: { 'cf-connecting-ip': '192.0.2.11' } }), { ...env, ...configured });
if (signupStart.status !== 302) throw new Error('Start pełnej rejestracji Discord nie powiódł się.');
const signupLocation = new URL(signupStart.headers.get('location'));
const signupState = signupLocation.searchParams.get('state');
const signupCookie = (signupStart.headers.get('set-cookie') || '').match(/academy_oauth_state=([^;]+)/)?.[1];
if (!signupState || !signupCookie) throw new Error('Brak state/cookie w pełnym teście Discord.');
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.hostname === 'discord.com' && url.pathname === '/api/oauth2/token') {
    const body = new URLSearchParams(init.body || '');
    if (body.get('code') !== 'test-code' || !body.get('code_verifier') || body.get('grant_type') !== 'authorization_code') throw new Error('Discord token exchange nie zawiera poprawnego code/PKCE.');
    return new Response(JSON.stringify({ access_token: 'mock-discord-access-token' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.hostname === 'discord.com' && url.pathname === '/api/users/@me') return new Response(JSON.stringify({ id: '123456789012345678', username: 'nowy', global_name: 'Nowy Technik' }), { status: 200, headers: { 'content-type': 'application/json' } });
  throw new Error(`Nieoczekiwane wywołanie fetch w teście: ${url.hostname}${url.pathname}`);
};
let signupCallback;
try {
  signupCallback = await completeOAuth(new Request(`https://academy.test/api/auth/callback?state=${encodeURIComponent(signupState)}&code=test-code`, { headers: { cookie: `academy_oauth_state=${signupCookie}` } }), { ...env, ...configured });
} finally { globalThis.fetch = originalFetch; }
const signupRedirect = signupCallback.headers.get('location') || '';
if (signupCallback.status !== 303 || !signupRedirect.includes('auth_result=success')) throw new Error(`Pełny callback Discord nie zakończył rejestracji: ${signupRedirect}`);
const socialUser = db.prepare('SELECT id,nickname,terms_accepted_at,terms_version FROM academy_users WHERE nickname=? LIMIT 1').get('Nowy-Technik');
if (!socialUser?.id || !socialUser.terms_accepted_at || socialUser.terms_version !== '2026-11-02-v1') throw new Error('Nowe konto Discord nie zapisało profilu oraz zaakceptowanej wersji zasad.');
if (!db.prepare('SELECT 1 AS found FROM academy_auth_identities WHERE provider=? AND provider_subject=? AND user_id=?').get('discord','123456789012345678',socialUser.id)) throw new Error('Nowe konto Discord nie zapisało stabilnego subject dostawcy.');

// Complete GitHub signup against mocked provider endpoints (authorization code + PKCE).
const githubStart = await startOAuth(new Request('https://academy.test/api/auth/start?provider=github&termsAccepted=1&nickname=GitHub-Technik', { headers: { 'cf-connecting-ip': '192.0.2.13' } }), { ...env, ...configured });
if (githubStart.status !== 302) throw new Error('Start pełnej rejestracji GitHub nie powiódł się.');
const githubLocation = new URL(githubStart.headers.get('location'));
const githubState = githubLocation.searchParams.get('state');
const githubCookie = (githubStart.headers.get('set-cookie') || '').match(/academy_oauth_state=([^;]+)/)?.[1];
if (!githubState || !githubCookie || !githubLocation.searchParams.get('code_challenge')) throw new Error('GitHub nie otrzymał bezpiecznego state/PKCE.');
const githubFetchOriginal = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.hostname === 'github.com' && url.pathname === '/login/oauth/access_token') {
    const body = new URLSearchParams(init.body || '');
    if (body.get('code') !== 'github-test-code' || !body.get('code_verifier') || body.get('grant_type') !== 'authorization_code') throw new Error('GitHub token exchange nie zawiera poprawnego code/PKCE.');
    return new Response(JSON.stringify({ access_token: 'mock-github-access-token', token_type: 'bearer', scope: 'read:user' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.hostname === 'api.github.com' && url.pathname === '/user') return new Response(JSON.stringify({ id: 24681012, login: 'github-tech', name: 'GitHub Technik' }), { status: 200, headers: { 'content-type': 'application/json' } });
  throw new Error(`Nieoczekiwane wywołanie fetch GitHub w teście: ${url.hostname}${url.pathname}`);
};
let githubCallback;
try {
  githubCallback = await completeOAuth(new Request(`https://academy.test/api/auth/callback?state=${encodeURIComponent(githubState)}&code=github-test-code`, { headers: { cookie: `academy_oauth_state=${githubCookie}` } }), { ...env, ...configured });
} finally { globalThis.fetch = githubFetchOriginal; }
const githubRedirect = githubCallback.headers.get('location') || '';
if (githubCallback.status !== 303 || !githubRedirect.includes('auth_result=success')) throw new Error(`Pełny callback GitHub nie zakończył rejestracji: ${githubRedirect}`);
const githubUser = db.prepare('SELECT id,terms_version FROM academy_users WHERE nickname=? LIMIT 1').get('GitHub-Technik');
if (!githubUser?.id || githubUser.terms_version !== '2026-11-02-v1' || !db.prepare('SELECT 1 AS found FROM academy_auth_identities WHERE provider=? AND provider_subject=? AND user_id=?').get('github','24681012',githubUser.id)) throw new Error('GitHub nie utworzył konta lub nie zapisał stabilnego identyfikatora subject.');

// A provider link cannot complete after the original academy session has been revoked.
const linkingToken = 'fix18-link-session-token-abcdefghijklmnopqrstuvwxyz123456';
const linkingHash = await sha256Hex(linkingToken);
db.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(linkingHash,userId,now,new Date(Date.now()+86400000).toISOString());
const linkingStart = await startOAuth(new Request('https://academy.test/api/auth/start?provider=discord', { headers: { cookie: `academy_sid=${encodeURIComponent(linkingToken)}`, 'cf-connecting-ip': '192.0.2.12' } }), { ...env, ...configured });
const linkingState = new URL(linkingStart.headers.get('location')).searchParams.get('state');
const linkingCookie = (linkingStart.headers.get('set-cookie') || '').match(/academy_oauth_state=([^;]+)/)?.[1];
await db.prepare('DELETE FROM academy_sessions WHERE token_hash=?').run(linkingHash);
const linkingCallback = await completeOAuth(new Request(`https://academy.test/api/auth/callback?state=${encodeURIComponent(linkingState)}&code=not-used`, { headers: { cookie: `academy_sid=${encodeURIComponent(linkingToken)}; academy_oauth_state=${linkingCookie}` } }), { ...env, ...configured });
if (!(linkingCallback.headers.get('location') || '').includes('link_session_expired')) throw new Error('Łączenie dostawcy nie odrzuciło unieważnionej sesji.');

// Auth identity unlink: last provider is protected; with another provider it may be removed.
const token = 'fix18-session-token-abcdefghijklmnopqrstuvwxyz123456';
const tokenHash = await sha256Hex(token);
db.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(tokenHash,userId,now,new Date(Date.now()+86400000).toISOString());
const cookieHeader = `academy_sid=${encodeURIComponent(token)}`;
const oneIdentityUser = 'fix18-last-login-user';
db.prepare('INSERT INTO academy_users(id,nickname,created_at,last_seen_at,consent_at,consent_version,locale) VALUES(?,?,?,?,NULL,NULL,?)').run(oneIdentityUser,'Single',now,now,'pl');
db.prepare('INSERT INTO academy_auth_identities(provider,provider_subject,user_id,created_at) VALUES(?,?,?,?)').run('google','only-google',oneIdentityUser,now);
const singleToken = 'fix18-single-session-token-abcdefghijklmnopqrstuvwxyz123456';
const singleHash = await sha256Hex(singleToken);
db.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(singleHash,oneIdentityUser,now,new Date(Date.now()+86400000).toISOString());
const blocked = await unlinkIdentity({ request: new Request('https://academy.test/api/auth/identities',{method:'DELETE',headers:{cookie:`academy_sid=${singleToken}`,origin:'https://academy.test','content-type':'application/json'},body:JSON.stringify({provider:'google'})}), env });
if (blocked.status !== 409) throw new Error('API pozwoliło usunąć ostatnią metodę logowania.');

// Sessions: list current + second device, then revoke only other sessions.
const otherTokenHash = await sha256Hex('fix18-another-session-token-abcdefghijklmnopqrstuvwxyz123456');
db.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').run(otherTokenHash,userId,now,new Date(Date.now()+86400000).toISOString());
const sessionResponse = await listSessions({ request: new Request('https://academy.test/api/auth/sessions',{headers:{cookie:cookieHeader}}), env });
const sessionData = await sessionResponse.json();
if (sessionResponse.status !== 200 || !sessionData.sessions.some(x=>x.isCurrent) || !sessionData.canRevokeOthers) throw new Error('Lista sesji nie rozpoznaje bieżącej i innej sesji.');
const revokedResponse = await revokeSessions({ request: new Request('https://academy.test/api/auth/sessions',{method:'DELETE',headers:{cookie:cookieHeader,origin:'https://academy.test','content-type':'application/json'},body:'{}'}), env });
const revoked = await revokedResponse.json();
if (revokedResponse.status !== 200 || revoked.revoked !== 1 || db.prepare('SELECT COUNT(*) AS c FROM academy_sessions WHERE user_id=?').get(userId).c !== 1) throw new Error('Wylogowanie pozostałych urządzeń nie zachowało bieżącej sesji.');

// Source contract ensures the publisher no longer references an undefined `github` variable
// and checks exact equality between HTML meta build and release.json before migrations.
const publisher = readFileSync(resolve(root,'ONECLICK_AKADEMIA.js'),'utf8');
const watcher = readFileSync(resolve(root,'AUTO_PUBLISH_WATCHER.js'),'utf8');
const html = readFileSync(resolve(root,'WEB_PUBLISH/index.html'),'utf8');
const release = JSON.parse(readFileSync(resolve(root,'WEB_PUBLISH/release.json'),'utf8'));
if (release.release !== '6.8.0' || !html.includes(`content="${release.build}"`) || !publisher.includes('buildMatch[1] !== expectedBuild') || !watcher.includes('match[1] !== expectedBuild')) throw new Error('Walidator wydania nie porównuje dokładnie academy-build.');
if (publisher.includes('oauthUi.includes(github)')) throw new Error('Publikator zawiera niezdefiniowaną zmienną github.');
if (!publisher.includes('0010_account_terms_and_oauth_consent.sql') || !watcher.includes('0010_account_terms_and_oauth_consent.sql') || !html.includes('id="accountOAuthTerms"') || !readFileSync(resolve(root,'functions/_oauth.js'),'utf8').includes('link_session_expired')) throw new Error('Brak migracji zgody, checkboxa lub ponownej walidacji sesji przy łączeniu.');
if (!['google','facebook','microsoft','github','discord'].every(provider=>html.includes(`data-oauth-start="${provider}"`)) || html.includes('data-oauth-start="x"')) throw new Error('Przyciski logowania nie odpowiadają pięciu aktywnym dostawcom.');
if (!html.includes('accountSessionsList') || !html.includes('revokeOtherSessions') || !readFileSync(resolve(root,'functions/api/auth/sessions.js'),'utf8').includes('DELETE FROM academy_sessions WHERE user_id=? AND token_hash<>?')) throw new Error('Brak zarządzania aktywnymi sesjami.');
console.log('PASS: migracje 0008/0009, pięciu aktywnych providerów i zachowanie historycznych rekordów X.');
console.log('PASS: status OAuth, przekierowania, PKCE/state i bezpieczne cookie dla pięciu aktywnych dostawców.');
console.log('PASS: brak sekretów oznacza nieaktywny provider; nie ma fikcyjnej aktywacji.');
console.log('PASS: pełny callback Discord i GitHub tworzy konta, zapisuje subject oraz akceptację zasad.');
console.log('PASS: łączenie dostawcy jest blokowane po wygaśnięciu pierwotnej sesji.');
console.log('PASS: rejestracja społecznościowa wymaga akceptacji zasad; data i wersja są zapisywane w profilu.');
console.log('PASS: ostatniej metody logowania nie można odłączyć.');
console.log('PASS: panel sesji rozpoznaje bieżącą sesję i usuwa tylko inne urządzenia.');
console.log('PASS: walidator dokładnie porównuje academy-build; usunięto błąd niezdefiniowanej zmiennej github.');
