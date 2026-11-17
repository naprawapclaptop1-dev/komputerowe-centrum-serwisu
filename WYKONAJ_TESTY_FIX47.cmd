@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX47/FIX48 + FIX49 ULTIMATE QUALITY CENTER
echo Kontrola skladni projektu + pelna regresja historyczna, FIX48 i FIX49
echo ======================================================
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
echo.
echo [OK] FIX47/FIX48/FIX49 i wszystkie testy historyczne zakonczone powodzeniem.
exit /b 0
:failed
echo.
echo [BLAD] Test nie przeszedl. Publikacja nie jest zatwierdzona.
exit /b 1
