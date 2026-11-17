@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z 6.8.0 - PELNE TESTY FIX198-FIX202
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js. Zainstaluj Node.js LTS lub uruchom testy na komputerze z Node.js.
  set "RESULT=1"
  goto :finish
)
node --version
node scripts\run-tests-fix202.mjs
set "RESULT=%ERRORLEVEL%"
if "%RESULT%"=="0" (
  echo.
  echo [OK] Wszystkie testy automatyczne zakonczone powodzeniem.
) else (
  echo.
  echo [BLAD] Testy nie przeszly. Sprawdz komunikat powyzej.
)
:finish
echo.
echo Kod zakonczenia: %RESULT%
echo ======================================================
pause
exit /b %RESULT%
