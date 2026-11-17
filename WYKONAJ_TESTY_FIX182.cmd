@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ================================================================
echo NAUKA OD A DO Z 6.8.0 - FIX182 - PELNA REGRESJA I AUDYT
echo ================================================================
where node >nul 2>&1
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
node scripts\run-tests-fix182.mjs
if errorlevel 1 (
  echo.
  echo [FAIL] Testy FIX182 nie przeszly. Zobacz FIX182_FULL_TESTS.log.
  pause
  exit /b 1
)
echo.
echo [PASS] FIX182 i regresja poprzednich poprawek zakonczone poprawnie.
echo [INFO] Raport: FIX182_FULL_TESTS.log
pause
exit /b 0
