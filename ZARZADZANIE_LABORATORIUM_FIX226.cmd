@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo FIX226 — audyt Hyper-V (domyślnie tylko odczyt)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\FIX226_HYPERV_LAB_MANAGER.ps1" -Action Audit
echo.
echo Aby wykonać zmianę, użyj PowerShell jako administrator i jawnie podaj -Action Stop, Checkpoint, RestoreBaseline, Export lub Start.
pause
