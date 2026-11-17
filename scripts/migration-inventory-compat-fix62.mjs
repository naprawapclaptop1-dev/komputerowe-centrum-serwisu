/**
 * FIX62 migration inventory compatibility.
 * Accepts the 17-file base migration set and the two historical files that
 * are present in some existing user workspaces. This validates filenames
 * only; it never executes SQL or changes Cloudflare D1.
 */
export const CORE_MIGRATION_NAMES = Object.freeze([
  '0001_academy_cloud.sql',
  '0002_rights_chat_feedback.sql',
  '0003_global_site_visits.sql',
  '0004_social_auth.sql',
  '0005_oauth_nonce.sql',
  '0006_accounts_and_device_models.sql',
  '0007_global_unique_visitors.sql',
  '0008_social_login_x_github.sql',
  '0009_discord_social_login.sql',
  '0010_account_terms_and_oauth_consent.sql',
  '0011_totp_two_factor.sql',
  '0012_email_verification_and_password_reset.sql',
  '0013_account_runtime_guard.sql',
  '0014_account_limiter_key_repair.sql',
  '0015_account_limiter_v3.sql',
  '0016_support_community_center.sql',
  '0017_site_feedback_fix43.sql'
]);

export const OPTIONAL_HISTORICAL_MIGRATION_NAMES = Object.freeze([
  '0004_customer_requests.sql',
  '0014_account_limiter_key_repair_and_cloud_backup.sql'
]);

export function validateMigrationInventory(inputNames) {
  if (!Array.isArray(inputNames) || inputNames.some(name => typeof name !== 'string' || !name.endsWith('.sql'))) {
    return { ok: false, reason: 'invalid-input', actualCount: 0, missing: [...CORE_MIGRATION_NAMES], unexpected: [], optionalPresent: [] };
  }

  const names = inputNames.slice().sort();
  const duplicates = names.filter((name, index) => index > 0 && name === names[index - 1]);
  const actual = new Set(names);
  const core = new Set(CORE_MIGRATION_NAMES);
  const optional = new Set(OPTIONAL_HISTORICAL_MIGRATION_NAMES);
  const missing = CORE_MIGRATION_NAMES.filter(name => !actual.has(name));
  const unexpected = names.filter(name => !core.has(name) && !optional.has(name));
  const optionalPresent = OPTIONAL_HISTORICAL_MIGRATION_NAMES.filter(name => actual.has(name));
  const optionalPairComplete = optionalPresent.length === 0 || optionalPresent.length === OPTIONAL_HISTORICAL_MIGRATION_NAMES.length;

  let reason = null;
  if (duplicates.length) reason = 'duplicate-migration-names';
  else if (missing.length) reason = 'missing-required-migrations';
  else if (unexpected.length) reason = 'unrecognized-migration-files';
  else if (!optionalPairComplete) reason = 'incomplete-historical-pair';

  return {
    ok: reason === null,
    reason,
    actualCount: names.length,
    coreCount: CORE_MIGRATION_NAMES.length,
    optionalHistoricalCount: optionalPresent.length,
    expectedCount: CORE_MIGRATION_NAMES.length + optionalPresent.length,
    missing,
    unexpected,
    duplicates,
    optionalPresent,
    supportedVariants: [CORE_MIGRATION_NAMES.length, CORE_MIGRATION_NAMES.length + OPTIONAL_HISTORICAL_MIGRATION_NAMES.length]
  };
}
