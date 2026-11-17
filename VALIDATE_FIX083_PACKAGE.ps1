$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$repo = 'naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$markerPath = Join-Path $root 'FIX083_PACKAGE_MARKER.txt'
$manifestPath = Join-Path $root 'FIX083_POWERSHELL_MANIFEST.txt'
try {
    if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
        Write-Host '[FAIL] Missing FIX083_PACKAGE_MARKER.txt beside the launcher.'
        exit 21
    }

    $markerLines = @(Get-Content -LiteralPath $markerPath -ErrorAction Stop)
    if ($markerLines -notcontains 'PACKAGE=FIX083') {
        Write-Host '[FAIL] Marker package identity is not FIX083.'
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
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        Write-Host '[FAIL] Missing FIX083_POWERSHELL_MANIFEST.txt.'
        exit 25
    }

    $required = @(
        'URUCHOM_TYLKO_TEN_PLIK.cmd',
        'FIX083_PACKAGE_MARKER.txt',
        'FIX083_POWERSHELL_MANIFEST.txt',
        'VALIDATE_FIX083_PACKAGE.ps1',
        'CHECK_FIX083_PACKAGE_VALIDATION.ps1',
        'CHECK_FIX083_INTERPOLATION.ps1',
        'CHECK_FIX083_NATIVE_PROCESS.ps1',
        'BOOTSTRAP_BUILD_TOOLS.ps1',
        'BUILD_ALL.cmd',
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
        exit 26
    }

    # IMPORTANT: Do not recursively scan the destination directory.
    # Users may extract a new ZIP over an older FIX057/FIX080 folder, leaving unrelated
    # legacy .ps1 files behind. Only files explicitly listed in this ZIP's manifest
    # are part of FIX083 and must pass BOM, SHA-256 and parser checks.
    $entries = @(Get-Content -LiteralPath $manifestPath -ErrorAction Stop | Where-Object { $_ -and -not $_.StartsWith('#') })
    if ($entries.Count -lt 1) {
        Write-Host '[FAIL] PowerShell package manifest is empty.'
        exit 27
    }

    $seen = @{}
    $parseFailures = @()
    $integrityFailures = @()
    foreach ($entry in $entries) {
        $parts = $entry.Split('|', 2)
        if ($parts.Count -ne 2 -or $parts[0] -notmatch '^[A-Fa-f0-9]{64}$') {
            $integrityFailures += ('Invalid manifest row: ' + $entry)
            continue
        }
        $expectedHash = $parts[0].ToUpperInvariant()
        $relative = $parts[1].Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        if ([System.IO.Path]::IsPathRooted($relative) -or $relative.Contains('..')) {
            $integrityFailures += ('Unsafe manifest path: ' + $relative)
            continue
        }
        $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
        $prefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
        if (-not $full.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            $integrityFailures += ('Manifest path escapes package folder: ' + $relative)
            continue
        }
        if ($seen.ContainsKey($relative.ToLowerInvariant())) {
            $integrityFailures += ('Duplicate manifest path: ' + $relative)
            continue
        }
        $seen[$relative.ToLowerInvariant()] = $true
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
            $integrityFailures += ('Missing packaged PowerShell file: ' + $relative)
            continue
        }

        $bytes = [System.IO.File]::ReadAllBytes($full)
        if ($bytes.Length -lt 3 -or $bytes[0] -ne 239 -or $bytes[1] -ne 187 -or $bytes[2] -ne 191) {
            $integrityFailures += ('Missing UTF-8 BOM: ' + $relative)
            continue
        }
        $actualHash = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToUpperInvariant()
        if ($actualHash -ne $expectedHash) {
            $integrityFailures += ('SHA-256 mismatch: ' + $relative)
            continue
        }

        $tokens = $null
        $parseErrors = $null
        [System.Management.Automation.Language.Parser]::ParseFile($full, [ref]$tokens, [ref]$parseErrors) | Out-Null
        if ($parseErrors -and $parseErrors.Count -gt 0) {
            foreach ($parseError in $parseErrors) {
                $parseFailures += ($relative + ':' + $parseError.Extent.StartLineNumber + ': ' + $parseError.Message)
            }
        }
    }

    if ($integrityFailures.Count -gt 0) {
        Write-Host '[FAIL] FIX083 packaged script integrity checks failed:'
        $integrityFailures | ForEach-Object { Write-Host ('  - ' + $_) }
        exit 28
    }
    if ($parseFailures.Count -gt 0) {
        Write-Host '[FAIL] PowerShell parser found syntax errors in FIX083 packaged scripts:'
        $parseFailures | ForEach-Object { Write-Host ('  - ' + $_) }
        exit 29
    }

    Write-Host '[PASS] Package FIX083 complete.'
    Write-Host ('[PASS] Folder: ' + $root)
    Write-Host ('[PASS] Repository: ' + $repo)
    Write-Host ('[PASS] Required files present and non-empty: ' + $required.Count)
    Write-Host ('[PASS] Packaged PowerShell scripts BOM + SHA-256 + parser: ' + $entries.Count)
    Write-Host '[INFO] Unlisted legacy PowerShell files in the destination folder are ignored; they are not part of FIX083.'
    exit 0
}
catch {
    Write-Host ('[FAIL] FIX083 package validation: ' + $_.Exception.Message)
    exit 30
}
