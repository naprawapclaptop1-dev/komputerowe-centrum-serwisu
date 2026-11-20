$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Read-Required { param([string]$Name); $p=Join-Path $root $Name; if(-not(Test-Path -LiteralPath $p -PathType Leaf)){throw "Missing build-identity input: $Name"}; return [IO.File]::ReadAllText($p) }
$versionLines=[IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))
$productVersion=if($versionLines.Count -gt 0){$versionLines[0].Trim()}else{''}
$productFix=if($versionLines.Count -gt 1){$versionLines[1].Trim()}else{''}
$assembly=Read-Required 'AssemblyInfo.cs'
$modules=Read-Required 'WindowsVersionSwitcherPRO.Modules.cs'
$setup=Read-Required 'SETUP_MODERN.iss'
$portable=Read-Required 'BUILD_PORTABLE.cmd'
$installer=Read-Required 'BUILD_INSTALLER_MODERN.cmd'
$buildAll=Read-Required 'BUILD_ALL.cmd'
$worker=Read-Required 'KCS_FIX101_WORKER.cmd'
$payloadVerifier=Read-Required 'VERIFY_PAYLOAD.ps1'
$sourceGate=Read-Required 'CHECK_SOURCE.cmd'
$validator=Read-Required 'VALIDATE_FIX100_PACKAGE.ps1'
$allow=@(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$manifest= (Get-Content -LiteralPath (Join-Path $root 'FIX099_POWERSHELL_MANIFEST.txt') -Raw -Encoding UTF8).Replace("`r`n","`n")
$policy=Read-Required 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1'
$safeBlock=[regex]::Match($policy,'\$safePaths\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock=[regex]::Match($policy,'\$currentTagChanges\s*=\s*@\((.*?)\)',[Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$required=@('CHECK_FIX072_REPOSITORY_INPUT.ps1','CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1','CHECK_FIX137_SERVICE_PRO.ps1','FIX136_RELEASE_NOTES.txt','FIX136_MODULE_MAP.txt','FIX137_RELEASE_NOTES.txt','FIX137_MODULE_MAP.txt')
Add-Check ($productVersion -eq '1.0.0.74' -and $productFix -eq 'FIX139') 'Product release is 1.0.0.74 / FIX139'
Add-Check ($assembly.Contains('AssemblyVersion("1.0.0.74")') -and $assembly.Contains('AssemblyFileVersion("1.0.0.74")') -and $assembly.Contains('AssemblyInformationalVersion("FIX139")')) 'Assembly metadata matches VERSION.txt'
Add-Check ($modules.Contains('ProgramVersion = "1.0.0.74"') -and $modules.Contains('KomputeroweCentrumSerwisu_FIX139_INSTALATOR.exe')) 'Application updater targets the immutable FIX139 product release'
Add-Check ($setup.Contains('#define MyAppVersion "1.0.0.74"') -and $setup.Contains('VersionInfoVersion=1.0.0.74') -and $setup.Contains('VersionInfoProductVersion=1.0.0.74') -and $setup.Contains('OutputBaseFilename=KomputeroweCentrumSerwisu_FIX139_INSTALATOR')) 'Inno Setup metadata and output filename consistently identify FIX139'
Add-Check ($portable.Contains('KomputeroweCentrumSerwisu_FIX139_PORTABLE.exe') -and $portable.Contains('-ExpectedVersion "1.0.0.74"') -and $portable.Contains('-CreateStamp')) 'Portable build verifies and stamps only the current 1.0.0.74 payload'
Add-Check ($installer.Contains('KomputeroweCentrumSerwisu_FIX139_INSTALATOR.exe') -and $installer.Contains('-ExpectedVersion "1.0.0.74"') -and $installer.Contains('SETUP_MODERN.iss')) 'Modern installer verifies only the current FIX139 payload and setup recipe'
Add-Check ($installer.Contains('if errorlevel 1 goto :fail') -and $installer.Contains('Expected Setup output missing') -and $installer.Contains('Stale payloads are rejected')) 'Modern installer fails closed on failed payload or wrong Inno output'
$portableGate=[regex]::Match($buildAll,'(?s)call\s+"%~dp0BUILD_PORTABLE\.cmd".*?set\s+"P_RC=%ERRORLEVEL%".*?if\s+not\s+"%P_RC%"=="0"\s+goto\s+:portable_failed')
$modernCall=$buildAll.IndexOf('call "%~dp0BUILD_INSTALLER_MODERN.cmd"',[StringComparison]::OrdinalIgnoreCase)
$portableGateEnd=if($portableGate.Success){$portableGate.Index+$portableGate.Length}else{-1}
Add-Check ($portableGate.Success -and $modernCall -gt $portableGateEnd) 'BUILD_ALL cannot start the modern installer after a failed Portable build'
Add-Check ($worker.Contains('BUILD_ALL child CMD exit code: %RC%') -and $worker.Contains('if not "%RC%"=="0" goto :build_fail') -and $worker.IndexOf('goto :build_fail') -lt $worker.IndexOf('PUBLISH_GITHUB_RELEASES.ps1')) 'Worker cannot publish or install after a failed build manager'
Add-Check ($payloadVerifier.Contains('"CHECK_FIX072_REPOSITORY_INPUT.ps1"') -and (Test-Path -LiteralPath (Join-Path $root 'CHECK_FIX072_REPOSITORY_INPUT.ps1') -PathType Leaf)) 'Every file used in payload source identity is present in the package'
Add-Check ($sourceGate.Contains('CHECK_FIX072_REPOSITORY_INPUT.ps1') -and $sourceGate.Contains('CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1') -and $sourceGate.Contains('CHECK_FIX137_SERVICE_PRO.ps1')) 'Repository-input, FIX136 identity and FIX139 Service PRO regressions are active in CHECK_SOURCE'
Add-Check (($required | Where-Object { $validator.Contains($_) }).Count -eq $required.Count) 'Full-package validator requires all FIX136/FIX139 test and documentation files'
Add-Check (($required | Where-Object { $allow -contains $_ }).Count -eq $required.Count) 'Explicit source allowlist contains all FIX136/FIX139 test and documentation files'
Add-Check (($required | Where-Object { $safeBlock.Contains($_) }).Count -eq $required.Count) 'FIX136/FIX139 tests and docs are classified as safe tooling and documentation changes'
Add-Check (($required | Where-Object { $currentBlock.Contains($_) }).Count -eq $required.Count) 'FIX136/FIX139 artifacts are included in the current release-preservation change set'
Add-Check ($manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX072_REPOSITORY_INPUT\.ps1$' -and $manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX136_SOURCE_BUILD_IDENTITY\.ps1$' -and $manifest -match '(?m)^[0-9A-F]{64}\|CHECK_FIX137_SERVICE_PRO\.ps1$') 'PowerShell manifest contains hashes for repository, FIX136 and FIX139 regressions'
$failed=@($checks | Where-Object { -not $_.Passed })
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){Write-Host ('[FAIL] FIX136 build identity checks: '+(($failed|ForEach-Object{$_.Name}) -join '; '));exit 1}
Write-Host ('[PASS] FIX136 source/build identity checks: {0}/{0}' -f $checks.Count)
exit 0
