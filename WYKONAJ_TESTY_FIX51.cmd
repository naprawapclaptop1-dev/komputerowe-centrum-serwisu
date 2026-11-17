@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX51 VISUAL ACADEMY PRO
echo Kontrola skladni, regresja, biblioteka wizualna i kontrakt wydania
echo ======================================================
node --version || goto :failed
for /f "tokens=*" %%V in ('node --version') do set NODE_VERSION=%%V
if not "%NODE_VERSION%"=="v24.19.0" echo [UWAGA] Zalecany runtime projektu to Node.js v24.19.0; wykryto %NODE_VERSION%.
for /r %%F in (*.js *.mjs *.cjs) do (
  echo [SYNTAX] %%F
  node --check "%%F" || goto :failed
)
for %%F in (scripts\test-*.js) do (
  echo [TEST] %%F
  node "%%F" || goto :failed
)
for %%F in (scripts\test-*.mjs) do (
  echo [TEST] %%F
  node "%%F" || goto :failed
)
node scripts\test-visual-academy-fix51.mjs || goto :failed
node scripts\test-preview-server-fix51.mjs || goto :failed
node scripts\test-release-contract-fix51.mjs || goto :failed
node scripts\security-audit-fix51.mjs || goto :failed
node scripts\migration-audit-fix51.mjs || goto :failed
echo.
echo [OK] Testy lokalne i audyty FIX51 zakonczone.
echo [INFO] Nie wykonano publikacji produkcyjnej ani migracji D1.
exit /b 0
:failed
echo.
echo [BLAD] Kontrola FIX51 nie przeszla. Publikacja nie jest zatwierdzona.
exit /b 1
