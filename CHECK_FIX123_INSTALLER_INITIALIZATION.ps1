$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Test-PowerShellParse { param([string]$Path); $tokens=$null; $errors=$null; [System.Management.Automation.Language.Parser]::ParseFile($Path,[ref]$tokens,[ref]$errors) | Out-Null; return ($errors.Count -eq 0) }
$modernPath = Join-Path $root 'SETUP_MODERN.iss'
$legacyPath = Join-Path $root 'SETUP_LEGACY_XP.iss'
$runnerPath = Join-Path $root 'INSTALL_PUBLISHED_BUILD.ps1'
$assemblyPath = Join-Path $root 'AssemblyInfo.cs'
$modulesPath = Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs'
$publisherPath = Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1'
$manifestGeneratorPath = Join-Path $root 'GENERATE_UPDATE_MANIFEST.ps1'
$versionPath = Join-Path $root 'VERSION.txt'
foreach ($path in @($modernPath,$legacyPath,$runnerPath,$assemblyPath,$modulesPath,$publisherPath,$manifestGeneratorPath,$versionPath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw ("Missing FIX123 release input: {0}" -f $path) }
}
$modern = Get-Content -LiteralPath $modernPath -Raw
$legacy = Get-Content -LiteralPath $legacyPath -Raw
$runner = Get-Content -LiteralPath $runnerPath -Raw
$assembly = Get-Content -LiteralPath $assemblyPath -Raw
$modules = Get-Content -LiteralPath $modulesPath -Raw
$publisher = Get-Content -LiteralPath $publisherPath -Raw
$manifestGenerator = Get-Content -LiteralPath $manifestGeneratorPath -Raw
$version = (Get-Content -LiteralPath $versionPath -TotalCount 1).Trim()
Add-Check ((Test-PowerShellParse -Path $runnerPath) -and (Test-PowerShellParse -Path $publisherPath) -and (Test-PowerShellParse -Path $manifestGeneratorPath)) 'Install and publisher PowerShell scripts parse without syntax errors'
foreach ($setup in @($modern,$legacy)) {
    Add-Check ($setup.Contains("'Install'") -and $setup.Contains("'Release'") -and $setup.Contains("'Version'")) 'Inno prerequisite detector supports Install, Release and Version registry values'
    Add-Check ($setup.Contains('InstallValue = 1') -and $setup.Contains('ReleaseValue > 0') -and $setup.Contains("Pos('4.', VersionValue) = 1")) 'Detector accepts the .NET 4 Full install marker or later .NET Release/Version markers'
    Add-Check ($setup.Contains('InstallValue := 0') -and $setup.Contains('ReleaseValue := 0') -and $setup.Contains("VersionValue := ''")) 'Registry query outputs are initialized before optional reads'
    Add-Check ($setup.Contains('IsDotNetFullAt(HKLM,') -and $setup.Contains('SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full') -and $setup.Contains('SOFTWARE\WOW6432Node\Microsoft\NET Framework Setup\NDP\v4\Full')) 'Both standard and WOW6432Node registry paths are checked'
    Add-Check ($setup.Contains('KCS_PREREQUISITE_OK') -and $setup.Contains('KCS_PREREQUISITE_MISSING')) 'Prerequisite success/failure is recorded in the Inno Setup log'
}
Add-Check ($modern.Contains('SetupLogging=yes') -and $modern.Contains('OutputBaseFilename=KomputeroweCentrumSerwisu_FIX072_INSTALATOR')) 'Modern installer logging and FIX072 output name are enabled'
Add-Check ($runner.Contains('/LOG=') -and $runner.Contains('installation-FIX072-inno.log') -and $runner.Contains('Get-Content -LiteralPath $InstallLog -Tail 80')) 'Automated installation saves a separate Inno log and shows its tail on errors'
Add-Check ($runner.Contains('switch([int]$p.ExitCode)') -and $runner.Contains('Setup failed to initialize') -and $runner.Contains('if($p.ExitCode -ne 0)')) 'Inno exit codes are identified; failed installations are never reported as successful'
Add-Check ($runner.Contains("ExpectedVersion '1.0.0.72'") -and $runner.Contains('$installedRaw') -and $runner.Contains('ConvertTo-KcsProductVersion')) 'Installer and installed application FileVersion are still validated'
Add-Check ($assembly.Contains('AssemblyVersion("1.0.0.72")') -and $assembly.Contains('AssemblyFileVersion("1.0.0.72")') -and $assembly.Contains('AssemblyInformationalVersion("FIX072")')) 'Application assembly metadata is aligned to product version 1.0.0.72 / FIX072'
Add-Check ($modules.Contains('ProgramVersion = "1.0.0.72"') -and $modules.Contains('KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe')) 'In-app updater uses the FIX072 tag and installer asset name'
Add-Check ($publisher.Contains('$Version="1.0.0.72"') -and $publisher.Contains('$SetupName="KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe"') -and $publisher.Contains('$PortableName="KomputeroweCentrumSerwisu_FIX072_PORTABLE.exe"')) 'Publisher targets new immutable release v1.0.0.72 and FIX072 artifacts'
Add-Check ($manifestGenerator.Contains('$Version="1.0.0.72"; $Tag="v$Version"; $Fix="FIX072"') -and $manifestGenerator.Contains('KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe')) 'Standalone manifest generator uses the same FIX072 release identity'
Add-Check ($version -eq '1.0.0.72') 'VERSION.txt declares product version 1.0.0.72'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX123 installer initialization regression: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ("[PASS] FIX123 installer initialization regression: {0}/{0}" -f $checks.Count)
exit 0
