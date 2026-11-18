$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$validator=Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw
$manifest=Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt')
$paths=@($manifest | ForEach-Object {$_.Trim()} | Where-Object {$_ -and -not $_.StartsWith('#')})
$bad=@();$seen=@{}
if($publisher -match '(?i)robocopy|git"\s*,\s*"add"\s*,\s*"-A"|git add -A'){$bad+='Publisher still contains a broad directory copy or git add -A.'}
if($publisher -notmatch 'FIX099_SOURCE_ALLOWLIST\.txt' -or $publisher -notmatch '\$gitPaths\.ToArray\(\)'){$bad+='Publisher does not copy and stage the explicit allowlist.'}
if($publisher -notmatch 'FIX099_PACKAGE_MARKER\.txt' -or $validator -notmatch 'FIX099_PACKAGE_MARKER\.txt' -or $publisher -match 'Split-Path -Leaf.*KCS_FIX099' -or $validator -match 'rootLeaf.*KCS_FIX099'){$bad+='Package marker validation must replace the extracted-folder-name restriction.'}
foreach($p in $paths){
 if([IO.Path]::IsPathRooted($p) -or $p -match '(^|[\\/])\.\.([\\/]|$)'){$bad+=('Unsafe allowlist path: '+$p);continue}
 if($p -match '^(?i:WEB_PUBLISH|ARCHIWUM_CLOUDFLARE_FIX067)([\\/]|$)'){$bad+=('Non-package folder is allowlisted: '+$p);continue}
 if($seen.ContainsKey($p.ToLowerInvariant())){$bad+=('Duplicate allowlist entry: '+$p)}else{$seen[$p.ToLowerInvariant()]=$true}
 $full=Join-Path $root ($p.Replace('/',[IO.Path]::DirectorySeparatorChar))
 if(!(Test-Path -LiteralPath $full -PathType Leaf)){$bad+=('Missing allowlisted package file: '+$p)}
}
$outside=@($paths | Where-Object {$_ -notmatch '^[^/\\]+$' -and $_ -notmatch '^website/' -and $_ -ne '.github/workflows/deploy-pages.yml'})
if($outside.Count){$bad+=('Unexpected nested paths: '+($outside -join ', '))}
if($paths -notcontains 'FIX099_SOURCE_ALLOWLIST.txt'){$bad+='Allowlist does not include its own versioned definition.'}
if($paths -contains 'README.md' -or $paths -contains 'POLITYKA_PUBLIKACJI.md'){$bad+='Repository-owned README/policy must be preserved, not overwritten.'}
if($bad.Count){$bad | ForEach-Object {Write-Host ('[FAIL] '+$_)};throw ($bad.Count.ToString()+' FIX100 source-scope checks failed.')}
Write-Host '[PASS] Explicit source allowlist is complete and path-safe.'
Write-Host '[PASS] No broad Robocopy /E or git add -A remains.'
Write-Host '[PASS] Only root package files, website/** and the Pages workflow can be synchronized.'
Write-Host '[PASS] WEB_PUBLISH and ARCHIWUM_CLOUDFLARE_FIX067 are excluded.'
Write-Host ('[PASS] FIX100 source scope checks: '+$paths.Count+'/'+$paths.Count)
