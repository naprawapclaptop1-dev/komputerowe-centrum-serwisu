@echo off
setlocal EnableExtensions
rem FIX63: complete local test suite plus automatic Cloudflare Pages branch discovery.
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX63 CLOUDflare BRANCH DISCOVERY
echo Pełna kontrola FIX49-FIX63; bez publikacji i bez SQL
 echo ======================================================
call WYKONAJ_TESTY_FIX62.cmd
if errorlevel 1 goto :failed
call WYKONAJ_TESTY_FIX47.cmd
if errorlevel 1 goto :failed
node --check AUTO_PUBLISH_WATCHER.js || goto :failed
node --check ONECLICK_AKADEMIA.js || goto :failed
node --check scripts\cloudflare-pages-branch-fix63.cjs || goto :failed
node --check scripts\test-pages-branch-discovery-fix63.mjs || goto :failed
node --check scripts\test-production-branch-guard-fix54.mjs || goto :failed
node scripts\test-pages-branch-discovery-fix63.mjs || goto :failed
node scripts\test-production-branch-guard-fix54.mjs || goto :failed
echo.
echo [OK] FIX63 - wszystkie testy bazowe i odkrywanie Production Branch przeszły.
echo [INFO] Testy nie publikowały projektu i nie wykonywały SQL.
exit /b 0
:failed
echo.
echo [BLAD] FIX63 - test nie przeszedl. Publikacja pozostaje zablokowana.
exit /b 1
