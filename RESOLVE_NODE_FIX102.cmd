@echo off
rem FIX102 compatibility entrypoint: shared tested resolver remains FIX101.
call "%~dp0RESOLVE_NODE_FIX101.cmd" %*
exit /b %ERRORLEVEL%
