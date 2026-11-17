@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX069 - PORTABLE
pushd "%~dp0"
call "%~dp0BUILD_PORTABLE.cmd" /nopause
if errorlevel 1 goto :fail
set "APP=%~dp0dist\portable\KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe"
if not exist "%APP%" goto :fail
start "" "%APP%"
popd
exit /b 0
:fail
echo [FAIL] Portable build or launch file missing. Check dist\build-logs.
popd
if /i not "%~1"=="/nopause" pause
exit /b 1
