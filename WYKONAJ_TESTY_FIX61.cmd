@echo off
setlocal EnableExtensions
rem Legacy compatibility marker: WYKONAJ_TESTY_FIX47.cmd remains the historical regression base; the current chain is FIX60 -> FIX53 -> FIX52 -> FIX51 plus active tests.
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX61 VIEW GUARD HOTFIX
echo Zachowuje 33 historyczne widoki i dopuszcza 34. widok Global Academy PRO
echo Bez publikacji produkcyjnej i bez migracji D1
echo ======================================================
call WYKONAJ_TESTY_FIX60.cmd
if errorlevel 1 goto :failed
node --check scripts\support-view-guard-fix35.js || goto :failed
node --check scripts\test-support-view-guard-fix35.js || goto :failed
node --check scripts\test-support-page-expansion-fix35.js || goto :failed
node --check scripts\test-support-community-fix36.mjs || goto :failed
node --check scripts\test-view-count-fix61.mjs || goto :failed
node scripts\test-view-count-fix61.mjs || goto :failed
echo.
echo [OK] FIX61 - kontrola 34 niezaleznych widokow zakonczona powodzeniem.
echo [INFO] Nie wykonano publikacji produkcyjnej ani migracji D1.
exit /b 0
:failed
echo.
echo [BLAD] FIX61 - test nie przeszedl. Publikacja pozostaje zablokowana.
exit /b 1
