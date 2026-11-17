import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
const require = createRequire(import.meta.url);
const helper = require('./configure-openai-secret.js');
const root = path.resolve(import.meta.dirname, '..');

test('akceptuje formaty kluczy projektowych i serwisowych OpenAI', () => {
  assert.equal(helper.isValidOpenAiKey('sk-proj-' + 'A'.repeat(48)), true);
  assert.equal(helper.isValidOpenAiKey('sk-svcacct-' + 'b'.repeat(40)), true);
});

test('odrzuca puste, zbyt krótkie i niepoprawne klucze', () => {
  assert.equal(helper.isValidOpenAiKey(''), false);
  assert.equal(helper.isValidOpenAiKey('sk-abc'), false);
  assert.equal(helper.isValidOpenAiKey('not-an-openai-key-' + 'x'.repeat(40)), false);
  assert.equal(helper.isValidOpenAiKey('sk-' + 'x'.repeat(40) + '\n'), false);
});

test('rozpoznaje istniejący sekret z JSON Wrangler', () => {
  assert.equal(helper.hasOpenAiSecret('[{"name":"OPENAI_API_KEY","type":"secret_text"}]'), true);
  assert.equal(helper.hasOpenAiSecret('[]'), false);
});

test('redaguje wartość sekretu z komunikatów procesu', () => {
  assert.equal(helper.redact('value=sk-proj-secret', 'sk-proj-secret'), 'value=[KLUCZ UKRYTY]');
});

test('HTML ma pole hasła z normalnym wklejaniem i bez usług zewnętrznych', () => {
  const { html } = helper.buildSetupHtml('test-token');
  assert.match(html, /type="password"/);
  assert.match(html, /Ctrl\+V/);
  assert.match(html, /127\.0\.0\.1/);
  assert.match(html, /X-Akademia-Token/);
  assert.doesNotMatch(html, /https?:\/\/(?!127\.0\.0\.1)/);
});

test('główny CMD otwiera graficzny konfigurator przed publikacją', () => {
  const cmd = fs.readFileSync(path.join(root, 'URUCHOM_AKADEMIE.cmd'), 'utf8');
  const setupIndex = cmd.indexOf('configure-openai-secret.js');
  const deployIndex = cmd.indexOf('ONECLICK_AKADEMIA.js', setupIndex);
  assert.ok(setupIndex >= 0);
  assert.ok(deployIndex > setupIndex);
});

test('sekret jest przekazywany Wranglerowi przez stdin, a nie argument lub plik', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'configure-openai-secret.js'), 'utf8');
  assert.match(source, /pages', 'secret', 'bulk'/);
  assert.match(source, /'--env', 'production'/);
  assert.match(source, /input,\s*encoding: 'utf8'/);
  assert.match(source, /Buffer\.from\(JSON\.stringify\(\{ OPENAI_API_KEY: key \}\)/);
  assert.match(source, /payload\.fill\(0\)/);
  assert.doesNotMatch(source, /writeFileSync|\.env\.production|wrangler\.toml.*OPENAI_API_KEY/i);
  assert.doesNotMatch(source, /setRawMode|readSecretHidden/);
});

test('lokalny formularz waliduje token i zwraca stronę bez cache', async () => {
  const serverPromise = helper.startLocalSetupPage({ onSave: key => key === 'sk-proj-' + 'T'.repeat(40), onSkip: () => true });
  await delay(100);
  // Test helper uses localhost port exposed via a temporary environment-independent hook below.
  assert.equal(typeof serverPromise.then, 'function');
  // End this test without sending a secret: full HTTP integration is covered by the fake-Wrangler test run.
  // Close any listener by skipping through the local HTTP endpoint discovered from the process-local registry.
  const registry = helper.__testServers;
  assert.ok(registry instanceof Map);
  const item = [...registry.values()][0];
  assert.ok(item?.url);
  const page = await fetch(item.url);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('cache-control') || '', /no-store/);
  const html = await page.text();
  const token = html.match(/name="setup-token" content="([^"]+)"/)[1];
  const denied = await fetch(item.url + 'save', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Akademia-Token': 'bad', Origin: item.origin }, body: JSON.stringify({ key: 'sk-proj-' + 'T'.repeat(40) }) });
  assert.equal(denied.status, 403);
  await fetch(item.url + 'skip', { method: 'POST', headers: { 'X-Akademia-Token': token, Origin: item.origin } });
  await serverPromise;
});

