// FIX20: verify every D1 table/column required by account operations before SQL writes.
const REQUIRED_ACCOUNT_COLUMNS = Object.freeze({
  academy_users: [
    'id','nickname','created_at','last_seen_at','locale','consent_at','consent_version',
    'email_normalized','password_salt','password_hash',
    'terms_accepted_at','terms_version',
    'totp_secret_cipher','totp_secret_iv','totp_pending_expires_at','totp_enabled_at',
    'email_verified_at'
  ],
  academy_sessions: ['token_hash','user_id','created_at','expires_at'],
  academy_account_rate_limits_v3: ['bucket_key','window_start','request_count'],
  academy_totp_login_challenges: ['token_hash','user_id','created_at','expires_at','attempts'],
  academy_totp_recovery_codes: ['user_id','code_hash','created_at','used_at'],
  academy_email_tokens: ['token_hash','user_id','email_normalized','purpose','created_at','expires_at','used_at']
});

export async function accountSchemaStatus(env) {
  if (!env?.DB) return { ready: false, missing: ['binding D1: DB'] };
  const missing = [];
  try {
    for (const [table, required] of Object.entries(REQUIRED_ACCOUNT_COLUMNS)) {
      // Table names are fixed above; no user-controlled identifier reaches this PRAGMA.
      const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
      const columns = new Set((info.results || []).map(row => String(row.name || '')));
      if (!columns.size) {
        missing.push(table);
        continue;
      }
      for (const column of required) if (!columns.has(column)) missing.push(`${table}.${column}`);
    }
  } catch {
    missing.push('schemat kont D1: odczyt struktury nie powiódł się');
  }
  // The UPSERT conflict target is valid only when bucket_key is the *entire* primary key.
  // A composite key beginning with bucket_key is not sufficient.
  try {
    const limiterInfo = await env.DB.prepare('PRAGMA table_info(academy_account_rate_limits_v3)').all();
    const columns = limiterInfo.results || [];
    const primaryKeyColumns = columns.filter(row => Number(row.pk || 0) > 0)
      .sort((a, b) => Number(a.pk) - Number(b.pk)).map(row => String(row.name || ''));
    const bucketKey = columns.find(row => row.name === 'bucket_key');
    if (primaryKeyColumns.length !== 1 || primaryKeyColumns[0] !== 'bucket_key' || !bucketKey || Number(bucketKey.notnull || 0) !== 1) {
      missing.push('academy_account_rate_limits_v3: wymagany pojedynczy PRIMARY KEY(bucket_key) NOT NULL');
    }
  } catch { missing.push('academy_account_rate_limits_v3: kontrola pojedynczego klucza głównego nie powiodła się'); }
  return { ready: missing.length === 0, missing: [...new Set(missing)] };
}
