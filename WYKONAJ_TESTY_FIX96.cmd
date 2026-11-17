@echo off
rem Compatibility marker for legacy regression contracts: WYKONAJ_TESTY_FIX47.cmd
setlocal
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX96
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  echo Zainstaluj Node.js LTS i uruchom ten plik ponownie.
  pause
  exit /b 1
)
echo ============================================================
echo NAUKA OD A DO Z - PELNE TESTY REGRESYJNE FIX96
echo ============================================================
node scripts\run-tests-fix96.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo [OK] Wszystkie testy FIX96 zakonczone powodzeniem.
) else (
  echo [BLAD] Testy nie przeszly. Publikacja pozostaje zablokowana.
)
pause
exit /b %RC%
