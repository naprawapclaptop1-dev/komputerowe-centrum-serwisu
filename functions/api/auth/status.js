import { oauthProviderDiagnostics, oauthProviderStatus, oauthSchemaStatus } from '../../_oauth.js';
import { accountSchemaStatus } from '../../_account-schema.js';
import { json } from '../../_lib.js';
import { emailDeliveryStatus } from '../../_mail.js';

const BUILD = '6.8.0-fix51-visual-academy-pro-20261105';

export async function onRequestGet({ request, env }) {
  const databaseReady = !!env?.DB;
  const schema = await oauthSchemaStatus(env);
  const accountSchema = await accountSchemaStatus(env);
  const providerDetails = oauthProviderDiagnostics(env);
  const providers = oauthProviderStatus(env);
  const schemaReady = databaseReady && schema.ready && accountSchema.ready;
  const emailDelivery = emailDeliveryStatus(env);
  return json({
    ok: databaseReady && schemaReady,
    databaseReady,
    schemaReady,
    schemaMissing: [...schema.missing, ...accountSchema.missing],
    accountSchemaReady: accountSchema.ready,
    accountSchemaMissing: accountSchema.missing,
    accountLimiterTable: 'academy_account_rate_limits_v3',
    providers,
    providerDetails,
    callbackUrl: new URL('/api/auth/callback', request.url).toString(),
    totpEncryptionReady: !!env?.AUTH_TOTP_ENCRYPTION_KEY,
    emailDeliveryReady: emailDelivery.ready,
    emailDeliveryMissing: emailDelivery.missing,
    build: BUILD
  }, 200);
}
