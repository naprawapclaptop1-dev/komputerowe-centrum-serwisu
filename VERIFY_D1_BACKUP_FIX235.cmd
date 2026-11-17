@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set /p FILE=Przeciagnij plik kopii SQL tutaj i nacisnij Enter: 
if "%FILE%"=="" (echo [BLAD] Nie podano pliku.& pause & exit /b 2)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\FIX235_VERIFY_D1_BACKUP.ps1" -BackupFile "%FILE%"
set RC=%ERRORLEVEL%
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
