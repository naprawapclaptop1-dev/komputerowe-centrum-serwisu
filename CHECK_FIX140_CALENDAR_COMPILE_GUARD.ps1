$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$mod = [IO.File]::ReadAllText((Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs'))
$version = [IO.File]::ReadAllText((Join-Path $root 'VERSION.txt'))
$assembly = [IO.File]::ReadAllText((Join-Path $root 'AssemblyInfo.cs'))
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$docDecl = [regex]::Matches($mod, 'private\s+XmlDocument\s+LoadServiceProAppointmentsDocument\s*\(\s*\)')
$refreshDecl = [regex]::Matches($mod, 'private\s+void\s+LoadServiceProAppointments\s*\(\s*\)')
$badDocDecl = [regex]::Matches($mod, 'private\s+XmlDocument\s+LoadServiceProAppointments\s*\(\s*\)')
Add-Check ($docDecl.Count -eq 1) 'Exactly one XML document loader declaration'
Add-Check ($refreshDecl.Count -eq 1) 'Exactly one table refresh loader declaration'
Add-Check ($badDocDecl.Count -eq 0) 'No conflicting XML-returning method with refresh method name'
Add-Check ($mod.Contains('XmlDocument d=LoadServiceProAppointmentsDocument();')) 'XML consumers call the document loader'
Add-Check ($mod.Contains('ButtonAt(form,"ODŚWIEŻ"') -and $mod.Contains('LoadServiceProAppointments();')) 'Refresh UI still calls the table refresh method'
Add-Check (($version -match '(?m)^1\.0\.0\.76\s*$') -and (([IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))[1]).Trim() -eq 'FIX141')) 'VERSION.txt identifies immutable FIX141 release'
Add-Check ($assembly.Contains('AssemblyVersion("1.0.0.76")') -and $assembly.Contains('AssemblyFileVersion("1.0.0.76")') -and $assembly.Contains('AssemblyInformationalVersion("FIX141")')) 'Assembly metadata matches FIX141 release'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX141 calendar compile guard: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX141 calendar compile guard: {0}/{0}' -f $checks.Count)
exit 0
