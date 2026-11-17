@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo [INFO] FIX48 publication guard tests use the complete historical runner.
call "%~dp0WYKONAJ_TESTY_FIX47.cmd"
exit /b %ERRORLEVEL%
