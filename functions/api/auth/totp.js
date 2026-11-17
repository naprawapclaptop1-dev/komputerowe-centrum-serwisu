import { dbRequired, getSession, hashedClientRateKey, json, nowIso, readJson, rateLimit, sameOrigin, sha256Hex, recordSecurityEvent } from '../../_lib.js';
import { decryptTotpSecret, encryptTotpSecret, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, verifyTotp } from '../../_totp.js';

const ISSUER = 'Nauka od A do Z';
async function currentAccount(request, env) {
  const user = await getSession(request, env);
  if (!user) return null;
  return env.DB.prepare('SELECT id,email_normalized,nickname,totp_secret_cipher,totp_secret_iv,totp_pending_expires_at,totp_enabled_at FROM academy_users WHERE id=? LIMIT 1').bind(user.id).first();
}
async function validTotpSchema(env) {
  try {
    const cols = await env.DB.prepare('PRAGMA table_info(academy_users)').all();
    const names = new Set((cols.results || []).map(x => x.name));
    const required = ['totp_secret_cipher','totp_secret_iv','totp_pending_expires_at','totp_enabled_at'];
    const missing = required.filter(x => !names.has(x));
    const recovery = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='academy_totp_recovery_codes'").first();
    const challenges = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='academy_totp_login_challenges'").first();
    if (!recovery) missing.push('academy_totp_recovery_codes');
    if (!challenges) missing.push('academy_totp_login_challenges');
    return { ready: !missing.length, missing };
  } catch { return { ready:false, missing:['migracja 0011_totp_two_factor.sql'] }; }
}
function recoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
async function replaceRecoveryCodes(env, userId) {
  const codes = generateRecoveryCodes(10);
  await env.DB.prepare('DELETE FROM academy_totp_recovery_codes WHERE user_id=?').bind(userId).run();
  for (const code of codes) {
    await env.DB.prepare('INSERT INTO academy_totp_recovery_codes(user_id,code_hash,created_at,used_at) VALUES(?,?,?,NULL)')
      .bind(userId, await hashRecoveryCode(code), nowIso()).run();
  }
  return codes;
}

