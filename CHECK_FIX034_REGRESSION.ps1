$ErrorActionPreference = "Stop"
$source = Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"
$text = [IO.File]::ReadAllText($source)
if ($text -notmatch 'private\s+PremiumButton\s+radioBubbleButton\s*;') {
    throw "FIX034 regression: radioBubbleButton must be declared as PremiumButton."
}
if ($text -match 'private\s+Button\s+radioBubbleButton\s*;') {
    throw "FIX034 regression: base Button declaration has returned."
}
if ($text -notmatch 'radioBubbleButton\.AccentColor\s*=') {
    throw "FIX034 regression: radio accent styling is missing."
}
$buildScripts = @("BUILD_PORTABLE.cmd","BUILD_INSTALLER_MODERN.cmd","BUILD_INSTALLER_XP.cmd","VERIFY_BUILD.cmd")
foreach ($name in $buildScripts) {
    $path = Join-Path $PSScriptRoot $name
    $script = [IO.File]::ReadAllText($path)
    if ($script -match '-SourceRoot\s+"%~dp0"') {
        throw "FIX034 regression: $name passes a quoted %~dp0 ending in backslash. Use %~dp0."
    }
    if ($script -match '-SourceRoot\s+"%~dp0\."') { continue }
    throw "FIX034 regression: safe SourceRoot argument missing in $name."
}
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
if ($verify -notmatch 'function\s+Resolve-VerifiedPath') { throw "FIX034 regression: safe path resolver missing." }
if ($verify -notmatch 'INVALID_\{0\}_PATH') { throw "FIX034 regression: descriptive invalid-path diagnostics missing." }
Write-Output "[PASS] FIX034 PremiumButton contract and quoted SourceRoot path safety verified."
