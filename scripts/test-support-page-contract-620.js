'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const web = path.join(root, 'WEB_PUBLISH');
const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
const publisher = fs.readFileSync(path.join(root, 'ONECLICK_AKADEMIA.js'), 'utf8');
const watcher = fs.readFileSync(path.join(root, 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const video = path.join(web, 'media/videos/akademia-dlaczego-warto-wspierac.mp4');
const captions = path.join(web, 'media/videos/akademia-dlaczego-warto-wspierac.vtt');
const serviceWorker = fs.readFileSync(path.join(web, 'service-worker.js'), 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); else console.log(`[PASS] ${message}`); };
check(/dlaczego\s+warto\s+wspierać\s+(?:Akademię|platformę)/i.test(html), 'Nagłówek wsparcia toleruje nazwę Akademii lub platformy.');
check(/akademia-dlaczego-warto-wspierac\.mp4/i.test(html) && /akademia-dlaczego-warto-wspierac\.vtt/i.test(html), 'HTML odwołuje się do filmu i polskich napisów.');
check(fs.existsSync(video) && fs.statSync(video).size > 10000, 'Plik MP4 istnieje i nie jest pusty.');
check(fs.existsSync(captions) && fs.statSync(captions).size > 100, 'Plik VTT istnieje i zawiera napisy.');
if (fs.existsSync(captions)) {
  const vtt = fs.readFileSync(captions, 'utf8');
  check(vtt.includes('Każda wpłata jest dobrowolna') && vtt.includes('Dziękujemy'), 'Napisy wyjaśniają dobrowolność wsparcia i zawierają zakończenie.');
}
for (const id of ['supportWhyTitle', 'supportImpact', 'supportImpactTitle', 'supportFaq']) check(html.includes(`id="${id}"`), `Sekcja wsparcia zawiera ${id}.`);
check(publisher.includes('(?:Akademię|platformę)') && publisher.includes('supportVideoPath'), 'ONECLICK sprawdza elastyczny nagłówek i fizyczny plik filmu.');
check(watcher.includes('(?:Akademię|platformę)'), 'Watcher akceptuje aktualną nazwę platformy.');
check(serviceWorker.includes('akademia-dlaczego-warto-wspierac.mp4'), 'Service Worker uwzględnia film wsparcia w cache offline.');
if (failures.length) { console.error('\nFAIL:', failures.join('\nFAIL: ')); process.exit(1); }
console.log('\nPASS: kompletny kontrakt strony wsparcia 6.2.0.');

const supportHtml = fs.readFileSync(path.join(root,'WEB_PUBLISH','index.html'),'utf8');
const supportVideoMarkup = supportHtml.match(/<video class="support-video"[\s\S]*?<\/video>/i)?.[0] || '';
if (!supportVideoMarkup.includes('fix9-clean-video') || !supportHtml.includes('support-video-transcript') || /<track[^>]*\bdefault(?:\s|>)/i.test(supportVideoMarkup)) throw new Error('FIX9: odtwarzacz musi mieć czysty obraz, transkrypcję i opcjonalne napisy.');
console.log('[PASS] Odtwarzacz FIX9 nie wymusza napisów na obrazie; transkrypcja jest pod filmem.');
