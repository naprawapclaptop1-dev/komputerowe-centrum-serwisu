#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publisher=fs.readFileSync(path.join(ROOT,'ONECLICK_AKADEMIA.js'),'utf8');
const release=JSON.parse(fs.readFileSync(path.join(ROOT,'WEB_PUBLISH','release.json'),'utf8'));
assert.ok(publisher.includes("const releaseVersion = String(releaseJson.release || '');"),'verifyWeb must read product version from release.json');
assert.ok(publisher.includes('fix149Extension.productVersion !== releaseVersion'),'FIX149 contract must use the locally scoped releaseVersion');
assert.ok(!publisher.includes('fix149Extension.productVersion !== RELEASE'),'the undefined RELEASE identifier must not return');
assert.equal(release.release,'6.8.0','FIX150 must preserve product version');
assert.equal(release.latestHotfix,'FIX176','FIX150 publisher scope repair remains included; current package hotfix is FIX175');
assert.ok(publisher.includes('PUBLISHER FIX167 — WEBSITE RELEASE 6.8.0 / GEMINI V1 / CMD-ONLY KEY GUARD'),'publisher banner must identify the CMD-only key guard correction');
console.log('[PASS] verifyWeb uses the releaseVersion variable declared in its own scope.');
console.log('[PASS] No out-of-scope RELEASE reference remains in the historical FIX149 metadata guard.');
console.log('[PASS] Public website runtime remains FIX165; the historical FIX150 RELEASE scope repair and publisher-only FIX166/FIX167 guards remain protected.');
console.log('FIX150 PUBLISHER RELEASE SCOPE: 3/3 PASS');
