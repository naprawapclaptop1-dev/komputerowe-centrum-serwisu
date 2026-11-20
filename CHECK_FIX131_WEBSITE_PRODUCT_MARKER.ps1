$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$versionPath = Join-Path $root 'VERSION.txt'
$indexPath = Join-Path $root 'website/index.html'
$jsPath = Join-Path $root 'website/app.js'
$verifierPath = Join-Path $root 'VERIFY_PUBLIC_DEPLOYMENT.ps1'
$versionLines = @(Get-Content -LiteralPath $versionPath -Encoding UTF8)
if ($versionLines.Count -lt 2) { throw 'VERSION.txt must contain product version and FIX identity.' }
$productVersion = ([string]$versionLines[0]).Trim().TrimStart([char]0xFEFF)
$productFix = ([string]$versionLines[1]).Trim().TrimStart([char]0xFEFF)
if ($productVersion -notmatch '^\d+\.\d+\.\d+\.\d+$') { throw 'Product version must contain four numeric components.' }
if ($productFix -notmatch '^FIX\d{3,}$') { throw 'Product FIX identity is malformed.' }
$html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$js = Get-Content -LiteralPath $jsPath -Raw -Encoding UTF8
$verifier = Get-Content -LiteralPath $verifierPath -Raw -Encoding UTF8
$marker = [regex]::Match($html, '<meta\s+name="application-fix"\s+content="([^"]+)"\s*/?>')
$softwareVersion = [regex]::Match($html, '<meta\s+name="software-version"\s+content="([^"]+)"\s*/?>')
$expectedInstaller = 'KomputeroweCentrumSerwisu_' + $productFix + '_INSTALATOR.exe'
$expectedPortable = 'KomputeroweCentrumSerwisu_' + $productFix + '_PORTABLE.exe'
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
Add-Check ($marker.Success -and $marker.Groups[1].Value -eq $productFix) 'Website application-fix marker equals VERSION.txt product FIX'
Add-Check ($softwareVersion.Success -and $softwareVersion.Groups[1].Value -eq $productVersion) 'Website software-version equals VERSION.txt product version'
Add-Check ($js.Contains(("const productVersion = '{0}'" -f $productVersion))) 'Website release client uses the VERSION.txt product version'
Add-Check ($js.Contains($expectedInstaller) -and $js.Contains($expectedPortable)) 'Website download asset names use the product FIX identity'
Add-Check ($verifier.Contains('<meta\s+name="application-fix"\s+content="([^"]+)"')) 'Public verifier extracts the site marker from local HTML'
Add-Check ($verifier.Contains('$ExpectedSiteFix=$LocalFixMatch.Groups[1].Value') -and $verifier.Contains('$ExpectedSiteMarker=') -and $verifier.Contains('$ExpectedSiteFix+')) 'Public verifier derives the expected public marker from local website content'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name) }
}
if ($failed.Count -gt 0) { Write-Host ('[FAIL] FIX131 website product marker: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX131 website product marker checks: ' + $checks.Count + '/' + $checks.Count)
exit 0
