@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU CENTRUM MIGRACJI I NAPRAW FIX069
pushd "%~dp0"
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - CENTRUM MIGRACJI I NAPRAW FIX069
echo BUILD ALL (XP INSTALLER IS OPTIONAL)
echo ============================================================
call "%~dp0BUILD_ALL.cmd" /nopause
set "BUILD_RC=%ERRORLEVEL%"
if not "%BUILD_RC%"=="0" goto :build_failed
set "APP=%~dp0dist\portable\KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe"
if exist "%APP%" (
  echo Starting Portable edition...
  start "" "%APP%"
) else (
  echo [FAIL] Portable EXE is unavailable. Check dist\build-logs.
)
popd
exit /b 0
:build_failed
echo [FAIL] FIX069 build failed. A previous EXE will NOT be launched. Check dist\build-logs.
popd
exit /b 1
