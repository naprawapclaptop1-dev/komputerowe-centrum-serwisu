'use strict';
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'AUTO_PUBLISH_WATCHER.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'WEB_PUBLISH', 'index.html'), 'utf8');
const stateApi = fs.readFileSync(path.join(__dirname, '..', 'functions', 'api', 'state.js'), 'utf8');
if (/newPlatformBrand\s*=.*\bindexHtml\b/.test(source)) throw new Error('Kontrola marki platformy odwołuje się do nieprawidłowej zmiennej indexHtml.');
const guard = source.split(/\r?\n/).find(line => line.includes('view-knowledge'));
if (!guard || !guard.includes('html.includes') || guard.includes('indexHtml')) throw new Error('Kontrola mapy wiedzy nie korzysta z html.');
if (stateApi.includes('academyLabWorkorders') || !source.includes("stateApi.includes('academyLabWorkorders')")) throw new Error('API/watchdog nadal dopuszcza stare karty zleceń.');
if (!source.includes('academyFeatureChecks') || !source.includes('academyFeaturesMissing')) throw new Error('Brak szczegółowej diagnostyki bramki Akademii.');
const hasId = (document, id) => new RegExp('\\bid\\s*=\\s*(["\\\'])' + id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + '\\1', 'i').test(document);
const hasIdText = (document, id, value) => {
  const escapedId = id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
  return new RegExp('<[a-z][^>]*\\bid\\s*=\\s*(["\\\'])' + escapedId + '\\1[^>]*>\\s*' + value + '(?:\\s|<)', 'i').test(document);
};
if (!hasIdText(html, 'lessonTotalBadge', '1060')) throw new Error('index.html nie ma 1060 lekcji.');
const requiredIds = ['emailAuthForm','deviceModelDirectory','academyGlobalStats','metricUniqueVisitors','metricMonthVisits','metricTodayViews','metricWeekViews','metricLearnersWithProgress','metricTrackedLessonOpens','metricTrackedVideoOpens','metricTrackedLessonCompletions','supportImpact','supportFaq'];
for (const id of requiredIds) if (!hasId(html, id)) throw new Error(`Brak wymaganego ID: ${id}.`);
for (const [id, value] of [['metricBrandTotal','33'],['metricModelTotal','150']]) if (!hasIdText(html,id,value)) throw new Error(`Nieprawidłowa wartość ${id}: ${value}.`);
if (!/akademia-dlaczego-warto-wspierac\.mp4/i.test(html)) throw new Error('Brak filmu wsparcia.');
// Simulate harmless HTML formatting changes performed by minifiers/edge transforms.
const formatted = html.replace('id="lessonTotalBadge">1060', "class='badge' id = 'lessonTotalBadge' >\n 1060");
if (!hasIdText(formatted, 'lessonTotalBadge', '1060')) throw new Error('Kontrola liczby lekcji nie toleruje białych znaków / pojedynczych cudzysłowów.');
console.log('[PASS] Brak niezadeklarowanego indexHtml.');
console.log('[PASS] Kontrola mapy wiedzy korzysta z html.');
console.log('[PASS] Bramka rozpoznaje 1060 lekcji, także po zmianie białych znaków i cudzysłowów.');
console.log('[PASS] Wszystkie ID kont, modeli, statystyk i wsparcia istnieją.');
console.log('[PASS] Liczby producentów i modeli są zgodne (33 / 150).');
console.log('[PASS] Diagnostyka raportuje nazwy brakujących funkcji zamiast samego academyFeatures=false.');
console.log('[PASS] Stary klucz kart zleceń jest blokowany przez API synchronizacji i watcher.');

