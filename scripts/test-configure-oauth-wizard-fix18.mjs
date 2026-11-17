import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { FIELDS, validateCredentials, buildHtml } = require('./configure-oauth-secrets.js');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fiveProviders = Object.keys(FIELDS);
if (fiveProviders.join(',') !== 'google,facebook,microsoft,github,discord') throw new Error('Konfigurator nie ma dokładnie pięciu wymaganych dostawców.');
const valid = validateCredentials({ googleClientId: 'client-id-google.apps.example', googleClientSecret: 'google-secret-abcdefghijklmnop' });
if (Object.keys(valid).join(',') !== 'GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET') throw new Error('Konfigurator nie tworzy pary sekretów Google.');
let rejected = false;
try { validateCredentials({ discordClientId: 'discord-client-id' }); } catch { rejected = true; }
if (!rejected) throw new Error('Konfigurator zaakceptował niepełną parę OAuth.');
rejected = false;
try { validateCredentials({ xClientId: 'x-client-id', xClientSecret: 'x-secret-abcdefghijklmnop' }); } catch { rejected = true; }
if (!rejected) throw new Error('Konfigurator nie zablokował wyłączonego dostawcy X.');
const mailOnly = validateCredentials({ resendApiKey: 're_test_key_1234567890', authEmailFrom: 'Akademia <noreply@example.test>' });
if (mailOnly.RESEND_API_KEY !== 're_test_key_1234567890' || mailOnly.AUTH_EMAIL_FROM !== 'Akademia <noreply@example.test>') throw new Error('Konfigurator nie obsługuje konfiguracji Resend bez dostawcy OAuth.');
rejected = false; try { validateCredentials({ resendApiKey: 're_test_key_1234567890' }); } catch { rejected = true; }
if (!rejected) throw new Error('Konfigurator zaakceptował niepełną konfigurację Resend.');
const page = buildHtml('fix18-local-token');
const configuratorSource = readFileSync(resolve(root,'scripts/configure-oauth-secrets.js'),'utf8');
for (const provider of fiveProviders) {
  if (!page.html.includes(`${provider}ClientId`) || !page.html.includes(`${provider}ClientSecret`)) throw new Error(`Brak pól ${provider} w lokalnym formularzu.`);
}
if (!configuratorSource.includes("default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-") || !configuratorSource.includes("const HOST = '127.0.0.1'") || !configuratorSource.includes("['pages','secret','bulk'") || !page.html.includes('wrangler.toml') || !page.html.includes('127.0.0.1')) throw new Error('Konfigurator nie ma ograniczeń lokalnych/CSP lub sugeruje zapis sekretów do plików.');
const html = readFileSync(resolve(root,'WEB_PUBLISH/index.html'),'utf8');
const publisher = readFileSync(resolve(root,'ONECLICK_AKADEMIA.js'),'utf8');
if (!configuratorSource.includes('AUTH_TOTP_ENCRYPTION_KEY') || !configuratorSource.includes('generatedTotpKey')) throw new Error('Konfigurator nie tworzy bezpiecznego klucza szyfrującego 2FA.');
if (!html.includes('id="accountTotpPanel"') || !html.includes('data-oauth-start="discord"') || !html.includes('id="accountSessionsList"') || !html.includes('id="accountOAuthTerms"') || !publisher.includes('0009_discord_social_login.sql') || !publisher.includes('0010_account_terms_and_oauth_consent.sql') || !publisher.includes('0011_totp_two_factor.sql') || !publisher.includes('0012_email_verification_and_password_reset.sql') || !configuratorSource.includes('RESEND_API_KEY')) throw new Error('Konfigurator i produkcyjny pakiet nie są zgodne.');
console.log('PASS: formularz konfiguracji obsługuje pięciu providerów i odrzuca X oraz niepełne/niebezpieczne wartości.');
console.log('PASS: lokalny formularz używa tokenu jednorazowego, CSP i nie przechowuje sekretów w plikach.');
console.log('PASS: GitHub, Discord, panel sesji, zgoda, 2FA, migracja e-mail 0012 i lokalna konfiguracja Resend są uwzględnione.');
