#requires -Version 5.1
[CmdletBinding()]
param([string]$OutputRoot = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'AKADEMIA_RAPORTY_SPRZETU'))
$ErrorActionPreference = 'Stop'

function Get-CimSafe {
    param([string]$ClassName, [string]$Namespace = 'root/cimv2')
    try { @(Get-CimInstance -ClassName $ClassName -Namespace $Namespace -ErrorAction Stop) }
    catch { @() }
}
function Get-PropertyValue {
    param($Object, [string]$Name, $Default = $null)
    if ($null -ne $Object -and $Object.PSObject.Properties.Name -contains $Name -and $null -ne $Object.$Name) { return $Object.$Name }
    return $Default
}
function Convert-BytesToGB { param($Value) if ($null -eq $Value) { return $null }; return [Math]::Round(([double]$Value / 1GB), 2) }

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outDir = Join-Path $OutputRoot ("FIX198_" + $stamp)
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$os = Get-CimSafe 'Win32_OperatingSystem' | Select-Object -First 1
$cs = Get-CimSafe 'Win32_ComputerSystem' | Select-Object -First 1
$bios = Get-CimSafe 'Win32_BIOS' | Select-Object -First 1
$board = Get-CimSafe 'Win32_BaseBoard' | Select-Object -First 1
$cpu = @(Get-CimSafe 'Win32_Processor' | ForEach-Object {
    [pscustomobject]@{ Name=$_.Name; Manufacturer=$_.Manufacturer; Cores=$_.NumberOfCores; LogicalProcessors=$_.NumberOfLogicalProcessors; MaxClockMHz=$_.MaxClockSpeed; CurrentClockMHz=$_.CurrentClockSpeed; LoadPercent=$_.LoadPercentage; Architecture=$_.Architecture }
})
$memory = @(Get-CimSafe 'Win32_PhysicalMemory' | ForEach-Object {
    [pscustomobject]@{ CapacityGB=(Convert-BytesToGB $_.Capacity); SpeedMHz=$_.Speed; ConfiguredClockMHz=$_.ConfiguredClockSpeed; Manufacturer=$_.Manufacturer; PartNumber=$_.PartNumber; FormFactor=$_.FormFactor; DeviceLocator=$_.DeviceLocator }
})
$gpu = @(Get-CimSafe 'Win32_VideoController' | ForEach-Object {
    [pscustomobject]@{ Name=$_.Name; AdapterRAM_WMI_GB=(Convert-BytesToGB $_.AdapterRAM); DriverVersion=$_.DriverVersion; DriverDate=$_.DriverDate; VideoProcessor=$_.VideoProcessor; CurrentResolution=if ($_.CurrentHorizontalResolution -and $_.CurrentVerticalResolution) { "$($_.CurrentHorizontalResolution)x$($_.CurrentVerticalResolution)" } else { $null }; CurrentRefreshHz=$_.CurrentRefreshRate; Status=$_.Status }
})
$disks = @(Get-CimSafe 'Win32_DiskDrive' | ForEach-Object {
    [pscustomobject]@{ Model=$_.Model; InterfaceType=$_.InterfaceType; MediaType=$_.MediaType; SizeGB=(Convert-BytesToGB $_.Size); FirmwareRevision=$_.FirmwareRevision; Status=$_.Status; Partitions=$_.Partitions }
})
$physicalDisks = @()
try {
    if (Get-Command Get-PhysicalDisk -ErrorAction SilentlyContinue) {
        $physicalDisks = @(Get-PhysicalDisk -ErrorAction Stop | ForEach-Object {
            [pscustomobject]@{ FriendlyName=$_.FriendlyName; MediaType=[string]$_.MediaType; BusType=[string]$_.BusType; SizeGB=(Convert-BytesToGB $_.Size); HealthStatus=[string]$_.HealthStatus; OperationalStatus=(@($_.OperationalStatus) -join ', '); FirmwareVersion=$_.FirmwareVersion }
        })
    }
} catch { $physicalDisks = @([pscustomobject]@{ Error='Get-PhysicalDisk niedostępne'; Detail=$_.Exception.Message }) }
$storageReliability = @()
try {
    if (Get-Command Get-PhysicalDisk -ErrorAction SilentlyContinue) {
        foreach ($disk in @(Get-PhysicalDisk -ErrorAction Stop)) {
            try {
                $reliability = $disk | Get-StorageReliabilityCounter -ErrorAction Stop
                if ($reliability) { $storageReliability += [pscustomobject]@{ FriendlyName=$disk.FriendlyName; TemperatureCelsius=$reliability.Temperature; TemperatureMaxCelsius=$reliability.TemperatureMax; Wear=$reliability.Wear; PowerOnHours=$reliability.PowerOnHours; ReadErrorsTotal=$reliability.ReadErrorsTotal; ReadErrorsUncorrected=$reliability.ReadErrorsUncorrected; WriteErrorsTotal=$reliability.WriteErrorsTotal; WriteErrorsUncorrected=$reliability.WriteErrorsUncorrected } }
            } catch { }
        }
    }
} catch { }
$battery = @(Get-CimSafe 'Win32_Battery' | ForEach-Object { [pscustomobject]@{ Name=$_.Name; Status=$_.Status; BatteryStatus=$_.BatteryStatus; EstimatedChargeRemaining=$_.EstimatedChargeRemaining; EstimatedRunTimeMinutes=$_.EstimatedRunTime } })
$thermalZones = @(Get-CimSafe 'MSAcpi_ThermalZoneTemperature' 'root/wmi' | ForEach-Object {
    $celsius = $null
    if ($_.CurrentTemperature) { $celsius = [Math]::Round(([double]$_.CurrentTemperature / 10.0) - 273.15, 1) }
    [pscustomobject]@{ InstanceName=$_.InstanceName; TemperatureCelsius=$celsius; Source='ACPI thermal zone'; Interpretation='Nie musi odpowiadać temperaturze CPU/GPU; zależy od firmware i sterownika.' }
})
$network = @(Get-CimSafe 'Win32_NetworkAdapter' | Where-Object { $_.PhysicalAdapter -eq $true } | ForEach-Object { [pscustomobject]@{ Name=$_.Name; Manufacturer=$_.Manufacturer; AdapterType=$_.AdapterType; SpeedMbps=if ($_.Speed) { [Math]::Round(([double]$_.Speed / 1000000), 1) } else { $null }; NetEnabled=$_.NetEnabled; Status=$_.NetConnectionStatus } })
$drivers = @(Get-CimSafe 'Win32_PnPSignedDriver' | Where-Object { $_.DeviceClass -in @('DISPLAY','SCSIADAPTER','HDC','SYSTEM','NET','MEDIA','USB') } | Select-Object -First 250 | ForEach-Object { [pscustomobject]@{ DeviceName=$_.DeviceName; Manufacturer=$_.Manufacturer; DeviceClass=$_.DeviceClass; DriverProviderName=$_.DriverProviderName; DriverVersion=$_.DriverVersion; DriverDate=$_.DriverDate; IsSigned=$_.IsSigned } })
$systemEvents = @()
try {
    $systemEvents = @(Get-WinEvent -FilterHashtable @{ LogName='System'; StartTime=(Get-Date).AddDays(-7); Level=@(1,2,3) } -MaxEvents 1500 -ErrorAction SilentlyContinue |
      Where-Object { $_.ProviderName -match '(?i)(WHEA|Disk|StorPort|stornvme|storahci|Kernel-PnP|PCI|Display|nvlddmkm|amdkmdag|igfx|volmgr|Ntfs)' } |
      Select-Object -First 500 | ForEach-Object { [pscustomobject]@{ TimeCreated=if ($_.TimeCreated) { $_.TimeCreated.ToUniversalTime().ToString('o') } else { $null }; Provider=$_.ProviderName; Id=$_.Id; Level=$_.LevelDisplayName; Message=try { $_.FormatDescription() } catch { '[Opis niedostępny]' } } })
} catch { }

