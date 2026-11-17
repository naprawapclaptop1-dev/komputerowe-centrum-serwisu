#requires -Version 5.1
[CmdletBinding()]
param([string]$Name='Nauka-Analiza-Offline',[string]$ReportPath=(Join-Path $env:PUBLIC 'Documents\Nauka-Analiza-Offline\FIX207_ISOLATION_AUDIT.json'))
$ErrorActionPreference='Stop'
if(-not (Get-Command Get-VM -ErrorAction SilentlyContinue)){throw 'Hyper-V nie jest dostępny.'}
$vm=Get-VM -Name $Name -ErrorAction Stop
$adapters=@(Get-VMNetworkAdapter -VMName $Name -ErrorAction Stop)
$enabledServices=@(Get-VMIntegrationService -VMName $Name -ErrorAction Stop | Where-Object { $_.Enabled })
$disks=@(Get-VMHardDiskDrive -VMName $Name -ErrorAction Stop)
$badDiskPaths=@($disks | Where-Object { -not $_.Path -or -not (Test-Path -LiteralPath $_.Path -PathType Leaf) })
$firmware=$null
try{$firmware=Get-VMFirmware -VMName $Name -ErrorAction Stop}catch{}
$secureBoot=if($firmware){[string]$firmware.SecureBoot}else{'Unknown'}
$checkpointCount=@(Get-VMSnapshot -VMName $Name -ErrorAction SilentlyContinue).Count
$checks=@(
  [pscustomobject]@{name='VM_OFF';passed=([string]$vm.State -eq 'Off');detail=[string]$vm.State},
  [pscustomobject]@{name='NO_NETWORK_ADAPTERS';passed=($adapters.Count -eq 0);detail="$($adapters.Count) adapter(s)"},
  [pscustomobject]@{name='NO_GUEST_INTEGRATION_SERVICES';passed=($enabledServices.Count -eq 0);detail=(@($enabledServices|ForEach-Object Name)-join ', ')},
  [pscustomobject]@{name='EXISTING_VHD_PATHS';passed=($disks.Count -gt 0 -and $badDiskPaths.Count -eq 0);detail="$($disks.Count) disk(s); missing $($badDiskPaths.Count)"},
  [pscustomobject]@{name='SECURE_BOOT';passed=($secureBoot -eq 'On');detail=$secureBoot},
  [pscustomobject]@{name='BASELINE_CHECKPOINT';passed=($checkpointCount -gt 0);detail="$checkpointCount checkpoint(s)"},
  [pscustomobject]@{name='NO_AUTOMATIC_START';passed=([string]$vm.AutomaticStartAction -eq 'Nothing');detail=[string]$vm.AutomaticStartAction}
)
$passed=@($checks|Where-Object passed).Count
$report=[pscustomobject]@{schema='NAUKA_FIX207_HYPERV_AUDIT';schemaVersion=1;fix='FIX207';vmName=$Name;checkedAt=(Get-Date).ToUniversalTime().ToString('o');passed=$passed;total=$checks.Count;safeToStart=($passed -eq $checks.Count);checks=$checks;warning='Audyt ogranicza ryzyko, ale nie potwierdza odporności hypervisora na ucieczkę z VM. Nie podłączaj udziałów hosta, schowka, USB ani sieci.'}
$parent=Split-Path -Parent $ReportPath;if($parent -and -not (Test-Path $parent)){New-Item -ItemType Directory -Path $parent -Force|Out-Null}
$report|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $ReportPath -Encoding UTF8
$checks|ForEach-Object{Write-Host "[$(if($_.passed){'PASS'}else{'FAIL'})] $($_.name): $($_.detail)" -ForegroundColor $(if($_.passed){'Green'}else{'Red'})}
Write-Host "Raport: $ReportPath"
if(-not $report.safeToStart){throw 'Audyt izolacji nie przeszedł. Maszyna pozostaje wyłączona.'}
Write-Host 'Audyt konfiguracji zakończony. Maszyna nadal jest wyłączona.' -ForegroundColor Green
