@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ================================================================
echo NAUKA OD A DO Z 6.8.0 - FIX181 - REGRESJA, AUDYT I TEST RUNTIME
echo ================================================================
where node >nul 2>&1
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
node scripts\run-tests-fix181.mjs
if errorlevel 1 (
  echo.
  echo [FAIL] Testy FIX181 nie przeszly. Zobacz FIX181_FULL_TESTS.log.
  pause
  exit /b 1
)
echo.
echo [PASS] FIX181 i regresja dotychczasowej Akademii zakończone poprawnie.
echo [INFO] Raport: FIX181_FULL_TESTS.log
pause
exit /b 0
