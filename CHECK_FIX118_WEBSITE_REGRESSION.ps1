$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$htmlPath = Join-Path $root 'website/index.html'
$jsPath = Join-Path $root 'website/app.js'
$cssPath = Join-Path $root 'website/styles.css'
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
$js = Get-Content -LiteralPath $jsPath -Raw -Encoding UTF8
$css = Get-Content -LiteralPath $cssPath -Raw -Encoding UTF8
$versionLines = Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Encoding UTF8
$productVersion = $versionLines[0].Trim()
$productFix = $versionLines[1].Trim()
$checks = @()
function Add-Check {
    param([bool]$Passed,[string]$Name)
    $script:checks += [pscustomobject]@{ Passed = $Passed; Name = $Name }
}
Add-Check ($html.Contains(('application-fix" content="{0}"' -f $productFix))) 'Current product FIX marker is published in website HTML'
Add-Check ($html.Contains('id="mobileMenuToggle"') -and $html.Contains('id="primaryNav"') -and $html.Contains('aria-controls="primaryNav"') -and $html.Contains('aria-expanded="false"')) 'Mobile menu button and navigation have accessible DOM relationships'
Add-Check ($js.Contains('mobileMenuToggle: $(''mobileMenuToggle'')')) 'Mobile menu button is bound in the application element map'
Add-Check ($js.Contains('primaryNav: $(''primaryNav'')') -and $js.Contains("event.key === 'Escape'") -and $js.Contains('setMobileMenuOpen(false, true)')) 'Mobile menu closes with Escape and returns keyboard focus'
Add-Check ($js.Contains('event.target') -and $js.Contains('elements.mobileMenuToggle.contains(event.target)')) 'Mobile menu closes when the user clicks outside the navigation'
Add-Check ($html.Contains('id="reportPublicAck"') -and $html.Contains('type="checkbox" required') -and $html.Contains('aria-live="polite"')) 'Public GitHub issue acknowledgement is required and announced accessibly'
Add-Check ($html.Contains('zgłoszenia GitHub są publiczne') -and $html.Contains('Nie dodawaj haseł') -and $html.Contains('Nie załączaj poufnych plików')) 'Support form prominently warns about public visibility and confidential data'
Add-Check ($js.Contains('!elements.reportPublicAck.checked') -and $js.Contains('access tokens') -and $js.Contains('serial numbers')) 'Support draft is blocked until acknowledgement and repeats the privacy warning'
Add-Check ($js.Contains('new URL(ISSUES_PAGE)') -and $js.Contains('url.searchParams.set') -and $js -notmatch 'fetch\s*\(\s*ISSUES_PAGE') 'Support report remains a user-reviewed GitHub draft and is never auto-submitted'
Add-Check ($html.Contains('prezentacja.mp4') -and $html.Contains('prezentacja.vtt') -and $html.Contains('prezentacja-en.vtt')) 'HTML declares the original video and both subtitle tracks'
Add-Check ((Test-Path -LiteralPath (Join-Path $root 'website/media/prezentacja.mp4')) -and (Test-Path -LiteralPath (Join-Path $root 'website/media/prezentacja.vtt')) -and (Test-Path -LiteralPath (Join-Path $root 'website/media/prezentacja-en.vtt'))) 'Original presentation media and both subtitle files exist in the package'
Add-Check ($js.Contains('video.querySelectorAll(''track[kind="captions"]'')') -and $js.Contains('track.track.mode = selected ? ''showing'' : ''disabled''')) 'Language switch selects the matching caption track without replacing the other track'
Add-Check ($css.Contains('.support-public-warning') -and $css.Contains('.support-ack') -and $css.Contains(':focus-visible')) 'New privacy and keyboard-accessibility elements have dedicated styles'
Add-Check ($html.Contains(('software-version" content="{0}"' -f $productVersion)) -and $js.Contains(("const productVersion = '{0}'" -f $productVersion))) 'Website HTML and release client share the current VERSION.txt value'
$failed = @($checks | Where-Object { -not $_.Passed })
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name) }
}
if ($failed.Count) { Write-Host ('[FAIL] FIX118 website regression: ' + (($failed | ForEach-Object { $_.Name }) -join '; ')); exit 1 }
Write-Host ('[PASS] FIX118 website regression checks: ' + $checks.Count + '/' + $checks.Count)
exit 0
