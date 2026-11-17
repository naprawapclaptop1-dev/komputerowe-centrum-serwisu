@echo off
setlocal
cd /d "%~dp0"
node scripts\preview-static.js --open
