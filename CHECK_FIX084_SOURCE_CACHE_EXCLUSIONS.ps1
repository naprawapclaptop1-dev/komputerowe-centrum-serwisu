$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$allowlist=Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt')
if($publisher -match '(?i)robocopy|/E'){throw 'Publisher must use explicit allowlist copying, not recursive Robocopy.'}
if($allowlist -match '(?im)^\.tools(?:/|$)'){throw 'Local .tools cache must never be included in the source allowlist.'}
if($publisher -notmatch '\"rm\",\"-r\",\"--cached\",\"--ignore-unmatch\",\"\.tools'){throw 'Publisher must remove previously tracked .tools entries from the temporary Git index.'}
if($publisher -notmatch 'FIX099_SOURCE_ALLOWLIST\.txt'){throw 'Publisher must copy only the explicit source allowlist.'}
if((Get-Content -LiteralPath (Join-Path $root '.gitignore') -Raw) -notmatch '(?m)^\.tools/$'){throw 'Git ignore rules must include .tools/.'}
Write-Host '[PASS] FIX084 source cache exclusion checks: explicit allowlist, no Robocopy, .tools excluded and untracked.'