$liveSensors = @()
$sensorSource = 'NONE'
foreach ($namespace in @('root/LibreHardwareMonitor','root/OpenHardwareMonitor')) {
    try {
        $found = @(Get-CimInstance -Namespace $namespace -ClassName Sensor -ErrorAction Stop | ForEach-Object {
            $value=$null;try{if($null -ne $_.Value){$value=[double]$_.Value}}catch{}
            [pscustomobject]@{ Name=[string]$_.Name; SensorType=[string]$_.SensorType; Value=$value; Identifier=[string]$_.Identifier; Parent=[string]$_.Parent; Source=$namespace }
        } | Where-Object { $_.SensorType -in @('Temperature','Fan','Voltage','Power','Clock','Load','Data','SmallData') -and $null -ne $_.Value } | Select-Object -First 300)
        if($found.Count -gt 0){$liveSensors=$found;$sensorSource=$namespace;break}
    } catch { }
}
$report = [pscustomobject]@{
    schema='NAUKA_OD_A_DO_Z_HARDWARE_SNAPSHOT'; schemaVersion=1; fix='FIX198'; collectedAt=(Get-Date).ToUniversalTime().ToString('o')
    privacy=[pscustomobject]@{ serialNumbersIncluded=$false; userNamesIncluded=$false; networkMacAddressesIncluded=$false; systemEventsMayContainLocalPathsOrAccountNames=$true; note='Raport celowo pomija numery seryjne i adresy MAC. Treść zdarzeń systemowych może zawierać lokalne ścieżki lub nazwy kont; przejrzyj ją przed udostępnieniem.' }
    system=[pscustomobject]@{ Manufacturer=(Get-PropertyValue $cs 'Manufacturer'); Model=(Get-PropertyValue $cs 'Model'); WindowsCaption=(Get-PropertyValue $os 'Caption'); WindowsVersion=(Get-PropertyValue $os 'Version'); BuildNumber=(Get-PropertyValue $os 'BuildNumber'); Architecture=(Get-PropertyValue $os 'OSArchitecture'); LastBootUpTime=(Get-PropertyValue $os 'LastBootUpTime'); TotalMemoryGB=(Convert-BytesToGB (Get-PropertyValue $cs 'TotalPhysicalMemory')); FreeMemoryGB=(Convert-BytesToGB (([double](Get-PropertyValue $os 'FreePhysicalMemory' 0)) * 1KB)); BIOSManufacturer=(Get-PropertyValue $bios 'Manufacturer'); BIOSVersion=(Get-PropertyValue $bios 'SMBIOSBIOSVersion'); BIOSReleaseDate=(Get-PropertyValue $bios 'ReleaseDate'); BoardManufacturer=(Get-PropertyValue $board 'Manufacturer'); BoardProduct=(Get-PropertyValue $board 'Product'); BoardVersion=(Get-PropertyValue $board 'Version') }
    cpu=$cpu; memoryModules=$memory; gpu=$gpu; liveSensors=$liveSensors; sensorSource=$sensorSource; disks=$disks; physicalDiskHealth=$physicalDisks; storageReliability=$storageReliability; battery=$battery; acpiThermalZones=$thermalZones; networkAdapters=$network; selectedDrivers=$drivers; systemEvents=$systemEvents
    limitations=@('Temperatura ACPI nie jest wiarygodnym zamiennikiem czujnika CPU/GPU.','Dostępność SMART/temperatur dysku zależy od sterownika, kontrolera i modelu nośnika.','AdapterRAM z Win32_VideoController jest polem WMI o ograniczonej szerokości; VRAM jest wartością orientacyjną i może być obcięta dla nowoczesnych kart.','Obciążenie i temperatury są migawką lub odczytem udostępnionym przez Windows; brakujące pola pozostają puste.','Treść zdarzeń może zawierać lokalne ścieżki, nazwy urządzeń lub kont; sprawdź ją przed wysłaniem raportu.', 'Raport jest tylko do odczytu: nie zmienia BIOS/UEFI, sterowników, partycji ani ustawień systemu.','Czujniki CPU/GPU/wentylatorów są odczytywane tylko wtedy, gdy LibreHardwareMonitor lub OpenHardwareMonitor udostępnia klasę WMI Sensor; brak danych pozostaje pusty.')
}
$jsonPath=Join-Path $outDir 'NAUKA_FIX198_SPRZET.json'
$txtPath=Join-Path $outDir 'NAUKA_FIX198_PODSUMOWANIE.txt'
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
@("NAUKA OD A DO Z — RAPORT SPRZĘTU FIX198", "Data UTC: $($report.collectedAt)", "Windows: $($report.system.WindowsCaption) / build $($report.system.BuildNumber)", "Model: $($report.system.Manufacturer) $($report.system.Model)", "CPU: $(@($cpu | ForEach-Object Name) -join '; ')", "GPU: $(@($gpu | ForEach-Object Name) -join '; ')", "Moduły RAM: $($memory.Count)", "Dyski: $($disks.Count)", "Zdarzenia WHEA/Storage/PCIe/Display (7 dni): $($systemEvents.Count)", "Czujniki live: $($liveSensors.Count) ($sensorSource)", '', 'Raport JSON zawiera szczegóły. Puste pola oznaczają brak danych udostępnionych przez Windows/sterownik.', 'ACPI Thermal Zone nie jest temperaturą CPU/GPU. Raport nie wykonuje napraw ani zmian konfiguracji.') | Set-Content -LiteralPath $txtPath -Encoding UTF8
Write-Host ''
Write-Host 'FIX198 — ODCZYT SPRZĘTU Z RZECZYWISTEGO WINDOWS' -ForegroundColor Cyan
Write-Host "Raport JSON: $jsonPath" -ForegroundColor Green
Write-Host "Podsumowanie: $txtPath" -ForegroundColor Green
Write-Host 'Dane pobrano przez CIM/Windows Storage/Event Log. Skrypt działa tylko w trybie odczytu.' -ForegroundColor Yellow
Write-Host 'Nie wszystkie komputery udostępniają temperatury i liczniki SMART. Nie traktuj braku odczytu jako wyniku prawidłowego.' -ForegroundColor Yellow
