@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX53 DEPLOY WATCHER HOTFIX
echo Naprawa kontroli 33 zasobow wizualnych po wdrozeniu
echo Bez publikacji produkcyjnej i bez migracji D1
rem Legacy runner WYKONAJ_TESTY_FIX47.cmd remains the historical full-regression base; FIX52 -> FIX51 is the current superset.
echo ======================================================
call WYKONAJ_TESTY_FIX52.cmd
if errorlevel 1 goto :failed
node --check AUTO_PUBLISH_WATCHER.js || goto :failed
node --check ONECLICK_AKADEMIA.js || goto :failed
node --check scripts\fix51-visual-asset-verification-fix53.cjs || goto :failed
node --check scripts\test-watcher-fix51-asset-count-fix53.mjs || goto :failed
node scripts\test-watcher-fix51-asset-count-fix53.mjs || goto :failed
echo.
echo [OK] FIX53 - testy poprawki obserwatora zakonczone powodzeniem.
echo [INFO] Publikacja produkcyjna i migracje D1 nie byly wykonywane.
exit /b 0
:failed
echo.
echo [BLAD] FIX53 - test nie przeszedl. Publikacja pozostaje zablokowana.
exit /b 1
