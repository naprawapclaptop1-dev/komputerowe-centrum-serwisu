$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$repo = 'naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$markerPath = Join-Path $root 'FIX079_PACKAGE_MARKER.txt'
try {
    if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
        Write-Host '[FAIL] Brak FIX079_PACKAGE_MARKER.txt w katalogu CMD.'
        exit 21
    }

    # Get-Content handles CRLF and LF files; unlike FINDSTR /X it does not depend on Windows line endings.
    $markerLines = @(Get-Content -LiteralPath $markerPath -ErrorAction Stop)
    if ($markerLines -notcontains 'PACKAGE=FIX079') {
        Write-Host '[FAIL] Marker nie zawiera dokładnej wartości PACKAGE=FIX079.'
        exit 22
    }
    if ($markerLines -notcontains ('REPOSITORY=' + $repo)) {
        Write-Host '[FAIL] Marker wskazuje inne repozytorium niż przypisane do tego programu.'
        exit 23
    }
    if ($markerLines -notcontains 'ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd') {
        Write-Host '[FAIL] Marker nie wskazuje wymaganego głównego CMD.'
        exit 24
    }

    $required = @(
        'URUCHOM_TYLKO_TEN_PLIK.cmd',
        'BOOTSTRAP_BUILD_TOOLS.ps1',
        'PUBLISH_GITHUB_SOURCE.ps1',
        'BUILD_ALL.cmd',
        'PUBLISH_GITHUB_RELEASES.ps1',
        'VERIFY_PUBLIC_DEPLOYMENT.ps1',
        'INSTALL_PUBLISHED_BUILD.ps1',
        'VERIFY_GLOBAL_UPDATE_SERVER.ps1',
        'CHECK_SOURCE.cmd',
        'CHANGELOG.txt',
        'VERSION.txt',
        'website\index.html',
        'website\styles.css',
        'website\app.js',
        'website\sitemap.xml',
        '.github\workflows\deploy-pages.yml'
    )
    $missing = @()
    foreach ($relative in $required) {
        $full = Join-Path $root $relative
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { $missing += $relative }
        elseif ((Get-Item -LiteralPath $full).Length -le 0) { $missing += ($relative + ' (pusty plik)') }
    }
    if ($missing.Count -gt 0) {
        Write-Host '[FAIL] Pakiet jest niekompletny. Brakujące pliki:'
        $missing | ForEach-Object { Write-Host ('  - ' + $_) }
        exit 25
    }

    Write-Host '[PASS] Pakiet FIX079 kompletny.'
    Write-Host ('[PASS] Katalog: ' + $root)
    Write-Host ('[PASS] Repozytorium: ' + $repo)
    Write-Host '[PASS] Wszystkie wymagane pliki obecne i niepuste.'
    exit 0
}
catch {
    Write-Host ('[FAIL] Walidacja pakietu FIX079: ' + $_.Exception.Message)
    exit 26
}
