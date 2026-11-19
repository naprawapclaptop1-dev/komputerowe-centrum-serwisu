$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot)
$repo='naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$marker=Join-Path $root 'FIX099_PACKAGE_MARKER.txt'
$manifest=Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt'
try {
 $rootPath=$root.TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
 $volumeRoot=[IO.Path]::GetPathRoot($rootPath).TrimEnd([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)
 if([string]::Equals($rootPath,$volumeRoot,[StringComparison]::OrdinalIgnoreCase)){throw 'Niebezpieczny katalog uruchomienia: pakiet nie może działać z katalogu głównego dysku.'}
 $rootItem=Get-Item -LiteralPath $rootPath -Force -ErrorAction Stop
 if(($rootItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Niebezpieczny katalog uruchomienia: katalog pakietu nie może być punktem ponownej analizy.'}
 if(!(Test-Path -LiteralPath $marker -PathType Leaf)){throw 'Missing FIX099 marker.'}
 $ml=@(Get-Content -LiteralPath $marker -ErrorAction Stop)
 if($ml -notcontains 'PACKAGE=FIX099' -or $ml -notcontains ('REPOSITORY='+$repo) -or $ml -notcontains 'ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd'){throw 'Package marker does not match FIX099/repository/entrypoint.'}
 if(!(Test-Path -LiteralPath $manifest -PathType Leaf)){throw 'Missing FIX099 PowerShell manifest.'}
 $required=@('URUCHOM_TYLKO_TEN_PLIK.cmd','KCS_FIX101_WORKER.cmd','CHECK_SOURCE.cmd','FIX099_PACKAGE_MARKER.txt','FIX099_POWERSHELL_MANIFEST.txt','VALIDATE_FIX100_PACKAGE.ps1','CLEAN_SAFE_TEMP.ps1','CHECK_FIX101_KEEP_OPEN.ps1','CHECK_FIX102_SOURCE_GATE.ps1','CHECK_FIX104_BUILD_ISOLATION.ps1','CHECK_FIX105_BUILD_FLOW.ps1','CHECK_FIX108_RELEASE_PUBLISHING.ps1','FIX108_RELEASE_NOTES.txt','FIX108_MODULE_MAP.txt','VERIFY_BUILD.ps1','CHECK_FIX112_VERIFICATION.ps1','FIX112_RELEASE_NOTES.txt','FIX112_MODULE_MAP.txt','CHECK_FIX113_WRAPPER_REPORT.ps1','FIX113_RELEASE_NOTES.txt','FIX113_MODULE_MAP.txt','CHECK_FIX114_ROOT_ARGUMENT.ps1','FIX114_RELEASE_NOTES.txt','FIX114_MODULE_MAP.txt','CHECK_FIX115_ROOT_INITIALIZATION.ps1','FIX115_RELEASE_NOTES.txt','FIX115_MODULE_MAP.txt','CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1','FIX116_RELEASE_NOTES.txt','FIX116_MODULE_MAP.txt','CHECK_FIX117_WEBSITE_FEATURES.ps1','FIX117_RELEASE_NOTES.txt','FIX117_MODULE_MAP.txt','CHECK_FIX118_WEBSITE_REGRESSION.ps1','FIX118_RELEASE_NOTES.txt','FIX118_MODULE_MAP.txt','KCS_RELEASE_POLICY.ps1','CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1','FIX119_RELEASE_NOTES.txt','FIX119_MODULE_MAP.txt','CHECK_FIX120_POWERSHELL_INTERPOLATION.ps1','FIX120_RELEASE_NOTES.txt','FIX120_MODULE_MAP.txt','website/media/prezentacja.vtt','website/media/prezentacja-en.vtt','CHECK_FIX100_PIPELINE.ps1','CHECK_FIX100_CLEANUP_PATH.ps1','CHECK_FIX100_SOURCE_SCOPE.ps1','CHECK_FIX100_ROOT_PATH.ps1','CHECK_FIX099_PAGES_TRIGGER.ps1','FIX100_RELEASE_NOTES.txt','FIX100_MODULE_MAP.txt','FIX101_RELEASE_NOTES.txt','FIX101_MODULE_MAP.txt','FIX102_RELEASE_NOTES.txt','FIX102_MODULE_MAP.txt','FIX103_RELEASE_NOTES.txt','FIX103_MODULE_MAP.txt','FIX104_RELEASE_NOTES.txt','FIX104_MODULE_MAP.txt','FIX106_RELEASE_NOTES.txt','FIX106_MODULE_MAP.txt','FIX099_CLEANUP_SCOPE.txt','FIX099_NETWORK_SCOPE.txt','FIX099_SOURCE_ALLOWLIST.txt','CHECK_FIX099_SOURCE_SCOPE.ps1','PUBLISH_GITHUB_SOURCE.ps1','PUBLISH_GITHUB_RELEASES.ps1','BUILD_ALL.cmd','BUILD_PORTABLE.cmd','BUILD_INSTALLER_MODERN.cmd','VERIFY_BUILD.cmd','VERIFY_PUBLIC_DEPLOYMENT.ps1','INSTALL_PUBLISHED_BUILD.ps1','WindowsVersionSwitcherPRO.cs','WindowsVersionSwitcherPRO.Modules.cs','AssemblyInfo.cs','VERSION.txt','SETUP_MODERN.iss','NaprawaPC.ico','CentrumMigracjiHero.png','website/index.html','website/styles.css','website/app.js','website/media/prezentacja.mp4','.github/workflows/deploy-pages.yml')
 $missing=@();foreach($rel in $required){$p=Join-Path $root $rel;if(!(Test-Path -LiteralPath $p -PathType Leaf)){ $missing+=$rel }elseif((Get-Item -LiteralPath $p).Length -le 0){$missing+=($rel+' (empty)')}}
 if($missing.Count){throw ('Required package files missing: '+($missing -join ', '))}
 foreach($n in @('URUCHOM_TYLKO_TEN_PLIK.cmd','KCS_FIX101_WORKER.cmd','CHECK_SOURCE.cmd')){$b=[IO.File]::ReadAllBytes((Join-Path $root $n));if($b.Length -lt 1 -or $b[0] -ne 64){throw ($n+' must be UTF-8/ASCII without BOM and start with @echo off.')}}
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
 Write-Host '[PASS] FIX101 package complete.'
 Write-Host ('[PASS] Root: '+$root)
 Write-Host ('[PASS] Repository: '+$repo)
 Write-Host ('[PASS] Required files: '+$required.Count)
 Write-Host ('[PASS] PowerShell BOM + SHA-256 + parser: '+$rows.Count)
 Write-Host '[PASS] CMD files are BOM-free.'
 exit 0
} catch {Write-Host ('[FAIL] FIX099 package validation: '+$_.Exception.Message);exit 1}
