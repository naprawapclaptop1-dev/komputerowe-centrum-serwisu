$ErrorActionPreference = "Stop"
$source = Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"
$text = [IO.File]::ReadAllText($source)
if ($text -notmatch 'private\s+PremiumButton\s+radioBubbleButton\s*;') {
    throw "FIX035 regression: radioBubbleButton must be declared as PremiumButton."
}
if ($text -match 'private\s+Button\s+radioBubbleButton\s*;') {
    throw "FIX035 regression: base Button declaration has returned."
}
if ($text -notmatch 'radioBubbleButton\.AccentColor\s*=') {
    throw "FIX035 regression: radio accent styling is missing."
}
$buildScripts = @("BUILD_PORTABLE.cmd","BUILD_INSTALLER_MODERN.cmd","BUILD_INSTALLER_XP.cmd","VERIFY_BUILD.cmd")
foreach ($name in $buildScripts) {
    $path = Join-Path $PSScriptRoot $name
    $script = [IO.File]::ReadAllText($path)
    if ($script -match '-SourceRoot\s+"%~dp0"') {
        throw "FIX035 regression: $name passes a quoted %~dp0 ending in backslash."
    }
    if ($script -notmatch '-SourceRoot\s+"%~dp0\."') {
        throw "FIX035 regression: safe SourceRoot argument missing in $name."
    }
}
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
if ($verify -notmatch 'function\s+Resolve-VerifiedPath') { throw "FIX035 regression: safe path resolver missing." }
if ($verify -notmatch '\$actualFileVersion\s*=\s*\$rawFileVersion\.Trim\(\)') { throw "FIX035 regression: padded PE FileVersion is not normalized with Trim()." }
if ($verify -notmatch 'expected normalized FileVersion') { throw "FIX035 regression: normalized FileVersion mismatch diagnostic missing." }
if ($verify -notmatch 'BUILD_INSTALLER_MODERN\.cmd') { throw "FIX035 regression: build pipeline files are not included in provenance hash." }
if ($verify -notmatch 'CHECK_FIX035_REGRESSION\.ps1') { throw "FIX035 regression: current regression test is not included in provenance hash." }
if ($verify -notmatch '\[string\]\$ExpectedFix\s*=\s*"FIX035"') { throw "FIX035 regression: verifier default FIX does not match package." }
# Reproduce the exact Inno Setup metadata shape seen in the FIX034 build log.
$rawSampleVersion = "1.0.0.35            "
$normalizedSampleVersion = $rawSampleVersion.Trim()
if (-not ([version]$normalizedSampleVersion).Equals([version]"1.0.0.35")) {
    throw "FIX035 regression: padded FileVersion sample did not normalize to 1.0.0.35."
}
Write-Output "[PASS] FIX035 PremiumButton, SourceRoot path, padded FileVersion normalization and build provenance checks verified."
