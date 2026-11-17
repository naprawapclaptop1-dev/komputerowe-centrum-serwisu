$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$workflow=Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
$source=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$checks=@(
 [pscustomobject]@{Passed=[bool]($workflow -match '(?m)^  push:' -and $workflow.Contains('website/**'));Name='Pages auto-deploys on website push'},
 [pscustomobject]@{Passed=[bool]($workflow -match '(?m)^  workflow_dispatch:');Name='Manual recovery remains available'},
 [pscustomobject]@{Passed=[bool]($source.Contains('PUSH_TRIGGER_CONFIGURED') -and $source.Contains('push na gałęzi main'));Name='Publisher records push-triggered deployment'},
 [pscustomobject]@{Passed=[bool]($source -notmatch 'workflowDispatchResult|workflow","run","deploy-pages.yml');Name='No redundant manual dispatch'},
 [pscustomobject]@{Passed=[bool]($source.Contains('build_type=workflow') -and $source.Contains('source[branch]=$Branch') -and $source.Contains('source[path]=/'));Name='Pages source uses Actions, main and root'}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX097 Pages checks failed.")};Write-Host ('[PASS] FIX097 Pages checks: '+$checks.Count+'/'+$checks.Count)
