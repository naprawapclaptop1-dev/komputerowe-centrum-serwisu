$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$htmlPath = Join-Path $root 'website/index.html'
$jsPath = Join-Path $root 'website/app.js'
$cssPath = Join-Path $root 'website/styles.css'
$index = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
$js = Get-Content -LiteralPath $jsPath -Raw -Encoding UTF8
$css = Get-Content -LiteralPath $cssPath -Raw -Encoding UTF8
$checks = @()
function Add-Check {
    param([bool]$Passed,[string]$Name)
    $script:checks += [pscustomobject]@{ Passed = $Passed; Name = $Name }
}
Add-Check ($index.Contains('application-fix" content="FIX118"')) 'Website FIX118 retains the published application marker'
Add-Check ($index.Contains('id="pobierz"') -and $index.Contains('id="deviceSummary"') -and $index.Contains('id="refreshRelease"')) 'Download center includes system detection and manual availability refresh'
Add-Check ($index.Contains('id="mobileMenuToggle"') -and $index.Contains('id="primaryNav"') -and $js.Contains('mobileMenuToggle: $(''mobileMenuToggle'')') -and $js.Contains('primaryNav: $(''primaryNav'')') -and $js.Contains('aria-expanded')) 'Mobile menu DOM controls are bound and keyboard-accessible with expanded state'
Add-Check ($index.Contains('class="skip-link"') -and $css.Contains('.skip-link:focus')) 'Skip-navigation link is available for keyboard and assistive-technology users'
Add-Check ($js.Contains('/releases?per_page=20') -and $js.Contains('!release.draft') -and $js.Contains('!release.prerelease')) 'Release data is fetched from public GitHub Releases and filtered by channel'
Add-Check ($js.Contains('download_count') -and $js.Contains('renderReleaseHistory') -and $index.Contains('id="releaseHistory"')) 'Release history and download counters use GitHub asset metadata'
Add-Check ($js.Contains('manifest-beta.xml') -and $js.Contains('betaManifest') -and $js.Contains('prerelease')) 'Stable and Beta are distinguished without inventing a separate Beta build'
Add-Check ($js.Contains('isOfficialReleaseAssetUrl') -and $js.Contains('parsed.hostname') -and $js.Contains('github.com') -and $js.Contains('/releases/download/')) 'Download links are restricted to official GitHub release assets'
Add-Check ($index.Contains('id="bezpieczenstwo"') -and $index.Contains('id="checksumForm"') -and $js.Contains("crypto.subtle.digest('SHA-256'")) 'Security center calculates SHA-256 locally in the browser'
Add-Check ($js.Contains('SHA256SUMS.txt') -and $js.Contains('verifyNoEntry') -and $js.Contains('verifyMismatch')) 'SHA-256 verification parses official checksum entries and reports mismatch'
Add-Check ($js.Contains('binary.arrayBuffer()') -and $js.Contains('sums.text()') -and $js -notmatch 'fetch\s*\(\s*ISSUES_PAGE') 'Selected files are processed locally and issue drafts are not auto-submitted'
Add-Check ($index.Contains('id="baza-wiedzy"') -and $index.Contains('id="knowledgeSearch"') -and $js.Contains('renderKnowledge')) 'Knowledge base includes live text search and category filtering'
Add-Check ($index.Contains('id="faqSearch"') -and $js.Contains('filterFaq')) 'FAQ search filters existing answers'
Add-Check ($index.Contains('id="reportForm"') -and $index.Contains('id="reportGithubLink"') -and $js.Contains('new URL(ISSUES_PAGE)')) 'Support form prepares a GitHub issue draft for explicit user review'
Add-Check ($index.Contains('Nie dodawaj haseł') -and $index.Contains('zgłoszenia publikowane') -and $js.Contains('issues/new')) 'Support form warns that GitHub issues may be public and excludes secrets'
Add-Check ($js.Contains('getHighEntropyValues') -and $js.Contains('userAgentData') -and $js.Contains('isWindows')) 'System and architecture detection uses browser information with a fallback'
Add-Check ($css.Contains('.device-summary') -and $css.Contains('.release-history-grid') -and $css.Contains('.security-panel') -and $css.Contains('.knowledge-grid') -and $css.Contains('.support-form')) 'All new page components have dedicated styling'
Add-Check ($css.Contains('@media(max-width:640px)') -and $css.Contains('@media(max-width:760px)') -and $css.Contains('prefers-reduced-motion')) 'New website layout supports mobile widths and reduced motion'
Add-Check ($index.Contains('data-pl=') -and $index.Contains('data-en=') -and $js.Contains('placeholder${lang')) 'Polish and English labels and dynamic placeholders are supported'
Add-Check ($index.Contains('prezentacja.mp4') -and $index.Contains('prezentacja.vtt') -and $index.Contains('prezentacja-en.vtt') -and (Test-Path -LiteralPath (Join-Path $root 'website/media/prezentacja-en.vtt')) -and (Test-Path -LiteralPath (Join-Path $root 'website/media/prezentacja.vtt'))) 'Existing presentation video and Polish/English captions remain present'
Add-Check ($js.Contains('productVersion') -and $index.Contains('software-version" content="1.0.0.69"')) 'Product version remains 1.0.0.69'
$failed = $false
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name); $failed = $true }
}
if ($failed) { Write-Host ('[FAIL] FIX117 website regression: ' + (($checks | Where-Object { -not $_.Passed }).Name -join '; ')); exit 1 }
Write-Host ('[PASS] FIX117 website feature compatibility checks: ' + $checks.Count + '/' + $checks.Count)
exit 0
