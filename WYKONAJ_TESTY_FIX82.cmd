@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NAUKA OD A DO Z - TESTY FIX82
color 0B
echo ======================================================
echo NAUKA OD A DO Z - GLOBAL ACADEMY PRO
echo TEST GLOBAL ACADEMY PUBLICATION MARKER - FIX82
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Node.js nie jest dostepny w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix82.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX82 nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo [OK] Wszystkie testy FIX82 zakonczone pomyslnie.
  echo [INFO] Watcher rozpoznaje moduł egzaminów FIX70 po aktywnym identyfikatorze npaFix70CertificatesV1.
)
echo ======================================================
pause
exit /b %RESULT%
