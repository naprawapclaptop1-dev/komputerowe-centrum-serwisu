@echo off
rem Compatibility wrapper: the active Node resolver is FIX101.
call "%~dp0SPRAWDZ_NODE_FIX101.cmd" %*
exit /b %ERRORLEVEL%
