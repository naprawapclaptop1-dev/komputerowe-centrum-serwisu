@echo off
setlocal EnableExtensions
title NAPRAWA PC FAN CONTROL PRO AI 2.0.1 FIX003
cd /d "%~dp0"
echo ============================================================
echo NAPRAWA PC FAN CONTROL PRO AI 2.0.1 - FIX003
echo Windows x64 / .NET 10
echo ============================================================
where dotnet >nul 2>nul
if errorlevel 1 (echo [BLAD] Brak .NET 10 SDK.& pause& exit /b 1)
dotnet --info
dotnet restore "NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj"
if errorlevel 1 goto :fail
dotnet publish "NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj" -c Release -r win-x64 --self-contained true -p:PublishReadyToRun=true -o "publish\win-x64"
if errorlevel 1 goto :fail
echo [OK] publish\win-x64\NaprawaPCFanControl.exe
pause
exit /b 0
:fail
echo [BLAD] Budowanie nie powiodlo sie.
pause
exit /b 1