@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
rem FIX101: CMD-first Node discovery, remembered absolute path and interactive file picker.
set "_NODE_ENV_OVERRIDE=%NODE_EXE%"
set "NODE_EXE="
set "NODE_VERSION="
set "NODE_DIR="
set "_NODE_CANDIDATE="
set "_NODE_PICK_FILE=%TEMP%\NPA_NODE_FIX101_%RANDOM%_%RANDOM%.txt"

rem 1. Use a previously selected node.exe path, persisted per project folder.
if exist "%~dp0NODE_EXE.path" set /p "_NODE_CANDIDATE="<"%~dp0NODE_EXE.path"
if defined _NODE_CANDIDATE call :TRY_NODE "%_NODE_CANDIDATE%"
if defined NODE_EXE goto :EXPORT

rem 2. Explicit environment overrides.
if defined _NODE_ENV_OVERRIDE call :TRY_NODE "%_NODE_ENV_OVERRIDE%"
if defined NODE_HOME call :TRY_NODE "%NODE_HOME%\node.exe"
if defined NODEJS_HOME call :TRY_NODE "%NODEJS_HOME%\node.exe"
if defined NODE_EXE goto :EXPORT

rem 3. Native CMD PATH resolution (does not depend on PowerShell).
for %%I in (node.exe) do if not "%%~$PATH:I"=="" call :TRY_NODE "%%~$PATH:I"
if defined NODE_EXE goto :EXPORT
if exist "%SystemRoot%\System32\where.exe" (
  for /f "usebackq delims=" %%P in (`"%SystemRoot%\System32\where.exe" node.exe 2^>nul`) do call :TRY_NODE "%%P"
)
if defined NODE_EXE goto :EXPORT

rem 4. Common fixed installation folders.
call :TRY_NODE "%ProgramFiles%\nodejs\node.exe"
call :TRY_NODE "%ProgramFiles(x86)%\nodejs\node.exe"
call :TRY_NODE "%LOCALAPPDATA%\Programs\nodejs\node.exe"
call :TRY_NODE "%ProgramData%\nodejs\node.exe"
call :TRY_NODE "%USERPROFILE%\nodejs\node.exe"
call :TRY_NODE "%USERPROFILE%\bin\node.exe"
call :TRY_NODE "%USERPROFILE%\tools\nodejs\node.exe"
call :TRY_NODE "C:\nodejs\node.exe"
call :TRY_NODE "C:\tools\nodejs\node.exe"
call :TRY_NODE "D:\nodejs\node.exe"
call :TRY_NODE "%LOCALAPPDATA%\Microsoft\WinGet\Links\node.exe"
call :TRY_NODE "%VOLTA_HOME%\bin\node.exe"
call :TRY_NODE "%LOCALAPPDATA%\Volta\bin\node.exe"
call :TRY_NODE "%USERPROFILE%\.volta\bin\node.exe"
call :TRY_NODE "%NVM_SYMLINK%\node.exe"
call :TRY_NODE "%NVM_HOME%\node.exe"
call :TRY_NODE "%FNM_MULTISHELL_PATH%\node.exe"
call :TRY_NODE "%LOCALAPPDATA%\fnm_multishells\node.exe"
if defined NODE_EXE goto :EXPORT

rem 5. Version-managed installations (NVM/FNM/NVS/Scoop/WinGet).
if defined NVM_HOME for /d %%D in ("%NVM_HOME%\v*") do call :TRY_NODE "%%~fD\node.exe"
if defined FNM_DIR for /d %%D in ("%FNM_DIR%\node-versions\*") do call :TRY_NODE "%%~fD\installation\node.exe"
for /d %%D in ("%LOCALAPPDATA%\fnm\node-versions\*") do call :TRY_NODE "%%~fD\installation\node.exe"
for /d %%D in ("%APPDATA%\fnm\node-versions\*") do call :TRY_NODE "%%~fD\installation\node.exe"
for /d %%D in ("%USERPROFILE%\.fnm\node-versions\*") do call :TRY_NODE "%%~fD\installation\node.exe"
for /d %%D in ("%LOCALAPPDATA%\nvs\node\*") do for /d %%A in ("%%~fD\*") do call :TRY_NODE "%%~fA\node.exe"
for /d %%D in ("%APPDATA%\nvs\node\*") do for /d %%A in ("%%~fD\*") do call :TRY_NODE "%%~fA\node.exe"
for /d %%D in ("%USERPROFILE%\scoop\apps\nodejs*\current") do call :TRY_NODE "%%~fD\node.exe"
for /d %%D in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS*\*") do call :TRY_NODE "%%~fD\node.exe"
if defined NODE_EXE goto :EXPORT

