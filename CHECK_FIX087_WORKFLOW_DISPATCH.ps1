$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$publisher = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$workflow = Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
$checks = @()
$checks += [pscustomobject]@{ Passed = [bool]($publisher -match '\$workflowDispatchResult\s*=\s*Invoke-NativeCapture'); Name = 'Workflow dispatch uses captured native process' }
$checks += [pscustomobject]@{ Passed = [bool]($publisher -notmatch 'Invoke-NativeInteractive\s+-Executable\s+\$gh\.Source\s+-Arguments\s+@\("workflow","run"'); Name = 'Workflow dispatch does not wait on an interactive console process' }
$checks += [pscustomobject]@{ Passed = [bool]($publisher -match '\[PAGES\].*bez interaktywnego procesu'); Name = 'Publisher prints dispatch progress before invoking gh' }
$checks += [pscustomobject]@{ Passed = [bool]($publisher -match 'workflowDispatchResult\.ExitCode\s+-ne\s+0'); Name = 'Publisher checks gh workflow run exit code' }
$checks += [pscustomobject]@{ Passed = [bool]($publisher -match 'workflowDispatchResult\.Output'); Name = 'Publisher displays captured workflow dispatch output' }
$checks += [pscustomobject]@{ Passed = [bool]($publisher -match '\$startInfo\.RedirectStandardInput=\$true' -and $publisher -match '\$process\.StandardInput\.Close\(\)'); Name = 'Captured native processes cannot pause waiting for keyboard input' }
$checks += [pscustomobject]@{ Passed = [bool]($workflow -match '(?m)^  workflow_dispatch:$'); Name = 'Workflow supports manual dispatch' }
$checks += [pscustomobject]@{ Passed = [bool]($workflow -match '(?m)^  push:$' -and $workflow -match '(?m)^    branches: \[ main \]$'); Name = 'Website workflow deploys after changes on main' }
$checks += [pscustomobject]@{ Passed = [bool]($workflow.Contains('website/**') -and $workflow.Contains('deploy-pages.yml')); Name = 'Push trigger is limited to website files and workflow changes' }
$failed = 0
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name); $failed++ }
}
if ($failed -gt 0) { throw ("$failed FIX087 workflow dispatch check(s) failed.") }
Write-Host ('[PASS] FIX087 workflow dispatch checks: ' + $checks.Count + '/' + $checks.Count)
