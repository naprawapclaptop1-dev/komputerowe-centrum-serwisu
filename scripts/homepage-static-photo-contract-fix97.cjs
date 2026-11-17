// FIX122: homepage publication contract — no photos or human subjects; local SVG technical art only.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(tag).match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[1] ?? match[2]) : '';
}
function fail(message) { throw new Error(`FIX122: ${message}`); }
function verifyHomepageStaticPhotoContractFix97({ webDir, indexHtml, photoUniquenessScript, photoLockScript, homeRefreshCss, homeShowcaseJs, homeShowcaseCss } = {}) {
  if (!webDir || typeof indexHtml !== 'string') fail('brak katalogu WWW lub HTML.');
  for (const [name, value] of Object.entries({ photoUniquenessScript, photoLockScript, homeRefreshCss, homeShowcaseJs, homeShowcaseCss })) if (typeof value !== 'string') fail(`brak kodu do kontroli: ${name}.`);
  const manifestPath = path.join(webDir, 'assets', 'homepage-tech-visuals-fix122.json');
  if (!fs.existsSync(manifestPath)) fail('brak manifestu ilustracji technicznych.');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.hotfix !== 'FIX122' || manifest.policy !== 'homepage-local-svg-only-no-people' || manifest.totalImages !== 36 || manifest.images?.length !== 36) fail('manifest musi opisywać 36 lokalnych ilustracji bez postaci.');
  const start = indexHtml.search(/<section\b[^>]*\bid=["']view-home["']/i);
  if (start < 0) fail('brak sekcji #view-home.');
  const homeId = indexHtml.indexOf('id="view-home"', start);
  const next = indexHtml.indexOf('id="view-', homeId + 15);
  const home = indexHtml.slice(start, next > start ? next : undefined);
  const tags = [...home.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  if (tags.length !== 36) fail(`oczekiwano 36 obrazów strony głównej, jest ${tags.length}.`);
  const byId = new Map(manifest.images.map(item => [item.id, item]));
  const sources = new Set();
  for (const tag of tags) {
    const id = attr(tag, 'data-tech-visual-id');
    const src = attr(tag, 'src').split(/[?#]/)[0];
    const item = byId.get(id);
    if (!item || item.path !== src) fail(`źródło ${id || '(brak ID)'} nie zgadza się z manifestem.`);
    if (!/^assets\/artwork-fix(?:77|51)\/[a-z0-9-]+\.svg$/i.test(src)) fail(`${id} nie jest lokalnym SVG.`);
    if (sources.has(src)) fail(`powtórzona ilustracja ${src}.`);
    sources.add(src);
    if (attr(tag, 'data-photo-ignore') !== 'true' || attr(tag, 'data-photo-eligible') !== 'false') fail(`silnik zdjęć nie jest zablokowany dla ${id}.`);
    if (attr(tag, 'data-tech-visual-src') !== src || !attr(tag, 'alt').startsWith('Ilustracja techniczna')) fail(`brak blokady lub tekstu alternatywnego dla ${id}.`);
    const file = path.resolve(webDir, src);
    if (!file.startsWith(path.resolve(webDir) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) fail(`brak pliku ${src}.`);
    if (!fs.readFileSync(file, 'utf8').includes('<svg')) fail(`niepoprawny SVG ${src}.`);
  }
  if (/https?:\/\/(?:images\.pexels\.com|thumb\.wikimedia\.org|upload\.wikimedia\.org)/i.test(home)) fail('strona główna zawiera zewnętrzny adres zdjęcia.');
  if (/photo-credit-fix(?:90|118)|FOTOGRAFIA ONLINE|NASA Johnson Space Center/i.test(home)) fail('w HTML pozostały podpisy fotografii.');
  const heroStart = home.indexOf('class="workbench-visual');
  const slideStart = home.indexOf('id="np640Showcase"');
  const hero = home.slice(heroStart, slideStart);
  const heroImages = [...hero.matchAll(/<img\b[^>]*>/gi)];
  const showcase = home.slice(slideStart, home.indexOf('</section>', slideStart));
  const slides = [...showcase.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)].filter(m => /np640-slide/.test(attr(` ${m[1]}`, 'class')));
  const gridStart = home.indexOf('<div class="np640-module-grid');
  const gridEnd = home.indexOf('</div>\n        </section>', gridStart);
  const moduleGrid = gridStart >= 0 && gridEnd > gridStart ? home.slice(gridStart, gridEnd) : '';
  const modules = [...moduleGrid.matchAll(/<button\b[\s\S]*?<\/button>/gi)];
  const specialists = home.match(/<section class="np75-specialists"[\s\S]*?<\/section>/i)?.[0] || '';
  const specialistCards = [...specialists.matchAll(/<img\b[^>]*data-tech-visual-id=["']home-tech-\d{2}["'][^>]*>/gi)].length;
  if (heroImages.length !== 3 || slides.length !== 6 || modules.length !== 19 || specialistCards !== 6) fail(`układ obrazów jest niekompletny: hero=${heroImages.length}, slajdy=${slides.length}, moduły=${modules.length}, specjalizacje=${specialistCards}.`);
  if (!home.includes('lokalnymi ilustracjami technicznymi') || !home.includes('bez postaci')) fail('brak czytelnego opisu polityki grafik.');
  if (!indexHtml.includes('homepage-tech-only-fix122.js?v=6.8.0-fix122')) fail('brak aktywnego runtime FIX122 w HTML.');
  if (!photoUniquenessScript.includes('FIX122_HOME_TECH_ONLY_NO_PEOPLE') || !photoLockScript.includes('NP_PHOTO_UNIQUENESS_FIX30') || !homeRefreshCss.includes('.np640-module-grid') || !homeShowcaseJs.includes('prefers-reduced-motion') || !homeShowcaseCss.includes('.np640-slide.is-active')) fail('zgodność z poprzednim układem strony lub silnikami jest niepełna.');
  return { totalUniqueLocalVisuals: sources.size, heroIllustrations: heroImages.length, showcaseSlides: slides.length, moduleCards: modules.length, specialistCards, peopleAllowed: false, externalHomepagePhotos: 0 };
}
module.exports = { verifyHomepageStaticPhotoContractFix97 };
