@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX87
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo FIX87 - REPAIR PHOTO LAYOUT + UNIQUE VISUALS
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix87.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX87 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Testy FIX87 zakonczone pomyslnie.
  echo [INFO] Karty usterek maja duze ilustracje 16:9.
  echo [INFO] Kazda z 155 usterek ma 1 ilustracje karty i 3 inne ilustracje lekcji.
  echo [INFO] Nie zmieniono bazy D1 ani sekretow.
)
echo ======================================================
pause
exit /b %RESULT%
