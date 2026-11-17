$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$workflow=Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
$publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
if($workflow -match 'enablement:\s*true'){throw 'Workflow must not attempt to create Pages with GITHUB_TOKEN.'}
if($workflow -notmatch '(?m)^  push:' -or $workflow -notmatch '(?m)^    branches: \[ main \]'){throw 'Workflow must deploy when website files change on main.'}
if($workflow -notmatch '(?m)^  workflow_dispatch:'){throw 'Workflow must retain manual recovery trigger.'}
if($publisher -notmatch 'build_type=workflow' -or $publisher -notmatch 'source\[branch\]=\$Branch' -or $publisher -notmatch 'source\[path\]=/') {throw 'Publisher must configure Pages for GitHub Actions, main and root.'}
if($publisher -notmatch 'PAGES_DEPLOYMENT.status'){throw 'Publisher must record Pages provisioning status.'}
if($publisher -match 'workflowDispatchResult|workflow","run","deploy-pages.yml'){throw 'Publisher must not issue a redundant manual dispatch after push; the push trigger deploys the site.'}
if($publisher -notmatch 'push na gałęzi main'){throw 'Publisher must explain automatic deployment after pushing website changes.'}
Write-Host '[PASS] GitHub Pages uses automatic push deployment; manual dispatch remains for recovery.'
