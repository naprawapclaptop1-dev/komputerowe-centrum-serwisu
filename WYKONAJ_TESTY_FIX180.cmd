@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ================================================================
echo NAUKA OD A DO Z 6.8.0 - FIX180 - PELNA REGRESJA I AUDYT DUPLIKATOW
echo ================================================================
where node >nul 2>&1
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
node scripts\run-tests-fix180.mjs
if errorlevel 1 (
  echo.
  echo [FAIL] Testy FIX180 nie przeszly. Szczegoly powyzej.
  pause
  exit /b 1
)
echo.
echo [PASS] FIX180 i regresja istniejącej Akademii zakończone poprawnie.
pause
exit /b 0
