@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo NAPRAWA PC FAN CONTROL PRO AI - FIX001
echo ============================================================
where dotnet >nul 2>nul
if errorlevel 1 (
  echo [BLAD] Brak .NET SDK 10.
  echo Zainstaluj .NET 10 SDK i uruchom ponownie BUILD.cmd.
  pause
  exit /b 1
)
dotnet --version
dotnet restore NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj
if errorlevel 1 goto :fail
dotnet build NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj -c Release --no-restore
if errorlevel 1 goto :fail
dotnet publish NAPRAWA_PC_FAN_CONTROL_PRO_AI.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true -o publish
if errorlevel 1 goto :fail
if not exist publish\NAPRAWA_PC_FAN_CONTROL_PRO_AI.exe goto :fail
echo.
echo [PASS] EXE gotowy: publish\NAPRAWA_PC_FAN_CONTROL_PRO_AI.exe
echo [INFO] Pliki zrodlowe pozostaja w katalogu projektu.
pause
exit /b 0
:fail
echo.
echo [FAIL] Budowanie zakonczone bledem. Skopiuj pelny log z tego okna.
pause
exit /b 1
