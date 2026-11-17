$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$workflow=Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
$publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
if($workflow -match 'enablement:\s*true'){throw 'Workflow must not try to create the Pages site with GITHUB_TOKEN.'}
if($workflow -notmatch '(?m)^  push:' -or $workflow -notmatch '(?m)^    branches: \[ main \]'){throw 'Workflow must deploy on main website/workflow changes after Pages provisioning.'}
if($workflow -notmatch '(?m)^  workflow_dispatch:'){throw 'Workflow must support manual dispatch after site provisioning.'}
if($publisher -notmatch '"-f","build_type=workflow"' -or $publisher -notmatch '"-f","source\[branch\]=\$Branch"' -or $publisher -notmatch '"-f","source\[path\]=/"'){throw 'Publisher must create Pages with build_type and source branch/path.'}
if($publisher -notmatch 'Alternatywnie ustaw jednorazowo Settings > Pages'){throw 'Publisher must report the one-time Pages fallback clearly.'}
if($publisher -notmatch 'PAGES_DEPLOYMENT.status'){throw 'Publisher must record Pages provisioning status.'}
if($publisher -notmatch 'X-GitHub-Api-Version: 2026-03-10'){throw 'Pages API calls must pin the supported API version.'}
if($publisher -notmatch '\$workflowDispatchResult=Invoke-NativeCapture' -or $publisher -match 'Invoke-NativeInteractive -Executable \$gh.Source -Arguments @\("workflow","run"'){throw 'Workflow dispatch must use captured non-interactive process execution.'}
Write-Host '[PASS] FIX084 Pages configuration and FIX087 non-interactive deployment checks: 8/8'
