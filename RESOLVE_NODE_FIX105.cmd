@echo off
rem FIX105: canonical root without trailing slash; explicit absolute output paths.
rem This avoids PowerShell.exe command-line parsing ambiguity with "G:\folder\".
set "NODE_EXE="
set "NODE_DIR="
set "NODE_VERSION="
for %%I in ("%~dp0.") do set "NPA_ROOT=%%~fI"
set "NODE_PATH_FILE=%NPA_ROOT%\NODE_EXE.path"
set "NODE_VERSION_FILE=%NPA_ROOT%\NODE_EXE.version"
set "NPA_RESOLVE_PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%NPA_RESOLVE_PS%" set "NPA_RESOLVE_PS=powershell.exe"
set "NPA_RESOLVER_PS1=%NPA_ROOT%\scripts\resolve-node-fix105.ps1"
if not exist "%NPA_RESOLVER_PS1%" goto :FIX105_NO_PS1

echo [INFO] Katalog projektu: "%NPA_ROOT%"
echo [INFO] Plik wyniku: "%NODE_PATH_FILE%"
echo [INFO] Plik wersji: "%NODE_VERSION_FILE%"
"%NPA_RESOLVE_PS%" -NoLogo -NoProfile -ExecutionPolicy Bypass -STA -File "%NPA_RESOLVER_PS1%" -Root "%NPA_ROOT%" -NodePathFile "%NODE_PATH_FILE%" -VersionFile "%NODE_VERSION_FILE%"
set "NPA_RESOLVE_RC=%ERRORLEVEL%"
if not "%NPA_RESOLVE_RC%"=="0" goto :FIX105_PS_FAIL
if not exist "%NODE_PATH_FILE%" goto :FIX105_MISSING_PATH
if not exist "%NODE_VERSION_FILE%" goto :FIX105_MISSING_VERSION

rem Read UTF-8-no-BOM files line-by-line; avoid SET /P quoting edge cases.
for /f "usebackq delims=" %%A in ("%NODE_PATH_FILE%") do if not defined NODE_EXE set "NODE_EXE=%%A"
for /f "usebackq delims=" %%A in ("%NODE_VERSION_FILE%") do if not defined NODE_VERSION set "NODE_VERSION=%%A"
if not defined NODE_EXE goto :FIX105_EMPTY_PATH
if not defined NODE_VERSION goto :FIX105_EMPTY_VERSION
for %%N in ("%NODE_EXE%") do set "NODE_DIR=%%~dpN"
if not exist "%NODE_EXE%" goto :FIX105_BAD_NODE

"%NODE_EXE%" --version >"%NPA_ROOT%\NODE_EXE.verify.tmp" 2>&1
if errorlevel 1 goto :FIX105_VERIFY_FAIL
set "NPA_NODE_VERIFY="
for /f "usebackq delims=" %%A in ("%NPA_ROOT%\NODE_EXE.verify.tmp") do if not defined NPA_NODE_VERIFY set "NPA_NODE_VERIFY=%%A"
del /q "%NPA_ROOT%\NODE_EXE.verify.tmp" >nul 2>&1
if not "%NPA_NODE_VERIFY%"=="%NODE_VERSION%" goto :FIX105_VERSION_MISMATCH

echo [OK] Node.js %NODE_VERSION% - "%NODE_EXE%"
exit /b 0

:FIX105_NO_PS1
echo [BLAD] Brak skryptu: "%NPA_RESOLVER_PS1%"
exit /b 10
:FIX105_PS_FAIL
echo [BLAD] PowerShell resolver zakonczyl sie kodem %NPA_RESOLVE_RC%.
goto :FIX105_FAIL
:FIX105_MISSING_PATH
echo [BLAD] PowerShell nie utworzyl pliku wynikowego: "%NODE_PATH_FILE%"
goto :FIX105_FAIL
:FIX105_MISSING_VERSION
echo [BLAD] PowerShell nie utworzyl pliku wersji: "%NODE_VERSION_FILE%"
goto :FIX105_FAIL
:FIX105_EMPTY_PATH
echo [BLAD] Plik NODE_EXE.path jest pusty: "%NODE_PATH_FILE%"
goto :FIX105_FAIL
:FIX105_EMPTY_VERSION
echo [BLAD] Plik NODE_EXE.version jest pusty: "%NODE_VERSION_FILE%"
goto :FIX105_FAIL
:FIX105_BAD_NODE
echo [BLAD] Nie istnieje node.exe wskazany w NODE_EXE.path: "%NODE_EXE%"
goto :FIX105_FAIL
:FIX105_VERIFY_FAIL
echo [BLAD] Node.exe nie uruchomil sie z parametrem --version: "%NODE_EXE%"
goto :FIX105_FAIL
:FIX105_VERSION_MISMATCH
echo [BLAD] Niezgodne wersje. PowerShell=%NODE_VERSION%; CMD=%NPA_NODE_VERIFY%.
goto :FIX105_FAIL
:FIX105_FAIL
echo [INFO] Sprawdz katalog projektu: "%NPA_ROOT%"
echo [INFO] Nie zmieniono systemowego PATH ani rejestru Windows.
if exist "%NPA_ROOT%\NODE_EXE.verify.tmp" del /q "%NPA_ROOT%\NODE_EXE.verify.tmp" >nul 2>&1
exit /b 10
