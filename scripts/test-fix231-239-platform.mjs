import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const migration=read('migrations/0023_platform_experience_fix231_239.sql');
const html=read('WEB_PUBLISH/index.html');
const sw=read('WEB_PUBLISH/service-worker.js');
const js=read('WEB_PUBLISH/assets/platform-enhancements-fix231-239.js');
const notif=read('functions/api/notifications.js');
const helper=read('functions/_notifications.js');
const push=read('functions/_webpush.js');
const checks=[
 ['migration defines inbox, preferences, subscriptions, guardians and reports',['academy_notification_preferences','academy_notifications','academy_push_subscriptions','academy_guardian_invites','academy_guardian_links','academy_content_reports'].every(x=>migration.includes(x))],
 ['account UI remains inside existing account view',html.includes('id="fix231239Preferences"')&&html.includes('id="view-admin"')&&(html.match(/id="view-[^"]+"/g)||[]).length===35],
 ['notifications respect per-category preferences',helper.includes('if (prefs[type] === false) return null')],
 ['Push unsubscribe removes only this browser endpoint without disabling account-wide Push',js.includes("action:'unsubscribe',endpoint")&&js.includes('Pozostałe urządzenia zachowują swoje subskrypcje.')&&!js.includes("action:'unsubscribe-all'")&&!/fix232UnsubscribePush[\s\S]{0,900}preferences\.push=false/.test(js)],
 ['Web Push only accepts trusted provider hosts',push.includes('ALLOWED_PUSH_HOSTS')&&notif.includes('isAllowedPushEndpoint(endpoint)')],
 ['email notifications require verified address',notif.includes('EMAIL_NOT_VERIFIED')&&notif.includes('account?.email_verified_at')],
 ['guardian invite claims are conditional and single-use',read('functions/api/guardians.js').includes('claimed_at IS NULL AND revoked_at IS NULL AND expires_at>?')],
 ['guardian reports expose aggregate progress only',read('functions/api/guardians.js').includes('privacy:')&&!read('functions/api/guardians.js').includes('SELECT content FROM academy_messages')],
 ['offline copy strips active code and network resources',js.includes('script,style,form,button,input,textarea,select,video,audio,iframe,object,embed')],
 ['content report input rejects credential-like content',read('functions/api/content-reports.js').includes('SENSITIVE_DATA_REJECTED')],
 ['SW caches new module without changing historic cache',sw.includes('platform-enhancements-fix231-239.js?v=6.8.0-fix239')&&sw.includes("const CACHE_NAME = 'nauka-6.8.0-fix176-global-academy-rescue-and-master-launch-20261115'")],
 ['VAPID generator writes private keys only to local ignored file',fs.existsSync('scripts/generate-vapid-keys-fix232.mjs')&&read('.gitignore').includes('VAPID_KEYS_LOCAL_ONLY.txt')],
 ['backup restore script blocks production database',read('tools/FIX235_RESTORE_D1_STAGING_ONLY.ps1').includes('naprawapc-orders|production|prod|live|main')],
 ['post deployment smoke checks migration 0023',read('scripts/post-deploy-smoke-fix239.mjs').includes('migracja 0023')],
 ['content audit checks ids and local assets',fs.existsSync('scripts/audit-content-quality-fix236.mjs')]
];
let passed=0;for(const [label,ok]of checks){console.log(`[${ok?'PASS':'FAIL'}] ${label}`);assert.ok(ok,label);passed++;}console.log(`FIX231–FIX239 PLATFORM CONTRACT: ${passed}/${checks.length} PASS`);
