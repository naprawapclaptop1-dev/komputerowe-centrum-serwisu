@echo off
rem Compatibility wrapper for older project utilities; active resolver is FIX101.
call "%~dp0RESOLVE_NODE_FIX101.cmd" %*
exit /b %ERRORLEVEL%
