import { ACCOUNT_TERMS_VERSION, clearSessionCookie, CONSENT_VERSION, dbRequired, getSession, hashedClientRateKey, json, nowIso, randomToken, readJson, rateLimit, sameOrigin, sessionCookie, sha256Hex } from '../_lib.js';
import { accountSchemaStatus } from '../_account-schema.js';
import { createTotpChallenge, totpChallengeCookie } from '../_totp.js';
import { emailDeliveryStatus, sendVerificationEmail } from '../_mail.js';
import { createPasswordSalt, derivePassword, isSupportedPasswordSalt, DUMMY_PASSWORD_SALT } from '../_password-kdf.js';

const cleanNickname = value => String(value || '').replace(/[<>\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32);
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
function normalizeEmail(value) { return String(value || '').trim().toLowerCase().slice(0, 254); }
function constantTimeEqual(a, b) {
  const aa = new TextEncoder().encode(String(a || ''));
  const bb = new TextEncoder().encode(String(b || ''));
  let diff = aa.length ^ bb.length;
  const max = Math.max(aa.length, bb.length);
  for (let i = 0; i < max; i++) diff |= (aa[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}
function validateEmailAndPassword(body, purpose='register') {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (email.length < 6 || email.length > 254 || !EMAIL_RE.test(email)) return { error: 'Podaj prawidłowy adres e-mail.' };
  if (purpose === 'login') {
    if (password.length < 1 || password.length > 128) return { error: 'Nieprawidłowy e-mail lub hasło.' };
  } else if (password.length < 12 || password.length > 128) {
    return { error: 'Hasło musi mieć od 12 do 128 znaków.' };
  }
  return { email, password };
}

function schemaUpgradeResponse(missing) {
  return json({ error:'ACCOUNT_SCHEMA_NOT_READY', accountRegistrationAvailable:false, accountSchemaReady:false, accountSchemaMissing:missing, missingColumns:missing, message:'Rejestracja i logowanie e-mail/hasło czekają na komplet migracji 0006, 0010, 0011, 0012 i 0013–0015 (konta, sesje, limity prób, 2FA, poczta i limiter v3). Uruchom bezpieczny publikator Akademii, który wykona kopię istniejącej bazy i zastosuje migracje addytywne. Nie twórz nowej bazy.' }, 503);
}

async function createSession(env, userId) {
  const token = randomToken();
  const now = nowIso();
  await env.DB.prepare('INSERT INTO academy_sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)')
    .bind(await sha256Hex(token), userId, now, new Date(Date.now() + 15552000 * 1000).toISOString()).run();
  return sessionCookie(token);
}
async function registerEmailAccount(request, env, body) {
  const validated = validateEmailAndPassword(body, 'register');
  if (validated.error) return json({ error: 'INVALID_CREDENTIALS', message: validated.error }, 400);
  if (body.termsAccepted !== true) return json({ error: 'TERMS_REQUIRED', message: 'Zaakceptuj zasady korzystania i politykę prywatności.' }, 400);
  const { email, password } = validated;
  const ipKey = await hashedClientRateKey(request, 'email-register');
  const emailKey = `email-register:${await sha256Hex(email)}`;
  if (!await rateLimit(env, ipKey, 5, 3600) || !await rateLimit(env, emailKey, 3, 3600)) {
    return json({ error: 'REGISTRATION_RATE_LIMIT', message: 'Zbyt wiele prób rejestracji. Spróbuj ponownie później.' }, 429);
  }
  const current = await getSession(request, env);
  const existing = await env.DB.prepare('SELECT id FROM academy_users WHERE email_normalized=? LIMIT 1').bind(email).first();
  if (existing && existing.id !== current?.id) return json({ error: 'ACCOUNT_EXISTS', message: 'Konto z tym adresem e-mail już istnieje. Wybierz logowanie zamiast rejestracji.' }, 409);
  const salt = createPasswordSalt();
  const hash = await derivePassword(password, salt);
  const now = nowIso();
  let userId = current?.id;
  const nickname = cleanNickname(body.nickname) || current?.nickname || `Serwisant-${crypto.randomUUID().slice(0, 6)}`;
  if (userId) {
    await env.DB.prepare('UPDATE academy_users SET email_normalized=?,email_verified_at=NULL,password_salt=?,password_hash=?,nickname=?,last_seen_at=?,terms_accepted_at=?,terms_version=? WHERE id=?')
      .bind(email, salt, hash, nickname, now, now, ACCOUNT_TERMS_VERSION, userId).run();
  } else {
    userId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO academy_users (id,nickname,created_at,last_seen_at,consent_at,consent_version,locale,email_normalized,password_salt,password_hash,terms_accepted_at,terms_version) VALUES (?,?,?,?,NULL,NULL,?,?,?,?,?,?)')
      .bind(userId, nickname, now, now, body.locale === 'en' ? 'en' : 'pl', email, salt, hash, now, ACCOUNT_TERMS_VERSION).run();
  }
  let verificationSent = false;
  if (emailDeliveryStatus(env).ready) {
    try { await sendVerificationEmail(env, request, userId, email); verificationSent = true; }
    catch { verificationSent = false; }
  }
  const cookie = await createSession(env, userId);
  const verificationMessage = verificationSent ? ' Wysłaliśmy link potwierdzający adres e-mail.' : (emailDeliveryStatus(env).ready ? ' Nie udało się wysłać wiadomości potwierdzającej — wyślij ją ponownie w panelu konta.' : ' Wysyłka potwierdzenia e-mail nie jest skonfigurowana.');
  return json({ ok: true, purpose: 'register', user: { id: userId, nickname, email }, consented: !!current?.consent_at, verificationSent, emailVerified: false, message: 'Konto zostało utworzone. Możesz zalogować się tym adresem e-mail i hasłem na innym urządzeniu. Synchronizacja historii nauki pozostaje osobną, dobrowolną zgodą.' + verificationMessage }, 201, { 'set-cookie': cookie });
}
async function accountStage(stage, operation) {
  try { return await operation(); }
  catch (error) {
    if (error && typeof error === 'object') error.accountStage = stage;
    throw error;
  }
}

async function loginEmailAccount(request, env, body) {
  const validated = validateEmailAndPassword(body, 'login');
  if (validated.error) return json({ error: 'INVALID_CREDENTIALS', message: 'Nieprawidłowy e-mail lub hasło.' }, 401);
  const { email, password } = validated;
  const ipKey = await accountStage('login-rate-key-ip', () => hashedClientRateKey(request, 'email-login'));
  const emailKey = `email-login:${await accountStage('login-rate-key-email', () => sha256Hex(email))}`;
  const ipAllowed = await accountStage('login-rate-limit-ip', () => rateLimit(env, ipKey, 12, 900));
  if (!ipAllowed) return json({ error: 'LOGIN_RATE_LIMIT', message: 'Zbyt wiele prób logowania. Odczekaj i spróbuj ponownie.' }, 429);
  const emailAllowed = await accountStage('login-rate-limit-email', () => rateLimit(env, emailKey, 10, 3600));
  if (!emailAllowed) return json({ error: 'LOGIN_RATE_LIMIT', message: 'Zbyt wiele prób logowania. Odczekaj i spróbuj ponownie.' }, 429);
  const row = await accountStage('login-account-lookup', () => env.DB.prepare('SELECT id,nickname,email_normalized,password_salt,password_hash,consent_at,consent_version,totp_enabled_at,email_verified_at FROM academy_users WHERE email_normalized=? LIMIT 1').bind(email).first());
  // Always perform the same supported KDF for unknown accounts and legacy salts.
  // Unversioned salts came from a pre-FIX25 scheme that requested 210,000 iterations;
  // Cloudflare Workers rejects that value, so those accounts must use the password-reset flow.
  const currentKdf = isSupportedPasswordSalt(row?.password_salt);
  const salt = currentKdf ? row.password_salt : DUMMY_PASSWORD_SALT;
  const candidate = await accountStage('login-password-kdf', () => derivePassword(password, salt));
  if (!row?.password_hash || !currentKdf || !constantTimeEqual(candidate, row.password_hash)) {
    return json({ error: 'LOGIN_FAILED', message: 'Nieprawidłowy e-mail lub hasło. Dla kont utworzonych w starszej wersji może być wymagany reset hasła.' }, 401);
  }
  const consented = !!(row.consent_at && row.consent_version === CONSENT_VERSION);
  if (emailDeliveryStatus(env).ready && !row.email_verified_at) {
    try { await sendVerificationEmail(env, request, row.id, row.email_normalized); }
    catch { return json({ error:'EMAIL_NOT_VERIFIED', message:'Adres e-mail nie jest potwierdzony, a wiadomość nie została wysłana. Sprawdź ustawienia poczty i spróbuj ponownie.' }, 502); }
    return json({ error:'EMAIL_NOT_VERIFIED', message:'Wysłaliśmy nowy link potwierdzający. Otwórz wiadomość, a następnie zaloguj się ponownie.' }, 403);
  }
  if (row.totp_enabled_at) {
    if (!env.AUTH_TOTP_ENCRYPTION_KEY) return json({ error:'TOTP_CONFIGURATION_MISSING', message:'Konto ma włączone uwierzytelnianie dwuskładnikowe, ale brakuje klucza ochrony TOTP na serwerze. Logowanie zostało bezpiecznie zatrzymane.' }, 503);
    const challenge = await createTotpChallenge(env, row.id);
    return json({ ok:true, requiresTotp:true, purpose:'login', message:'Hasło poprawne. Potwierdź logowanie kodem z aplikacji uwierzytelniającej albo jednorazowym kodem odzyskiwania.' }, 200, { 'set-cookie': totpChallengeCookie(challenge.token) });
  }
  const cookie = await accountStage('login-create-session', () => createSession(env, row.id));
  return json({ ok: true, purpose: 'login', user: { id: row.id, nickname: row.nickname, email: row.email_normalized }, consented, message: 'Zalogowano. Historia nauki jest synchronizowana tylko wtedy, gdy wcześniej wyrażono osobną zgodę.' }, 200, { 'set-cookie': cookie });
}

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const schema = await accountSchemaStatus(env);
  let user = null;
  try { user = await getSession(request, env); } catch { user = null; }
  return json({ enabled: true, accountRegistrationAvailable: schema.ready, accountSchemaReady: schema.ready, accountSchemaMissing: schema.missing, accountLimiterTable: 'academy_account_rate_limits_v3', accountRegistrationMessage: schema.ready ? '' : `Schemat kont wymaga migracji 0015 lub uzupełnienia: ${schema.missing.join(', ')}. Dane dotychczasowych profili pozostają zachowane.`, active: !!user, consented: !!(user?.consent_at && user?.consent_version === CONSENT_VERSION), user: user ? { id: user.id, nickname: user.nickname, email: user.email_normalized || null, createdAt: user.created_at } : null });
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  let body; try { body = await readJson(request, 5000); } catch (e) { return json({ error: e.message }, 400); }
  const now = nowIso();
  const nickname = cleanNickname(body.nickname);
  const locale = body.locale === 'en' ? 'en' : 'pl';

  if (body.purpose === 'register' || body.purpose === 'login') {
    const schema = await accountSchemaStatus(env);
    if (!schema.ready) return schemaUpgradeResponse(schema.missing);
    try {
      return body.purpose === 'register'
        ? await registerEmailAccount(request, env, body)
        : await loginEmailAccount(request, env, body);
    } catch (error) {
      const message = String(error?.message || error || '');
      if (/no such table|no such column|academy_account_rate_limits(?:_v2|_v3)?|academy_sessions|email_normalized|password_salt|password_hash/i.test(message)) {
        const currentSchema = await accountSchemaStatus(env);
        return schemaUpgradeResponse(currentSchema.missing.length ? currentSchema.missing : ['schemat kont D1 wymaga ponownej kontroli']);
      }
      const diagnosticRef = crypto.randomUUID().slice(0, 8).toUpperCase();
      const stage = String(error?.accountStage || (body.purpose === 'login' ? 'login-unclassified' : 'register-unclassified'));
      // Cloudflare logs retain bounded runtime detail, stage and ref; never log email, password or request body.
      console.error('[ACCOUNT_OPERATION_FAILED]', diagnosticRef, stage, String(error?.name || 'Error'), message.slice(0, 240));
      return json({ error:'ACCOUNT_OPERATION_FAILED', reference:diagnosticRef, stage, message:`Nie udało się wykonać operacji konta. Kod diagnostyczny: ${diagnosticRef}.` }, 503);
    }
  }

  // Contribution-only registration: a nickname is enough to submit a case or device record.
  if (body.purpose === 'contribution') {
    if (nickname.length < 3) return json({ error: 'NICKNAME_REQUIRED', message: 'Podaj pseudonim o długości 3–32 znaków.' }, 400);
    const ipKey = await hashedClientRateKey(request, 'contributor-register');
    if (!await rateLimit(env, ipKey, 6, 3600)) return json({ error: 'REGISTRATION_RATE_LIMIT', message: 'Zbyt wiele nowych profili z tej sieci. Spróbuj ponownie później.' }, 429);
    try { await env.DB.prepare('DELETE FROM academy_account_rate_limits_v3 WHERE window_start < ?').bind(Math.floor(Date.now()/1000) - 172800).run(); } catch {}
    let user = await getSession(request, env);
    if (user) {
      await env.DB.prepare('UPDATE academy_users SET nickname=?, locale=?, last_seen_at=? WHERE id=?').bind(nickname, locale, now, user.id).run();
      return json({ ok: true, purpose: 'contribution', user: { id: user.id, nickname, email: user.email_normalized || null }, message: 'Profil autora jest gotowy. Historia nauki pozostaje niesynchronizowana.' });
    }
    const token = randomToken();
    const tokenHash = await sha256Hex(token);
    const userId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO academy_users (id,nickname,created_at,last_seen_at,consent_at,consent_version,locale) VALUES (?,?,?,?,NULL,NULL,?)')
      .bind(userId, nickname, now, now, locale).run();
    await env.DB.prepare('INSERT INTO academy_sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)')
      .bind(tokenHash, userId, now, new Date(Date.now()+15552000*1000).toISOString()).run();
    return json({ ok: true, purpose: 'contribution', user: { id: userId, nickname, email: null }, message: 'Profil autora utworzony. Możesz wysyłać przypadki do moderacji; synchronizacja historii pozostaje wyłączona.' }, 200, { 'set-cookie': sessionCookie(token) });
  }

  if (body.consent !== true) return json({ error: 'CONSENT_REQUIRED', message: 'Aby włączyć zapis historii w chmurze, potwierdź osobną zgodę.' }, 400);
  let user = await getSession(request, env);
  let token = '';
  if (user) {
    await env.DB.prepare('UPDATE academy_users SET nickname=?, consent_at=?, consent_version=?, locale=?, last_seen_at=? WHERE id=?')
      .bind(nickname || user.nickname, now, CONSENT_VERSION, locale, now, user.id).run();
    const rawCookie = (request.headers.get('cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('academy_sid='));
    token = rawCookie ? decodeURIComponent(rawCookie.slice('academy_sid='.length)) : '';
  } else {
    token = randomToken();
    const userId = crypto.randomUUID();
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('INSERT INTO academy_users (id,nickname,created_at,last_seen_at,consent_at,consent_version,locale) VALUES (?,?,?,?,?,?,?)')
      .bind(userId, nickname || `Uczeń-${userId.slice(0,6)}`, now, now, now, CONSENT_VERSION, locale).run();
    await env.DB.prepare('INSERT INTO academy_sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)')
      .bind(tokenHash, userId, now, new Date(Date.now()+15552000*1000).toISOString()).run();
    user = { id: userId, nickname: nickname || `Uczeń-${userId.slice(0,6)}`, email_normalized: null };
  }
  return json({ ok: true, purpose: 'learning-sync', user: { id: user.id, nickname: nickname || user.nickname, email: user.email_normalized || null }, consentVersion: CONSENT_VERSION }, 200, { 'set-cookie': sessionCookie(token) });
}

export async function onRequestDelete({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error: 'ORIGIN_REJECTED' }, 403);
  const rawCookie = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith('academy_sid='));
  const token = rawCookie ? decodeURIComponent(rawCookie.slice('academy_sid='.length)) : '';
  if (token && token.length >= 40 && token.length <= 100) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('DELETE FROM academy_sessions WHERE token_hash=?').bind(tokenHash).run();
  }
  return json({ ok: true, loggedOut: true }, 200, { 'set-cookie': clearSessionCookie() });
}
