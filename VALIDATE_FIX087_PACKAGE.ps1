$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$repo = 'naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$markerPath = Join-Path $root 'FIX087_PACKAGE_MARKER.txt'
$manifestPath = Join-Path $root 'FIX087_POWERSHELL_MANIFEST.txt'
try {
    if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) { Write-Host '[FAIL] Missing FIX087_PACKAGE_MARKER.txt beside the launcher.'; exit 21 }
    $markerLines = @(Get-Content -LiteralPath $markerPath -ErrorAction Stop)
    if ($markerLines -notcontains 'PACKAGE=FIX087') { Write-Host '[FAIL] Marker package identity is not FIX087.'; exit 22 }
    if ($markerLines -notcontains ('REPOSITORY=' + $repo)) { Write-Host '[FAIL] Marker repository does not match the assigned repository.'; exit 23 }
    if ($markerLines -notcontains 'ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd') { Write-Host '[FAIL] Marker entry point does not match the single CMD launcher.'; exit 24 }
    if ($markerLines -notcontains 'CMD_ENCODING=UTF8_NO_BOM') { Write-Host '[FAIL] Marker does not require BOM-free CMD files.'; exit 25 }
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { Write-Host '[FAIL] Missing FIX087_POWERSHELL_MANIFEST.txt.'; exit 26 }
    $required = @(
      'URUCHOM_TYLKO_TEN_PLIK.cmd','FIX087_PACKAGE_MARKER.txt','FIX087_POWERSHELL_MANIFEST.txt','VALIDATE_FIX087_PACKAGE.ps1',
      'CHECK_FIX087_PACKAGE_VALIDATION.ps1','CHECK_FIX087_WORKFLOW_DISPATCH.ps1','CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1','CHECK_FIX084_CMD_ENCODING.ps1','CHECK_FIX084_PAGES_CONFIGURATION.ps1','CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1',
      'CHECK_FIX083_INTERPOLATION.ps1','CHECK_FIX083_NATIVE_PROCESS.ps1','PUBLISH_GITHUB_SOURCE.ps1','PUBLISH_GITHUB_RELEASES.ps1',
      'BOOTSTRAP_BUILD_TOOLS.ps1','BUILD_ALL.cmd','VERIFY_PUBLIC_DEPLOYMENT.ps1','INSTALL_PUBLISHED_BUILD.ps1','VERIFY_GLOBAL_UPDATE_SERVER.ps1',
      'CHECK_SOURCE.cmd','.gitignore','CHANGELOG.txt','VERSION.txt','FIX087_RELEASE_NOTES.txt','FIX087_MODULE_MAP.txt','website\index.html','website\styles.css','website\app.js','website\sitemap.xml','.github\workflows\deploy-pages.yml'
    )
    $missing=@()
    foreach($relative in $required){$full=Join-Path $root $relative;if(-not(Test-Path -LiteralPath $full -PathType Leaf)){$missing+=$relative}elseif((Get-Item -LiteralPath $full).Length -le 0){$missing+=($relative+' (empty file)')}}
    if($missing.Count -gt 0){Write-Host '[FAIL] Package incomplete:';$missing|ForEach-Object{Write-Host ('  - '+$_)};exit 27}
    foreach($cmdName in @('URUCHOM_TYLKO_TEN_PLIK.cmd','CHECK_SOURCE.cmd')){
      $cmdBytes=[IO.File]::ReadAllBytes((Join-Path $root $cmdName))
      if($cmdBytes.Length -lt 1 -or $cmdBytes[0] -ne 64){Write-Host ('[FAIL] CMD has BOM or invalid first byte: '+$cmdName);exit 28}
    }
    $publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
    if($publisher -notmatch '\$exclude=@\([^\r\n]*"\.tools"'){Write-Host '[FAIL] Source publisher does not exclude .tools.';exit 29}
    if($publisher -notmatch '"-c","core.longpaths=true","clone"'){Write-Host '[FAIL] git clone must enable core.longpaths before checkout.';exit 37}
    if((Get-Content -LiteralPath (Join-Path $root '.gitignore') -Raw) -notmatch '(?m)^\.tools/$'){Write-Host '[FAIL] .gitignore must exclude local .tools cache.';exit 38}
    if($publisher -notmatch '"-f","build_type=workflow"' -or $publisher -notmatch '"-f","source\[branch\]=\$Branch"' -or $publisher -notmatch '"-f","source\[path\]=/"'){Write-Host '[FAIL] Pages provisioning must send build_type and source branch/path.';exit 30}
    $workflow=Get-Content -LiteralPath (Join-Path $root '.github\workflows\deploy-pages.yml') -Raw
    if($workflow -match 'enablement:\s*true'){Write-Host '[FAIL] Pages workflow must not attempt to create the Pages site using GITHUB_TOKEN.';exit 31}
    if($workflow -notmatch '(?m)^  push:' -or $workflow -notmatch '(?m)^    branches: \[ main \]'){Write-Host '[FAIL] Pages workflow must deploy on website changes to main.';exit 36}
    if($workflow -notmatch '(?m)^  workflow_dispatch:'){Write-Host '[FAIL] Pages workflow must support manual dispatch after site provisioning.';exit 39}
    if($publisher -notmatch '\$workflowDispatchResult\s*=\s*Invoke-NativeCapture' -or $publisher -match 'Invoke-NativeInteractive\s+-Executable\s+\$gh\.Source\s+-Arguments\s+@\("workflow","run"'){Write-Host '[FAIL] Workflow dispatch must use non-interactive captured process execution.';exit 40}
    if($publisher -notmatch '\$startInfo\.RedirectStandardInput=\$true' -or $publisher -notmatch '\$process\.StandardInput\.Close\(\)'){Write-Host '[FAIL] Captured GitHub command must not wait for keyboard input.';exit 41}
    if($publisher -notmatch 'X-GitHub-Api-Version: 2026-03-10'){Write-Host '[FAIL] Pages API version is not pinned.';exit 35}
    $entries=@(Get-Content -LiteralPath $manifestPath | Where-Object { $_ -and -not $_.StartsWith('#') })
    if($entries.Count -lt 1){Write-Host '[FAIL] PowerShell manifest is empty.';exit 32}
    $seen=@{};$parseFailures=@();$integrityFailures=@()
    foreach($entry in $entries){
      $parts=$entry.Split('|',2)
      if($parts.Count -ne 2 -or $parts[0] -notmatch '^[A-Fa-f0-9]{64}$'){$integrityFailures+=('Invalid manifest row: '+$entry);continue}
      $relative=$parts[1].Replace('/',[IO.Path]::DirectorySeparatorChar)
      if([IO.Path]::IsPathRooted($relative) -or $relative.Contains('..')){$integrityFailures+=('Unsafe manifest path: '+$relative);continue}
      $full=[IO.Path]::GetFullPath((Join-Path $root $relative));$prefix=$root.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
      if(-not $full.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){$integrityFailures+=('Path escapes package: '+$relative);continue}
      if($seen.ContainsKey($relative.ToLowerInvariant())){$integrityFailures+=('Duplicate path: '+$relative);continue};$seen[$relative.ToLowerInvariant()]=$true
      if(-not(Test-Path -LiteralPath $full -PathType Leaf)){$integrityFailures+=('Missing script: '+$relative);continue}
      $bytes=[IO.File]::ReadAllBytes($full)
      if($bytes.Length -lt 3 -or $bytes[0] -ne 239 -or $bytes[1] -ne 187 -or $bytes[2] -ne 191){$integrityFailures+=('Missing UTF-8 BOM: '+$relative);continue}
      $actual=(Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToUpperInvariant()
      if($actual -ne $parts[0].ToUpperInvariant()){$integrityFailures+=('SHA-256 mismatch: '+$relative);continue}
      $tokens=$null;$parseErrors=$null
      [System.Management.Automation.Language.Parser]::ParseFile($full,[ref]$tokens,[ref]$parseErrors)|Out-Null
      if($parseErrors){foreach($e in $parseErrors){$parseFailures+=($relative+':'+$e.Extent.StartLineNumber+': '+$e.Message)}}
    }
    if($integrityFailures.Count){Write-Host '[FAIL] Package integrity:';$integrityFailures|ForEach-Object{Write-Host ('  - '+$_)};exit 33}
    if($parseFailures.Count){Write-Host '[FAIL] PowerShell syntax errors:';$parseFailures|ForEach-Object{Write-Host ('  - '+$_)};exit 34}
    Write-Host '[PASS] Package FIX087 complete.'
    Write-Host ('[PASS] Folder: '+$root)
    Write-Host ('[PASS] Repository: '+$repo)
    Write-Host ('[PASS] Required files present and non-empty: '+$required.Count)
    Write-Host ('[PASS] CMD files have no BOM: 2')
    Write-Host ('[PASS] PowerShell scripts BOM + SHA-256 + parser: '+$entries.Count)
    Write-Host '[PASS] .tools cache excluded; existing tracked cache scheduled for removal from repository index.'
    exit 0
} catch { Write-Host ('[FAIL] FIX087 package validation: '+$_.Exception.Message); exit 35 }
