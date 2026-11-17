#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='High')]
param(
 [ValidateSet('Audit','Stop','Checkpoint','RestoreBaseline','Export','Start')][string]$Action='Audit',
 [string]$Name='Nauka-Analiza-Offline',
 [string]$ExportPath=(Join-Path $env:PUBLIC 'Documents\Nauka-HyperV-Export'),
 [string]$ReportPath=(Join-Path $env:PUBLIC 'Documents\Nauka-FIX226\MANAGER_REPORT.json')
)
$ErrorActionPreference='Stop'
if(-not (Get-Command Get-VM -ErrorAction SilentlyContinue)){throw 'Hyper-V nie jest dostępny. Nie wykonano żadnej operacji.'}
if($Action -ne 'Audit'){$identity=[Security.Principal.WindowsIdentity]::GetCurrent();$principal=New-Object Security.Principal.WindowsPrincipal($identity);if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Operacje modyfikujące Hyper-V wymagają uruchomienia PowerShell jako administrator.'}}
$vm=Get-VM -Name $Name -ErrorAction Stop
function Get-IsolationReport {
 $adapters=@(Get-VMNetworkAdapter -VMName $Name -ErrorAction Stop)
 $services=@(Get-VMIntegrationService -VMName $Name -ErrorAction Stop)
 $enabled=@($services|Where-Object Enabled)
 $disks=@(Get-VMHardDiskDrive -VMName $Name -ErrorAction Stop)
 $dvd=@(Get-VMDvdDrive -VMName $Name -ErrorAction SilentlyContinue)
 $snapshots=@(Get-VMSnapshot -VMName $Name -ErrorAction SilentlyContinue)
 $firmware=Get-VMFirmware -VMName $Name -ErrorAction SilentlyContinue
 $baseline=@($snapshots|Where-Object Name -eq 'CZYSTA_BAZA_PRZED_LABORATORIUM')|Select-Object -First 1
 $checks=@(
  [pscustomobject]@{name='VM_STOPPED';passed=([string]$vm.State -eq 'Off');detail=[string]$vm.State},
  [pscustomobject]@{name='NO_NETWORK_ADAPTERS';passed=($adapters.Count -eq 0);detail="$($adapters.Count)"},
  [pscustomobject]@{name='NO_ENABLED_INTEGRATION_SERVICES';passed=($enabled.Count -eq 0);detail=(@($enabled|ForEach-Object Name)-join ', ')},
  [pscustomobject]@{name='SECURE_BOOT';passed=([string]$firmware.SecureBoot -eq 'On');detail=[string]$firmware.SecureBoot},
  [pscustomobject]@{name='VHDX_FILES_EXIST';passed=($disks.Count -gt 0 -and @($disks|Where-Object{-not $_.Path -or -not(Test-Path -LiteralPath $_.Path -PathType Leaf)}).Count -eq 0);detail="$($disks.Count)"},
  [pscustomobject]@{name='NO_DVD_MEDIA';passed=($dvd.Count -eq 0);detail="$($dvd.Count)"},
  [pscustomobject]@{name='BASELINE_CHECKPOINT';passed=($null -ne $baseline);detail=if($baseline){$baseline.Name}else{'brak'}},
  [pscustomobject]@{name='NO_AUTOMATIC_START';passed=([string]$vm.AutomaticStartAction -eq 'Nothing');detail=[string]$vm.AutomaticStartAction}
 )
 return [pscustomobject]@{schema='NAUKA_FIX226_HYPERV_MANAGER';version=1;action=$Action;vmName=$Name;checkedAt=(Get-Date).ToUniversalTime().ToString('o');passed=@($checks|Where-Object passed).Count;total=$checks.Count;allChecksPassed=(@($checks|Where-Object passed).Count -eq $checks.Count);checks=$checks;warning='Kontrole nie stanowią gwarancji odporności hypervisora na ucieczkę z VM. Nie montuj współdzielonych folderów, USB, schowka ani sieci.'}
}
function Assert-Isolated($report){$failed=@($report.checks|Where-Object{-not $_.passed});if($failed.Count){throw ('Operacja zablokowana. Niespełnione kontrole: '+(($failed|ForEach-Object name)-join ', '))}}
if($Action -eq 'Audit'){
 $report=Get-IsolationReport;$parent=Split-Path -Parent $ReportPath;New-Item -ItemType Directory -Path $parent -Force|Out-Null;$report|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $ReportPath -Encoding UTF8
 $report.checks|ForEach-Object{Write-Host "[$(if($_.passed){'PASS'}else{'FAIL'})] $($_.name): $($_.detail)"}
 Write-Host "Raport: $ReportPath";if(-not $report.allChecksPassed){throw 'Audyt Hyper-V nie przeszedł. Maszyna pozostaje wyłączona.'};exit 0
}
if($Action -eq 'Stop'){
 if($vm.State -ne 'Off' -and $PSCmdlet.ShouldProcess($Name,'Natychmiast zatrzymaj maszynę laboratoryjną')){Stop-VM -Name $Name -TurnOff -Confirm:$false -ErrorAction Stop};Write-Host 'Zlecono zatrzymanie VM. Sprawdź stan przed dalszą operacją.';exit 0
}
if($vm.State -ne 'Off'){throw 'Maszyna musi być wyłączona przed zmianą checkpointu lub eksportem.'}
if($Action -eq 'Checkpoint'){
 $report=Get-IsolationReport;Assert-Isolated $report
 $snap='FIX226_'+(Get-Date -Format 'yyyyMMdd_HHmmss')
 if($PSCmdlet.ShouldProcess($Name,"Utwórz checkpoint $snap")){Checkpoint-VM -Name $Name -SnapshotName $snap -ErrorAction Stop|Out-Null;Write-Host "Utworzono $snap."};exit 0
}
if($Action -eq 'RestoreBaseline'){
 $report=Get-IsolationReport;Assert-Isolated $report
 $base=Get-VMSnapshot -VMName $Name -Name 'CZYSTA_BAZA_PRZED_LABORATORIUM' -ErrorAction Stop
 if($PSCmdlet.ShouldProcess($Name,'Przywróć checkpoint CZYSTA_BAZA_PRZED_LABORATORIUM')){Restore-VMSnapshot -VMName $Name -Name $base.Name -Confirm:$false -ErrorAction Stop;Write-Host 'Przywrócono stan bazowy. Zweryfikuj VM ponownie przed uruchomieniem.'};exit 0
}
if($Action -eq 'Export'){
 $report=Get-IsolationReport;Assert-Isolated $report
 if(Test-Path -LiteralPath $ExportPath){throw 'Folder eksportu już istnieje. Wybierz nową ścieżkę; skrypt nie nadpisuje kopii.'}
 if($PSCmdlet.ShouldProcess($Name,"Eksport VM do $ExportPath")){Export-VM -Name $Name -Path $ExportPath -ErrorAction Stop|Out-Null;Write-Host "Eksport zakończony: $ExportPath"};exit 0
}
if($Action -eq 'Start'){
 $report=Get-IsolationReport;Assert-Isolated $report
 if($PSCmdlet.ShouldProcess($Name,'Utwórz checkpoint przed startem i uruchom VM bez sieci')){$snap='FIX226_PRE_START_'+(Get-Date -Format 'yyyyMMdd_HHmmss');Checkpoint-VM -Name $Name -SnapshotName $snap -ErrorAction Stop|Out-Null;Start-VM -Name $Name -ErrorAction Stop|Out-Null;Write-Host "Uruchomiono $Name. Checkpoint: $snap" -ForegroundColor Green}
}
