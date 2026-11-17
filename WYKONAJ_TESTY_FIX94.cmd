@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - TESTY FIX94 - DOPASOWANIE PRAWDZIWYCH ZDJEC
echo ======================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Nie znaleziono Node.js w PATH.
  pause
  exit /b 1
)
node --version
node scripts\run-tests-fix94.mjs
set RESULT=%ERRORLEVEL%
echo.
if not "%RESULT%"=="0" (
  echo [BLAD] Testy FIX94 nie przeszly. Publikacja musi pozostac zablokowana.
) else (
  echo [OK] Testy FIX94 zakonczone powodzeniem.
)
echo Kod zakonczenia: %RESULT%
pause
exit /b %RESULT%
