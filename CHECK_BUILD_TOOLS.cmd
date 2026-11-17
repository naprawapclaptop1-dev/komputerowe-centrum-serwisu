@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX069 - BUILD TOOLS CHECK
set "FAILED=0"
set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
set "CSHARP=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\Microsoft.CSharp.dll"
set "WEBEXT=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\System.Web.Extensions.dll"
if not exist "%CSHARP%" set "CSHARP=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\Microsoft.CSharp.dll"
if not exist "%WEBEXT%" set "WEBEXT=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\System.Web.Extensions.dll"
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU FIX069 - BUILD TOOLS CHECK
echo ============================================================
if exist "%CSC%" (echo [PASS] C# compiler: "%CSC%") else (echo [FAIL] csc.exe missing.& set "FAILED=1")
if exist "%CSHARP%" (echo [PASS] Microsoft.CSharp.dll: "%CSHARP%") else (echo [FAIL] Microsoft.CSharp.dll missing.& set "FAILED=1")
if exist "%WEBEXT%" (echo [PASS] System.Web.Extensions.dll: "%WEBEXT%") else (echo [FAIL] System.Web.Extensions.dll missing.& set "FAILED=1")
if exist "%~dp0NaprawaPC.ico" (echo [PASS] App icon found.) else (echo [FAIL] NaprawaPC.ico missing.& set "FAILED=1")
echo.
echo PowerShell - REQUIRED for FIX069 build identity / SHA-256 verification:
if exist "%WINDIR%\System32\WindowsPowerShell\v1.0\powershell.exe" (echo [PASS] Windows PowerShell found.) else (echo [FAIL] PowerShell is required for verified payload stamping.& set "FAILED=1")

echo.
echo Inno Setup 6/7 - REQUIRED for the modern Setup EXE:
set "FOUND="
if defined INNO_MODERN_ISCC if exist "%INNO_MODERN_ISCC%" set "FOUND=%INNO_MODERN_ISCC%"
if not defined FOUND if exist "%ProgramFiles%\Inno Setup 7\ISCC.exe" set "FOUND=%ProgramFiles%\Inno Setup 7\ISCC.exe"
if not defined FOUND if exist "%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe" set "FOUND=%ProgramFiles(x86)%\Inno Setup 7\ISCC.exe"
if not defined FOUND if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "FOUND=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not defined FOUND if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "FOUND=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if defined FOUND (echo [PASS] Modern Inno Setup: "%FOUND%") else (echo [WARN] Inno Setup 6/7 not found. Portable build works; modern installer will not build.)
echo.
echo Inno Setup 5.6.1 - OPTIONAL for XP Setup:
set "FOUND="
if defined INNO5_ISCC if exist "%INNO5_ISCC%" set "FOUND=%INNO5_ISCC%"
if not defined FOUND if exist "%ProgramFiles(x86)%\Inno Setup 5\ISCC.exe" set "FOUND=%ProgramFiles(x86)%\Inno Setup 5\ISCC.exe"
if not defined FOUND if exist "%ProgramFiles%\Inno Setup 5\ISCC.exe" set "FOUND=%ProgramFiles%\Inno Setup 5\ISCC.exe"
if defined FOUND (echo [PASS] Legacy Inno Setup: "%FOUND%") else echo [SKIP] XP Setup is optional; missing Inno Setup 5 does not fail BUILD ALL.
echo.
echo Official Inno Setup download: https://jrsoftware.org/isdl.php
if "%FAILED%"=="0" (echo [PASS] Required compiler tools are available.) else echo [FAIL] Portable compilation tools are incomplete.
if /i not "%~1"=="/nopause" pause
if "%FAILED%"=="0" exit /b 0
exit /b 1