if (!source.includes('remoteSupportVideoFresh') || !source.includes('fix9-clean-video') || !source.includes('checkPublicMediaAsset') || source.includes("method:'HEAD'")) throw new Error('Watcher musi sprawdzać MP4 żądaniem GET/Range bez założenia Content-Length z HEAD.');
const mediaCheck = fs.readFileSync(path.join(__dirname, 'public-media-check.js'), 'utf8');
if (!mediaCheck.includes("method: 'GET'") || !mediaCheck.includes("Range: 'bytes=0-1048575'") || !mediaCheck.includes('content-range') || !mediaCheck.includes('getReader')) throw new Error('Brak odporniej kontroli rozmiaru MP4 przez GET/Range i ograniczony odczyt.');
for (const id of ['npmlMeasurementLog','npmlForm','npmlRows','npmlExportCsv']) if (!hasId(html,id)) throw new Error(`Brak dziennika pomiarów FIX11: ${id}`);
if (!source.includes('remoteMeasurementLogValid') || !source.includes('measurement-log-640.js?v=6.2.0-fix11')) throw new Error('Watcher nie sprawdza nowego modułu dziennika pomiarów.');
if (!source.includes('remoteMasterWorkshopValid') || !source.includes('remoteMasterWorkshopCssValid') || !source.includes("masterWorkshop: hasId('view-masterworkshop')") || !source.includes('master-workshop-630.js?v=6.2.0-fix12') || !source.includes('master-workshop-630.css?v=6.2.0-fix12')) throw new Error('Watcher musi sprawdzać FIX12 na stałym adresie, w tym rzeczywisty JS i CSS Warsztatu Mistrza.');
if (!source.includes('remoteMasterAcademyValid') || !source.includes('remoteMasterAcademyCssValid') || !source.includes('masterAcademyFix14') || !source.includes('master-workshop-630-extension.js?v=6.8.0-fix119') || !source.includes('master-workshop-630-extension.css?v=6.8.0-fix119')) throw new Error('Watcher musi sprawdzać nowy moduł FIX14 na stałym adresie.');
for (const key of ['view-masterworkshop','nwmMasterWorkshop','nwmDomainGrid','nwmCaseForm','nwmExamPicker']) if (!html.includes(`id="${key}"`)) throw new Error(`Brak zasobu Warsztatu Mistrza FIX12: ${key}`);
console.log('[PASS] FIX12: watcher wymaga aktywnego widoku i rzeczywistych zasobów JS/CSS na stałym adresie.');

// FIX28: account limiter v2 schema, migration 0014 and bounded negative-login probe.
if (!source.includes('accountSchemaStatus') || source.includes("'emailAccountSchema'") || !source.includes('0013_account_runtime_guard.sql') || !source.includes('0014_account_limiter_key_repair.sql') || !source.includes('0015_account_limiter_v3.sql')) throw new Error('Watcher musi sprawdzać wspólny schemat kont FIX28 i migracje 0013–0015.');
if (!source.includes('accountNegativeProbePassedForBuild') || !source.includes('qa-login-check@example.invalid') || !source.includes('TestInvalidOnly-2026!')) throw new Error('Watcher musi wykonać kontrolowany test negatywny raz na build, bez tworzenia konta.');
if (!source.includes('negativeData.reference') || !source.includes('negativeData.stage') || !source.includes('academy_account_rate_limits_v3') || !source.includes("auth.accountLimiterTable!=='academy_account_rate_limits_v3'")) throw new Error('Watcher nie sprawdza diagnostyki etapu lub aktywnego limitera V3.');
if (!source.includes('6.8.0 FIX49')) throw new Error('Wiadomość deploymentu musi oznaczać aktualny build FIX49.');
for (const token of ['cloud-backup-700.js','google_drive','microsoft_onedrive','KONFIGURUJ_KOPIE_CHMUROWE']) if (source.includes(token)) throw new Error(`Watcher nadal wymaga zewnętrznej kopii chmurowej: ${token}`);
console.log('[PASS] FIX30: watcher sprawdza migracje 0013–0015, limiter v3 i bezpieczną próbę negatywną; integracje chmurowe są usunięte.');
