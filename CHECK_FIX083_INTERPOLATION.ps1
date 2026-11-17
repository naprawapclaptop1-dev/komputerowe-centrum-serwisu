$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$tests = @(
    [pscustomobject]@{
        File = 'VERIFY_GLOBAL_UPDATE_SERVER.ps1'
        BadPattern = '\$Channel:|\$manifestName:'
        GoodTokens = @('${Channel}:', '${manifestName}:')
    },
    [pscustomobject]@{
        File = 'VERIFY_PUBLIC_DEPLOYMENT.ps1'
        BadPattern = '\$channel:'
        GoodTokens = @('${channel}:')
    },
    [pscustomobject]@{
        File = 'WindowsVersionSwitcherPRO_LegacyFallback.ps1'
        BadPattern = '\$dst:'
        GoodTokens = @('${dst}:')
    }
)
$failed = 0
foreach ($test in $tests) {
    $path = Join-Path $root $test.File
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        Write-Host ('[FAIL] Missing interpolation target: ' + $test.File)
        $failed++
        continue
    }
    $source = Get-Content -LiteralPath $path -Raw
    if ($source -match $test.BadPattern) {
        Write-Host ('[FAIL] Unbraced variable-colon interpolation remains in ' + $test.File)
        $failed++
        continue
    }
    $missingTokens = @($test.GoodTokens | Where-Object { -not $source.Contains($_) })
    if ($missingTokens.Count -gt 0) {
        Write-Host ('[FAIL] Expected safe interpolation token is missing in ' + $test.File + ': ' + ($missingTokens -join ', '))
        $failed++
    } else {
        Write-Host ('[PASS] Safe braced interpolation in ' + $test.File)
    }
}
if ($failed -gt 0) { throw ($failed.ToString() + ' FIX083 interpolation regression checks failed.') }
Write-Host '[PASS] FIX083 PowerShell interpolation regression checks: 3/3'
