$ErrorActionPreference='Stop'
$publisher=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
if($publisher -notmatch '\$exclude=@\([^\r\n]*"\.tools"'){throw 'Robocopy exclusion list must include .tools.'}
if($publisher -notmatch '"\.tools/"'){throw 'Git ignore rules must include .tools/.'}
if($publisher -notmatch '"rm","-r","--cached","--ignore-unmatch","\.tools"'){throw 'Previously committed .tools cache must be untracked without deleting the local source folder.'}
Write-Host '[PASS] FIX084 source cache exclusion checks: 3/3'
