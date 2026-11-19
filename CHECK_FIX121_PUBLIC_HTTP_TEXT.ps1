$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$policyPath = Join-Path $root 'KCS_RELEASE_POLICY.ps1'
$verifierPath = Join-Path $root 'VERIFY_PUBLIC_DEPLOYMENT.ps1'
if (-not (Test-Path -LiteralPath $policyPath -PathType Leaf) -or -not (Test-Path -LiteralPath $verifierPath -PathType Leaf)) {
    Write-Host '[FAIL] Required policy/verifier files are missing.'
    exit 1
}
. $policyPath

$checks = @()
function Add-Check {
    param([bool]$Passed, [string]$Name)
    $script:checks += [pscustomobject]@{ Passed = $Passed; Name = $Name }
}

# Reproduce the Windows PowerShell 5.1 Invoke-WebRequest Byte[] response shape.
$xmlSource = '<?xml version="1.0" encoding="utf-8"?><Update version="1.0.0.69" channel="stable"><Description>Weryfikacja łącza</Description></Update>'
$xmlBytes = [System.Text.Encoding]::UTF8.GetBytes($xmlSource)
$xmlText = ConvertTo-KcsResponseText -Content $xmlBytes
$xmlDoc = [xml]$xmlText
Add-Check ($xmlDoc.DocumentElement.Name -eq 'Update' -and $xmlDoc.DocumentElement.GetAttribute('version') -eq '1.0.0.69' -and $xmlDoc.DocumentElement.SelectSingleNode('Description').InnerText -eq 'Weryfikacja łącza') 'UTF-8 Byte[] manifest content is decoded before XML parsing'

$xmlBomMemory = New-Object System.IO.MemoryStream
try {
    $preamble = [System.Text.Encoding]::UTF8.GetPreamble()
    $xmlPayload = [System.Text.Encoding]::UTF8.GetBytes($xmlSource)
    $xmlBomMemory.Write($preamble, 0, $preamble.Length)
    $xmlBomMemory.Write($xmlPayload, 0, $xmlPayload.Length)
    $xmlBomBytes = $xmlBomMemory.ToArray()
}
finally { $xmlBomMemory.Dispose() }
$xmlBomText = ConvertTo-KcsResponseText -Content $xmlBomBytes
$xmlBomDoc = [xml]$xmlBomText
Add-Check ($xmlBomDoc.DocumentElement.Name -eq 'Update') 'UTF-8 BOM is detected and removed before XML parsing'

$jsonSource = '[{"channel":"stable","version":"1.0.0.69"},{"channel":"beta","version":"1.0.0.69"}]'
$jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonSource)
$jsonText = ConvertTo-KcsResponseText -Content $jsonBytes
$json = ConvertFrom-Json -InputObject $jsonText
Add-Check ($json.Count -eq 2 -and $json[0].channel -eq 'stable' -and $json[1].channel -eq 'beta') 'UTF-8 Byte[] release catalogue is decoded before JSON parsing'

$sumSource = ('a' * 64) + '  installer.exe' + "`n" + ('b' * 64) + '  portable.exe'
$sumBytes = [System.Text.Encoding]::UTF8.GetBytes($sumSource)
$sumText = ConvertTo-KcsResponseText -Content $sumBytes
Add-Check ($sumText.Contains('installer.exe') -and $sumText.Contains('portable.exe') -and $sumText.Contains(('a' * 64))) 'UTF-8 Byte[] SHA256SUMS response is decoded before text checks'

$memory = New-Object System.IO.MemoryStream
try {
    $memory.Write($xmlBytes, 0, $xmlBytes.Length)
    $memory.Position = 0
    $streamText = ConvertTo-KcsResponseText -Content $memory
}
finally { $memory.Dispose() }
$streamDoc = [xml]$streamText
Add-Check ($streamDoc.DocumentElement.Name -eq 'Update') 'Stream response content is copied and decoded safely'

$stringText = ConvertTo-KcsResponseText -Content 'plain response text'
Add-Check ($stringText -ceq 'plain response text') 'Already-decoded string response remains unchanged'

$verifier = Get-Content -LiteralPath $verifierPath -Raw -Encoding UTF8
$tokens = $null
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile($verifierPath, [ref]$tokens, [ref]$parseErrors) | Out-Null
Add-Check (-not $parseErrors -or $parseErrors.Count -eq 0) 'VERIFY_PUBLIC_DEPLOYMENT.ps1 parses without PowerShell syntax errors'
Add-Check ($verifier.Contains('. (Join-Path $PSScriptRoot "KCS_RELEASE_POLICY.ps1")')) 'Public verifier imports the shared HTTP response decoder'
Add-Check ($verifier.Contains('ConvertTo-KcsResponseText -Content $manifestResponse.Content') -and $verifier.Contains('[xml]$doc=$manifestText')) 'Public manifest Byte[] is decoded before XML cast'
Add-Check ($verifier.Contains('ConvertTo-KcsResponseText -Content $catalogResponse.Content') -and $verifier.Contains('ConvertFrom-Json -InputObject $catalogText')) 'Public releases.json Byte[] is decoded before JSON parsing'
Add-Check ($verifier.Contains('ConvertTo-KcsResponseText -Content $sumResponse.Content') -and $verifier.Contains('$sumText=ConvertTo-KcsResponseText')) 'Public SHA256SUMS Byte[] is decoded before matching'
Add-Check ($verifier.Contains('ConvertTo-KcsResponseText -Content $page.Content') -and $verifier.Contains('$pageText.Contains($ExpectedSiteMarker)')) 'GitHub Pages Byte[] is decoded before marker and content checks'
Add-Check ($verifier.Contains('$ExpectedSiteFix=$LocalFixMatch.Groups[1].Value') -and $verifier -notmatch 'FIX093') 'Expected website marker is derived from local HTML instead of a stale hard-coded FIX number'
Add-Check ((Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw -Encoding UTF8).Contains('CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1')) 'FIX121 test is included in CHECK_SOURCE'
Add-Check ((Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8).Contains('CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1')) 'FIX121 test is required by full package validation'

$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name) }
}
if ($failed.Count -gt 0) {
    Write-Host ('[FAIL] FIX121 public HTTP response regression: ' + (($failed | ForEach-Object { $_.Name }) -join '; '))
    exit 1
}
Write-Host ('[PASS] FIX121 public HTTP response checks: ' + $checks.Count + '/' + $checks.Count)
exit 0
