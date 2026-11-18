$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$launcher = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$workerPath = Join-Path $root 'KCS_FIX101_WORKER.cmd'
if (!(Test-Path -LiteralPath $workerPath -PathType Leaf)) { throw 'Missing separate FIX104 worker CMD.' }
$worker = Get-Content -LiteralPath $workerPath -Raw
$checks = @(
 [pscustomobject]@{Name='Launcher starts persistent ComSpec /K';Passed=($launcher -match '(?im)^start\s+"[^"]*FIX104"\s+"%ComSpec%"\s+/d\s+/k\s+""%KCS_WORKER%""\s*$')},
 [pscustomobject]@{Name='Launcher uses a separate worker file';Passed=($launcher.Contains('KCS_FIX101_WORKER.cmd') -and $launcher -notmatch '(?i)call\s+"%~f0"')},
 [pscustomobject]@{Name='Launcher checks worker existence before start';Passed=($launcher.IndexOf('if not exist "%KCS_WORKER%"') -ge 0 -and $launcher.IndexOf('start ') -gt $launcher.IndexOf('if not exist'))},
 [pscustomobject]@{Name='Worker contains the full automation pipeline';Passed=($worker.Contains('VALIDATE_FIX100_PACKAGE.ps1') -and $worker.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $worker.Contains('BUILD_ALL.cmd') -and $worker.Contains('PUBLISH_GITHUB_RELEASES.ps1') -and $worker.Contains('INSTALL_PUBLISHED_BUILD.ps1'))},
 [pscustomobject]@{Name='Worker returns to persistent shell on success and failure';Passed=($worker.Contains('exit /b 0') -and $worker.Contains('exit /b 1') -and $worker.Contains(':end_fail'))},
 [pscustomobject]@{Name='No recursive self-call or missing worker label dispatch';Passed=($launcher -notmatch '(?i)__KCS_WORKER|goto\s+:KCS_WORKER|call\s+"%~f0"' -and $worker -notmatch '(?i)goto\s+:KCS_WORKER|call\s+"%~f0"')}
)
$failed=0
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX104 CMD startup checks failed.")}
Write-Host ('[PASS] FIX104 CMD startup checks: '+$checks.Count+'/'+$checks.Count)
