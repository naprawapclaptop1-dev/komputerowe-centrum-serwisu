@echo off
setlocal EnableExtensions
rem Legacy compatibility marker: WYKONAJ_TESTY_FIX47.cmd remains the historical regression base; the current chain is FIX60 -> FIX53 -> FIX52 -> FIX51 plus active tests.
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO FIX54-FIX60
echo Kontrola lokalna, obrazy, API, prywatnosc, offline i publikator
echo Bez publikacji produkcyjnej i bez migracji D1
echo ======================================================
call WYKONAJ_TESTY_FIX53.cmd
if errorlevel 1 goto :failed
node --check AUTO_PUBLISH_WATCHER.js || goto :failed
node --check ONECLICK_AKADEMIA.js || goto :failed
node --check WEB_PUBLISH\assets\global-academy-suite-fix60.js || goto :failed
node --check scripts\test-global-academy-suite-fix60.mjs || goto :failed
node --check scripts\test-production-branch-guard-fix54.mjs || goto :failed
node --check scripts\test-visual-assets-http-fix54.mjs || goto :failed
node scripts\test-global-academy-suite-fix60.mjs || goto :failed
node scripts\test-production-branch-guard-fix54.mjs || goto :failed
node scripts\test-visual-assets-http-fix54.mjs || goto :failed
echo.
echo [OK] GLOBAL ACADEMY PRO FIX54-FIX60 - testy lokalne zakonczone powodzeniem.
echo [INFO] Nie wykonano wdrozenia produkcyjnego ani migracji D1.
exit /b 0
:failed
echo.
echo [BLAD] FIX54-FIX60 - test nie przeszedl. Publikacja pozostaje zablokowana.
exit /b 1
