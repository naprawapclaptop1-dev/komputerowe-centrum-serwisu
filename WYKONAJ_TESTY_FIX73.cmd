@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX64-FIX73 - PELNE TESTY WYDANIA
echo ======================================================
node --version
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-release-contract-fix49.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-release-contract-fix50.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-photo-reliability-fix50.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-visual-academy-fix51.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-preview-server-fix51.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-release-contract-fix51.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-watcher-fix51-asset-count-fix53.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-global-academy-suite-fix60.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-global-academy-expansion-fix73.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-global-academy-http-fix73.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-syntax-fix64-fix73.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-migration-inventory-compat-fix62.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-visual-assets-http-fix54.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-production-branch-guard-fix54.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-pages-branch-discovery-fix63.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-view-count-fix61.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-ultimate-quality-fix49.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\test-pending-migration-guard-fix49.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\security-audit-fix51.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\migration-audit-fix51.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\security-audit-fix49.mjs
if errorlevel 1 goto fail
echo.
echo [TEST] {t}
node scripts\migration-audit-fix49.mjs
if errorlevel 1 goto fail
echo.
echo [OK] Wszystkie 22 testy preflight zakonczone.
echo Sprawdz Chrome i Edge przez PODGLAD_FIX64_FIX73.cmd.
echo Publikacja produkcyjna wymaga osobnej kontroli Cloudflare.
echo ======================================================
pause
exit /b 0
:fail
echo.
echo [BLAD] Test nie przeszedl. Publikacja pozostaje zablokowana.
echo ======================================================
pause
exit /b 1
