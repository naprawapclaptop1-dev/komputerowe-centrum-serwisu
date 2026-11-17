#requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$Name,[string]$ReportPath=(Join-Path $env:PUBLIC 'Documents\Nauka-FIX216\HYPERV_SECURITY_AUDIT.json'))
$ErrorActionPreference='Stop'
if(-not (Get-Command Get-VM -ErrorAction SilentlyContinue)){throw 'Hyper-V nie jest dostępny.'}
$vm=Get-VM -Name $Name -ErrorAction Stop
$adapters=@(Get-VMNetworkAdapter -VMName $Name -ErrorAction Stop)
$services=@(Get-VMIntegrationService -VMName $Name -ErrorAction Stop)
$enabled=@($services|Where-Object{$_.Enabled})
$disks=@(Get-VMHardDiskDrive -VMName $Name -ErrorAction Stop)
$dvd=@(Get-VMDvdDrive -VMName $Name -ErrorAction SilentlyContinue)
$snapshots=@(Get-VMSnapshot -VMName $Name -ErrorAction SilentlyContinue)
$firmware=Get-VMFirmware -VMName $Name -ErrorAction SilentlyContinue
$badPaths=@($disks|Where-Object{-not $_.Path -or -not(Test-Path -LiteralPath $_.Path -PathType Leaf)})
$checks=@(
 [pscustomobject]@{name='VM_OFF';passed=([string]$vm.State -eq 'Off');detail=[string]$vm.State},
 [pscustomobject]@{name='NO_VIRTUAL_NETWORK_ADAPTERS';passed=($adapters.Count -eq 0);detail="$($adapters.Count)"},
 [pscustomobject]@{name='NO_ENABLED_GUEST_INTEGRATION';passed=($enabled.Count -eq 0);detail=(@($enabled|% Name)-join ', ')},
 [pscustomobject]@{name='VHDX_PATHS_EXIST';passed=($disks.Count -gt 0 -and $badPaths.Count -eq 0);detail="$($disks.Count) disk(s); missing $($badPaths.Count)"},
 [pscustomobject]@{name='SECURE_BOOT';passed=([string]$firmware.SecureBoot -eq 'On');detail=[string]$firmware.SecureBoot},
 [pscustomobject]@{name='BASELINE_CHECKPOINT';passed=($snapshots.Count -gt 0);detail="$($snapshots.Count) checkpoint(s)"},
 [pscustomobject]@{name='NO_AUTOMATIC_START';passed=([string]$vm.AutomaticStartAction -eq 'Nothing');detail=[string]$vm.AutomaticStartAction},
 [pscustomobject]@{name='NO_DVD_OR_HOST_MEDIA_MOUNT';passed=($dvd.Count -eq 0);detail="$($dvd.Count) DVD drive(s); inspect mounted media manually"}
)
$passed=@($checks|? passed).Count;$result=[pscustomobject]@{schema='NAUKA_FIX216_HYPERV_SECURITY_AUDIT';schemaVersion=1;fix='FIX216';vmName=$Name;checkedAt=(Get-Date).ToUniversalTime().ToString('o');passed=$passed;total=$checks.Count;allChecksPassed=($passed -eq $checks.Count);checks=$checks;integrationServices=@($services|%{[pscustomobject]@{name=$_.Name;enabled=[bool]$_.Enabled;primaryStatus=[string]$_.PrimaryStatusDescription}});networkAdapters=@($adapters|%{[pscustomobject]@{name=$_.Name;switchName=$_.SwitchName;connected=[bool]$_.Connected}});warning='Audyt nie gwarantuje odporności hypervisora na ucieczkę z VM. Nie podłączaj schowka, udziałów, USB ani sieci. VM nie została uruchomiona.'}
$parent=Split-Path -Parent $ReportPath;New-Item -ItemType Directory -Path $parent -Force|Out-Null;$result|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $ReportPath -Encoding UTF8
$checks|%{Write-Host "[$(if($_.passed){'PASS'}else{'FAIL'})] $($_.name): $($_.detail)"}
Write-Host "Raport: $ReportPath"
if(-not $result.allChecksPassed){throw 'Audyt nie przeszedł. VM pozostaje wyłączona.'}
Write-Host 'Kontrole konfiguracji przeszły. Maszyna nadal pozostaje wyłączona.' -ForegroundColor Green
