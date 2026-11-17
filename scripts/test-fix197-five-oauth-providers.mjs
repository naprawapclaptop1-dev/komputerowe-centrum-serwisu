import assert from 'node:assert/strict';
import fs from 'node:fs';
import { oauthProviderStatus } from '../functions/_oauth.js';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const oauth = read('../functions/_oauth.js');
const html = read('../WEB_PUBLISH/index.html');
const cloud = read('../WEB_PUBLISH/assets/cloud-academy.js');
const checker = read('./check-oauth-production.js');
const publisher = read('../ONECLICK_AKADEMIA.js');
const watcher = read('../AUTO_PUBLISH_WATCHER.js');
const release = JSON.parse(read('../WEB_PUBLISH/release.json'));
const expected = ['google','facebook','microsoft','github','discord'];
const configured = {
  GOOGLE_CLIENT_ID:'g', GOOGLE_CLIENT_SECRET:'g-secret',
  FACEBOOK_CLIENT_ID:'f', FACEBOOK_CLIENT_SECRET:'f-secret',
  MICROSOFT_CLIENT_ID:'m', MICROSOFT_CLIENT_SECRET:'m-secret',
  GITHUB_CLIENT_ID:'gh', GITHUB_CLIENT_SECRET:'gh-secret',
  DISCORD_CLIENT_ID:'d', DISCORD_CLIENT_SECRET:'d-secret'
};
assert.deepEqual(Object.keys(oauthProviderStatus(configured)).sort(), expected.slice().sort());
assert.deepEqual(Object.keys(oauthProviderStatus({})).sort(), expected.slice().sort());
assert.ok(oauth.includes("new Set(['google', 'facebook', 'microsoft', 'github', 'discord'])"));
for (const provider of expected) assert.ok(html.includes(`data-oauth-start="${provider}"`), `missing ${provider} button`);
assert.ok(!html.includes('data-oauth-start="x"'), 'X button must remain disabled');
assert.ok(!Object.keys(oauthProviderStatus(configured)).includes('x'), 'X must not be exposed in the active status API');
for (const provider of ['github','discord']) assert.ok(html.includes(`data-oauth-start="${provider}"`), `${provider} button is missing`);

assert.ok(html.includes('Google, Microsoft, Facebook, GitHub lub Discord'));
assert.ok(cloud.includes("const names={google:'Google',facebook:'Facebook',microsoft:'Microsoft',github:'GitHub',discord:'Discord'};"));
assert.ok(checker.includes("const NAMES = { google:'Google', microsoft:'Microsoft', facebook:'Facebook', github:'GitHub', discord:'Discord' }"));
assert.ok(publisher.includes("fiveOAuthProviders: ['google','facebook','microsoft','github','discord']"), 'publisher must validate the five active providers');
assert.ok(publisher.includes('xOAuthButtonExcluded: !indexHtml.includes(\'data-oauth-start=\"x\"\')'), 'publisher must reject an active X login button');
assert.ok(publisher.includes("githubOAuthButton: indexHtml.includes('data-oauth-start=\"github\"')"));
assert.ok(publisher.includes("discordOAuthButton: indexHtml.includes('data-oauth-start=\"discord\"')"));
assert.ok(watcher.includes("socialLoginFiveProviders: ['google','facebook','microsoft','github','discord']"), 'watcher must validate five providers');
assert.ok(watcher.includes("&& !html.includes('data-oauth-start=\"x\"')"), 'watcher must keep X disabled');
assert.deepEqual(release.socialAuthCurrent.providers.slice().sort(), expected.slice().sort(), 'release metadata must list all five active providers');
assert.deepEqual(release.socialAuthCurrent.disabledProviders, ['x'], 'X must be the only disabled provider');
assert.equal(release.socialAuthCurrent.productionLoginVerified, false, 'release metadata must not claim production OAuth was tested');
console.log('FIX197 FIVE PROVIDERS (bez X): PASS');
