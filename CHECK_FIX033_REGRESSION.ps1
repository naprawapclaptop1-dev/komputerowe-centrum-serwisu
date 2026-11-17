$ErrorActionPreference = "Stop"
$source = Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"
$text = [IO.File]::ReadAllText($source)
if ($text -notmatch 'private\s+PremiumButton\s+radioBubbleButton\s*;') {
    throw "FIX033 regression: radioBubbleButton must be declared as PremiumButton."
}
if ($text -match 'private\s+Button\s+radioBubbleButton\s*;') {
    throw "FIX033 regression: base Button declaration has returned."
}
if ($text -notmatch 'radioBubbleButton\.AccentColor\s*=') {
    throw "FIX033 regression: radio accent styling is missing."
}
Write-Output "[PASS] radioBubbleButton compile-time type and AccentColor contract verified."
