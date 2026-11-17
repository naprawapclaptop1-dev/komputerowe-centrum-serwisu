@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title KOMPUTEROWE CENTRUM SERWISU FIX091 - KONTROLA AKTYWNEGO PAKIETU
pushd "%~dp0" >nul 2>&1
if errorlevel 1 exit /b 2
set "FAILED=0"
echo ============================================================
echo CHECK SOURCE - AKTYWNE TESTY FIX091
echo ============================================================
for %%F in (URUCHOM_TYLKO_TEN_PLIK.cmd FIX091_PACKAGE_MARKER.txt FIX091_POWERSHELL_MANIFEST.txt VALIDATE_FIX091_PACKAGE.ps1 CLEAN_SAFE_TEMP.ps1 CHECK_FIX091_PIPELINE.ps1 CHECK_FIX091_PAGES_TRIGGER.ps1 PUBLISH_GITHUB_SOURCE.ps1 PUBLISH_GITHUB_RELEASES.ps1 BUILD_ALL.cmd BUILD_PORTABLE.cmd BUILD_INSTALLER_MODERN.cmd VERIFY_BUILD.cmd VERIFY_PUBLIC_DEPLOYMENT.ps1 INSTALL_PUBLISHED_BUILD.ps1 WindowsVersionSwitcherPRO.cs WindowsVersionSwitcherPRO.Modules.cs AssemblyInfo.cs app.manifest NaprawaPC.ico CentrumMigracjiHero.png SETUP_MODERN.iss website\index.html website\styles.css website\app.js website\media\prezentacja.mp4 .github\workflows\deploy-pages.yml) do (
  if exist "%~dp0%%F" (echo [PASS] %%F) else (echo [FAIL] Missing: %%F& set "FAILED=1")
)
if not "%FAILED%"=="0" goto :done
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX069_REGRESSION.ps1"
if errorlevel 1 (echo [FAIL] Product FIX069 regression.& set "FAILED=1") else echo [PASS] Product compatibility FIX069
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX083_INTERPOLATION.ps1"
if errorlevel 1 (echo [FAIL] PowerShell interpolation regression.& set "FAILED=1") else echo [PASS] PowerShell interpolation
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX083_NATIVE_PROCESS.ps1"
if errorlevel 1 (echo [FAIL] Native process runner regression.& set "FAILED=1") else echo [PASS] Native process runner
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_CMD_ENCODING.ps1"
if errorlevel 1 (echo [FAIL] CMD encoding regression.& set "FAILED=1") else echo [PASS] CMD encoding
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_PAGES_CONFIGURATION.ps1"
if errorlevel 1 (echo [FAIL] GitHub Pages configuration regression.& set "FAILED=1") else echo [PASS] GitHub Pages configuration
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1"
if errorlevel 1 (echo [FAIL] Source cache exclusions regression.& set "FAILED=1") else echo [PASS] Source cache exclusions
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1"
if errorlevel 1 (echo [FAIL] Git long paths/cache regression.& set "FAILED=1") else echo [PASS] Git long paths/cache
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX091_PAGES_TRIGGER.ps1"
if errorlevel 1 (echo [FAIL] FIX091 Pages trigger regression.& set "FAILED=1") else echo [PASS] FIX091 Pages trigger
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX091_PIPELINE.ps1"
if errorlevel 1 (echo [FAIL] FIX091 pipeline and cleanup regression.& set "FAILED=1") else echo [PASS] FIX091 pipeline and cleanup
:done
if "%FAILED%"=="0" (echo [PASS] Current source/build/release gates completed.) else echo [FAIL] Current source/build/release gate failed.
popd
if /i not "%~1"=="/nopause" pause
if "%FAILED%"=="0" exit /b 0
exit /b 1
