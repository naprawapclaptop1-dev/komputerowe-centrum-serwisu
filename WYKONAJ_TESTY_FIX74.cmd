@echo off
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX64-FIX74 - PELNE TESTY WYDANIA
echo ======================================================
node --version
if errorlevel 1 goto fail
set "FAILED=0"
call :run "FIX74 - natywne sciezki file URL" "scripts\test-syntax-root-fix74.mjs" || goto fail
call :run "FIX49 - kontrakt wydania" "scripts\test-release-contract-fix49.mjs" || goto fail
call :run "FIX50 - kontrakt wydania" "scripts\test-release-contract-fix50.mjs" || goto fail
call :run "FIX50 - niezawodnosc fotografii" "scripts\test-photo-reliability-fix50.mjs" || goto fail
call :run "FIX51 - biblioteka wizualna" "scripts\test-visual-academy-fix51.mjs" || goto fail
call :run "FIX51 - lokalny serwer podgladu" "scripts\test-preview-server-fix51.mjs" || goto fail
call :run "FIX51 - kontrakt wydania" "scripts\test-release-contract-fix51.mjs" || goto fail
call :run "FIX53 - liczba zasobow watchera" "scripts\test-watcher-fix51-asset-count-fix53.mjs" || goto fail
call :run "FIX60 - Global Academy Suite" "scripts\test-global-academy-suite-fix60.mjs" || goto fail
call :run "FIX73 - rozszerzenie akademii" "scripts\test-global-academy-expansion-fix73.mjs" || goto fail
call :run "FIX73 - HTTP i bezpieczenstwo sciezek" "scripts\test-global-academy-http-fix73.mjs" || goto fail
call :run "FIX64-FIX73 - skladnia" "scripts\test-syntax-fix64-fix73.mjs" || goto fail
call :run "FIX62 - inwentarz migracji" "scripts\test-migration-inventory-compat-fix62.mjs" || goto fail
call :run "FIX54 - zasoby wizualne HTTP" "scripts\test-visual-assets-http-fix54.mjs" || goto fail
call :run "FIX54 - bramka galezi produkcyjnej" "scripts\test-production-branch-guard-fix54.mjs" || goto fail
call :run "FIX63 - wykrywanie galezi Pages" "scripts\test-pages-branch-discovery-fix63.mjs" || goto fail
call :run "FIX61 - liczba widokow" "scripts\test-view-count-fix61.mjs" || goto fail
call :run "FIX49 - centrum jakosci" "scripts\test-ultimate-quality-fix49.mjs" || goto fail
call :run "FIX49 - blokada migracji oczekujacych" "scripts\test-pending-migration-guard-fix49.mjs" || goto fail
call :run "FIX51 - audyt bezpieczenstwa" "scripts\security-audit-fix51.mjs" || goto fail
call :run "FIX51 - audyt migracji" "scripts\migration-audit-fix51.mjs" || goto fail
call :run "FIX49 - audyt bezpieczenstwa historyczny" "scripts\security-audit-fix49.mjs" || goto fail
call :run "FIX49 - audyt migracji historyczny" "scripts\migration-audit-fix49.mjs" || goto fail
echo.
echo [OK] Wszystkie 23 kontrole FIX74 zakonczone.
echo Chrome i Edge sprawdz przez PODGLAD_FIX64_FIX73.cmd.
echo Produkcyjna publikacja wymaga osobnego przejscia bramki Cloudflare.
echo ======================================================
pause
exit /b 0
:run
echo.
echo [TEST] %~1
node %~2
if errorlevel 1 exit /b 1
exit /b 0
:fail
echo.
echo [BLAD] Test nie przeszedl. Publikacja pozostaje zablokowana.
echo ======================================================
pause
exit /b 1
