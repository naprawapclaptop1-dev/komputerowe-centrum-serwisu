$ErrorActionPreference = 'Stop'
$legacyTest = Join-Path $PSScriptRoot 'CHECK_FIX139_APPOINTMENTS.ps1'
if (-not (Test-Path -LiteralPath $legacyTest -PathType Leaf)) {
    Write-Error "Missing historical calendar regression: $legacyTest"
    exit 1
}
& $legacyTest
$rc = $LASTEXITCODE
if ($null -eq $rc) { $rc = 0 }
if ($rc -ne 0) { exit $rc }
exit 0
