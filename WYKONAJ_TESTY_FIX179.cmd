@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z - FIX179 - TESTY AKADEMII EKSPERCKIEJ
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  echo Zainstaluj obslugiwana wersje Node.js lub uruchom resolver Node.
  pause
  exit /b 1
)
node scripts\run-tests-fix179.mjs
set RESULT=%ERRORLEVEL%
echo.
if "%RESULT%"=="0" (
  echo [PASS] Regresja FIX176-FIX179 zakonczona pomyslnie.
) else (
  echo [FAIL] Testy zakonczone bledem. Zapisz caly komunikat.
)
pause
exit /b %RESULT%