rem 6. Registry, uncommon manager layouts and persisted PATH scan via PowerShell as a secondary resolver.
set "_PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%_PS_EXE%" set "_PS_EXE=powershell.exe"
if exist "%~dp0scripts\resolve-node-fix101.ps1" (
  if exist "%_PS_EXE%" (
    for /f "usebackq delims=" %%P in (`"%_PS_EXE%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0scripts\resolve-node-fix101.ps1" 2^>nul`) do call :TRY_NODE "%%P"
  )
)
if defined NODE_EXE goto :EXPORT

rem 7. Last resort: ask the user to choose the actual node.exe. The path is remembered.
echo.
echo [INFO] Automatyczne wyszukiwanie nie znalazlo dzialajacego Node.js.
echo Otwieram wybor pliku node.exe. Wybierz node.exe z instalacji Node.js 24.19.0.
if exist "%_PS_EXE%" (
  set "NPA_NODE_PICK_FILE=%_NODE_PICK_FILE%"
  "%_PS_EXE%" -NoLogo -NoProfile -STA -Command "Add-Type -AssemblyName System.Windows.Forms; $d=New-Object System.Windows.Forms.OpenFileDialog; $d.Title='Wybierz node.exe z instalacji Node.js'; $d.Filter='Node.js runtime (node.exe)|node.exe'; $d.CheckFileExists=$true; $d.Multiselect=$false; if($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){[IO.File]::WriteAllText($env:NPA_NODE_PICK_FILE,$d.FileName,([System.Text.UTF8Encoding]::new($false)))}" >nul 2>&1
)
if exist "%_NODE_PICK_FILE%" set /p "_NODE_CANDIDATE="<"%_NODE_PICK_FILE%"
if defined _NODE_CANDIDATE call :TRY_NODE "%_NODE_CANDIDATE%"
if defined NODE_EXE goto :REMEMBER

echo.
echo Nie otworzyl sie wybor pliku albo anulowano wybor.
echo Przeciagnij plik node.exe z Eksploratora do tego okna CMD lub wklej pelna sciezke.
set /p "_NODE_CANDIDATE=Sciezka do node.exe (ENTER = zakoncz): "
if defined _NODE_CANDIDATE call :TRY_NODE "%_NODE_CANDIDATE%"
if defined NODE_EXE goto :REMEMBER

echo [BLAD] Nie znaleziono dzialajacego node.exe. Nie zmieniono systemowego PATH.
del /q "%_NODE_PICK_FILE%" >nul 2>&1
endlocal & exit /b 10

:REMEMBER
>"%~dp0NODE_EXE.path" <nul set /p "=%NODE_EXE%"
echo.
echo [OK] Zapisano sciezke Node.js w NODE_EXE.path na potrzeby kolejnych uruchomien.

:EXPORT
for %%N in ("%NODE_EXE%") do set "NODE_DIR=%%~dpN"
if not defined NODE_DIR goto :EXPORT_FAIL
if not exist "%NODE_EXE%" goto :EXPORT_FAIL
endlocal & set "NODE_EXE=%NODE_EXE%" & set "NODE_VERSION=%NODE_VERSION%" & set "NODE_DIR=%NODE_DIR%" & set "PATH=%NODE_DIR%;%PATH%" & exit /b 0

:EXPORT_FAIL
endlocal & exit /b 10

:TRY_NODE
if defined NODE_EXE exit /b 0
set "_TRY_NODE=%~1"
set "_TRY_NODE=%_TRY_NODE:"=%"
if not defined _TRY_NODE exit /b 1
if exist "%_TRY_NODE%\node.exe" set "_TRY_NODE=%_TRY_NODE%\node.exe"
if not exist "%_TRY_NODE%" exit /b 1
for %%N in ("%_TRY_NODE%") do set "_TRY_NODE=%%~fN"
set "_TRY_VER_FILE=%TEMP%\NPA_NODE_VER_%RANDOM%_%RANDOM%.txt"
"%_TRY_NODE%" --version >"%_TRY_VER_FILE%" 2>&1
if errorlevel 1 goto :TRY_NODE_FAILED
set "_TRY_VERSION="
set /p "_TRY_VERSION="<"%_TRY_VER_FILE%"
del /q "%_TRY_VER_FILE%" >nul 2>&1
echo(%_TRY_VERSION%| findstr /r /c:"^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if errorlevel 1 exit /b 1
for /f "tokens=1 delims=." %%M in ("%_TRY_VERSION:v=%") do set "_TRY_MAJOR=%%M"
if not defined _TRY_MAJOR exit /b 1
if %_TRY_MAJOR% LSS 20 exit /b 1
set "NODE_EXE=%_TRY_NODE%"
set "NODE_VERSION=%_TRY_VERSION%"
exit /b 0

:TRY_NODE_FAILED
del /q "%_TRY_VER_FILE%" >nul 2>&1
exit /b 1
