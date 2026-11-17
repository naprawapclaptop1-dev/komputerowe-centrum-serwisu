import { CONSENT_VERSION, dbRequired, hashedClientRateKey, json, nowIso, randomToken, rateLimit, readJson, sameOrigin, sessionCookie, sha256Hex } from '../../../_lib.js';
import { decryptTotpSecret, hashRecoveryCode, readTotpChallengeCookie, totpChallengeCookie, verifyTotp } from '../../../_totp.js';

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error:'ORIGIN_REJECTED' }, 403);
  if (!env.AUTH_TOTP_ENCRYPTION_KEY) return json({ error:'TOTP_KEY_MISSING', message:'Brak serwerowego klucza ochrony 2FA. Zgłoś problem administratorowi.' }, 503);
  let body; try { body = await readJson(request, 1024); } catch (error) { return json({ error:'INVALID_JSON', message:error.message }, 400); }
  const supplied = String(body.code || '').trim();
  if (!/^(?:\d{6}|[A-Fa-f0-9 -]{16,32})$/.test(supplied)) return json({ error:'TOTP_CODE_INVALID', message:'Wpisz 6 cyfr z aplikacji albo jeden kod odzyskiwania.' }, 400);
  const token = readTotpChallengeCookie(request);
  if (!token || token.length < 40 || token.length > 100) return json({ error:'TOTP_CHALLENGE_MISSING', message:'Sesja potwierdzenia wygasła. Zaloguj się ponownie.' }, 401, { 'set-cookie':totpChallengeCookie('', true) });
  const rateKey = await hashedClientRateKey(request, 'totp-verify');
  if (!await rateLimit(env, rateKey, 10, 900)) return json({ error:'TOTP_RATE_LIMIT', message:'Za dużo prób. Zaloguj się ponownie za 15 minut.' }, 429);
  const tokenHash = await sha256Hex(token);
  const challenge = await env.DB.prepare('SELECT user_id,expires_at,attempts FROM academy_totp_login_challenges WHERE token_hash=? LIMIT 1').bind(tokenHash).first();
  if (!challenge || challenge.expires_at <= nowIso() || Number(challenge.attempts) >= 5) {
    await env.DB.prepare('DELETE FROM academy_totp_login_challenges WHERE token_hash=?').bind(tokenHash).run();
    return json({ error:'TOTP_CHALLENGE_EXPIRED', message:'Potwierdzenie logowania wygasło. Zaloguj się ponownie.' }, 401, { 'set-cookie':totpChallengeCookie('', true) });
  }
  const account = await env.DB.prepare('SELECT id,nickname,email_normalized,consent_at,consent_version,totp_secret_cipher,totp_secret_iv,totp_enabled_at FROM academy_users WHERE id=? LIMIT 1').bind(challenge.user_id).first();
  let valid = false, usedRecovery = false;
  try {
    if (account?.totp_enabled_at && account.totp_secret_cipher && account.totp_secret_iv) {
      const secret = await decryptTotpSecret(account.totp_secret_cipher, account.totp_secret_iv, env);
      valid = await verifyTotp(secret, supplied);
      if (!valid) {
        const normalized = supplied.replace(/[^a-f0-9]/gi, '').toUpperCase();
        const codeHash = await hashRecoveryCode(normalized);
        const result = await env.DB.prepare('UPDATE academy_totp_recovery_codes SET used_at=? WHERE user_id=? AND code_hash=? AND used_at IS NULL')
          .bind(nowIso(), account.id, codeHash).run();
        valid = Number(result?.meta?.changes ?? result?.changes ?? 0) === 1;
        usedRecovery = valid;
      }
    }
  } catch { valid = false; }
  if (!valid) {
    await env.DB.prepare('UPDATE academy_totp_login_challenges SET attempts=attempts+1 WHERE token_hash=?').bind(tokenHash).run();
    const after = await env.DB.prepare('SELECT attempts FROM academy_totp_login_challenges WHERE token_hash=?').bind(tokenHash).first();
    const locked = Number(after?.attempts || 0) >= 5;
    if (locked) await env.DB.prepare('DELETE FROM academy_totp_login_challenges WHERE token_hash=?').bind(tokenHash).run();
    return json({ error:'TOTP_CODE_INVALID', message:locked?'Wykorzystano 5 prób. Zaloguj się ponownie.':'Kod jest nieprawidłowy. Spróbuj ponownie.' }, 401, locked ? { 'set-cookie':totpChallengeCookie('', true) } : {});
  }
  if (!account) return json({ error:'ACCOUNT_NOT_FOUND' }, 401, { 'set-cookie':totpChallengeCookie('', true) });
  const claimed = await env.DB.prepare('DELETE FROM academy_totp_login_challenges WHERE token_hash=? AND expires_at>? AND attempts<5').bind(tokenHash, nowIso()).run();
  if (Number(claimed?.meta?.changes ?? claimed?.changes ?? 0) !== 1) return json({ error:'TOTP_CHALLENGE_ALREADY_USED', message:'To potwierdzenie zostało już wykorzystane. Zaloguj się ponownie.' }, 409, { 'set-cookie':totpChallengeCookie('', true) });
  const sessionToken = randomToken(), now = nowIso();
  await env.DB.prepare('INSERT INTO academy_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
    .bind(await sha256Hex(sessionToken), account.id, now, new Date(Date.now()+15552000*1000).toISOString()).run();
  const headers = new Headers({ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' });
  headers.append('set-cookie', sessionCookie(sessionToken));
  headers.append('set-cookie', totpChallengeCookie('', true));
  return new Response(JSON.stringify({ ok:true, purpose:'login', user:{id:account.id,nickname:account.nickname,email:account.email_normalized}, consented:!!(account.consent_at&&account.consent_version===CONSENT_VERSION), usedRecoveryCode:usedRecovery, message:usedRecovery?'Zalogowano kodem odzyskiwania. Wygeneruj nowy zestaw kodów.':'Potwierdzono 2FA i zalogowano.' }), { status:200, headers });
}
