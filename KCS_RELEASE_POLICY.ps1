$ErrorActionPreference = 'Stop'

function Test-KcsReleaseIndependentChangeSet {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Status,
        [string[]]$ChangedPaths = @(),
        [int]$ReportedPathCount = 0,
        [bool]$AssetsComplete = $false,
        [bool]$TagIsAncestor = $false
    )

    if (-not $AssetsComplete -or -not $TagIsAncestor) { return $false }
    if ($Status -notin @('ahead','identical')) { return $false }
    if ($ReportedPathCount -lt 0 -or $ReportedPathCount -ge 300) { return $false }
    if ($null -eq $ChangedPaths) { $ChangedPaths = @() }
    if ($ChangedPaths.Count -ne $ReportedPathCount) { return $false }
    if ($Status -eq 'ahead' -and $ReportedPathCount -eq 0) { return $false }
    if ($Status -eq 'identical' -and $ReportedPathCount -ne 0) { return $false }

    $safePatterns = @(
        '(?i)^website/',
        '(?i)^\.github/workflows/deploy-pages\.yml$',
        '(?i)^CHECK_[A-Za-z0-9_.-]+\.(ps1|cmd)$',
        '(?i)^CHECK_SOURCE\.cmd$',
        '(?i)^BUILD_INSTALLER_XP\.cmd$',
        '(?i)^(BUILD_ALL|BUILD_INSTALLERS|BUILD_MANAGER)\.cmd$',
        '(?i)^(URUCHOM_TYLKO_TEN_PLIK|KCS_FIX101_WORKER)\.cmd$',
        '(?i)^VALIDATE_FIX100_PACKAGE\.ps1$',
        '(?i)^FIX099_(POWERSHELL_MANIFEST|SOURCE_ALLOWLIST)\.txt$',
        '(?i)^FIX[0-9]+_(RELEASE_NOTES|MODULE_MAP)\.txt$',
        '(?i)^CHANGELOG\.txt$',
        '(?i)^(PUBLISH_GITHUB_SOURCE|PUBLISH_GITHUB_RELEASES|GENERATE_UPDATE_MANIFEST|VERIFY_GLOBAL_UPDATE_SERVER|VERIFY_PUBLIC_DEPLOYMENT)\.ps1$',
        '(?i)^KCS_RELEASE_POLICY\.ps1$',
        '(?i)^INSTALL_PUBLISHED_BUILD\.ps1$',
        '(?i)^README\.md$',
        '(?i)^README(_PORTABLE)?\.txt$',
        '(?i)^GLOBAL_UPDATE_DEPLOYMENT\.txt$',
        '(?i)^UPDATE_MANIFEST_TEMPLATE\.xml$'
    )

    foreach ($changedPath in $ChangedPaths) {
        if ([string]::IsNullOrWhiteSpace($changedPath)) { return $false }
        $normalized = ([string]$changedPath).Replace('\','/').TrimStart('/')
        if ($normalized.Contains('..')) { return $false }
        $safe = $false
        foreach ($pattern in $safePatterns) {
            if ($normalized -match $pattern) { $safe = $true; break }
        }
        if (-not $safe) { return $false }
    }
    return $true
}

function ConvertTo-KcsResponseText {
    [CmdletBinding()]
    param([AllowNull()][object]$Content)

    if ($null -eq $Content) { return '' }
    if ($Content -is [string]) { return $Content }

    # Windows PowerShell 5.1 may expose Invoke-WebRequest.Content as Byte[].
    # StreamReader decodes UTF-8 and honours a UTF-8/UTF-16 BOM when present.
    if ($Content -is [byte[]]) {
        $memory = New-Object System.IO.MemoryStream
        try {
            $bytes = [byte[]]$Content
            if ($bytes.Length -gt 0) { $memory.Write($bytes, 0, $bytes.Length) }
            $memory.Position = 0
            $reader = New-Object System.IO.StreamReader($memory, [System.Text.Encoding]::UTF8, $true)
            try { return $reader.ReadToEnd() }
            finally { $reader.Dispose() }
        }
        finally { $memory.Dispose() }
    }
    if ($Content -is [System.IO.Stream]) {
        $memory = New-Object System.IO.MemoryStream
        try {
            if ($Content.CanSeek) { $Content.Position = 0 }
            $Content.CopyTo($memory)
            $memory.Position = 0
            $reader = New-Object System.IO.StreamReader($memory, [System.Text.Encoding]::UTF8, $true)
            try { return $reader.ReadToEnd() }
            finally { $reader.Dispose() }
        }
        finally { $memory.Dispose() }
    }
    return [string]$Content
}
