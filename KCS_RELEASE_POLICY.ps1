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
        '(?i)^VALIDATE_FIX100_PACKAGE\.ps1$',
        '(?i)^FIX099_(POWERSHELL_MANIFEST|SOURCE_ALLOWLIST)\.txt$',
        '(?i)^FIX[0-9]+_(RELEASE_NOTES|MODULE_MAP)\.txt$',
        '(?i)^CHANGELOG\.txt$',
        '(?i)^(PUBLISH_GITHUB_SOURCE|PUBLISH_GITHUB_RELEASES|VERIFY_GLOBAL_UPDATE_SERVER)\.ps1$',
        '(?i)^KCS_RELEASE_POLICY\.ps1$',
        '(?i)^README\.md$'
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
    if ($Content -is [byte[]]) {
        return [System.Text.Encoding]::UTF8.GetString($Content)
    }
    if ($Content -is [System.IO.Stream]) {
        $memory = New-Object System.IO.MemoryStream
        try {
            if ($Content.CanSeek) { $Content.Position = 0 }
            $Content.CopyTo($memory)
            return [System.Text.Encoding]::UTF8.GetString($memory.ToArray())
        }
        finally { $memory.Dispose() }
    }
    return [string]$Content
}
