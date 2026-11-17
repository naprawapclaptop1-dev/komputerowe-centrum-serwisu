#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const helper='functions/_photo-proxy-fix131.js';
const route='functions/media/photos/[id].js';
const allowed=new Set(['.js','.ts']);
const functionFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile())functionFiles.push(path.relative(path.join(ROOT,'functions'),full).replace(/\\/g,'/'));}}
walk(path.join(ROOT,'functions'));
assert.ok(fs.existsSync(path.join(ROOT,helper)),'Pages helper must exist with .js extension');
assert.ok(!fs.existsSync(path.join(ROOT,'functions/_photo-proxy-fix131.mjs')),'unsupported .mjs helper must be removed');
assert.ok(functionFiles.every(file=>allowed.has(path.extname(file).toLowerCase())),`unsupported Functions file: ${functionFiles.filter(file=>!allowed.has(path.extname(file).toLowerCase())).join(', ')}`);
assert.ok(read(route).includes("../../_photo-proxy-fix131.js"),'route must import .js helper');
assert.ok(read('ONECLICK_AKADEMIA.js').includes("path.join(ROOT,'functions','_photo-proxy-fix131.js')"),'OneClick must validate the .js helper');
assert.ok(read('AUTO_PUBLISH_WATCHER.js').includes("path.join(ROOT,'functions','_photo-proxy-fix131.js')"),'Watcher must validate the .js helper');
assert.ok(read('scripts/test-photo-local-proxy-fix131.mjs').includes("read('functions/_photo-proxy-fix131.js')"),'proxy test must load .js helper source');
console.log(`[PASS] All ${functionFiles.length} Cloudflare Pages Functions files use supported .js/.ts extensions.`);
console.log('[PASS] Photo proxy route, publisher, watcher and tests all reference the .js helper.');
console.log('[PASS] Unsupported .mjs helper is absent.');
console.log('FIX132 PAGES FUNCTION EXTENSION: 3/3 PASS');
