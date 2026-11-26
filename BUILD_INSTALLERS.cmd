@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX141 - INSTALLER BUILDS
pushd "%~dp0"
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU FIX141 - INSTALLER BUILDS
echo ============================================================
call "%~dp0BUILD_INSTALLER_MODERN.cmd" /nopause
set "MODERN_RC=%ERRORLEVEL%"
"%ComSpec%" /d /s /c ""%~dp0BUILD_INSTALLER_XP.cmd" /nopause"
set "XP_RC=%ERRORLEVEL%"
echo.
if "%MODERN_RC%"=="0" (
  echo [PASS] Modern installer stage.
) else (
  echo [FAIL] Modern installer stage. Check dist\build-logs\02-modern-installer.log.
)
findstr /i /x "PASS" "%~dp0dist\build-logs\XP_INSTALLER.status" >nul 2>&1
if not errorlevel 1 (
  echo [PASS] Optional XP installer built.
) else (
  findstr /i /x "SKIPPED" "%~dp0dist\build-logs\XP_INSTALLER.status" >nul 2>&1
  if not errorlevel 1 (echo [SKIP] XP installer intentionally skipped.) else (echo [WARN] XP installer did not build. See dist\build-logs\03-xp-installer.log.)
)
if not "%MODERN_RC%"=="0" goto :fail
if /i not "%~1"=="/nopause" pause
popd
exit /b 0
:fail
echo [FAIL] Modern installer is not ready. Portable output is preserved.
if /i not "%~1"=="/nopause" pause
popd
exit /b 1
