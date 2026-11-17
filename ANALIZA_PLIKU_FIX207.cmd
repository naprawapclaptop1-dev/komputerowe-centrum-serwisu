@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "TARGET=%~1"
if "%TARGET%"=="" set /p TARGET=Podaj pelna sciezke do pliku do analizy statycznej: 
if "%TARGET%"=="" echo Brak sciezki.&pause&exit /b 2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX207_STATIC_FILE_TRIAGE.ps1" -FilePath "%TARGET%"
set "RC=%ERRORLEVEL%"
echo Kod: %RC%
pause
exit /b %RC%
