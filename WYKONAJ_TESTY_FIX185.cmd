@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================================
echo NAUKA OD A DO Z 6.8.0 - FIX185 - PELNA REGRESJA
echo ================================================================
set "NODE_EXE=node.exe"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  echo Zainstaluj Node.js zgodny z projektem lub uruchom dotychczasowy resolver NODE_EXE.path.
  pause
  exit /b 2
)
node scripts\run-tests-fix185.mjs
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
  echo.
  echo [FAIL] Testy FIX185 nie przeszly. Szczegoly: FIX185_FULL_TESTS.log
) else (
  echo.
  echo [PASS] Pelna regresja FIX176-FIX185 zakonczona powodzeniem.
  echo Raport: FIX185_FULL_TESTS.log
)
echo.
pause
exit /b %RC%
