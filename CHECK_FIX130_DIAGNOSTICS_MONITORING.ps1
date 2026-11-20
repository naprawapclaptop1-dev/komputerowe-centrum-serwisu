$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$main = Get-Content -LiteralPath (Join-Path $root 'WindowsVersionSwitcherPRO.cs') -Raw -Encoding UTF8
$modules = Get-Content -LiteralPath (Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs') -Raw -Encoding UTF8
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
Add-Check ($main.Contains('GpuDetails') -and $main.Contains('GpuPhysicalStatus') -and $main.Contains('DriveSummary')) 'Hardware snapshot stores detailed GPU status and concise disk summary'
Add-Check ($main.Contains('IsVirtualVideoAdapter') -and $main.Contains('spacedesk') -and $main.Contains('parsec') -and $main.Contains('rdpidd')) 'Virtual and remote display adapters are explicitly classified'
Add-Check ($main.Contains('if(selected==null && !virtualAdapter)selected=o') -and $main.Contains('fizyczność wymaga potwierdzenia sprzętowego')) 'Dashboard prefers an adapter not labelled virtual but never claims physical presence as certain'
Add-Check ($main.Contains('SELECT Name,AdapterRAM,DriverVersion,DriverDate,VideoProcessor,PNPDeviceID,Status FROM Win32_VideoController')) 'GPU identification records all WMI video adapters and driver metadata'
Add-Check ($main.Contains('h.DriveSummary=concise.Count==0') -and $main.Contains('concise.GetRange(0,visible)')) 'Dashboard disk summary is concise and does not truncate the underlying full volume report'
Add-Check ($main.Contains('dashboardMetricTip.SetToolTip(dashGpuLabel,h.GpuDetails') -and $main.Contains('dashboardMetricTip.SetToolTip(dashStorageLabel,"Woluminy: "+h.Drives')) 'Hover tooltips expose full GPU and volume diagnostics without overcrowding dashboard cards'
Add-Check ($modules.Contains('Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine') -and $modules.Contains('UtilizationPercentage')) 'LIVE monitor reads Windows GPU Engine utilisation when provider is available'
Add-Check ($modules.Contains('maxGpu=Math.Max(maxGpu') -and $modules.Contains('nie suma silników')) 'GPU utilization uses a clearly described maximum engine sample rather than summing overlapping counters'
Add-Check ($modules.Contains('GPUAdapterMemory') -and $modules.Contains('DedicatedUsage') -and $modules.Contains('SharedUsage')) 'LIVE monitor reads dedicated/shared GPU memory when Windows exposes counters'
Add-Check ($modules.Contains('Win32_PerfFormattedData_PerfDisk_PhysicalDisk') -and $modules.Contains('DiskReadBytesPersec') -and $modules.Contains('DiskWriteBytesPersec')) 'LIVE monitor reads disk read/write throughput counters'
Add-Check ($modules.Contains('CreateTimedWmiSearcher("root\\cimv2"') -and $modules.Contains('GPU Engine usage: provider nie zwrócił danych; brak odczytu nie oznacza 0%')) 'Optional performance providers use bounded WMI queries and missing values are never shown as zero'
Add-Check ($modules.Contains('performanceGpuHistory.Add(snap.GpuPercent)') -and $modules.Contains('performanceGpuHistory.Count>60') -and $modules.Contains('DrawHistoryLine(g,bounds,performanceGpuHistory,Color.Gold)')) 'GPU history is capped at 60 points and drawn with the existing CPU/RAM charts'
Add-Check ($modules.Contains('private DiskHealthSnapshot ReadDiskHealthSnapshot') -and $modules.Contains('CreateTimedWmiSearcher("root\\cimv2","SELECT Index,Model,Status,Size,InterfaceType,MediaType,PNPDeviceID FROM Win32_DiskDrive",7)')) 'Disk inventory runs through a bounded WMI scan in the worker result model'
Add-Check ($modules.Contains('diskHealthWorker=worker;') -and $modules.Contains('worker.RunWorkerAsync()') -and $modules.Contains('RunWorkerCompleted')) 'Disk SMART and volume report loads off the UI thread and updates controls only on completion'
Add-Check ($modules.Contains('CreateTimedWmiSearcher("root\\WMI","SELECT InstanceName,PredictFailure,Reason FROM MSStorageDriver_FailurePredictStatus",6)') -and $modules.Contains('nie oznacza to automatycznie zdrowego dysku')) 'SMART predictive failure remains read-only and unavailable data is not interpreted as healthy'
Add-Check ($modules.Contains('NVMe / Storage Reliability') -and $modules.Contains('ShowPage("NVMe SSD Doctor")') -and $modules.Contains('Zapisz raport dysków')) 'Disk page links to detailed NVMe reliability and exports the disk report'
Add-Check ($modules.Contains('MONITOR LIVE CPU / RAM / GPU') -and $modules.Contains('ShowPage("Windows Performance")') -and $modules.Contains('GPU / MONITORY / PNP')) 'Hardware monitor directly opens LIVE and full hardware-identification pages'
Add-Check ($modules.Contains('ButtonAt(cpu,"BIOS / UEFI"') -and $modules.Contains('ShowPage("Partycje i UEFI")')) 'Hardware monitor links directly to the existing BIOS/UEFI and partition inventory'
Add-Check ($modules.Contains('ButtonAt(note,"KOPIA / ODZYSKIWANIE"') -and $modules.Contains('ShowPage("Backup Recovery ULTIMATE")')) 'Disk health page links directly to the existing backup and recovery center'
Add-Check ($main.Contains('private BackgroundWorker hardwareMonitorWorker') -and $modules.Contains('hardwareMonitorWorker!=null && hardwareMonitorWorker.IsBusy')) 'Hardware monitor prevents overlapping WMI scans while a previous scan is running'
Add-Check ($modules.Contains('if(diskHealthWorker==worker)diskHealthWorker=null;') -and $modules.Contains('if(performanceWorker==worker)performanceWorker=null;') -and $modules.Contains('worker.Dispose();')) 'Disk and performance polling workers are detached and disposed after completion or startup failure'
Add-Check ($modules.Contains('try{diskHealthList.EndUpdate();}') -eq $false -and $modules.Contains('finally{diskHealthList.EndUpdate();}')) 'Disk list update always closes BeginUpdate even when a UI update fails'
Add-Check ($modules.Contains('CreateTimedWmiSearcher("root\\cimv2","SELECT Name FROM Win32_Processor",4)')) 'CPU name lookup in the LIVE monitor uses a bounded WMI query'
Add-Check ($main.Contains('b.AppendLine("Status rozpoznania GPU: "+h.GpuPhysicalStatus)') -and $main.Contains('b.AppendLine("Pełny odczyt woluminów: "+h.Drives)')) 'Service report includes GPU detection detail and complete disk volume information'
$existingPages = @('BuildDiskHealthPage','BuildNvmeDoctorPage','BuildHardwareIntelligencePage','BuildWindowsPerformancePage','BuildServiceReportDesignerPage','BuildServiceDeskPage','BuildBackupSchedulerPage','BuildBackupRecoveryUltimatePage','BuildDriverDownloadCenterPage')
$allExisting = $true
foreach ($method in $existingPages) { if (-not $modules.Contains($method)) { $allExisting = $false } }
Add-Check $allExisting 'Existing Disk SMART/NVMe, driver, BIOS, backup, report and work-order modules remain present rather than being duplicated'
Add-Check ($modules.Contains('ProgramVersion = "1.0.0.74"')) 'Updater targets immutable product version 1.0.0.74 / FIX139'
$failed=@($checks | Where-Object {-not $_.Passed})
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){Write-Host ('[FAIL] FIX130 monitoring integration: '+(($failed | ForEach-Object {$_.Name}) -join '; '));exit 1}
Write-Host ('[PASS] FIX130 monitoring integration checks: '+$checks.Count+'/'+$checks.Count)
exit 0
