#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true)]
param([string]$Name='Nauka-Analiza-Offline')
$ErrorActionPreference='Stop'
if(-not (Get-Command Get-VM -ErrorAction SilentlyContinue)){throw 'Hyper-V nie jest dostępny.'}
$vm=Get-VM -Name $Name -ErrorAction Stop
if($vm.State -ne 'Off'){throw "VM nie jest wyłączona (stan: $($vm.State)). Nie uruchamiam ponownie."}
$adapters=@(Get-VMNetworkAdapter -VMName $Name)
if($adapters.Count -gt 0){throw 'STOP: VM ma co najmniej jedną kartę sieciową. Usuń wszystkie adaptery i sprawdź konfigurację przed startem.'}
$services=@(Get-VMIntegrationService -VMName $Name | Where-Object { $_.Enabled })
if($services.Count -gt 0){$names=($services | ForEach-Object Name) -join ', ';throw "STOP: aktywne usługi integracji host-gość: $names. Wyłącz wszystkie przed startem."}
$firmware=Get-VMFirmware -VMName $Name -ErrorAction Stop
if([string]$firmware.SecureBoot -ne 'On'){throw 'STOP: Secure Boot nie jest aktywny.'}
$diskPaths=@(Get-VMHardDiskDrive -VMName $Name | Where-Object { -not $_.Path -or -not (Test-Path -LiteralPath $_.Path -PathType Leaf) })
if($diskPaths.Count -gt 0){throw 'STOP: jeden z dysków VM nie istnieje lub nie ma ścieżki. Sprawdź VHDX.'}
if(@(Get-VMSnapshot -VMName $Name).Count -eq 0){throw 'STOP: brak punktu kontrolnego bazowego. Najpierw utwórz i zweryfikuj czystą bazę.'}
if($PSCmdlet.ShouldProcess($Name,'Zapisz punkt kontrolny i uruchom odizolowaną VM')){
    $snap='PRZED_STARTEM_'+(Get-Date -Format 'yyyyMMdd_HHmmss')
    Checkpoint-VM -Name $Name -SnapshotName $snap -ErrorAction Stop | Out-Null
    Start-VM -Name $Name -ErrorAction Stop | Out-Null
    Write-Host "Uruchomiono $Name po kontroli adapterów, usług integracji, Secure Boot, dysków i punktu bazowego; checkpoint: $snap." -ForegroundColor Green
    Write-Host 'Kontrola wykazała brak karty sieciowej. Nie podłączaj udostępnień hosta ani urządzeń USB.' -ForegroundColor Yellow
}
