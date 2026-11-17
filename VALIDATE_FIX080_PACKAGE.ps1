$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$repo = 'naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$markerPath = Join-Path $root 'FIX080_PACKAGE_MARKER.txt'
try {
    if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
        Write-Host '[FAIL] Missing FIX080_PACKAGE_MARKER.txt beside the launcher.'
        exit 21
    }

    $markerLines = @(Get-Content -LiteralPath $markerPath -ErrorAction Stop)
    if ($markerLines -notcontains 'PACKAGE=FIX080') {
        Write-Host '[FAIL] Marker package identity is not FIX080.'
        exit 22
    }
    if ($markerLines -notcontains ('REPOSITORY=' + $repo)) {
        Write-Host '[FAIL] Marker repository does not match the assigned repository.'
        exit 23
    }
    if ($markerLines -notcontains 'ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd') {
        Write-Host '[FAIL] Marker entry point does not match the single CMD launcher.'
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
        'CHECK_FIX080_PACKAGE_VALIDATION.ps1',
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
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
            $missing += $relative
        }
        elseif ((Get-Item -LiteralPath $full).Length -le 0) {
            $missing += ($relative + ' (empty file)')
        }
    }
    if ($missing.Count -gt 0) {
        Write-Host '[FAIL] Package is incomplete. Missing files:'
        $missing | ForEach-Object { Write-Host ('  - ' + $_) }
        exit 25
    }

    # Windows PowerShell 5.1 reads UTF-8 reliably when a BOM is present.
    # Validate every packaged PS1 and parse it before starting any publishing step.
    $psFiles = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.ps1' -ErrorAction Stop)
    $encodingFailures = @()
    $parseFailures = @()
    foreach ($file in $psFiles) {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191)
        if (-not $hasBom) {
            $encodingFailures += $file.FullName
            continue
        }
        $tokens = $null
        $parseErrors = $null
        [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$parseErrors) | Out-Null
        if ($parseErrors -and $parseErrors.Count -gt 0) {
            foreach ($parseError in $parseErrors) {
                $parseFailures += ($file.FullName + ':' + $parseError.Extent.StartLineNumber + ': ' + $parseError.Message)
            }
        }
    }
    if ($encodingFailures.Count -gt 0) {
        Write-Host '[FAIL] PowerShell files without UTF-8 BOM (not safe for Windows PowerShell 5.1):'
        $encodingFailures | ForEach-Object { Write-Host ('  - ' + $_) }
        exit 27
    }
    if ($parseFailures.Count -gt 0) {
        Write-Host '[FAIL] PowerShell parser found syntax errors before startup:'
        $parseFailures | ForEach-Object { Write-Host ('  - ' + $_) }
        exit 28
    }

    Write-Host '[PASS] Package FIX080 complete.'
    Write-Host ('[PASS] Folder: ' + $root)
    Write-Host ('[PASS] Repository: ' + $repo)
    Write-Host ('[PASS] Required files present and non-empty: ' + $required.Count)
    Write-Host ('[PASS] PowerShell files UTF-8 BOM and parser validation: ' + $psFiles.Count)
    exit 0
}
catch {
    Write-Host ('[FAIL] FIX080 package validation: ' + $_.Exception.Message)
    exit 26
}
