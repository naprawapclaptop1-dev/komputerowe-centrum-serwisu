# NAUKA OD A DO Z — FIX17 Windows hardware inventory companion
# Read-only CIM / Storage cmdlets. No network, firmware writes, disk writes or customer identifiers.
# Compatible target: Windows 10/11, Windows PowerShell 5.1 (best-effort fields depend on drivers).
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

function Get-SafeText([object]$Value) {
    if ($null -eq $Value) { return $null }
    $text = ([string]$Value).Trim()
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    return $text.Substring(0, [Math]::Min(240, $text.Length))
}
function Get-Bytes([object]$Value) {
    try { if ($null -eq $Value) { return $null }; return [int64]$Value } catch { return $null }
}
function Get-GB([object]$Value) {
    $bytes = Get-Bytes $Value
    if ($null -eq $bytes -or $bytes -le 0) { return $null }
    return [Math]::Round(($bytes / 1GB), 2)
}
function Convert-WmiChars([object]$Value) {
    if ($null -eq $Value) { return $null }
    try {
        $chars = @($Value | Where-Object { [int]$_ -gt 0 } | ForEach-Object { [char][int]$_ })
        if ($chars.Count -eq 0) { return $null }
        return Get-SafeText (-join $chars)
    } catch { return $null }
}

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host 'NAUKA OD A DO Z — AUDYT STANOWISKA FIX17' -ForegroundColor Cyan
Write-Host 'Odczyt tylko do raportu. Brak zapisów do BIOS/UEFI, dysków i firmware.'
Write-Host 'Nie zbieram nazw użytkowników, numerów seryjnych, MAC ani adresów IP.'
Write-Host '============================================================' -ForegroundColor Cyan

$computer = $null; $os = $null; $baseboard = $null; $bios = $null
$processors = @(); $memory = @(); $gpus = @(); $disks = @(); $physicalDisks = @(); $monitors = @()
try { $computer = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop } catch { Write-Warning 'Nie udało się odczytać Win32_ComputerSystem.' }
try { $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop } catch { Write-Warning 'Nie udało się odczytać Win32_OperatingSystem.' }
try { $baseboard = Get-CimInstance -ClassName Win32_BaseBoard -ErrorAction Stop } catch { Write-Warning 'Nie udało się odczytać informacji o płycie.' }
try { $bios = Get-CimInstance -ClassName Win32_BIOS -ErrorAction Stop } catch { Write-Warning 'Nie udało się odczytać BIOS.' }

try {
    $processors = @(Get-CimInstance -ClassName Win32_Processor -ErrorAction Stop | Select-Object -First 16 | ForEach-Object {
        [pscustomobject]@{ name = Get-SafeText $_.Name; manufacturer = Get-SafeText $_.Manufacturer; cores = $_.NumberOfCores; logicalProcessors = $_.NumberOfLogicalProcessors; maxClockMHz = $_.MaxClockSpeed }
    })
} catch { Write-Warning 'Brak danych CPU.' }
try {
    $memory = @(Get-CimInstance -ClassName Win32_PhysicalMemory -ErrorAction Stop | Select-Object -First 32 | ForEach-Object {
        [pscustomobject]@{ manufacturer = Get-SafeText $_.Manufacturer; partNumber = Get-SafeText $_.PartNumber; capacityBytes = Get-Bytes $_.Capacity; capacityGB = Get-GB $_.Capacity; speedMHz = $_.Speed; configuredSpeedMHz = $_.ConfiguredClockSpeed; slot = Get-SafeText $_.DeviceLocator; memoryTypeCode = $_.SMBIOSMemoryType }
    })
} catch { Write-Warning 'Brak danych modułów RAM.' }
try {
    $gpus = @(Get-CimInstance -ClassName Win32_VideoController -ErrorAction Stop | Select-Object -First 16 | ForEach-Object {
        [pscustomobject]@{ name = Get-SafeText $_.Name; driverVersion = Get-SafeText $_.DriverVersion; videoProcessor = Get-SafeText $_.VideoProcessor; reportedVramBytes = Get-Bytes $_.AdapterRAM; reportedVramGB = Get-GB $_.AdapterRAM; currentResolution = Get-SafeText $_.VideoModeDescription }
    })
} catch { Write-Warning 'Brak danych GPU.' }
try {
    $disks = @(Get-CimInstance -ClassName Win32_DiskDrive -ErrorAction Stop | Select-Object -First 64 | ForEach-Object {
        [pscustomobject]@{ model = Get-SafeText $_.Model; sizeBytes = Get-Bytes $_.Size; sizeGB = Get-GB $_.Size; interfaceType = Get-SafeText $_.InterfaceType; mediaType = Get-SafeText $_.MediaType; firmwareRevision = Get-SafeText $_.FirmwareRevision; status = Get-SafeText $_.Status }
    })
} catch { Write-Warning 'Brak danych dysków Win32_DiskDrive.' }
try {
    if (Get-Command Get-PhysicalDisk -ErrorAction SilentlyContinue) {
        $physicalDisks = @(Get-PhysicalDisk -ErrorAction Stop | Select-Object -First 64 | ForEach-Object {
            $disk = $_; $reliability = $null
            if (Get-Command Get-StorageReliabilityCounter -ErrorAction SilentlyContinue) {
                try { $reliability = Get-StorageReliabilityCounter -PhysicalDisk $disk -ErrorAction Stop } catch { $reliability = $null }
            }
            [pscustomobject]@{
                friendlyName = Get-SafeText $disk.FriendlyName
                mediaType = Get-SafeText $disk.MediaType
                busType = Get-SafeText $disk.BusType
                sizeBytes = Get-Bytes $disk.Size
                sizeGB = Get-GB $disk.Size
                healthStatus = Get-SafeText $disk.HealthStatus
                operationalStatus = Get-SafeText (@($disk.OperationalStatus) -join ', ')
                temperatureC = $(if ($reliability -and $null -ne $reliability.Temperature) { $reliability.Temperature } else { $null })
                wearPercent = $(if ($reliability -and $null -ne $reliability.Wear) { $reliability.Wear } else { $null })
                readErrorsTotal = $(if ($reliability -and $null -ne $reliability.ReadErrorsTotal) { $reliability.ReadErrorsTotal } else { $null })
                writeErrorsTotal = $(if ($reliability -and $null -ne $reliability.WriteErrorsTotal) { $reliability.WriteErrorsTotal } else { $null })
            }
        })
    }
} catch { Write-Warning 'Dane Get-PhysicalDisk / ReliabilityCounter są niedostępne na tym komputerze.' }
try {
    $monitors = @(Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction Stop | Select-Object -First 16 | ForEach-Object {
        [pscustomobject]@{ manufacturer = Convert-WmiChars $_.ManufacturerName; model = Convert-WmiChars $_.UserFriendlyName; productCode = Convert-WmiChars $_.ProductCodeID; yearOfManufacture = $_.YearOfManufacture; active = $_.Active }
    })
} catch { Write-Warning 'Odczyt WmiMonitorID/EDID nie jest dostępny.' }