export async function onRequestGet({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  const account = await currentAccount(request, env);
  if (!account) return json({ error:'SESSION_REQUIRED' }, 401);
  const schema = await validTotpSchema(env);
  if (!schema.ready) return json({ error:'TOTP_SCHEMA_NOT_READY', missing:schema.missing, message:'Uwierzytelnianie dwuskładnikowe wymaga migracji 0011.' }, 503);
  const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM academy_totp_recovery_codes WHERE user_id=? AND used_at IS NULL').bind(account.id).first();
  return json({ ok:true, enabled:!!account.totp_enabled_at, pending:!!(account.totp_pending_expires_at && account.totp_pending_expires_at > nowIso()), recoveryCodesRemaining:Number(count?.total||0), encryptionReady:!!env.AUTH_TOTP_ENCRYPTION_KEY });
}

export async function onRequestPost({ request, env }) {
  const missing = dbRequired(env); if (missing) return missing;
  if (!sameOrigin(request)) return json({ error:'ORIGIN_REJECTED' }, 403);
  const account = await currentAccount(request, env);
  if (!account) return json({ error:'SESSION_REQUIRED' }, 401);
  const schema = await validTotpSchema(env);
  if (!schema.ready) return json({ error:'TOTP_SCHEMA_NOT_READY', missing:schema.missing, message:'Najpierw zastosuj migrację 0011_totp_two_factor.sql.' }, 503);
  if (!env.AUTH_TOTP_ENCRYPTION_KEY) return json({ error:'TOTP_KEY_MISSING', message:'Brakuje sekretu AUTH_TOTP_ENCRYPTION_KEY w Cloudflare Pages. Uruchom lokalny konfigurator sekretów FIX19.' }, 503);
  const ipKey = await hashedClientRateKey(request, 'totp-settings');
  if (!await rateLimit(env, ipKey, 12, 900)) return json({ error:'TOTP_RATE_LIMIT', message:'Za dużo prób. Spróbuj ponownie za 15 minut.' }, 429);
  let body; try { body = await readJson(request, 3000); } catch (error) { return json({ error:'INVALID_JSON', message:error.message }, 400); }
  const action = String(body.action || '');
  if (action === 'setup') {
    if (account.totp_enabled_at) return json({ error:'TOTP_ALREADY_ENABLED', message:'Uwierzytelnianie dwuskładnikowe jest już aktywne.' }, 409);
    const secret = generateTotpSecret();
    const sealed = await encryptTotpSecret(secret, env);
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await env.DB.prepare('UPDATE academy_users SET totp_secret_cipher=?,totp_secret_iv=?,totp_pending_expires_at=? WHERE id=?')
      .bind(sealed.cipher, sealed.iv, expires, account.id).run();
    const label = account.email_normalized || account.nickname || account.id;
    const uri = `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=6&period=30`;
    return json({ ok:true, secret, otpauthUri:uri, expiresAt:expires, message:'Dodaj konto w aplikacji uwierzytelniającej. Potem wpisz sześciocyfrowy kod, aby potwierdzić konfigurację.' });
  }
  if (action === 'confirm' || action === 'disable' || action === 'regenerate-recovery') {
    const code = String(body.code || '').trim();
    if (!account.totp_secret_cipher || !account.totp_secret_iv) return json({ error:'TOTP_NOT_SETUP', message:'Najpierw rozpocznij konfigurację 2FA.' }, 409);
    if (action === 'confirm' && (!account.totp_pending_expires_at || account.totp_pending_expires_at < nowIso())) return json({ error:'TOTP_SETUP_EXPIRED', message:'Konfiguracja wygasła. Rozpocznij ją ponownie.' }, 410);
    const secret = await decryptTotpSecret(account.totp_secret_cipher, account.totp_secret_iv, env);
    if (!await verifyTotp(secret, code)) return json({ error:'TOTP_CODE_INVALID', message:'Kod jest nieprawidłowy lub wygasł. Sprawdź zegar telefonu i spróbuj ponownie.' }, 400);
    if (action === 'confirm') {
      if (account.totp_enabled_at) return json({ error:'TOTP_ALREADY_ENABLED' }, 409);
      const codes = await replaceRecoveryCodes(env, account.id);
      await env.DB.prepare('UPDATE academy_users SET totp_enabled_at=?,totp_pending_expires_at=NULL WHERE id=?').bind(nowIso(), account.id).run();
      await recordSecurityEvent(env, account.id, 'totp_enabled');
      return json({ ok:true, enabled:true, recoveryCodes:codes, message:'2FA zostało włączone. Zapisz kody odzyskiwania — zostaną pokazane tylko raz.' });
    }
    if (!account.totp_enabled_at) return json({ error:'TOTP_NOT_ENABLED', message:'2FA nie jest obecnie włączone.' }, 409);
    if (action === 'disable') {
      await env.DB.prepare('UPDATE academy_users SET totp_secret_cipher=NULL,totp_secret_iv=NULL,totp_pending_expires_at=NULL,totp_enabled_at=NULL WHERE id=?').bind(account.id).run();
      await env.DB.prepare('DELETE FROM academy_totp_recovery_codes WHERE user_id=?').bind(account.id).run();
      await recordSecurityEvent(env, account.id, 'totp_disabled');
      return json({ ok:true, enabled:false, message:'2FA wyłączono. Pozostałe aktywne sesje nie zostały zmienione.' });
    }
    const codes = await replaceRecoveryCodes(env, account.id);
    await recordSecurityEvent(env, account.id, 'recovery_codes_regenerated');
    return json({ ok:true, recoveryCodes:codes, message:'Wygenerowano nowy zestaw kodów. Poprzednie kody zostały unieważnione.' });
  }
  return json({ error:'TOTP_ACTION_INVALID' }, 400);
}
