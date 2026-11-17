#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true)]
param(
    [string]$Name = 'Nauka-Analiza-Offline',
    [string]$RootPath = (Join-Path $env:PUBLIC 'Documents\Nauka-Analiza-Offline'),
    [string]$IsoPath = '',
    [ValidateRange(2,8)][int]$MemoryGB = 4,
    [ValidateRange(1,4)][int]$CpuCount = 2,
    [ValidateRange(40,256)][int]$DiskGB = 80
)
$ErrorActionPreference='Stop'
function Test-Admin { $id=[Security.Principal.WindowsIdentity]::GetCurrent();$p=New-Object Security.Principal.WindowsPrincipal($id);return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) }
if(-not (Test-Admin)){throw 'Uruchom PowerShell jako administrator. Skrypt niczego nie zmienił.'}
if(-not (Get-Command New-VM -ErrorAction SilentlyContinue)){throw 'Nie znaleziono modułu Hyper-V. Włącz funkcję Hyper-V w systemie Windows i uruchom ponownie komputer.'}
if(Get-VM -Name $Name -ErrorAction SilentlyContinue){throw "Maszyna '$Name' już istnieje. Nie nadpisuję istniejącej VM."}
if($IsoPath){$resolved=Resolve-Path -LiteralPath $IsoPath -ErrorAction Stop;if((Get-Item -LiteralPath $resolved.Path).Extension -ne '.iso'){throw 'Wskazany obraz musi mieć rozszerzenie .iso.'};$IsoPath=$resolved.Path}
New-Item -ItemType Directory -Path $RootPath -Force | Out-Null
$vhd=Join-Path $RootPath ($Name+'.vhdx')
if(Test-Path -LiteralPath $vhd){throw "Plik VHDX już istnieje: $vhd. Nie usuwam ani nie nadpisuję danych."}
if($PSCmdlet.ShouldProcess($Name,'Utwórz maszynę Hyper-V bez karty sieciowej')){
    $vm=New-VM -Name $Name -Generation 2 -MemoryStartupBytes (${MemoryGB}GB) -NoVHD -Path $RootPath
    Set-VMProcessor -VMName $Name -Count $CpuCount -ExposeVirtualizationExtensions $false
    Set-VMMemory -VMName $Name -DynamicMemoryEnabled $false -StartupBytes (${MemoryGB}GB)
    New-VHD -Path $vhd -SizeBytes (${DiskGB}GB) -Dynamic | Out-Null
    Add-VMHardDiskDrive -VMName $Name -Path $vhd
    # Zasada fail-closed: nie podpinaj przełącznika, usuń wszystkie karty sieciowe.
    Get-VMNetworkAdapter -VMName $Name -ErrorAction SilentlyContinue | Remove-VMNetworkAdapter -Confirm:$false
    Set-VMFirmware -VMName $Name -EnableSecureBoot On -SecureBootTemplate MicrosoftWindows
    Set-VM -VMName $Name -AutomaticCheckpointsEnabled $false -CheckpointType Standard -AutomaticStartAction Nothing -AutomaticStopAction TurnOff
    if($IsoPath){Add-VMDvdDrive -VMName $Name -Path $IsoPath | Out-Null}
    $serviceNames=@('Guest Service Interface','Heartbeat','Key-Value Pair Exchange','Shutdown','Time Synchronization','VSS')
    foreach($serviceName in $serviceNames){Get-VMIntegrationService -VMName $Name -Name $serviceName -ErrorAction SilentlyContinue | Disable-VMIntegrationService -ErrorAction SilentlyContinue}
    Checkpoint-VM -Name $Name -SnapshotName 'CZYSTA_BAZA_PRZED_LABORATORIUM' -ErrorAction Stop | Out-Null
    $vmInfo=Get-VM -Name $Name
    $networkCount=@(Get-VMNetworkAdapter -VMName $Name).Count
    $report=[pscustomobject]@{fix='FIX200';name=$Name;state=[string]$vmInfo.State;generation=$vmInfo.Generation;memoryGB=$MemoryGB;cpuCount=$CpuCount;diskGB=$DiskGB;isoAttached=[bool]$IsoPath;networkAdapters=$networkCount;checkpoint='CZYSTA_BAZA_PRZED_LABORATORIUM';networkIsolation=($networkCount -eq 0);createdAt=(Get-Date).ToUniversalTime().ToString('o');note='Brak wirtualnej karty sieciowej. Przed każdym startem wymagane jest sprawdzenie konfiguracji. Izolacja VM zmniejsza ryzyko, ale nie daje absolutnej gwarancji odporności na ucieczkę z hypervisora.'}
    $report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $RootPath 'FIX200_SANDBOX_CONFIGURATION.json') -Encoding UTF8
    if($networkCount -ne 0){throw 'Weryfikacja izolacji nie powiodła się: VM ma kartę sieciową. Nie uruchamiaj maszyny.'}
    Write-Host "Utworzono VM: $Name" -ForegroundColor Green
    Write-Host "Folder: $RootPath"
    Write-Host 'Maszyna NIE została uruchomiona. Brak karty sieciowej. Punkt kontrolny czystej bazy został zapisany.' -ForegroundColor Yellow
    Write-Host 'Nie udostępniaj VM katalogów hosta, USB, schowka ani sesji rozszerzonej. Do testów używaj wyłącznie legalnych, kontrolowanych materiałów szkoleniowych.' -ForegroundColor Yellow
}
