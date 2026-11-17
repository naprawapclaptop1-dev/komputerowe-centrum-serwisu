@echo off
rem Compatibility wrapper: run the complete FIX101 Node discovery tests.
call "%~dp0WYKONAJ_TESTY_FIX101.cmd" %*
exit /b %ERRORLEVEL%
