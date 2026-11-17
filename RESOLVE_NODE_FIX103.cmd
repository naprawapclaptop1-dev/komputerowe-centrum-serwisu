@echo off
rem Legacy FIX103 entrypoint: delegate to current FIX105 resolver.
call "%~dp0RESOLVE_NODE_FIX105.cmd" %*
exit /b %ERRORLEVEL%
