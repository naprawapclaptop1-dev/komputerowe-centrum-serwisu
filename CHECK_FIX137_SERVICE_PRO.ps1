$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Read-Text { param([string]$Name); $p=Join-Path $root $Name; if(-not(Test-Path -LiteralPath $p -PathType Leaf)){throw "Missing source: $Name"}; return [IO.File]::ReadAllText($p,[Text.Encoding]::UTF8) }
$main=Read-Text 'WindowsVersionSwitcherPRO.cs'
$modules=Read-Text 'WindowsVersionSwitcherPRO.Modules.cs'
$versionLines=[IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))
$assembly=Read-Text 'AssemblyInfo.cs'
$setup=Read-Text 'SETUP_MODERN.iss'
$sourceGate=Read-Text 'CHECK_SOURCE.cmd'
$validator=Read-Text 'VALIDATE_FIX100_PACKAGE.ps1'
$payload=Read-Text 'VERIFY_PAYLOAD.ps1'
$allow=@(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') | ForEach-Object {$_.Trim()} | Where-Object {$_})
$manifest= (Get-Content -LiteralPath (Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt') -Raw -Encoding UTF8).Replace("`r`n","`n")
$policy=Read-Text 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$safe=[regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$changed=[regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$required=@('CHECK_FIX137_SERVICE_PRO.ps1','FIX137_RELEASE_NOTES.txt','FIX137_MODULE_MAP.txt')
Add-Check ($main.Contains('AddNav("Serwis PRO"') -and $main.Contains('AddNav("Magazyn części PRO"') -and $main.Contains('AddNav("Historia serwisu PRO"') -and $main.Contains('AddNav("Kopia danych serwisu PRO"')) 'All four Service PRO navigation entries are present'
Add-Check ($main.Contains('BuildServiceProPage()') -and $main.Contains('BuildServiceProPartsPage()') -and $main.Contains('BuildServiceProHistoryPage()') -and $main.Contains('BuildServiceProBackupPage()')) 'All four Service PRO pages are routed from ShowPage'
Add-Check ($modules.Contains('Path.Combine(dataRoot,"ServicePRO")') -and $modules.Contains('cases.xml') -and $modules.Contains('parts.xml') -and $modules.Contains('history.xml')) 'Service PRO data uses its own local Data\ServicePRO XML files'
Add-Check ($modules.Contains('SaveXmlSafely') -and $modules.Contains('TryLoadXmlDocument') -and $modules.Contains('DtdProcessing.Prohibit')) 'Service PRO uses existing secure XML load and atomic save helpers'
Add-Check ($modules.Contains('BeforeSnapshot') -and $modules.Contains('AfterSnapshot') -and $modules.Contains('CaptureServiceProDiagnosticsSnapshot')) 'Before and after repair snapshots are stored per order'
Add-Check ($modules.Contains('Win32_Processor') -and $modules.Contains('Win32_OperatingSystem') -and $modules.Contains('Win32_VideoController') -and $modules.Contains('DriveInfo.GetDrives()')) 'Snapshot covers CPU, RAM, GPU/driver and disk volumes'
Add-Check ($modules.Contains('MSStorageDriver_FailurePredictStatus') -and $modules.Contains('Brak dostępnego provider') -and $modules.Contains('nie oznacza sprawności')) 'Unavailable SMART provider is never treated as a healthy disk'
Add-Check ($modules.Contains('Win32_Battery') -and $modules.Contains('DesignCapacity') -and $modules.Contains('FullChargeCapacity') -and $modules.Contains('BatteryStatus')) 'Laptop battery charge and capacity are collected only when WMI exposes them'
Add-Check ($modules.Contains('WmiMonitorID') -and $modules.Contains('ManufacturerName') -and $modules.Contains('UserFriendlyName') -and $modules.Contains('ServiceProDecodeMonitorId')) 'Monitor manufacturer and model are decoded from available WMI/EDID data'
Add-Check ($modules.Contains('MSAcpi_ThermalZoneTemperature') -and $modules.Contains('odczyt strefy, nie zawsze temperatura CPU')) 'ACPI temperature source is labelled accurately'
Add-Check ($modules.Contains('CompareServiceProSnapshots') -and $modules.Contains('nie deklaruje automatycznie poprawy')) 'Snapshot comparison does not invent a repair-success conclusion'
Add-Check ($modules.Contains('ServiceProParts') -and $modules.Contains('Quantity') -and $modules.Contains('Minimum') -and $modules.Contains('ConsumeServiceProPartForCase')) 'Parts inventory supports stock quantity, low threshold and issue to work order'
Add-Check ($modules.Contains('available<count') -and $modules.Contains('Za mało części')) 'Parts cannot be issued beyond the available stock'
$captureIndex=$modules.IndexOf('string originalCasesXml=cases.OuterXml;');$mutateIndex=$modules.IndexOf('ServiceProWrite(cases,item,"UsedParts"')
Add-Check ($captureIndex -ge 0 -and $mutateIndex -gt $captureIndex -and $modules.Contains('rollback.LoadXml(originalCasesXml)')) 'Stock issue transaction captures the original order before mutation and rolls it back on failed stock write'
Add-Check ($modules.Contains('foreach(string file in ServiceProBackupFiles())') -and $modules.Contains('kopii cofającej') -and $modules.Contains('poprzedni stan wszystkich plików został przywrócony')) 'Multi-file restore attempts a full rollback from the before-restore backup after a partial failure'
Add-Check ($modules.Contains('PrintDocument') -and $modules.Contains('PrintDialog') -and $modules.Contains('Microsoft Print to PDF') -and $modules.Contains('BuildServiceProReportText')) 'Work-order report can be printed or saved through Windows Print to PDF'
Add-Check ($modules.Contains('LinkedList<string> printLines') -and $modules.Contains('printLines.AddFirst(line)') -and $modules.Contains('MeasureString(line,font,e.MarginBounds.Width)') -and $modules.Contains('line.Substring(cut)')) 'Multi-page reports retain lines at page breaks and split long text before drawing'
Add-Check (-not $modules.Contains('reader.Dispose();font.Dispose();doc.Dispose();')) 'Report printer no longer disposes a removed StringReader variable'
Add-Check ($modules.Contains('ShowServiceProDeviceHistory') -and $modules.Contains('String.Equals(ServiceProRead(n,"Serial").Trim(),serial,StringComparison.OrdinalIgnoreCase)')) 'Device history can locate previous work orders by serial number'
Add-Check ($modules.Contains('Recommendations') -and $modules.Contains('ZALECENIA DLA KLIENTA / NASTĘPNE KROKI')) 'Technician recommendations are stored with the order and included in the report'
Add-Check ($modules.Contains('Client') -and $modules.Contains('Serial') -and $modules.Contains('UsedParts') -and $modules.Contains('BeforeSnapshot') -and $modules.Contains('AfterSnapshot')) 'Printed report includes client, hardware, issued parts and both snapshots'
Add-Check ($modules.Contains('BACKUP_MANIFEST.txt') -and $modules.Contains('KCS_SERVICEPRO_BACKUP_V1') -and $modules.Contains('ComputeSha256')) 'Backup writes a versioned SHA-256 manifest'
Add-Check ($modules.Contains('Niezgodna suma SHA-256') -and $modules.Contains('TryLoadXmlDocument') -and $modules.Contains('BeforeRestore_')) 'Restore validates hashes and XML and keeps a before-restore backup'
Add-Check ($modules.Contains('MessageBoxButtons.YesNo') -and $modules.Contains('MessageBoxDefaultButton.Button2')) 'Restore requires explicit confirmation and defaults to No'
Add-Check ($versionLines.Count -ge 2 -and $versionLines[0].Trim() -eq '1.0.0.76' -and $versionLines[1].Trim() -eq 'FIX141') 'Product release identity is 1.0.0.76 / FIX141'
Add-Check ($assembly.Contains('AssemblyVersion("1.0.0.76")') -and $assembly.Contains('AssemblyFileVersion("1.0.0.76")') -and $assembly.Contains('AssemblyInformationalVersion("FIX141")')) 'Assembly metadata matches the new immutable product release'
Add-Check ($modules.Contains('ProgramVersion = "1.0.0.76"') -and $setup.Contains('#define MyAppVersion "1.0.0.76"') -and $setup.Contains('OutputBaseFilename=KomputeroweCentrumSerwisu_FIX141_INSTALATOR')) 'Updater and installer recipe share the new product version and FIX141 asset name'
$buildAll=Read-Text 'BUILD_ALL.cmd';$buildManager=Read-Text 'BUILD_MANAGER.cmd';$legacyInstallerMenu=Read-Text 'BUILD_INSTALLERS.cmd'
Add-Check ($buildAll.Contains('FIX141') -and $buildManager.Contains('FIX141') -and $legacyInstallerMenu.Contains('FIX141') -and -not $buildAll.Contains('FIX130')) 'All visible build menus identify the active FIX141 build'
Add-Check ($main.Contains('UniversalWindowsMigrationPRO/1.0.0.76') -and $main.Contains('Radio Stream Probe/1.0.0.76') -and $main.Contains('NAPRAW - FIX141')) 'Application diagnostics and product report use the active FIX141 identity'
Add-Check ($sourceGate.Contains('CHECK_FIX137_SERVICE_PRO.ps1') -and $sourceGate.Contains('CHECK_FIX137_SERVICE_PRO.ps1" "Service desk')) 'Service PRO regression is active in CHECK_SOURCE'
Add-Check (($required | Where-Object {$validator.Contains($_)}).Count -eq $required.Count) 'Full package validator requires the FIX141 regression and docs'
Add-Check (($required | Where-Object {$allow -contains $_}).Count -eq $required.Count) 'Explicit source allowlist contains the FIX141 regression and docs'
Add-Check (($required | Where-Object {$safe.Contains($_)}).Count -eq $required.Count) 'FIX141 test and docs are classified as safe tooling/documentation paths'
Add-Check (($required | Where-Object {$changed.Contains($_)}).Count -eq $required.Count) 'FIX141 artifacts are included in release-preservation path classification'
Add-Check ($manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX137_SERVICE_PRO\.ps1$') 'PowerShell SHA-256 manifest contains FIX141 regression test'
Add-Check ($payload.Contains('"CHECK_FIX137_SERVICE_PRO.ps1"') -and $payload.Contains('"1.0.0.76"') -and $payload.Contains('"FIX141"') -and $payload.Contains('"BUILD_ALL.cmd"') -and $payload.Contains('"KCS_FIX101_WORKER.cmd"')) 'Build provenance hashes Service PRO tests, active orchestration and worker with current release identity'
$failed=@($checks | Where-Object {-not $_.Passed})
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){Write-Host ('[FAIL] FIX141 Service PRO: '+(($failed|ForEach-Object{$_.Name}) -join '; '));exit 1}
Write-Host ('[PASS] FIX141 Service PRO regression checks: '+$checks.Count+'/'+$checks.Count)
exit 0