$report = [ordered]@{
    format = 'NPA-WINDOWS-HARDWARE-AUDIT-FIX17'
    schemaVersion = 1
    capturedAt = (Get-Date).ToUniversalTime().ToString('o')
    source = 'Windows CIM / Storage cmdlets — read only'
    computer = [ordered]@{ manufacturer = Get-SafeText $computer.Manufacturer; model = Get-SafeText $computer.Model; systemType = Get-SafeText $computer.SystemType; totalMemoryBytes = Get-Bytes $computer.TotalPhysicalMemory; totalMemoryGB = Get-GB $computer.TotalPhysicalMemory }
    os = [ordered]@{ caption = Get-SafeText $os.Caption; version = Get-SafeText $os.Version; build = Get-SafeText $os.BuildNumber; architecture = Get-SafeText $os.OSArchitecture; lastBoot = $(if ($os.LastBootUpTime) { ([datetime]$os.LastBootUpTime).ToUniversalTime().ToString('o') } else { $null }) }
    baseboard = [ordered]@{ manufacturer = Get-SafeText $baseboard.Manufacturer; product = Get-SafeText $baseboard.Product; version = Get-SafeText $baseboard.Version }
    bios = [ordered]@{ manufacturer = Get-SafeText $bios.Manufacturer; version = Get-SafeText (@($bios.SMBIOSBIOSVersion) -join ' '); releaseDate = Get-SafeText $bios.ReleaseDate }
    cpu = @($processors)
    memory = @($memory)
    gpu = @($gpus)
    disks = @($disks)
    physicalDisks = @($physicalDisks)
    monitors = @($monitors)
    limitations = @(
        'Brak numerów seryjnych, nazw użytkowników, adresów IP i MAC.',
        'Dane zależą od sterowników, uprawnień i dostępności klas CIM/Storage.',
        'AdapterRAM z Win32_VideoController może nie odzwierciedlać pełnej pamięci współdzielonej lub dedykowanej GPU.',
        'Temperatura i Wear pojawiają się tylko wtedy, gdy producent/sterownik udostępnia je przez Storage Reliability Counter.',
        'To inwentarz, nie test obciążeniowy ani pełny test SMART/powierzchni dysku.'
    )
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$basePath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "AUDYT_STANOWISKA_$timestamp"
$jsonPath = "$basePath.json"
$txtPath = "$basePath.txt"
try {
    $report | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
    $summary = @(
        'NAUKA OD A DO Z — RAPORT AUDYTU STANOWISKA',
        "Data UTC: $($report.capturedAt)",
        "Komputer: $($report.computer.manufacturer) $($report.computer.model)",
        "System: $($report.os.caption) $($report.os.version) (build $($report.os.build))",
        "Płyta: $($report.baseboard.manufacturer) $($report.baseboard.product) / $($report.baseboard.version)",
        "BIOS: $($report.bios.manufacturer) $($report.bios.version)",
        "CPU: $(($report.cpu | ForEach-Object { $_.name }) -join '; ')",
        "GPU: $(($report.gpu | ForEach-Object { $_.name }) -join '; ')",
        "RAM: $(($report.memory | ForEach-Object { "$($_.capacityGB) GB $($_.partNumber) $($_.speedMHz) MHz" }) -join '; ')",
        "Dyski: $(($report.disks | ForEach-Object { "$($_.model) $($_.sizeGB) GB" }) -join '; ')",
        "Monitory: $(($report.monitors | ForEach-Object { "$($_.manufacturer) $($_.model)" }) -join '; ')",
        '', 'Ograniczenia:', ($report.limitations | ForEach-Object { "- $_" }),
        '', 'Raport JSON nie zawiera numerów seryjnych, adresów IP ani MAC.'
    )
    $summary | Set-Content -LiteralPath $txtPath -Encoding UTF8
} catch {
    Write-Error "Nie udało się zapisać raportu: $($_.Exception.Message)"
    exit 2
}
Write-Host ''
Write-Host "Raport JSON: $jsonPath" -ForegroundColor Green
Write-Host "Raport TXT:  $txtPath" -ForegroundColor Green
Write-Host 'Import: Warsztat Mistrza PRO → Audyt stanowiska → Importuj raport PowerShell JSON.' -ForegroundColor Cyan
Write-Host 'Raport pozostaje lokalny. Nie został wysłany do sieci.'
Read-Host 'Naciśnij Enter, aby zakończyć' | Out-Null
