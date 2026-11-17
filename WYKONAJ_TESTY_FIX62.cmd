@echo off
setlocal EnableExtensions
rem Legacy compatibility marker: WYKONAJ_TESTY_FIX47.cmd remains the historical regression base; this runner extends FIX61 with the FIX62 migration inventory checks.
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX62 MIGRATION INVENTORY HOTFIX
echo Naprawa testu liczby migracji: 17 bazowych lub 19 z dwiema znanymi migracjami historycznymi
echo Nie usuwa migracji, nie wykonuje SQL, nie publikuje do Cloudflare
echo ======================================================
call WYKONAJ_TESTY_FIX61.cmd
if errorlevel 1 goto :failed
node --check scripts\migration-inventory-compat-fix62.mjs || goto :failed
node --check scripts\test-migration-inventory-compat-fix62.mjs || goto :failed
node --check scripts\test-global-academy-suite-fix60.mjs || goto :failed
node scripts\test-migration-inventory-compat-fix62.mjs || goto :failed
node scripts\test-global-academy-suite-fix60.mjs || goto :failed
echo.
echo [OK] FIX62 - kontrola migracji i Global Academy zakonczona powodzeniem.
echo [INFO] Nie wykonano publikacji produkcyjnej ani migracji D1.
exit /b 0
:failed
echo.
echo [BLAD] FIX62 - test nie przeszedl. Publikacja pozostaje zablokowana.
exit /b 1
