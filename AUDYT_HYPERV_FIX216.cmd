@echo off
chcp 65001 >nul
setlocal
set /p VMNAME=Nazwa istniejacej maszyny Hyper-V do audytu: 
if "%VMNAME%"=="" (echo [BLAD] Nie podano nazwy maszyny.& pause & exit /b 2)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\FIX216_HYPERV_SECURITY_AUDIT.ps1" -Name "%VMNAME%"
set RC=%ERRORLEVEL%
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
