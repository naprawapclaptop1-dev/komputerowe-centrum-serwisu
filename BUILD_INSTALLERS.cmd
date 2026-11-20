@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX139 - INSTALLER BUILDS
pushd "%~dp0"
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU FIX139 - INSTALLER BUILDS
echo ============================================================
call "%~dp0BUILD_INSTALLER_MODERN.cmd" /nopause
set "MODERN_RC=%ERRORLEVEL%"
call "%~dp0BUILD_INSTALLER_XP.cmd" /nopause
set "XP_RC=%ERRORLEVEL%"
echo.
if "%MODERN_RC%"=="0" (
  echo [PASS] Modern installer stage.
) else (
  echo [FAIL] Modern installer stage. Check dist\build-logs\02-modern-installer.log.
)
if "%XP_RC%"=="0" (
  echo [INFO] XP stage completed or was intentionally skipped.
) else (
  echo [WARN] XP optional stage returned code %XP_RC%.
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
