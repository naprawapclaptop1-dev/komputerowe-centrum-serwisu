@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX069 - ZWERYFIKOWANA WERSJA PRZENOSNA
pushd "%~dp0"
set "SRC=%~dp0WindowsVersionSwitcherPRO.cs"
set "SRC2=%~dp0WindowsVersionSwitcherPRO.Modules.cs"
set "ASM=%~dp0AssemblyInfo.cs"
set "MANIFEST=%~dp0app.manifest"
set "ICON=%~dp0NaprawaPC.ico"
set "HERO=%~dp0CentrumMigracjiHero.png"
set "DIST=%~dp0dist"
set "STAGEDIR=%DIST%\setup-files"
set "PORTDIR=%DIST%\portable"
set "STAGE=%STAGEDIR%\KomputeroweCentrumSerwisu.exe"
set "PORTABLE=%PORTDIR%\KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe"
set "STAMP=%STAGEDIR%\BUILD_ID.txt"
set "LOGDIR=%DIST%\build-logs"
set "LOG=%LOGDIR%\01-portable.log"
set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
set "CSHARP=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\Microsoft.CSharp.dll"
set "WEBEXT=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\System.Web.Extensions.dll"
if not exist "%CSHARP%" set "CSHARP=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\Microsoft.CSharp.dll"
if not exist "%WEBEXT%" set "WEBEXT=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\System.Web.Extensions.dll"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
if not exist "%STAGEDIR%" mkdir "%STAGEDIR%"
if not exist "%PORTDIR%" mkdir "%PORTDIR%"
>"%LOG%" echo KOMPUTEROWE CENTRUM SERWISU FIX069 - ZWERYFIKOWANA WERSJA PRZENOSNA
>>"%LOG%" echo Date: %DATE% %TIME%

