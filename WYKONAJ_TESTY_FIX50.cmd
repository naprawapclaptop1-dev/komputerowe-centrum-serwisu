@echo off
setlocal EnableExtensions
cd /d "%~dp0"
rem FIX50 zastępuje bezpośrednie wywołanie WYKONAJ_TESTY_FIX47.cmd, ale zachowuje pełną listę test-*.js i test-*.mjs.
echo ======================================================
echo NAUKA OD A DO Z - FIX50 PHOTO RELIABILITY
echo Pelna kontrola skladni, regresja, zdjecia, kontrakt i audyty
echo ======================================================
node --version || goto :failed
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
node scripts\security-audit-fix49.mjs || goto :failed
node scripts\migration-audit-fix49.mjs || goto :failed
node scripts\test-release-contract-fix50.mjs || goto :failed
echo.
echo [OK] Testy lokalne i audyty zakonczone powodzeniem.
echo [INFO] Brak wdrozenia produkcyjnego i brak migracji D1.
exit /b 0
:failed
echo.
echo [BLAD] Kontrola FIX50 nie przeszla. Publikacja nie jest zatwierdzona.
exit /b 1
