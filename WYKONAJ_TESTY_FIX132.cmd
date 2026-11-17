@echo off
setlocal
cd /d "%~dp0"
echo FIX132 is a compatibility launcher. Running FIX133 safe preflight and regression suite.
call WYKONAJ_TESTY_FIX133.cmd
exit /b %ERRORLEVEL%
