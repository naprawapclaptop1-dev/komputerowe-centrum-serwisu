$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$publisher = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$workflow = Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
$checks = @(
  @($publisher -match '\$workflowDispatchResult\s*=\s*Invoke-NativeCapture' , 'Workflow dispatch uses captured native process'),
  @($publisher -notmatch 'Invoke-NativeInteractive\s+-Executable\s+\$gh\.Source\s+-Arguments\s+@\("workflow","run"', 'Workflow dispatch does not wait on an interactive console process'),
  @($publisher -match '\[PAGES\].*bez interaktywnego procesu', 'Publisher prints dispatch progress before invoking gh'),
  @($publisher -match 'workflowDispatchResult\.ExitCode\s+-ne\s+0', 'Publisher checks gh workflow run exit code'),
  @($publisher -match 'workflowDispatchResult\.Output', 'Publisher displays captured workflow dispatch output'),
  @($publisher -match '\$startInfo\.RedirectStandardInput=\$true' -and $publisher -match '\$process\.StandardInput\.Close\(\)', 'Captured native processes cannot pause waiting for keyboard input'),
  @($workflow -match '(?m)^  workflow_dispatch:$', 'Workflow supports manual dispatch'),
  @($workflow -match '(?m)^  push:$' -and $workflow -match '(?m)^    branches: \[ main \]$', 'Website workflow deploys after changes on main'),
  @($workflow -match "website/\\*\\*" -and $workflow -match "deploy-pages.yml", 'Push trigger is limited to website files and workflow changes')
)
$failed=0
foreach($check in $checks){if($check[0]){Write-Host ('[PASS] '+$check[1])}else{Write-Host ('[FAIL] '+$check[1]);$failed++}}
if($failed){throw ("$failed FIX086 workflow dispatch check(s) failed.")}
Write-Host ('[PASS] FIX086 workflow dispatch checks: '+$checks.Count+'/'+$checks.Count)
