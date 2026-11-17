@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title KOMPUTEROWE CENTRUM SERWISU FIX085 - KONTROLA PLIKOW ZRODLOWYCH
pushd "%~dp0" >nul 2>&1
if errorlevel 1 exit /b 2
set "FAILED=0"
for %%F in (URUCHOM_TYLKO_TEN_PLIK.cmd FIX085_PACKAGE_MARKER.txt FIX085_POWERSHELL_MANIFEST.txt VALIDATE_FIX085_PACKAGE.ps1 CHECK_FIX085_PACKAGE_VALIDATION.ps1 CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1 CHECK_FIX083_INTERPOLATION.ps1 CHECK_FIX083_NATIVE_PROCESS.ps1 PUBLISH_GITHUB_SOURCE.ps1 PUBLISH_GITHUB_RELEASES.ps1 BOOTSTRAP_BUILD_TOOLS.ps1 BUILD_ALL.cmd VERIFY_PUBLIC_DEPLOYMENT.ps1 INSTALL_PUBLISHED_BUILD.ps1 VERIFY_GLOBAL_UPDATE_SERVER.ps1 CHECK_FIX076_GITHUB_AUTH.ps1 CHECK_FIX069_REGRESSION.ps1 website\index.html website\styles.css website\app.js website\sitemap.xml website\media\prezentacja-en.vtt .github\workflows\deploy-pages.yml) do (
  if exist "%~dp0%%F" (echo [PASS] %%F) else (echo [FAIL] %%F missing& set "FAILED=1")
)
findstr /c:"FIX069" "%~dp0WindowsVersionSwitcherPRO.cs" >nul
if errorlevel 1 (echo [FAIL] Main source does not contain FIX069.& set "FAILED=1") else echo [PASS] Main source FIX069 marker
findstr /c:"1.0.0.69" "%~dp0AssemblyInfo.cs" >nul
if errorlevel 1 (echo [FAIL] Assembly version mismatch.& set "FAILED=1") else echo [PASS] Assembly version 1.0.0.69
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX069_REGRESSION.ps1"
if errorlevel 1 (echo [FAIL] FIX069 application regression.& set "FAILED=1") else echo [PASS] FIX069 regression checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX071_REPOSITORY_INPUT.ps1"
if errorlevel 1 (echo [FAIL] FIX071 repository input checks.& set "FAILED=1") else echo [PASS] FIX071 repository input checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX072_UPDATE_ENDPOINTS.ps1"
if errorlevel 1 (echo [FAIL] FIX072 GitHub updater checks.& set "FAILED=1") else echo [PASS] FIX072 GitHub updater checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX073_PUBLICATION_AND_SITE.ps1"
if errorlevel 1 (echo [FAIL] FIX073 publication and site checks.& set "FAILED=1") else echo [PASS] FIX073 publication and site checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX074_PUBLICATION_AND_SITE.ps1"
if errorlevel 1 (echo [FAIL] FIX074 publication and site checks.& set "FAILED=1") else echo [PASS] FIX074 publication and site checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX075_PUBLICATION_AND_SITE.ps1"
if errorlevel 1 (echo [FAIL] FIX075 publication and site checks.& set "FAILED=1") else echo [PASS] FIX075 publication and site checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX076_GITHUB_AUTH.ps1"
if errorlevel 1 (echo [FAIL] GitHub authentication and native process checks.& set "FAILED=1") else echo [PASS] GitHub authentication and native process checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX085_PACKAGE_VALIDATION.ps1"
if errorlevel 1 (echo [FAIL] FIX085 package validation test.& set "FAILED=1") else echo [PASS] FIX085 package validation test
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX083_INTERPOLATION.ps1"
if errorlevel 1 (echo [FAIL] FIX083 interpolation regression test.& set "FAILED=1") else echo [PASS] FIX083 interpolation regression test
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX083_NATIVE_PROCESS.ps1"
if errorlevel 1 (echo [FAIL] FIX083 native process and GitHub login regression test.& set "FAILED=1") else echo [PASS] FIX083 native process and GitHub login regression test
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_CMD_ENCODING.ps1"
if errorlevel 1 (echo [FAIL] FIX084 CMD encoding checks.& set "FAILED=1") else echo [PASS] FIX084 CMD encoding checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_PAGES_CONFIGURATION.ps1"
if errorlevel 1 (echo [FAIL] FIX084 GitHub Pages checks.& set "FAILED=1") else echo [PASS] FIX084 GitHub Pages checks
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1"
if errorlevel 1 (echo [FAIL] FIX084 source cache exclusion checks.& set "FAILED=1") else echo [PASS] FIX084 source cache exclusions
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1"
if errorlevel 1 (echo [FAIL] FIX085 clone long-path checks.& set "FAILED=1") else echo [PASS] FIX085 clone long-path checks
if "%FAILED%"=="0" (echo [PASS] Source package check completed.) else echo [FAIL] Source package incomplete.
popd
if /i not "%~1"=="/nopause" pause
if "%FAILED%"=="0" exit /b 0
exit /b 1
