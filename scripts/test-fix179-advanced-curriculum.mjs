import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const require = createRequire(import.meta.url);
const dataPath = path.join(root, 'WEB_PUBLISH/assets/academy-advanced-curriculum-fix179.js');
const data = require(dataPath);
const html = fs.readFileSync(path.join(root, 'WEB_PUBLISH/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'WEB_PUBLISH/assets/academy-advanced-curriculum-fix179.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'WEB_PUBLISH/assets/academy-professional-repair-fix175.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'WEB_PUBLISH/service-worker.js'), 'utf8');
const runtime = fs.readFileSync(dataPath, 'utf8');

function pass(label) { console.log(`[PASS] ${label}`); }
function runSyntax(file) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${file} syntax error: ${result.stderr || result.stdout}`);
}

assert.equal(data.version, '6.8.0');
assert.equal(data.fix, 179);
assert.equal(data.lessons.length, 24);
pass('Katalog zawiera dokładnie 24 lekcje eksperckie; wersja produktu pozostała 6.8.0');

const lessonIds = new Set();
let questionCount = 0;
for (const lesson of data.lessons) {
  assert.ok(lesson.id && !lessonIds.has(lesson.id), `brak lub duplikat ID lekcji: ${lesson.id}`);
  lessonIds.add(lesson.id);
  assert.ok(lesson.title && lesson.summary && lesson.category);
  assert.ok(['Zaawansowany', 'Ekspert'].includes(lesson.level));
  assert.ok(lesson.minutes >= 10);
  assert.ok(lesson.goals.length >= 3);
  assert.ok(lesson.theory.length >= 3);
  assert.ok(lesson.workflow.length >= 4);
  assert.ok(lesson.cautions.length >= 3);
  assert.equal(lesson.quiz.length, 3);
  for (const q of lesson.quiz) {
    questionCount++;
    assert.ok(q.q && q.e);
    assert.equal(q.a.length, 3);
    assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.a.length);
  }
}
assert.equal(questionCount, 72);
pass('24 lekcje mają cele, teorię, procedury, ostrzeżenia oraz 72 poprawnie zdefiniowane pytania');

assert.equal(data.cases.length, 8);
for (const item of data.cases) {
  assert.ok(item.id && item.title && item.symptom);
  assert.equal(item.stages.length, 3);
  item.stages.forEach(stage => {
    assert.ok(stage.name && stage.prompt && stage.why);
    assert.equal(stage.options.length, 3);
    assert.ok(Number.isInteger(stage.correct) && stage.correct >= 0 && stage.correct < 3);
  });
}
pass('8 trudnych przypadków zawiera po 3 etapy: diagnoza, plan i walidacja');

assert.equal(data.glossary.length, 22);
assert.equal(new Set(data.glossary.map(x => x[0])).size, data.glossary.length);
pass('Słownik ma 22 unikalne terminy techniczne');

const ids = ['a179LessonGrid','a179LessonDetail','a179ProgressBar','a179ProgressCount','a179Status','a179Points','a179CaseCount','a179Search','a179Category','a179Level','a179ExportReport','a179CaseSelect','a179CaseBody','a179GlossarySearch','a179GlossaryResults'];
for (const id of ids) {
  const count = (html.match(new RegExp(`id=["']${id}["']`, 'g')) || []).length;
  assert.equal(count, 1, `ID ${id} powinien występować dokładnie raz (jest ${count})`);
}
assert.match(html, /data-a168-tab="advanced"/);
assert.match(html, /data-a168-panel="advanced"/);
assert.match(html, /academy-advanced-curriculum-fix179\.js\?v=6\.8\.0-fix179/);
assert.match(html, /academy-advanced-curriculum-fix179\.css\?v=6\.8\.0-fix179/);
pass('Nowy panel jest podłączony do istniejącej nawigacji Akademii i nie tworzy osobnego widoku');

assert.match(app, /global\.ACADEMY_FIX168_AWARD\s*=\s*award/);
assert.match(app, /global\.ACADEMY_FIX168_ADD_JOURNAL\s*=\s*addJournal/);
assert.match(runtime, /nauka-od-a-do-z-advanced-fix179-v1/);
assert.match(runtime, /if\(typeof global\.ACADEMY_FIX168_AWARD === 'function'\)/);
assert.match(runtime, /else if\(typeof global\.ACADEMY_FIX168_ADD_JOURNAL === 'function'\)/);
pass('Postępy FIX179 korzystają z istniejącego profilu/dziennika, osobnego klucza notatek i nie dublują wpisów dziennika');

assert.match(sw, /academy-advanced-curriculum-fix179\.js\?v=6\.8\.0-fix179/);
assert.match(sw, /academy-advanced-curriculum-fix179\.css\?v=6\.8\.0-fix179/);
assert.match(sw, /const CACHE_NAME = 'nauka-6\.8\.0-fix176-global-academy-rescue-and-master-launch-20261115'/);
pass('Nowe pliki dodane do istniejącego cache offline bez zmiany jego tożsamości');

runSyntax(dataPath);
runSyntax(path.join(root, 'WEB_PUBLISH/assets/academy-professional-repair-fix175.js'));
runSyntax(path.join(root, 'scripts/test-fix179-advanced-curriculum.mjs'));
pass('Składnia JavaScript sprawdzona');

assert.ok(css.includes('.a179-main-grid') && css.includes('@media(max-width:620px)'));
assert.ok(html.includes('Nie wpisuj haseł, kluczy BitLocker ani danych klientów'));
assert.ok(!fs.existsSync(path.join(root, 'migrations', '0000_fix179.sql')));
pass('Style responsywne, ostrzeżenia bezpieczeństwa i brak nowej migracji D1');

console.log('\nFIX179 ADVANCED CURRICULUM: 8/8 PASS');
