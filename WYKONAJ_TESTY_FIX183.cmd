@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo NAUKA OD A DO Z 6.8.0 - PELNA KONTROLA FIX183
echo Regresja FIX176-FIX182 + audyt i test rzeczywistego panelu FIX183
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  echo Uruchom dotychczasowy START_FIX105.cmd, aby skorzystac z zapisanej sciezki Node.
  pause
  exit /b 2
)
node scripts\run-tests-fix183.mjs
set "RESULT=%ERRORLEVEL%"
if "%RESULT%"=="0" (
  echo.
  echo [PASS] FIX183 i pelna regresja zakonczone pomyslnie.
) else (
  echo.
  echo [FAIL] Testy zakonczone kodem %RESULT%.
)
echo Raport: FIX183_FULL_TESTS.log
echo Audyt duplikatow: FIX183_DUPLICATE_AUDIT.txt
echo Audyt dzialania: FIX183_ACTUAL_FUNCTIONAL_AUDIT.txt
pause
exit /b %RESULT%
