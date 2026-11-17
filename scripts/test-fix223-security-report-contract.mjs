import fs from 'node:fs';import assert from 'node:assert/strict';
const client=fs.readFileSync('WEB_PUBLISH/assets/cloud-academy.js','utf8'),html=fs.readFileSync('WEB_PUBLISH/index.html','utf8'),lib=fs.readFileSync('functions/_lib.js','utf8');
assert.ok(client.includes('exportSecurityReport')&&html.includes('id="exportSecurityReport"'));
assert.ok(client.includes("'google','microsoft','facebook','github','discord'")||client.includes("['google','microsoft','facebook','github','discord']"));
assert.ok(client.includes('hasPasswordLogin')&&client.includes('twoFactorEnabled')&&client.includes('activeSessions'));
assert.ok(client.includes('privacy:')&&client.includes('Raport nie zawiera haseł, tokenów, adresów IP, user-agent ani sekretów 2FA.'));
assert.ok(lib.includes('const safeDetails = {}')&&lib.includes('safeDetails.revoked')&&lib.includes('safeDetails.method'));
console.log('FIX223 ACCOUNT SECURITY REPORT: 5/5 PASS');
