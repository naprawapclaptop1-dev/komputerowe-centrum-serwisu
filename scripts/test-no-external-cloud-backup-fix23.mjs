import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const html = read('WEB_PUBLISH/index.html');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const migration = read('migrations/0015_account_limiter_v3.sql');
assert.equal(release.build,'6.8.0-fix51-visual-academy-pro-20261105');
for (const token of ['ncbCloudBackupPanel','cloud-backup-700.js','Google Drive','Microsoft OneDrive','Dropbox']) assert.ok(!html.includes(token),`External-cloud UI remains: ${token}`);
for (const token of ['cloud-backup-700.js','cloud-backup-700.css']) assert.ok(!sw.includes(token),`External-cloud cache asset remains: ${token}`);
for (const token of ['_cloud-backup.js','api/backup','configure-cloud-backup.js','KONFIGURUJ_KOPIE_CHMUROWE']) {
  for (const p of [publisher,watcher]) assert.ok(!p.includes(token),`Publisher/watcher still references ${token}`);
}
for (const token of ['academy_cloud_backup_','google_drive','microsoft_onedrive','dropbox','CLOUD_BACKUP_ENCRYPTION_KEY']) assert.ok(!migration.toLowerCase().includes(token.toLowerCase()),`External cloud migration artifact remains: ${token}`);
assert.ok(migration.includes('bucket_key TEXT NOT NULL PRIMARY KEY'));
assert.ok(read('functions/_account-schema.js').includes('PRAGMA table_info(academy_account_rate_limits_v3)'));
assert.ok(read('functions/_lib.js').includes('academy_account_rate_limits_v3'));
assert.ok(sw.includes('support-video-clean-fix9'));
// Existing local JSON backups and the Cloudflare D1 export-before-migration safeguard are intentionally retained.
assert.ok(html.includes('id="npbExportBackup"') && html.includes('id="npbImportBackup"'));
assert.ok(publisher.includes("['d1', 'export'") && publisher.indexOf("['d1', 'export'") < publisher.indexOf("['d1', 'migrations', 'apply'"));
console.log('PASS: Google Drive, OneDrive and Dropbox backup connectors are absent from UI, PWA, API and migration.');
console.log('PASS: local JSON backup and D1 backup-before-migration safeguards remain.');
console.log('PASS: limiter-v3 migration keeps bucket_key as the single PRIMARY KEY.');
