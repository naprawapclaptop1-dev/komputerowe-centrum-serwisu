import { ACCOUNT_TERMS_VERSION, dbRequired, getSession, hashedClientRateKey, json, nowIso, randomToken, rateLimit, sha256Hex, sessionCookie, text, recordSecurityEvent } from './_lib.js';
import { createTotpChallenge, totpChallengeCookie } from './_totp.js';

const PROVIDERS = new Set(['google', 'facebook', 'microsoft', 'github', 'discord']);
const providerConfig = (provider, env) => {
  if (provider === 'google') return { clientId: env.GOOGLE_CLIENT_ID || '', clientSecret: env.GOOGLE_CLIENT_SECRET || '' };
  if (provider === 'facebook') return { clientId: env.FACEBOOK_CLIENT_ID || '', clientSecret: env.FACEBOOK_CLIENT_SECRET || '', graphVersion: env.FACEBOOK_GRAPH_VERSION || 'v26.0' };
  if (provider === 'microsoft') return { clientId: env.MICROSOFT_CLIENT_ID || '', clientSecret: env.MICROSOFT_CLIENT_SECRET || '', tenant: env.MICROSOFT_TENANT_ID || 'common' };
  if (provider === 'github') return { clientId: env.GITHUB_CLIENT_ID || '', clientSecret: env.GITHUB_CLIENT_SECRET || '' };
  if (provider === 'discord') return { clientId: env.DISCORD_CLIENT_ID || '', clientSecret: env.DISCORD_CLIENT_SECRET || '' };
  return null;
};
const PROVIDER_SECRET_KEYS = Object.freeze({
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  facebook: ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
  microsoft: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
  github: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
  discord: ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'],
});
export function oauthProviderDiagnostics(env) {
  return Object.fromEntries(Object.entries(PROVIDER_SECRET_KEYS).map(([provider, keys]) => {
    const missingKeys = keys.filter(key => !String(env?.[key] || '').trim());
    return [provider, { configured: missingKeys.length === 0, missingKeys }];
  }));
}
export function oauthProviderStatus(env) {
  return Object.fromEntries(Object.entries(oauthProviderDiagnostics(env)).map(([provider, item]) => [provider, item.configured]));
}
const REQUIRED_OAUTH_COLUMNS = Object.freeze({
  academy_oauth_states: ['state_hash','provider','code_verifier','nonce','nickname','link_user_id','terms_accepted','created_at','expires_at'],
  academy_auth_identities: ['provider','provider_subject','user_id','created_at'],
  academy_users: ['terms_accepted_at','terms_version','email_verified_at','totp_secret_cipher','totp_secret_iv','totp_pending_expires_at','totp_enabled_at'],
  academy_sessions: ['token_hash','user_id','created_at','expires_at'],
  academy_totp_login_challenges: ['token_hash','user_id','created_at','expires_at','attempts'],
  academy_totp_recovery_codes: ['user_id','code_hash','created_at','used_at'],
  academy_email_tokens: ['token_hash','user_id','email_normalized','purpose','created_at','expires_at','used_at'],
  academy_account_rate_limits_v3: ['bucket_key','window_start','request_count']
});
const REQUIRED_OAUTH_PROVIDERS = ['google','facebook','microsoft','github','discord'];
export async function oauthSchemaStatus(env) {
  if (!env?.DB) return { ready: false, missing: ['binding D1: DB'] };
  const missing = [];
  try {
    for (const [table, required] of Object.entries(REQUIRED_OAUTH_COLUMNS)) {
      const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
      const columns = new Set((info.results || []).map(row => String(row.name || '')));
      if (!columns.size) missing.push(`tabela ${table}`);
      for (const column of required) if (!columns.has(column)) missing.push(`${table}.${column}`);
    }
    const limiterInfo = await env.DB.prepare('PRAGMA table_info(academy_account_rate_limits_v3)').all();
    const limiterColumns = limiterInfo.results || [];
    const limiterPk = limiterColumns.filter(row => Number(row.pk || 0) > 0).sort((a,b)=>Number(a.pk)-Number(b.pk)).map(row=>String(row.name||''));
    const limiterBucket = limiterColumns.find(row => row.name === 'bucket_key');
    if (limiterPk.length !== 1 || limiterPk[0] !== 'bucket_key' || !limiterBucket || Number(limiterBucket.notnull || 0) !== 1) missing.push('academy_account_rate_limits_v3: wymagany pojedynczy PRIMARY KEY(bucket_key) NOT NULL');
    for (const table of ['academy_oauth_states','academy_auth_identities']) {
      const row = await env.DB.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(table).first();
      const createSql = String(row?.sql || '').toLowerCase();
      for (const provider of REQUIRED_OAUTH_PROVIDERS) {
        if (!createSql.includes(`'${provider}'`)) missing.push(`ograniczenie dostawców ${table}: ${provider}`);
      }
    }
  } catch {
    missing.push('schemat D1: odczyt struktury OAuth nie powiódł się');
  }
  return { ready: missing.length === 0, missing: [...new Set(missing)] };
}
function b64url(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
async function challenge(verifier) { return b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))); }
function callbackUrl(request) { return new URL('/api/auth/callback', request.url).toString(); }
function nickname(value) { return text(value, 32).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim(); }
function redirectTo(request, result, error = '') {
  const url = new URL('/', request.url);
  url.searchParams.set('auth_result', result);
  if (error) url.searchParams.set('auth_error', error);
  url.hash = result === 'two_factor_required' ? 'view=account' : 'view=community';
  return url;
}
function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0 || part.slice(0, idx).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(idx + 1).trim()); } catch { return ''; }
  }
  return '';
}
function oauthStateCookie(state, clear = false) {
  return `academy_oauth_state=${clear ? '' : encodeURIComponent(state)}; Path=/api/auth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=${clear ? 0 : 600}`;
}
function oauthRedirect(request, result, error = '') {
  const headers = new Headers({ location: redirectTo(request, result, error).toString(), 'cache-control': 'no-store' });
  headers.append('set-cookie', oauthStateCookie('', true));
  return new Response(null, { status: 303, headers });
}
function randomUserNickname(value, provider) {
  const safe = nickname(value);
  if (safe.length >= 3) return safe;
  return `Technik-${provider}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function startOAuth(request, env) {
  const missing = dbRequired(env); if (missing) return missing;
  const schema = await oauthSchemaStatus(env);
  if (!schema.ready) return Response.redirect(redirectTo(request, 'error', 'oauth_schema_not_ready'), 303);
  const url = new URL(request.url);
  const provider = String(url.searchParams.get('provider') || '').toLowerCase();
  if (!PROVIDERS.has(provider)) return json({ error: 'OAUTH_PROVIDER_INVALID' }, 400);
  const config = providerConfig(provider, env);
  if (!config?.clientId || !config?.clientSecret) return Response.redirect(redirectTo(request, 'error', `${provider}_not_configured`), 303);
  const rateKey = await hashedClientRateKey(request, `oauth-start-${provider}`);
  if (!await rateLimit(env, rateKey, 12, 900)) return json({ error: 'OAUTH_RATE_LIMIT', message: 'Zbyt wiele prób logowania zewnętrznego. Odczekaj 15 minut i spróbuj ponownie.' }, 429);

  const state = randomToken();
  const codeVerifier = randomToken();
  const nonce = randomToken();
  const currentUser = await getSession(request, env);
  const linkUserId = currentUser?.id || null;
  const termsAccepted = url.searchParams.get('termsAccepted') === '1';
  if (!currentUser && !termsAccepted) return Response.redirect(redirectTo(request, 'error', 'terms_required'), 303);
  const now = nowIso();
  await env.DB.prepare(`INSERT INTO academy_oauth_states(state_hash,provider,code_verifier,nonce,nickname,link_user_id,terms_accepted,created_at,expires_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).bind(await sha256Hex(state), provider, codeVerifier, nonce, nickname(url.searchParams.get('nickname')), linkUserId, termsAccepted ? 1 : 0, now, new Date(Date.now() + 10 * 60 * 1000).toISOString()).run();
  try { await env.DB.prepare('DELETE FROM academy_oauth_states WHERE expires_at < ?').bind(now).run(); } catch {}

  const redirectUri = callbackUrl(request);
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: redirectUri, response_type: 'code', state });
  if (provider !== 'facebook') {
    params.set('code_challenge', await challenge(codeVerifier));
    params.set('code_challenge_method', 'S256');
  }
  let authorizeUrl;
  if (provider === 'google') {
    params.set('scope', 'openid profile');
    params.set('nonce', nonce);
    params.set('prompt', 'select_account');
    authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  } else if (provider === 'microsoft') {
    params.set('scope', 'openid profile');
    params.set('nonce', nonce);
    params.set('response_mode', 'query');
    const tenant = encodeURIComponent(config.tenant || 'common');
    authorizeUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
  } else if (provider === 'facebook') {
    params.set('scope', 'public_profile');
    params.set('auth_type', 'rerequest');
    authorizeUrl = `https://www.facebook.com/${config.graphVersion}/dialog/oauth?${params}`;
  } else if (provider === 'github') {
    params.set('scope', 'read:user');
    params.set('allow_signup', 'true');
    authorizeUrl = `https://github.com/login/oauth/authorize?${params}`;
  } else {
    params.set('scope', 'identify');
    params.set('prompt', 'consent');
    authorizeUrl = `https://discord.com/oauth2/authorize?${params}`;
  }
  const headers = new Headers({ location: authorizeUrl, 'cache-control': 'no-store' });
  headers.append('set-cookie', oauthStateCookie(state));
  return new Response(null, { status: 302, headers });
}

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function parseJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Nieprawidłowy token dostawcy.');
  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  return { parts, header, claims };
}
async function getOidcMetadata(provider, tenant = 'common') {
  const url = provider === 'google'
    ? 'https://accounts.google.com/.well-known/openid-configuration'
    : `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/v2.0/.well-known/openid-configuration`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('Nie można pobrać konfiguracji OpenID dostawcy.');
  const metadata = await response.json();
  if (!metadata.jwks_uri || !metadata.token_endpoint || !metadata.authorization_endpoint) throw new Error('Niekompletna konfiguracja OpenID.');
  const allowedHost = provider === 'google' ? 'www.googleapis.com' : 'login.microsoftonline.com';
  if (new URL(metadata.jwks_uri).hostname !== allowedHost) throw new Error('Nieoczekiwany adres kluczy OpenID.');
  if (new URL(metadata.token_endpoint).hostname !== (provider === 'google' ? 'oauth2.googleapis.com' : 'login.microsoftonline.com')) throw new Error('Nieoczekiwany adres tokenów OpenID.');
  return metadata;
}
async function verifyOidcToken(token, provider, clientId, expectedNonce, tenant = 'common') {
  const { parts, header, claims } = parseJwt(token);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Nieobsługiwany podpis tokenu.');
  const metadata = await getOidcMetadata(provider, tenant);
  const keyResponse = await fetch(metadata.jwks_uri, { headers: { accept: 'application/json' } });
  if (!keyResponse.ok) throw new Error('Nie można pobrać kluczy publicznych dostawcy.');
  const jwks = await keyResponse.json();
  const jwk = (jwks.keys || []).find(item => item.kid === header.kid && item.kty === 'RSA' && item.use !== 'enc');
  if (!jwk) throw new Error('Brak klucza podpisującego token dostawcy.');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, decodeBase64Url(parts[2]), signed);
  if (!valid) throw new Error('Podpis tokenu dostawcy jest nieprawidłowy.');
  const now = Math.floor(Date.now() / 1000);
  const multiAudience = Array.isArray(claims.aud);
  const audienceOk = multiAudience ? claims.aud.includes(clientId) : claims.aud === clientId;
  const expired = Number(claims.exp || 0) <= now;
  const issuedInFuture = Number(claims.iat || 0) > now + 300;
  const notYetValid = claims.nbf != null && Number(claims.nbf) > now + 60;
  const authorizedPartyInvalid = multiAudience && claims.azp !== clientId;
  if (!audienceOk || expired || issuedInFuture || notYetValid || authorizedPartyInvalid || claims.nonce !== expectedNonce || !claims.sub) throw new Error('Nieprawidłowe lub wygasłe oświadczenia logowania.');
  if (provider === 'google') {
    if (!['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss)) throw new Error('Nieprawidłowy wystawca tokenu Google.');
  } else {
    const tid = String(claims.tid || '');
    if (!/^[0-9a-f-]{36}$/i.test(tid) || claims.iss !== `https://login.microsoftonline.com/${tid}/v2.0`) throw new Error('Nieprawidłowy wystawca tokenu Microsoft.');
  }
  return { subject: String(claims.sub), displayName: text(claims.name || claims.preferred_username || '', 80) };
}
async function exchangeCode(provider, config, code, codeVerifier, redirectUri) {
  let endpoint = provider === 'google' ? 'https://oauth2.googleapis.com/token'
    : provider === 'microsoft' ? `https://login.microsoftonline.com/${encodeURIComponent(config.tenant || 'common')}/oauth2/v2.0/token`
      : provider === 'facebook' ? `https://graph.facebook.com/${config.graphVersion}/oauth/access_token`
        : provider === 'github' ? 'https://github.com/login/oauth/access_token'
          : 'https://discord.com/api/oauth2/token';
  const body = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: redirectUri });
  let response;
  if (provider === 'facebook') {
    // Facebook Login exchanges the authorization code through the Graph access_token endpoint.
    response = await fetch(`${endpoint}?${body.toString()}`, { headers: { accept: 'application/json' } });
  } else {
    body.set('grant_type', 'authorization_code');
    body.set('code_verifier', codeVerifier);
    response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error('Dostawca nie zaakceptował kodu logowania.');
  return data;
}
async function hmacSha256Hex(message, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function getIdentity(provider, config, tokenData, nonce) {
  if (provider === 'google' || provider === 'microsoft') {
    if (!tokenData.id_token) throw new Error('Dostawca nie zwrócił tokenu ID.');
    return verifyOidcToken(tokenData.id_token, provider, config.clientId, nonce, config.tenant || 'common');
  }
  if (!tokenData.access_token) throw new Error('Dostawca nie zwrócił tokenu dostępu.');
  if (provider === 'facebook') {
    const appToken = `${config.clientId}|${config.clientSecret}`;
    const debugUrl = new URL(`https://graph.facebook.com/${config.graphVersion}/debug_token`);
    debugUrl.searchParams.set('input_token', tokenData.access_token);
    debugUrl.searchParams.set('access_token', appToken);
    const debugResponse = await fetch(debugUrl, { headers: { accept: 'application/json' } });
    const debug = await debugResponse.json().catch(() => ({}));
    const tokenInfo = debug.data || {};
    if (!debugResponse.ok || tokenInfo.is_valid !== true || String(tokenInfo.app_id || '') !== String(config.clientId) || !tokenInfo.user_id) {
      throw new Error('Token Facebook nie jest ważny dla skonfigurowanej aplikacji.');
    }
    const proof = await hmacSha256Hex(tokenData.access_token, config.clientSecret);
    const profileUrl = new URL(`https://graph.facebook.com/${config.graphVersion}/me`);
    profileUrl.searchParams.set('fields', 'id,name');
    profileUrl.searchParams.set('appsecret_proof', proof);
    const response = await fetch(profileUrl, { headers: { authorization: `Bearer ${tokenData.access_token}`, accept: 'application/json' } });
    const profile = await response.json().catch(() => ({}));
    if (!response.ok || !profile.id || String(profile.id) !== String(tokenInfo.user_id)) throw new Error('Nie udało się potwierdzić profilu Facebook.');
    return { subject: String(profile.id), displayName: text(profile.name || '', 80) };
  }
  if (provider === 'github') {
    const response = await fetch('https://api.github.com/user', { headers: { authorization: `Bearer ${tokenData.access_token}`, accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Nauka-Od-A-Do-Z-Academy' } });
    const profile = await response.json().catch(() => ({}));
    if (!response.ok || !Number.isSafeInteger(Number(profile.id)) || Number(profile.id) <= 0) throw new Error('Nie udało się potwierdzić profilu GitHub.');
    return { subject: String(profile.id), displayName: text(profile.name || profile.login || '', 80) };
  }
  const response = await fetch('https://discord.com/api/users/@me', { headers: { authorization: `Bearer ${tokenData.access_token}`, accept: 'application/json' } });
  const profile = await response.json().catch(() => ({}));
  if (!response.ok || !/^\d{5,30}$/.test(String(profile.id || ''))) throw new Error('Nie udało się potwierdzić profilu Discord. Sprawdź zakres identify.');
  return { subject: String(profile.id), displayName: text(profile.global_name || profile.username || '', 80) };
}

export async function completeOAuth(request, env) {
  const missing = dbRequired(env); if (missing) return missing;
  const schema = await oauthSchemaStatus(env);
  if (!schema.ready) return oauthRedirect(request, 'error', 'oauth_schema_not_ready');
  const url = new URL(request.url);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  const cookieState = readCookie(request, 'academy_oauth_state');
  if (!state || state.length > 160 || state !== cookieState || !code || code.length > 4096 || url.searchParams.has('error')) return oauthRedirect(request, 'error', 'logowanie_anulowane_lub_nieprawidlowy_stan');
  const stateHash = await sha256Hex(state);
  const record = await env.DB.prepare('SELECT * FROM academy_oauth_states WHERE state_hash=? AND expires_at>? LIMIT 1').bind(stateHash, nowIso()).first();
  if (!record || !PROVIDERS.has(record.provider)) return oauthRedirect(request, 'error', 'stan_logowania_wygasl');
  await env.DB.prepare('DELETE FROM academy_oauth_states WHERE state_hash=?').bind(stateHash).run();
  const provider = record.provider;
  if (record.link_user_id) {
    const linkingUser = await getSession(request, env);
    if (!linkingUser || linkingUser.id !== record.link_user_id) return oauthRedirect(request, 'error', 'link_session_expired');
  } else if (Number(record.terms_accepted) !== 1) {
    return oauthRedirect(request, 'error', 'terms_required');
  }
  const config = providerConfig(provider, env);
  if (!config?.clientId || !config?.clientSecret) return oauthRedirect(request, 'error', 'provider_not_configured');
  let tokens;
  try {
    tokens = await exchangeCode(provider, config, code, record.code_verifier, callbackUrl(request));
  } catch (error) {
    console.error('Akademia OAuth token exchange failed:', provider, String(error?.message || error).slice(0, 180));
    return oauthRedirect(request, 'error', 'provider_token_exchange_failed');
  }
  let identity;
  try {
    identity = await getIdentity(provider, config, tokens, record.nonce);
  } catch (error) {
    console.error('Akademia OAuth identity verification failed:', provider, String(error?.message || error).slice(0, 180));
    return oauthRedirect(request, 'error', 'provider_verification_failed');
  }
  try {
    const existing = await env.DB.prepare('SELECT user_id FROM academy_auth_identities WHERE provider=? AND provider_subject=? LIMIT 1').bind(provider, identity.subject).first();
    let userId = existing?.user_id || record.link_user_id || '';
    if (existing && record.link_user_id && existing.user_id !== record.link_user_id) throw new Error('To konto dostawcy jest już połączone z innym profilem Akademii.');
    if (!userId) {
      userId = crypto.randomUUID();
      const created = nowIso();
      const name = randomUserNickname(record.nickname || identity.displayName, provider);
      await env.DB.prepare('INSERT INTO academy_users (id,nickname,created_at,last_seen_at,consent_at,consent_version,locale,terms_accepted_at,terms_version) VALUES (?,?,?,?,NULL,NULL,?,?,?)')
        .bind(userId, name, created, created, 'pl', created, ACCOUNT_TERMS_VERSION).run();
    } else if (!existing) {
      // Linking a provider to a live nickname profile is permitted, but it never enables history synchronization.
      const live = await env.DB.prepare('SELECT id FROM academy_users WHERE id=?').bind(userId).first();
      if (!live) throw new Error('Profil do połączenia już nie istnieje.');
      await env.DB.prepare('UPDATE academy_users SET last_seen_at=? WHERE id=?').bind(nowIso(), userId).run();
    }
    if (Number(record.terms_accepted) === 1) {
      await env.DB.prepare('UPDATE academy_users SET terms_accepted_at=?, terms_version=? WHERE id=?')
        .bind(nowIso(), ACCOUNT_TERMS_VERSION, userId).run();
    }
    if (!existing) await env.DB.prepare('INSERT INTO academy_auth_identities(provider,provider_subject,user_id,created_at) VALUES(?,?,?,?)').bind(provider, identity.subject, userId, nowIso()).run();
    if (!record.link_user_id) {
      const accountSecurity = await env.DB.prepare('SELECT totp_enabled_at FROM academy_users WHERE id=? LIMIT 1').bind(userId).first();
      if (accountSecurity?.totp_enabled_at) {
        if (!env.AUTH_TOTP_ENCRYPTION_KEY) throw new Error('Brak serwerowego klucza ochrony 2FA.');
        const challenge = await createTotpChallenge(env, userId);
        const headers = new Headers({ location: redirectTo(request, 'two_factor_required').toString(), 'cache-control': 'no-store' });
        headers.append('set-cookie', oauthStateCookie('', true));
        headers.append('set-cookie', totpChallengeCookie(challenge.token));
        return new Response(null, { status: 303, headers });
      }
    }
    const sessionToken = randomToken();
    await env.DB.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
      .bind(await sha256Hex(sessionToken), userId, nowIso(), new Date(Date.now() + 15552000 * 1000).toISOString()).run();
    await recordSecurityEvent(env, userId, record.link_user_id ? 'account_linked' : 'oauth_login', { provider });
    const headers = new Headers({ location: redirectTo(request, 'success').toString(), 'cache-control': 'no-store' });
    headers.append('set-cookie', oauthStateCookie('', true));
    headers.append('set-cookie', sessionCookie(sessionToken));
    return new Response(null, { status: 303, headers });
  } catch (error) {
    console.error('Akademia OAuth callback error:', String(error?.message || error).slice(0, 240));
    return oauthRedirect(request, 'error', 'provider_verification_failed');
  }
}
