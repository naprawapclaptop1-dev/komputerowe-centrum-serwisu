@echo off
rem Legacy FIX104 entrypoint: delegate to FIX105 canonical-path resolver.
call "%~dp0RESOLVE_NODE_FIX105.cmd" %*
exit /b %ERRORLEVEL%
