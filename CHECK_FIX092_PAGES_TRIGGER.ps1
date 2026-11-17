$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$workflow=Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
$source=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$checks=@()
$checks += [pscustomobject]@{Passed=[bool]($workflow -match '(?m)^  push:' -and $workflow.Contains('website/**'));Name='Pages workflow auto-deploys when website changes are pushed'}
$checks += [pscustomobject]@{Passed=[bool]($workflow -match '(?m)^  workflow_dispatch:');Name='Manual workflow recovery remains available'}
$checks += [pscustomobject]@{Passed=[bool]($source.Contains('PUSH_TRIGGER_CONFIGURED') -and $source.Contains('push na gałęzi main'));Name='Source publisher records and explains push-triggered deployment'}
$checks += [pscustomobject]@{Passed=[bool]($source -notmatch 'workflowDispatchResult|workflow","run","deploy-pages.yml');Name='No redundant manual workflow dispatch after push'}
$checks += [pscustomobject]@{Passed=[bool]($source.Contains('build_type=workflow') -and $source.Contains('source[branch]=$Branch') -and $source.Contains('source[path]=/'));Name='Pages is configured with Actions, main and repository root'}
$failed=0
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX092 Pages-trigger checks failed.")}
Write-Host ('[PASS] FIX092 Pages-trigger checks: '+$checks.Count+'/'+$checks.Count)
