@echo off
rem Zgodnosc historycznego kontraktu runnerow FIX46: WYKONAJ_TESTY_FIX47.cmd.
setlocal
cd /d "%~dp0"
title NAUKA OD A DO Z - PELNE TESTY FIX97
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
echo ============================================================
echo NAUKA OD A DO Z - PELNE TESTY REGRESYJNE FIX97
echo ============================================================
node scripts\run-tests-fix97.mjs
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo [OK] Wszystkie testy FIX97 zakonczone powodzeniem.
  echo Publikator sprawdza 13 zdjec: 3 baner + 6 slajdow + 4 kafelki.
) else (
  echo [BLAD] Testy nie przeszly. Publikacja pozostaje zablokowana.
)
pause
exit /b %RC%
