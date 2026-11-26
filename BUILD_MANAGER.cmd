@echo off
setlocal EnableExtensions
title KOMPUTEROWE CENTRUM SERWISU FIX141 - BUILD MANAGER
pushd "%~dp0"
set "LOGDIR=%~dp0dist\build-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
:menu
cls
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - BUILD MANAGER PRO  ^|  FIX141
echo ============================================================
echo 1. Build PORTABLE EXE only
echo 2. Build modern INSTALLER EXE only (Windows 7 SP1 - 11)
echo 3. Build optional XP installer only
echo 4. Build ALL stages independently
echo 5. Verify available outputs (partial / Portable-only allowed)
echo 6. Check build tools
echo 7. Check source package
echo 8. Open build logs folder
echo 9. Open dist folder
echo 0. Exit
echo.
set "SELECTION="
set /p "SELECTION=Wybierz zadanie: "
if "%SELECTION%"=="0" goto :exit
if "%SELECTION%"=="1" goto :portable
if "%SELECTION%"=="2" goto :modern
if "%SELECTION%"=="3" goto :xp
if "%SELECTION%"=="4" goto :all
if "%SELECTION%"=="5" goto :verify
if "%SELECTION%"=="6" goto :tools_check
if "%SELECTION%"=="7" goto :source_check
if "%SELECTION%"=="8" goto :open_logs
if "%SELECTION%"=="9" goto :open_dist
echo Nieprawidlowy wybor.
pause
goto :menu
:portable
call :run BUILD_PORTABLE.cmd 11-portable-manager.log
 goto :menu
:modern
call :run BUILD_INSTALLER_MODERN.cmd 12-modern-manager.log
 goto :menu
:xp
call :run BUILD_INSTALLER_XP.cmd 13-xp-manager.log
 goto :menu
:all
call :run BUILD_ALL.cmd 14-all-manager.log
 goto :menu
:verify
call "%~dp0VERIFY_BUILD.cmd" /partial > "%LOGDIR%\15-verify-manager.log" 2>&1
set "RC=%ERRORLEVEL%"
type "%LOGDIR%\15-verify-manager.log"
if "%RC%"=="0" (echo [PASS] Partial verification) else (echo [FAIL] Partial verification - EXIT %RC%)
echo Log: %LOGDIR%\15-verify-manager.log
pause
 goto :menu
:tools_check
call :run CHECK_BUILD_TOOLS.cmd 16-tools-manager.log
 goto :menu
:source_check
call :run CHECK_SOURCE.cmd 17-source-manager.log
 goto :menu
:open_logs
if exist "%LOGDIR%" start "" explorer.exe "%LOGDIR%"
goto :menu
:open_dist
if not exist "%~dp0dist" mkdir "%~dp0dist"
start "" explorer.exe "%~dp0dist"
goto :menu
:run
set "TASK=%~1"
set "LOG=%LOGDIR%\%~2"
echo Uruchamianie %TASK% ...
"%ComSpec%" /d /s /c ""%~dp0%TASK%" /nopause" > "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
type "%LOG%"
>>"%LOGDIR%\MANAGER_HISTORY.txt" echo [%DATE% %TIME%] %TASK% - EXIT %RC%
if /i "%TASK%"=="BUILD_INSTALLER_XP.cmd" goto :report_xp
if "%RC%"=="0" (echo [PASS] %TASK%) else (echo [FAIL] %TASK% - EXIT %RC%)
goto :run_done
:report_xp
findstr /i /x "PASS" "%LOGDIR%\XP_INSTALLER.status" >nul 2>&1
if not errorlevel 1 (echo [PASS] Optional XP installer built.) else (
  findstr /i /x "SKIPPED" "%LOGDIR%\XP_INSTALLER.status" >nul 2>&1
  if not errorlevel 1 (echo [SKIP] Optional XP installer skipped.) else (echo [WARN] Optional XP installer failed. See 03-xp-installer.log.)
)
:run_done
echo Log: %LOG%
pause
exit /b 0
:exit
popd
endlocal
exit /b 0
