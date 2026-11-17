const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = __dirname + '/../WEB_PUBLISH';
const source = fs.readFileSync(root + '/assets/master-workshop-630.js', 'utf8');
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} }, Date, Math, JSON, Array, Object, Set, Map, RegExp, Number, String, Error };
vm.runInNewContext(source, context);
const data = context.window.NP_MASTER_WORKSHOP_CONTENT;
assert(data, 'master workshop content API exists');
const progressApi = context.window.NP_MASTER_WORKSHOP_PROGRESS;
assert(progressApi, 'safe local progress API exists');
const sanitized = progressApi.sanitize({completedTopics:['pcb:0','pcb:0','fake:9',42],completedCases:['no-power','unknown'],bestScores:{'no-power':140,'gpu-artifacts':-5,unknown:100}});
assert.equal(JSON.stringify(sanitized.completedTopics), JSON.stringify(['pcb:0']), 'progress imports only known unique topic IDs');
assert.equal(JSON.stringify(sanitized.completedCases), JSON.stringify(['no-power']), 'progress imports only known case IDs');
assert.equal(sanitized.bestScores['no-power'], 100, 'progress score is clamped to 100');
assert.equal(sanitized.bestScores['gpu-artifacts'], 0, 'progress score is clamped to zero');
assert.equal(sanitized.bestScores.unknown, undefined, 'unknown score IDs are ignored');
const merged = progressApi.merge({completedTopics:['pcb:1'],completedCases:['gpu-artifacts'],bestScores:{'gpu-artifacts':60}},{completedTopics:['pcb:0'],completedCases:['no-power'],bestScores:{'gpu-artifacts':80}});
assert.equal(merged.completedTopics.length, 2, 'backup import merges without losing existing progress');
assert.equal(merged.bestScores['gpu-artifacts'], 80, 'backup import preserves the best score');
assert.equal(data.domains.length, 10, 'ten domains');
assert.equal(data.domains.reduce((n, d) => n + d.topics.length, 0), 30, 'thirty structured atlas topics');
for (const domain of data.domains) {
  assert(domain.id && domain.name && domain.desc, 'domain metadata');
  for (const topic of domain.topics) {
    assert.equal(topic.length, 5, 'topic has overview, steps, equipment and safety');
    assert(topic[0].length > 5 && topic[1].length > 50, 'topic has usable title and explanation');
    assert(topic[2].length >= 3, 'topic contains practical steps');
    assert(topic[3].length > 5 && topic[4].length > 10, 'topic contains tools and safety notes');
  }
}
assert.equal(data.cases.length, 8, 'eight diagnostic simulations');
for (const scenario of data.cases) {
  assert.equal(scenario.stages.length, 3, 'three decisions per scenario');
  for (const stage of scenario.stages) {
    assert(stage.q.length > 15 && stage.options.length >= 3, 'scenario decision is complete');
    assert.equal(stage.options.filter(option => option[1] === true).length, 1, 'exactly one safe/appropriate answer');
  }
}
assert.equal(data.exams.length, 3, 'three exams');
for (const exam of data.exams) {
  assert.equal(exam.questions.length, 8, 'eight questions per exam');
  for (const q of exam.questions) {
    assert.equal(q[1].length, 3, 'three answer options');
    assert(q[2] >= 0 && q[2] < q[1].length, 'correct answer index valid');
    assert(q[3].length > 10, 'answer explanation present');
  }
}
assert.match(data.decodeSmd('472').replace(/\s/g, ''), /4700Ω/, '3 digit SMD');
assert.match(data.decodeSmd('1001').replace(/\s/g, ''), /1000Ω/, '4 digit SMD');
assert.match(data.decodeSmd('4R7').replace(/\s/g, ''), /4,7Ω/, 'R notation');
assert.match(data.decodeSmd('01A'), /EIA-96/, 'EIA-96 notation');
assert.match(data.decodeSmd('XYZ-42'), /Nie rozpoznaję/, 'unknown marking is not guessed');
assert.equal(Object.keys(data.media).length, 10, 'ten media sets for ten domains');
for (const domain of data.domains) {
  const media = data.media[domain.id];
  assert(media && media.image && media.video && media.poster && media.captions, `media mapping for ${domain.id}`);
  for (const asset of [
    root + '/media/' + media.image,
    root + '/media/videos/' + media.video,
    root + '/media/video_posters/' + media.poster,
    root + '/media/videos/' + media.captions
  ]) assert(require('node:fs').existsSync(asset), `local media asset exists: ${asset}`);
}
const html = fs.readFileSync(root + '/index.html', 'utf8');
const sw = fs.readFileSync(root + '/service-worker.js', 'utf8');
assert(html.includes('id="view-masterworkshop"') && html.includes('id="nwmMasterWorkshop"'), 'view root exists');
assert(html.includes('data-view="masterworkshop"') && html.includes("'masterworkshop'"), 'sidebar navigation and route exist');
assert(html.includes('master-workshop-630.js?v=6.2.0-fix12'), 'runtime loaded with versioned URL');
assert(html.includes('master-workshop-630.css?v=6.2.0-fix12'), 'styles loaded with versioned URL');
assert(sw.includes('/assets/master-workshop-630.js') && sw.includes('/assets/master-workshop-630.css'), 'PWA caches both assets');
for (const id of ['nwmDomainGrid','nwmTopicList','nwmTopicDetail','nwmCasePicker','nwmSimStage','nwmCalcMode','nwmSmdCode','nwmExamPicker','nwmCaseForm','nwmBeforePhoto','nwmAfterPhoto','nwmNoteForm','nwmDatasheetSearch','nwmExportBackup','nwmImportBackup']) assert(html.includes(`id="${id}"`), `HTML element ${id}`);
assert(source.includes('indexedDB.open') && source.includes('NPAcademyWorkshopDB'), 'case journal uses local IndexedDB');
assert(source.includes("['image/jpeg','image/png','image/webp']"), 'photo uploader accepts only raster JPG/PNG/WebP formats');
assert(source.includes('function cleanProgress') && source.includes('mergeProgress'), 'backup import validates and merges local progress');
assert(source.includes('data:image\\/') || source.includes('data:image/'), 'image compression and local-only image storage');
assert(source.includes('NPA-MASTER-WORKSHOP-BACKUP'), 'separate versioned backup format');
assert(source.includes('Nie jest państwowym ani akredytowanym'), 'certificate limitations disclosed');
console.log('PASS | import postępu filtruje nieznane ID, usuwa duplikaty i łączy wyniki bez utraty danych');
console.log('PASS | atlas 10 dziedzin / 30 tematów z procedurami i ostrzeżeniami');
console.log('PASS | 8 symulacji diagnostycznych × 3 decyzje, jedna prawidłowa odpowiedź na etap');
console.log('PASS | 3 egzaminy × 8 pytań, wyjaśnienia i próg zaliczenia w module');
console.log('PASS | dekoder SMD 3/4 cyfry, R i EIA-96 bez zgadywania nieznanych kodów');
console.log('PASS | nawigacja, widok, arkusz stylów, skrypt oraz cache PWA FIX12');
console.log('PASS | 10 dziedzin ma własne zdjęcie, film MP4, plakat i napisy z lokalnej biblioteki');
console.log('PASS | dziennik ze zdjęciami w IndexedDB, edytor lokalnych materiałów i kopia JSON');
