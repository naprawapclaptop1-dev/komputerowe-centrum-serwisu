@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX069 - MODERN SETUP
pushd "%~dp0"
call "%~dp0BUILD_INSTALLER_MODERN.cmd" /nopause
if errorlevel 1 goto :fail
set "SETUP=%~dp0dist\installers\KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe"
if not exist "%SETUP%" goto :fail
if not exist "%~dp0dist\installers\SETUP_BUILD_ID.txt" goto :fail
start "" "%SETUP%"
popd
exit /b 0
:fail
echo [FAIL] Modern installer was not created. Portable output, if any, is preserved.
echo Check dist\build-logs\02-modern-installer.log.
popd
if /i not "%~1"=="/nopause" pause
exit /b 1
