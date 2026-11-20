$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$main = [IO.File]::ReadAllText((Join-Path $Root 'WindowsVersionSwitcherPRO.cs'))
$mod = [IO.File]::ReadAllText((Join-Path $Root 'WindowsVersionSwitcherPRO.Modules.cs'))
$version = [IO.File]::ReadAllText((Join-Path $Root 'VERSION.txt'))
$assembly = [IO.File]::ReadAllText((Join-Path $Root 'AssemblyInfo.cs'))
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
Add-Check ($main.Contains('AddNav("Kalendarz wizyt PRO"') -and $main.Contains('BuildServiceProAppointmentsPage()')) 'Navigation and page routing'
Add-Check ($mod.Contains('appointments.xml') -and $mod.Contains('ServiceProAppointments')) 'Separate local XML data store'
Add-Check ($mod.Contains('SaveServiceProAppointment') -and $mod.Contains('DeleteServiceProAppointment') -and $mod.Contains('LoadServiceProAppointments')) 'Create, edit, delete and reload'
Add-Check ($mod.Contains('ExportServiceProAppointmentsIcs') -and $mod.Contains('BEGIN:VCALENDAR') -and $mod.Contains('DTSTART:')) 'iCalendar export'
Add-Check ($mod.Contains('ExportServiceProAppointmentsCsv') -and $mod.Contains('new UTF8Encoding(true)')) 'CSV UTF-8 export'
Add-Check ($mod.Contains('SaveXmlSafely(d,ServiceProAppointmentPath(),10)')) 'Safe XML persistence'
Add-Check ($mod.Contains('AddServiceProHistory(selectedServiceProAppointmentId')) 'Appointment audit history'
Add-Check ($version -match '1\.0\.0\.74\s+FIX139' -and $assembly.Contains('AssemblyVersion("1.0.0.74")')) 'Release identity 1.0.0.74 / FIX139'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX139 appointments: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX139 appointment checks: {0}/{0}' -f $checks.Count)
exit 0
