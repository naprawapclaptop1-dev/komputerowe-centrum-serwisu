$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$fix116Path = Join-Path $root 'CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1'
$publisherPath = Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1'
$versionPath = Join-Path $root 'VERSION.txt'
$fix116 = Get-Content -LiteralPath $fix116Path -Raw -Encoding UTF8
$publisher = Get-Content -LiteralPath $publisherPath -Raw -Encoding UTF8
$versionLines = @(Get-Content -LiteralPath $versionPath -Encoding UTF8)
$tokens = $null
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($fix116Path,[ref]$tokens,[ref]$parseErrors)
if ($parseErrors) {
    foreach ($parseError in $parseErrors) { Write-Host ('[FAIL] FIX116 parser: ' + $parseError.Message) }
    exit 1
}
$resolverAst = $ast.Find({ param($node) return ($node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Get-PublisherProductVersion') },$true)
if ($null -eq $resolverAst) { Write-Host '[FAIL] FIX116 product-version resolver function is missing.'; exit 1 }
. ([scriptblock]::Create($resolverAst.Extent.Text))
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$resolvedActual = Get-PublisherProductVersion -PublisherText $publisher
Add-Check ($resolvedActual -ceq $versionLines[0]) 'Indented publisher assignment resolves to the product version declared in VERSION.txt'
Add-Check ($resolvedActual -match '^\d+\.\d+\.\d+\.\d+$') 'Resolved product version has four numeric components'
$unindented = Get-PublisherProductVersion -PublisherText '$Version="2.3.4.5"'
Add-Check ($unindented -ceq '2.3.4.5') 'Resolver accepts an unindented assignment'
$tabIndented = Get-PublisherProductVersion -PublisherText "`t`$Version = `"3.4.5.6`""
Add-Check ($tabIndented -ceq '3.4.5.6') 'Resolver accepts tab-indented assignments and spaces around equals'
$commentOnlyRejected = $false
try { [void](Get-PublisherProductVersion -PublisherText '# $Version="9.9.9.9"') } catch { $commentOnlyRejected = $true }
Add-Check $commentOnlyRejected 'Resolver does not mistake a commented-out assignment for active metadata'
$missingRejected = $false
try { [void](Get-PublisherProductVersion -PublisherText '$Tag="v1.2.3.4"') } catch { $missingRejected = $true }
Add-Check $missingRejected 'Resolver rejects publisher text with no product-version assignment'
$malformedRejected = $false
try { [void](Get-PublisherProductVersion -PublisherText '  $Version="1.2.3-beta"') } catch { $malformedRejected = $true }
Add-Check $malformedRejected 'Resolver rejects malformed non-four-part version values'
Add-Check ($fix116.Contains('Get-PublisherProductVersion -PublisherText $publisher') -and $fix116.Contains('[ \t]*\$Version')) 'FIX116 executes the indentation-tolerant metadata resolver'
$cmd = Get-Content -LiteralPath (Join-Path $root 'CHECK_SOURCE.cmd') -Raw -Encoding UTF8
$validator = Get-Content -LiteralPath (Join-Path $root 'VALIDATE_FIX100_PACKAGE.ps1') -Raw -Encoding UTF8
$allow = @(Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt') -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$policyTest = Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1') -Raw -Encoding UTF8
$safeBlock = [regex]::Match($policyTest, '\$safePaths\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$currentBlock = [regex]::Match($policyTest, '\$currentTagChanges\s*=\s*@\((.*?)\)', [Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value
$requiredNew = @('CHECK_FIX127_PUBLISHER_VERSION_RESOLVER.ps1','FIX127_RELEASE_NOTES.txt','FIX127_MODULE_MAP.txt')
Add-Check ($cmd.Contains('call :run_ps_check "CHECK_FIX127_PUBLISHER_VERSION_RESOLVER.ps1"')) 'FIX127 resolver regression is active in CHECK_SOURCE'
Add-Check (($requiredNew | Where-Object { $validator.Contains($_) }).Count -eq 3) 'Full-package validation requires all FIX127 artifacts'
Add-Check (($requiredNew | Where-Object { $allow -contains $_ }).Count -eq 3) 'Explicit source allowlist includes all FIX127 artifacts'
Add-Check (($requiredNew | Where-Object { $safeBlock.Contains($_) }).Count -eq 3) 'FIX127 test and historical docs remain safe tooling paths'
Add-Check ($currentBlock.Contains('CHECK_FIX127_PUBLISHER_VERSION_RESOLVER.ps1') -and -not $currentBlock.Contains('FIX127_RELEASE_NOTES.txt') -and -not $currentBlock.Contains('FIX127_MODULE_MAP.txt')) 'Only the FIX127 test changed in this package; its historical docs remain unchanged'
Add-Check ($safeBlock.Contains('CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1') -and -not $currentBlock.Contains('CHECK_FIX116_RELEASE_VERSION_NORMALIZATION.ps1')) 'Historical FIX116 regression remains safe tooling but is unchanged from the preceding baseline'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) { if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) } else { Write-Host ('[FAIL] ' + $check.Name) } }
if ($failed.Count) { Write-Host ('[FAIL] FIX127 publisher-version resolver checks: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX127 publisher-version resolver checks: {0}/{0}' -f $checks.Count)
exit 0
