@echo off
rem Zgodnosc historycznego kontraktu runnerow FIX46: WYKONAJ_TESTY_FIX47.cmd.
setlocal
cd /d "%~dp0"
title NAUKA OD A DO Z - PELNE TESTY FIX98
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
echo ============================================================
echo NAUKA OD A DO Z - PELNE TESTY REGRESYJNE FIX98
echo ============================================================
node scripts\run-tests-fix98.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo [OK] Wszystkie testy FIX98 zakonczone powodzeniem.
  echo Kontrola obejmuje 19 modulow, 6 specjalizacji i 21 unikalnych zrodel fotografii.
) else (
  echo [BLAD] Testy nie przeszly. Publikacja pozostaje zablokowana.
)
pause
exit /b %RC%