test('zmiana klucza nie tworzy pliku z kluczem', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'configure-openai-secret.js'), 'utf8');
  assert.match(source, /input,\s*encoding: 'utf8'/);
  assert.match(source, /payload\.fill\(0\)/);
  assert.doesNotMatch(source, /appendFileSync|writeFile\(/);
});

test('pełny przebieg: strona lokalna przyjmuje wklejony klucz i zapisuje sekret przez Wrangler stdin', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'akademia-openai-gui-'));
  const setupDir = path.join(temp, 'scripts');
  const wranglerDir = path.join(temp, 'TOOLS_CLOUDFLARE', 'node_modules', 'wrangler', 'bin');
  fs.mkdirSync(setupDir, { recursive: true });
  fs.mkdirSync(wranglerDir, { recursive: true });
  fs.copyFileSync(path.join(root, 'scripts', 'configure-openai-secret.js'), path.join(setupDir, 'configure-openai-secret.js'));
  const statePath = path.join(temp, 'fake-wrangler-state.json');
  const fakeWrangler = `
    const fs=require('node:fs');const state=${JSON.stringify(statePath)};const args=process.argv.slice(2);
    const account='4ddfc3803a4f0c4457ccae083f18b975';
    if(args[0]==='whoami'){console.log(account);process.exit(0)}
    if(args[0]==='pages'&&args[1]==='secret'&&args[2]==='list'){console.log(fs.existsSync(state)?'[{"name":"OPENAI_API_KEY","type":"secret_text"}]':'[]');process.exit(0)}
    if(args[0]==='pages'&&args[1]==='secret'&&args[2]==='bulk'){let raw='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>raw+=d);process.stdin.on('end',()=>{const data=JSON.parse(raw);if(!data.OPENAI_API_KEY||!data.OPENAI_API_KEY.startsWith('sk-'))process.exit(7);fs.writeFileSync(state,JSON.stringify({name:'OPENAI_API_KEY'}));console.log('1 secrets successfully uploaded')});process.exitCode=0;return}
    console.error('unexpected command');process.exit(9);
  `;
  fs.writeFileSync(path.join(wranglerDir, 'wrangler.js'), fakeWrangler);
  const child = spawn(process.execPath, [path.join(setupDir, 'configure-openai-secret.js')], {
    env: { ...process.env, AKADEMIA_OPENAI_SETUP_NO_BROWSER: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let out = ''; let err = '';
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => { out += chunk; });
  child.stderr.on('data', chunk => { err += chunk; });
  let match = '';
  for (let i = 0; i < 100 && !match; i++) {
    match = out.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0] || '';
    if (!match) await delay(50);
  }
  assert.ok(match, `Nie uruchomiono formularza. stdout=${out} stderr=${err}`);
  const page = await fetch(match);
  assert.equal(page.status, 200);
  const html = await page.text();
  const token = html.match(/name="setup-token" content="([^"]+)"/)?.[1];
  assert.ok(token, 'Brak tokenu sesji formularza');
  const testKey = 'sk-proj-' + 'Z'.repeat(48);
  const response = await fetch(new URL('save', match), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Akademia-Token': token, Origin: new URL(match).origin },
    body: JSON.stringify({ key: testKey })
  });
  assert.equal(response.status, 200, await response.text());
  const closed = await once(child, 'close');
  assert.equal(closed[0], 0, `Konfigurator zakończył się błędem. stdout=${out} stderr=${err}`);
  assert.ok(fs.existsSync(statePath), 'Wrangler nie zapisał sekretu testowego');
  assert.deepEqual(JSON.parse(fs.readFileSync(statePath, 'utf8')), { name: 'OPENAI_API_KEY' });
  assert.equal((out + err).includes(testKey), false, 'Klucz pojawił się w logu procesu');
  fs.rmSync(temp, { recursive: true, force: true });
});
