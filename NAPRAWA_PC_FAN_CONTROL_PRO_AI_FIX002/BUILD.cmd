@echo off
setlocal EnableExtensions
title NAPRAWA PC FAN CONTROL PRO AI 2.0.3 FIX005
cd /d "%~dp0"
echo ============================================================
echo NAPRAWA PC FAN CONTROL PRO AI 2.0.3 - FIX005
echo Windows x64 / .NET 10 / PORTABLE / SETUP.EXE
echo ============================================================
where dotnet >nul 2>nul
if errorlevel 1 (echo [BLAD] Brak .NET 10 SDK.& pause& exit /b 1)
dotnet --info
dotnet restore "NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj"
if errorlevel 1 goto :fail
if not exist "..\artifacts" mkdir "..\artifacts"
dotnet publish "NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj" -c Release -r win-x64 --self-contained true -p:PublishReadyToRun=true -o "..\artifacts\NaprawaPCFanControl"
if errorlevel 1 goto :fail
if not exist "..\artifacts\NaprawaPCFanControl\NaprawaPCFanControl.exe" (echo [BLAD] Brak opublikowanego EXE.& goto :fail)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '..\artifacts\NaprawaPCFanControl\*' -DestinationPath '..\artifacts\NAPRAWA_PC_FAN_CONTROL_PRO_AI_2.0.3_FIX005_PORTABLE.zip' -Force"
if errorlevel 1 goto :fail
set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if exist "%ISCC%" (
  "%ISCC%" "INSTALLER.iss"
  if errorlevel 1 goto :fail
  if not exist "..\artifacts\installer\NaprawaPC_FanControl_PRO_AI_2.0.3_FIX005_Setup.exe" (echo [BLAD] Instalator Setup.exe nie zostal utworzony.& goto :fail)
  echo [OK] Setup.exe gotowy.
) else (
  echo [UWAGA] Nie znaleziono Inno Setup 6. Plik portable jest gotowy; do Setup.exe doinstaluj Inno Setup 6.
)
echo [OK] EXE, portable oraz dostepny instalator sprawdzone.
echo Wyniki: ..\artifacts
pause
exit /b 0
:fail
echo [BLAD] Budowanie nie powiodlo sie.
pause
exit /b 1