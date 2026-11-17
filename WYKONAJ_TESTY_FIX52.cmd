@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - FIX52 PREFLIGHT HOTFIX
echo Uruchamiam pelny zestaw testow projektu FIX51 po poprawce preflight.
echo Bez publikacji produkcyjnej i bez migracji D1.
echo ======================================================
call WYKONAJ_TESTY_FIX51.cmd
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo [BLAD] FIX52: testy nie przeszly. Publikacja pozostaje zablokowana.
) else (
  echo.
  echo [OK] FIX52: wszystkie kontrole WYKONAJ_TESTY_FIX51 zakonczone powodzeniem.
  echo [INFO] Testy nie uruchamiaja publikacji produkcyjnej ani migracji D1.
)
exit /b %RESULT%
