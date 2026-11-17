@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo NAUKA OD A DO Z - MONITOR CZUJNIKOW FIX224
echo ================================================
where powershell.exe >nul 2>&1 || (echo [BLAD] Brak Windows PowerShell.&pause&exit /b 1)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX224_LIVE_SENSOR_MONITOR.ps1" -DurationMinutes 5 -IntervalSeconds 2
set RESULT=%ERRORLEVEL%
echo.
echo Kod zakonczenia: %RESULT%
pause
exit /b %RESULT%
