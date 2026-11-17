import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const require = createRequire(import.meta.url);
const { verifySupportUpdatesPayload } = require('./support-community-guard-fix39.js');

const anonymousPayload = { items: [], authenticated: false, enabled: false, lastSeenAt: null, unreadCount: 0 };
assert.equal(verifySupportUpdatesPayload(anonymousPayload), true, 'anonymous public API response must satisfy the JSON DTO');
assert.equal(verifySupportUpdatesPayload({ ...anonymousPayload, last_seen_at: null, lastSeenAt: undefined }), false, 'SQL snake_case must not substitute for the public JSON field');
assert.equal(verifySupportUpdatesPayload({ ...anonymousPayload, unreadCount: -1 }), false);
assert.equal(verifySupportUpdatesPayload({ ...anonymousPayload, unreadCount: '0' }), false);
assert.equal(verifySupportUpdatesPayload({ ...anonymousPayload, items: {} }), false);
assert.equal(verifySupportUpdatesPayload(null), false);

const watcher = read('AUTO_PUBLISH_WATCHER.js');
const client = read('WEB_PUBLISH/assets/support-community-fix36.js');
const api = read('functions/api/support/updates.js');
const publisher = read('ONECLICK_AKADEMIA.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const sw = read('WEB_PUBLISH/service-worker.js');
const expectedBuild = '6.8.0-fix51-visual-academy-pro-20261105';

assert.equal(release.build, expectedBuild);
assert.ok(client.includes('lastSeenAt'), 'browser client consumes camelCase JSON DTO');
assert.ok(!client.includes('last_seen_at'), 'browser bundle must not depend on SQL snake_case column');
assert.ok(api.includes('last_seen_at') && api.includes('lastSeenAt'), 'API maps the SQL column to the public JSON property');
assert.ok(watcher.includes("require('./scripts/support-community-guard-fix39')"));
assert.ok(watcher.includes('supportApiResponses[2].clone().json()'));
assert.ok(watcher.includes('verifySupportUpdatesPayload(supportUpdatesPayload)'));
assert.ok(watcher.includes("'lastSeenAt'"));
assert.ok(!watcher.includes("'last_seen_at','refreshSupportData'"), 'watcher must check the API DTO field, not SQL internals, in the JS bundle');
assert.ok(watcher.includes('remoteSupportUpdatesContractValid'));
assert.ok(watcher.includes('supportCommunityFeatureValid'));

const brandStart = watcher.indexOf('const newPlatformBrand =');
const brandEnd = watcher.indexOf(';', brandStart);
assert.ok(brandStart >= 0 && brandEnd > brandStart);
const brandExpression = watcher.slice(brandStart, brandEnd);
assert.ok(!brandExpression.includes('supportExpansionValid') && !brandExpression.includes('supportCommunityFeatureValid'), 'brand diagnostics must be independent of support module status');
const publishGuard = watcher.slice(watcher.indexOf('if (response.ok && match'), watcher.indexOf(') {', watcher.indexOf('if (response.ok && match')));
assert.ok(publishGuard.includes('newPlatformBrand') && publishGuard.includes('supportExpansionValid') && publishGuard.includes('supportCommunityFeatureValid'), 'deployment still requires brand and support guards independently');
assert.ok(publisher.includes("supportUpdatesApiSource.includes('last_seen_at')") && publisher.includes("supportUpdatesApiSource.includes('lastSeenAt')"));
assert.ok(sw.includes(expectedBuild) && read('WEB_PUBLISH/index.html').includes(expectedBuild) && read('functions/api/auth/status.js').includes(expectedBuild));

console.log('PASS FIX39: public support updates JSON validates camelCase lastSeenAt, API maps last_seen_at, community guard is accurate, and brand diagnostics are independent while deployment gates remain strict.');
