@echo off
setlocal EnableExtensions
title NAPRAWA PC FAN CONTROL PRO AI 2.0.4 FIX006
cd /d "%~dp0"
echo ============================================================
echo NAPRAWA PC FAN CONTROL PRO AI 2.0.4 - FIX006
echo JEDEN ZIP: Setup.exe + Portable
echo ============================================================
where dotnet >nul 2>nul
if errorlevel 1 (echo [BLAD] Brak .NET 10 SDK.& pause& exit /b 1)
dotnet restore "NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj"
if errorlevel 1 goto :fail
if not exist "..\artifacts" mkdir "..\artifacts"
dotnet publish "NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj" -c Release -r win-x64 --self-contained true -p:PublishReadyToRun=true -o "..\artifacts\NaprawaPCFanControl"
if errorlevel 1 goto :fail
if not exist "..\artifacts\NaprawaPCFanControl\NaprawaPCFanControl.exe" (echo [BLAD] Brak EXE.& goto :fail)
set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" (echo [BLAD] Zainstaluj Inno Setup 6.& goto :fail)
"%ISCC%" "INSTALLER.iss"
if errorlevel 1 goto :fail
set "STAGE=..\artifacts\ONE_ZIP_FIX006"
if exist "%STAGE%" rmdir /s /q "%STAGE%"
mkdir "%STAGE%\Portable"
copy /y "..\artifacts\installer\NaprawaPC_FanControl_PRO_AI_2.0.4_FIX006_Setup.exe" "%STAGE%\Setup.exe" >nul
if errorlevel 1 goto :fail
xcopy "..\artifacts\NaprawaPCFanControl\*" "%STAGE%\Portable\" /e /i /h /y >nul
if errorlevel 1 goto :fail
> "%STAGE%\README.txt" echo Rozpakuj archiwum. Uruchom Setup.exe aby zainstalowac program lub Portable\NaprawaPCFanControl.exe aby uruchomic wersje portable.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%STAGE%\*' -DestinationPath '..\artifacts\NAPRAWA_PC_FAN_CONTROL_PRO_AI_2.0.4_FIX006_ONE_ZIP.zip' -Force"
if errorlevel 1 goto :fail
echo [OK] Jedno archiwum ZIP zawiera Setup.exe oraz katalog Portable.
pause
exit /b 0
:fail
echo [BLAD] Budowanie nie powiodlo sie.
pause
exit /b 1