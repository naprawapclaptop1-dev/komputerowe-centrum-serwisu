// FIX129: homepage showcase guard — local SVG fallback plus curated equipment photo slots.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
function readAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = String(tag).match(pattern);
  return match ? (match[1] ?? match[2]) : null;
}
function homeMarkup(html) {
  const marker = html.search(/<section\b[^>]*\bid=["']view-home["']/i);
  if (marker < 0) throw new Error('FIX122: brak sekcji #view-home.');
  const homeId = html.indexOf('id="view-home"', marker);
  const next = html.indexOf('id="view-', homeId + 15);
  return html.slice(marker, next > marker ? next : undefined);
}
function verifyHomepageShowcase(html, showcaseJs, showcaseCss, projectRoot = path.resolve(__dirname, '..')) {
  if (![html, showcaseJs, showcaseCss].every(value => typeof value === 'string')) throw new TypeError('Kontrola pokazu wymaga HTML, JavaScript i CSS jako tekstu.');
  const webRoot = path.join(projectRoot, 'WEB_PUBLISH');
  const visualManifestPath = path.join(webRoot, 'assets', 'homepage-tech-visuals-fix122.json');
  if (!fs.existsSync(visualManifestPath)) throw new Error('FIX122: brak manifestu ilustracji technicznych.');
  const manifest = JSON.parse(fs.readFileSync(visualManifestPath, 'utf8'));
  if (manifest.hotfix !== 'FIX122' || manifest.policy !== 'homepage-local-svg-only-no-people' || manifest.totalImages !== 36 || manifest.images?.length !== 36) throw new Error('FIX122: manifest nie opisuje 36 ilustracji technicznych bez postaci.');
  const section = homeMarkup(html);
  const images = [...section.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
  if (images.length !== 36) throw new Error(`FIX122: strona główna powinna mieć dokładnie 36 ilustracji; znaleziono ${images.length}.`);
  const expected = new Map(manifest.images.map(item => [item.path, item]));
  const used = new Set();
  const currentPhotoMap = JSON.parse(fs.readFileSync(path.join(webRoot,'media','photo-sources-online.json'),'utf8')).homepageSlotSeedMap || {};
  const photoSlots = Object.keys(currentPhotoMap).length;
  for (const tag of images) {
    const src = String(readAttribute(tag, 'src') || '').split(/[?#]/)[0];
    const photoId = readAttribute(tag, 'data-photo-id');
    const isFix142HeroPhoto = photoId === 'home-hero-usbc-main';
    const fallbackSrc = String(readAttribute(tag, 'data-photo-local-fallback') || '').split(/[?#]/)[0];
    const validatedIllustration = isFix142HeroPhoto ? fallbackSrc : src;
    const record = expected.get(validatedIllustration);
    if (!record || !/^assets\/artwork-fix(?:77|51)\/[a-z0-9-]+\.svg$/i.test(validatedIllustration)) throw new Error(`FIX129: brak zatwierdzonej lokalnej ilustracji awaryjnej: ${validatedIllustration || '(brak źródła)'}.`);
    if (isFix142HeroPhoto) {
      if (src !== 'media/hero-usbc-power-delivery-fix142.jpg' || readAttribute(tag, 'data-photo-kind') !== 'port' || readAttribute(tag, 'data-photo-unique') !== 'true') throw new Error('FIX142: HERO USB-C musi korzystać z lokalnej, unikalnej fotografii portu.');
      const photoPath = path.resolve(webRoot, src);
      if (!photoPath.startsWith(webRoot + path.sep) || !fs.existsSync(photoPath) || !fs.statSync(photoPath).isFile()) throw new Error(`FIX142: brakuje lokalnej fotografii HERO ${src}.`);
      const signature = fs.readFileSync(photoPath).subarray(0, 3);
      if (signature[0] !== 0xff || signature[1] !== 0xd8 || signature[2] !== 0xff) throw new Error('FIX142: fotografia HERO nie jest prawidłowym plikiem JPEG.');
    }
    if (used.has(validatedIllustration)) throw new Error(`FIX129: powtórzone źródło ilustracji awaryjnej ${validatedIllustration}.`);
    used.add(validatedIllustration);
    if (!photoId) throw new Error(`FIX129: slot grafiki strony głównej nie ma data-photo-id: ${src}.`);
    if (readAttribute(tag, 'data-photo-ignore') === 'true' || readAttribute(tag, 'data-photo-eligible') === 'false') throw new Error(`FIX129: slot ${photoId} nadal ma aktywną blokadę zdjęć.`);
    const asset = path.resolve(webRoot, validatedIllustration);
    if (!asset.startsWith(webRoot + path.sep) || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) throw new Error(`FIX129: brakuje pliku awaryjnego ${validatedIllustration}.`);
    if (!fs.readFileSync(asset, 'utf8').includes('<svg')) throw new Error(`FIX129: ${validatedIllustration} nie zawiera poprawnego SVG fallbacku.`);
  }
  if (used.size !== 36) throw new Error('FIX129: wszystkie 36 slotów musi zachować własny, lokalny fallback SVG.');
  if (photoSlots < 19) throw new Error(`FIX129: oczekiwano co najmniej 19 slotów modułów ze zdjęciami; znaleziono ${photoSlots}.`);
  const slideSection = section.match(/<section\b[^>]*\bid=["']np640Showcase["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] || '';
  const slides = [...slideSection.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)].filter(match => (readAttribute(match[1], 'class') || '').split(/\s+/).includes('np640-slide'));
  if (slides.length !== 6) throw new Error(`FIX122: pokaz powinien zawierać 6 slajdów; znaleziono ${slides.length}.`);
  const moduleGrid = section.match(/<div\b[^>]*class=["'][^"']*np640-module-grid[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/section>/i)?.[1] || '';
  const modules = [...moduleGrid.matchAll(/<button\b[\s\S]*?<\/button>/gi)];
  if (modules.length !== 19) throw new Error(`FIX122: oczekiwano 19 kart modułów; znaleziono ${modules.length}.`);
  const specialistSection = section.match(/<section\b[^>]*class=["'][^"']*np75-specialists[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] || '';
  const specialistImages = [...specialistSection.matchAll(/<img\b[^>]*data-photo-id=["']home-specialist-[^"']+["'][^>]*>/gi)];
  if (specialistImages.length !== 6) throw new Error(`FIX129: oczekiwano 6 kart specjalizacji z fallbackiem; znaleziono ${specialistImages.length}.`);
  if (!html.includes('np640-learning-center')) throw new Error('Brak Centrum Nauki FIX8.');
  if (!showcaseJs.includes('NAUKA OD A DO Z — strona główna') || !showcaseJs.includes('prefers-reduced-motion') || !showcaseJs.includes('dailyPlan') || !showcaseJs.includes('setImageFallbacks') || !/addEventListener\(['"]error['"]/.test(showcaseJs) || !showcaseJs.includes('fallbackUsed')) throw new Error('Silnik pokazu FIX8 jest niekompletny.');
  if (!showcaseCss.includes('.np640-slide.is-active')) throw new Error('Brak stylu aktywnego slajdu FIX8.');
  return { slides: slides.length, uniqueIllustrations: 6, uniqueVisualIds: 36, hasLearningCenter: true, homepageImages: images.length, moduleCards: modules.length, specialistCards: specialistImages.length, photoSlots, peopleAllowed: false };
}
module.exports = { verifyHomepageShowcase };
