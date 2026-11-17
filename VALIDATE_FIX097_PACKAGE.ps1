$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot)
$repo='naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$marker=Join-Path $root 'FIX097_PACKAGE_MARKER.txt'
$manifest=Join-Path $root 'FIX097_POWERSHELL_MANIFEST.txt'
try {
 if(!(Test-Path -LiteralPath $marker -PathType Leaf)){throw 'Missing FIX097 marker.'}
 $ml=@(Get-Content -LiteralPath $marker -ErrorAction Stop)
 if($ml -notcontains 'PACKAGE=FIX097' -or $ml -notcontains ('REPOSITORY='+$repo) -or $ml -notcontains 'ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd'){throw 'Package marker does not match FIX097/repository/entrypoint.'}
 if(!(Test-Path -LiteralPath $manifest -PathType Leaf)){throw 'Missing FIX097 PowerShell manifest.'}
 $required=@('URUCHOM_TYLKO_TEN_PLIK.cmd','CHECK_SOURCE.cmd','FIX097_PACKAGE_MARKER.txt','FIX097_POWERSHELL_MANIFEST.txt','VALIDATE_FIX097_PACKAGE.ps1','CLEAN_SAFE_TEMP.ps1','CHECK_FIX097_KEEP_OPEN.ps1','CHECK_FIX097_PIPELINE.ps1','CHECK_FIX097_PAGES_TRIGGER.ps1','CHECK_FIX097_CLEANUP_PATH.ps1','CHECK_FIX097_APP_CACHE_CLEANUP.ps1','PUBLISH_GITHUB_SOURCE.ps1','PUBLISH_GITHUB_RELEASES.ps1','BUILD_ALL.cmd','BUILD_PORTABLE.cmd','BUILD_INSTALLER_MODERN.cmd','VERIFY_BUILD.cmd','VERIFY_PUBLIC_DEPLOYMENT.ps1','INSTALL_PUBLISHED_BUILD.ps1','WindowsVersionSwitcherPRO.cs','WindowsVersionSwitcherPRO.Modules.cs','AssemblyInfo.cs','VERSION.txt','SETUP_MODERN.iss','NaprawaPC.ico','CentrumMigracjiHero.png','website/index.html','website/styles.css','website/app.js','website/media/prezentacja.mp4','.github/workflows/deploy-pages.yml')
 $missing=@();foreach($rel in $required){$p=Join-Path $root $rel;if(!(Test-Path -LiteralPath $p -PathType Leaf)){ $missing+=$rel }elseif((Get-Item -LiteralPath $p).Length -le 0){$missing+=($rel+' (empty)')}}
 if($missing.Count){throw ('Required package files missing: '+($missing -join ', '))}
 foreach($n in @('URUCHOM_TYLKO_TEN_PLIK.cmd','CHECK_SOURCE.cmd')){$b=[IO.File]::ReadAllBytes((Join-Path $root $n));if($b.Length -lt 1 -or $b[0] -ne 64){throw ($n+' must be UTF-8/ASCII without BOM and start with @echo off.')}}
 $rows=@(Get-Content -LiteralPath $manifest | Where-Object {$_ -and -not $_.StartsWith('#')})
 if($rows.Count -lt 1){throw 'PowerShell manifest is empty.'}
 $seen=@{};$bad=@()
 foreach($row in $rows){$parts=$row.Split('|',2);if($parts.Count -ne 2 -or $parts[0] -notmatch '^[A-Fa-f0-9]{64}$'){ $bad+=('Invalid manifest row: '+$row);continue }
  $rel=$parts[1].Replace('/',[IO.Path]::DirectorySeparatorChar);if([IO.Path]::IsPathRooted($rel) -or $rel.Contains('..')){$bad+=('Unsafe path '+$rel);continue}
  if($seen.ContainsKey($rel.ToLowerInvariant())){$bad+=('Duplicate path '+$rel);continue};$seen[$rel.ToLowerInvariant()]=$true
  $path=Join-Path $root $rel;if(!(Test-Path -LiteralPath $path -PathType Leaf)){$bad+=('Missing '+$rel);continue}
  $bytes=[IO.File]::ReadAllBytes($path);if($bytes.Length -lt 3 -or $bytes[0] -ne 239 -or $bytes[1] -ne 187 -or $bytes[2] -ne 191){$bad+=('UTF-8 BOM missing '+$rel);continue}
  $hash=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash;if($hash -ne $parts[0]){$bad+=('SHA-256 mismatch '+$rel);continue}
  $tokens=$null;$errors=$null;[System.Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors)|Out-Null;if($errors){foreach($e in $errors){$bad+=($rel+':'+$e.Extent.StartLineNumber+' '+$e.Message)}}
 }
 if($bad.Count){throw ('Manifest/parser validation failed: '+($bad -join ' | '))}
 Write-Host '[PASS] FIX097 package complete.'
 Write-Host ('[PASS] Root: '+$root)
 Write-Host ('[PASS] Repository: '+$repo)
 Write-Host ('[PASS] Required files: '+$required.Count)
 Write-Host ('[PASS] PowerShell BOM + SHA-256 + parser: '+$rows.Count)
 Write-Host '[PASS] CMD files are BOM-free.'
 exit 0
} catch {Write-Host ('[FAIL] FIX097 package validation: '+$_.Exception.Message);exit 1}
