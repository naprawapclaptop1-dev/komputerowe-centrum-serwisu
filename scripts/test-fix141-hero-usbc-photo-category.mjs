#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = fs.readFileSync(path.join(root, 'WEB_PUBLISH/assets/photo-catalog-fix115.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'WEB_PUBLISH/index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'WEB_PUBLISH/media/photo-sources-online.json'), 'utf8'));

assert.match(runtime, /id === 'home-hero-usbc-main'/, 'HERO slot must be recognized by its stable ID');
assert.match(runtime, /usbCHero \? 'port'/, 'HERO slot must force the USB-C port category');
assert.match(runtime, /Złącze USB-C w laptopie obsługujące ładowanie Power Delivery/, 'HERO search topic must be precise');
assert.match(runtime, /port: \{ query: 'USB-C'.*commons: \['USB-C connector on a laptop', 'USB port computer', 'laptop charging port'\]/s, 'port search must use USB-C/laptop charging topics');
assert.match(html, /data-photo-id="home-hero-usbc-main"[^>]*data-photo-kind="port"[^>]*src="media\/hero-usbc-power-delivery-fix142\.jpg"/, 'FIX142 local USB-C photo must replace the broken remote hero request');
assert.match(html, /data-photo-local-fallback="assets\/artwork-fix77\/hero-main\.svg"/, 'approved local SVG fallback must remain available');
assert.equal(Object.keys(manifest.homepageSlotSeedMap).length, 19, 'FIX135 must keep exactly 19 module seeds');
assert.equal(new Set(Object.values(manifest.homepageSlotSeedMap)).size, 19, 'FIX135 module seeds must remain unique');
assert.equal(manifest.homepageSlotSeedMap['home-module-15'], 'usb-c-laptop-port', 'USB-C seed remains reserved for its original module');
console.log('[PASS] HERO USB-C is categorized as port and uses the local FIX142 Power Delivery photo.');
console.log('[PASS] FIX135 retains all 19 unique module photo assignments.');
console.log('[PASS] Local USB-C HERO photo and original SVG fallback are present.');
console.log('FIX141 HERO USB-C PHOTO CATEGORY: 3/3 PASS');
