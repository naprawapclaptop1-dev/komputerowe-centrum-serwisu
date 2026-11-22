$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'KCS_RELEASE_POLICY.ps1')
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$orchestration = @('BUILD_ALL.cmd','BUILD_INSTALLERS.cmd','BUILD_MANAGER.cmd','BUILD_INSTALLER_XP.cmd','KCS_FIX101_WORKER.cmd','PUBLISH_GITHUB_RELEASES.ps1','KCS_RELEASE_POLICY.ps1','CHECK_FIX155_RELEASE_REUSE_POLICY.ps1','FIX155_RELEASE_NOTES.txt','FIX155_MODULE_MAP.txt','CHANGELOG.txt')
Add-Check (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths $orchestration -ReportedPathCount $orchestration.Count -AssetsComplete $true -TagIsAncestor $true) 'FIX155 orchestration-only changes can reuse verified immutable public assets'
$buildInputs = @('BUILD_PORTABLE.cmd','BUILD_INSTALLER_MODERN.cmd','SETUP_MODERN.iss','SETUP_LEGACY_XP.iss','WindowsVersionSwitcherPRO.cs','WindowsVersionSwitcherPRO.Modules.cs','AssemblyInfo.cs','VERSION.txt','NaprawaPC.ico','CentrumMigracjiHero.png')
foreach($path in $buildInputs){ Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @($path) -ReportedPathCount 1 -AssetsComplete $true -TagIsAncestor $true)) ("Build input remains release-blocking: "+$path) }
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('BUILD_ALL.cmd','WindowsVersionSwitcherPRO.cs') -ReportedPathCount 2 -AssetsComplete $true -TagIsAncestor $true)) 'Mixed orchestration and application changes fail closed'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths $orchestration -ReportedPathCount ($orchestration.Count-1) -AssetsComplete $true -TagIsAncestor $true)) 'Incomplete GitHub compare path count fails closed'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths $orchestration -ReportedPathCount $orchestration.Count -AssetsComplete $false -TagIsAncestor $true)) 'Incomplete public assets fail closed'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths $orchestration -ReportedPathCount $orchestration.Count -AssetsComplete $true -TagIsAncestor $false)) 'Non-ancestor tag fails closed'
$failed=@($checks | Where-Object {-not $_.Passed})
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){Write-Host ('[FAIL] FIX155 release reuse policy: '+(($failed | ForEach-Object {$_.Name}) -join '; '));exit 1}
Write-Host ('[PASS] FIX155 release reuse policy checks: '+$checks.Count+'/'+$checks.Count)
exit 0