rem Invalidate old proof before any build attempt. A stale EXE can never be packaged as FIX069.
if exist "%STAMP%" del /q "%STAMP%" >nul 2>&1
if exist "%PORTDIR%\BUILD_ID.txt" del /q "%PORTDIR%\BUILD_ID.txt" >nul 2>&1
for %%F in ("%SRC%" "%SRC2%" "%ASM%" "%MANIFEST%" "%ICON%" "%HERO%" "%~dp0VERIFY_PAYLOAD.ps1" "%~dp0CHECK_FIX069_REGRESSION.ps1") do if not exist "%%~fF" (
  >>"%LOG%" echo [FAIL] Missing required input: %%~fF
  goto :fail
)
if not exist "%CSC%" (>>"%LOG%" echo [FAIL] csc.exe not found.& goto :fail)
if not exist "%CSHARP%" (>>"%LOG%" echo [FAIL] Microsoft.CSharp.dll not found.& goto :fail)
if not exist "%WEBEXT%" (>>"%LOG%" echo [FAIL] System.Web.Extensions.dll not found.& goto :fail)
for %%F in (README.txt INSTRUKCJA.txt CHANGELOG.txt VERSION.txt) do if not exist "%~dp0%%F" (>>"%LOG%" echo [FAIL] Missing documentation %%F.& goto :fail)
set "TEMP_EXE=%TEMP%\NaprawaPC_FIX069_%RANDOM%_%RANDOM%.exe"
set "TEMP_STAGE=%STAGE%.new"
set "TEMP_PORTABLE=%PORTABLE%.new"
set "TEMP_STAMP=%TEMP%\NaprawaPC_FIX069_%RANDOM%_%RANDOM%.buildinfo"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX069_REGRESSION.ps1" >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
>>"%LOG%" echo [INFO] Compiler: %CSC%
>>"%LOG%" echo [INFO] Building source as a temporary EXE. Old final artifacts remain but are NOT packageable without a new BUILD_ID.
"%CSC%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%TEMP_EXE%" /win32manifest:"%MANIFEST%" /win32icon:"%ICON%" /reference:System.dll /reference:System.Core.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Xml.dll /reference:System.Management.dll /reference:System.Security.dll /reference:"%CSHARP%" /reference:"%WEBEXT%" "%SRC%" "%SRC2%" "%ASM%" >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
if not exist "%TEMP_EXE%" (>>"%LOG%" echo [FAIL] Compiler returned success but no EXE was created.& goto :fail)
for %%F in ("%TEMP_EXE%") do if %%~zF LEQ 0 (>>"%LOG%" echo [FAIL] Compiler created an empty EXE.& goto :fail)
rem The PE FileVersion must be exactly 1.0.0.69 before anything is staged.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%TEMP_EXE%" -ExpectedVersion "1.0.0.69" -StampPath "%TEMP_STAMP%" -SourceRoot "%~dp0." -CreateStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
copy /y "%TEMP_EXE%" "%TEMP_STAGE%" >nul
if errorlevel 1 goto :fail
copy /y "%TEMP_EXE%" "%TEMP_PORTABLE%" >nul
if errorlevel 1 goto :fail
move /y "%TEMP_STAGE%" "%STAGE%" >nul
if errorlevel 1 goto :fail
move /y "%TEMP_PORTABLE%" "%PORTABLE%" >nul
if errorlevel 1 goto :fail
copy /y "%ICON%" "%PORTDIR%\NaprawaPC.ico" >nul
if errorlevel 1 goto :fail
copy /y "%HERO%" "%PORTDIR%\CentrumMigracjiHero.png" >nul
if errorlevel 1 goto :fail
copy /y "%ICON%" "%STAGEDIR%\NaprawaPC.ico" >nul
if errorlevel 1 goto :fail
copy /y "%HERO%" "%STAGEDIR%\CentrumMigracjiHero.png" >nul
if errorlevel 1 goto :fail
for %%F in (README.txt INSTRUKCJA.txt CHANGELOG.txt VERSION.txt) do (
  copy /y "%~dp0%%F" "%STAGEDIR%\%%F" >nul
  if errorlevel 1 goto :fail
)
copy /y "%TEMP_STAMP%" "%STAMP%" >nul
if errorlevel 1 goto :fail
copy /y "%TEMP_STAMP%" "%PORTDIR%\BUILD_ID.txt" >nul
if errorlevel 1 goto :fail
>"%PORTDIR%\portable.mode" echo PORTABLE=1
rem Final verification checks both file version and SHA-256 binding to the stamp.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%STAGE%" -ExpectedVersion "1.0.0.69" -StampPath "%STAMP%" -SourceRoot "%~dp0." -CheckStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFY_PAYLOAD.ps1" -ExePath "%PORTABLE%" -ExpectedVersion "1.0.0.69" -StampPath "%PORTDIR%\BUILD_ID.txt" -SourceRoot "%~dp0." -CheckStamp >>"%LOG%" 2>&1
if errorlevel 1 goto :fail
>"%LOGDIR%\PORTABLE.status" echo PASS
if not exist "%~dp0GITHUB_REPOSITORY.txt" (>>"%LOG%" echo [FAIL] GITHUB_REPOSITORY.txt missing. Run URUCHOM_TYLKO_TEN_PLIK.cmd first.& goto :fail)
copy /y "%~dp0GITHUB_REPOSITORY.txt" "%PORTDIR%\GITHUB_REPOSITORY.txt" >nul
if errorlevel 1 goto :fail
copy /y "%~dp0GITHUB_REPOSITORY.txt" "%~dp0dist\setup-files\GITHUB_REPOSITORY.txt" >nul
if errorlevel 1 goto :fail
>>"%LOG%" echo [PASS] FIX069 Portable and installer payload compiled from current source.
for %%F in ("%PORTABLE%" "%STAGE%" "%STAMP%") do >>"%LOG%" echo [FILE] %%~fF - %%~zF bytes
if exist "%TEMP_EXE%" del /q "%TEMP_EXE%" >nul 2>&1
if exist "%TEMP_STAMP%" del /q "%TEMP_STAMP%" >nul 2>&1
if exist "%LOG%" type "%LOG%"
echo.
echo [PASS] FIX069 PORTABLE BUILD COMPLETED. Fresh build identity written.
echo Log: %LOG%
if /i not "%~1"=="/nopause" pause
popd
exit /b 0
:fail
>>"%LOG%" echo [FAIL] Budowanie wersji przenosnej nie powiodlo sie. BUILD_ID remains absent, so installers will refuse stale staging EXEs.
>"%LOGDIR%\PORTABLE.status" echo FAIL
if exist "%STAMP%" del /q "%STAMP%" >nul 2>&1
if exist "%PORTDIR%\BUILD_ID.txt" del /q "%PORTDIR%\BUILD_ID.txt" >nul 2>&1
if defined TEMP_EXE if exist "%TEMP_EXE%" del /q "%TEMP_EXE%" >nul 2>&1
if defined TEMP_STAGE if exist "%TEMP_STAGE%" del /q "%TEMP_STAGE%" >nul 2>&1
if defined TEMP_PORTABLE if exist "%TEMP_PORTABLE%" del /q "%TEMP_PORTABLE%" >nul 2>&1
if defined TEMP_STAMP if exist "%TEMP_STAMP%" del /q "%TEMP_STAMP%" >nul 2>&1
if exist "%LOG%" type "%LOG%"
echo.
echo [FAIL] FIX069 PORTABLE BUILD FAILED. Existing EXEs may remain, but cannot be used to build a new installer.
if /i not "%~1"=="/nopause" pause
popd
exit /b 1
