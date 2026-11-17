#requires -Version 5.1
[CmdletBinding()]
param([string]$OutputRoot=(Join-Path ([Environment]::GetFolderPath('Desktop')) 'AKADEMIA_RAPORTY_SPRZETU'))
$ErrorActionPreference='Continue'
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss';$dir=Join-Path $OutputRoot ("FIX215_"+$stamp);New-Item -ItemType Directory -Path $dir -Force|Out-Null
$checks=@()
function Add-Check([string]$Name,[string]$Status,[string]$Command,[string]$Output){$script:checks+= [pscustomobject]@{name=$Name;status=$Status;command=$Command;output=($Output|Out-String).Trim()}}
try{$v=Get-CimInstance Win32_OperatingSystem -ErrorAction Stop;Add-Check 'Windows' 'OK' 'Get-CimInstance Win32_OperatingSystem' "$($v.Caption) build $($v.BuildNumber)"}catch{Add-Check 'Windows' 'ERROR' 'Get-CimInstance Win32_OperatingSystem' $_.Exception.Message}
try{$s=Get-CimInstance Win32_Service -Filter "Name='wuauserv'" -ErrorAction Stop|Select-Object -First 1;Add-Check 'Windows Update service' 'INFO' 'Get-CimInstance Win32_Service' "$($s.State) / $($s.StartMode)"}catch{Add-Check 'Windows Update service' 'UNAVAILABLE' 'Get-CimInstance Win32_Service' $_.Exception.Message}
try{$sfc=& sfc.exe /verifyonly 2>&1;$rc=$LASTEXITCODE;Add-Check 'System File Checker verify-only' $(if($rc -eq 0){'OK'}else{'WARNING'}) 'sfc.exe /verifyonly' ($sfc -join "`n")}catch{Add-Check 'System File Checker verify-only' 'UNAVAILABLE' 'sfc.exe /verifyonly' $_.Exception.Message}
try{$dism=& dism.exe /Online /Cleanup-Image /ScanHealth 2>&1;$rc=$LASTEXITCODE;Add-Check 'DISM component store scan' $(if($rc -eq 0){'OK'}else{'WARNING'}) 'dism.exe /Online /Cleanup-Image /ScanHealth' ($dism -join "`n")}catch{Add-Check 'DISM component store scan' 'UNAVAILABLE' 'dism.exe /Online /Cleanup-Image /ScanHealth' $_.Exception.Message}
try{$events=Get-WinEvent -FilterHashtable @{LogName='System';StartTime=(Get-Date).AddDays(-7);Level=@(1,2)} -MaxEvents 100 -ErrorAction Stop|Where-Object{$_.ProviderName -match '(?i)(WHEA|Disk|Ntfs|stornvme|StorPort|Display|Kernel-Power)'}|Select-Object -First 50 TimeCreated,ProviderName,Id,LevelDisplayName,Message;Add-Check 'Hardware/storage/display events (7 days)' 'INFO' 'Get-WinEvent System' ($events|ConvertTo-Json -Depth 4)}catch{Add-Check 'Hardware/storage/display events (7 days)' 'UNAVAILABLE' 'Get-WinEvent System' $_.Exception.Message}
$report=[pscustomobject]@{schema='NAUKA_FIX215_WINDOWS_READ_ONLY_DIAGNOSTIC';schemaVersion=1;fix='FIX215';collectedAt=(Get-Date).ToUniversalTime().ToString('o');readOnly=$true;checks=$checks;notice='To raport kontrolny, nie wykonuje napraw. SFC /verifyonly i DISM /ScanHealth skanują; nie używaj tego raportu jako gwarancji sprawności.'}
$path=Join-Path $dir 'NAUKA_FIX215_DIAGNOSTYKA.json';$report|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $path -Encoding UTF8
$checks|Format-Table -AutoSize|Out-String|Set-Content -LiteralPath (Join-Path $dir 'NAUKA_FIX215_DIAGNOSTYKA.txt') -Encoding UTF8
Write-Host "Raport odczytowy: $path" -ForegroundColor Green
Write-Host 'Nie wykonano napraw, resetu Windows, zmian sterowników, partycji ani BIOS.' -ForegroundColor Yellow
