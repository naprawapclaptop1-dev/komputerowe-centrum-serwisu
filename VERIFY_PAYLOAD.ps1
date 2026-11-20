[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$ExePath,
    [string]$ExpectedVersion = "1.0.0.74",
    [string]$ExpectedFix = "FIX139",
    [string]$StampPath = "",
    [string]$SourceRoot = "",
    [switch]$CreateStamp,
    [switch]$CheckStamp
)
$ErrorActionPreference = "Stop"

function Resolve-VerifiedPath {
    param([string]$Value,[string]$Label)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw ("{0}_EMPTY: path argument was empty" -f $Label)
    }
    $candidate = $Value.Trim()
    # Remove only accidental wrapper quotes; never strip normal path characters.
    if ($candidate.Length -ge 2 -and $candidate[0] -eq '"' -and $candidate[$candidate.Length-1] -eq '"') {
        $candidate = $candidate.Substring(1,$candidate.Length-2)
    }
    if ([string]::IsNullOrWhiteSpace($candidate)) {
        throw ("{0}_EMPTY: path argument contained only whitespace/quotes" -f $Label)
    }
    try {
        return [IO.Path]::GetFullPath($candidate)
    }
    catch {
        throw ("INVALID_{0}_PATH: [{1}] - {2}" -f $Label,$candidate,$_.Exception.Message)
    }
}

$full = Resolve-VerifiedPath -Value $ExePath -Label "EXE"
if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw "EXE_NOT_FOUND: $full" }
$info = [Diagnostics.FileVersionInfo]::GetVersionInfo($full)
# Windows PE version resources may expose fixed-width string values with trailing spaces.
# Compare the normalized FileVersion, but retain the raw value for diagnostics.
$rawFileVersion = [string]$info.FileVersion
$actualFileVersion = $rawFileVersion.Trim()
$expectedFileVersion = ([string]$ExpectedVersion).Trim()
if ([string]::IsNullOrWhiteSpace($actualFileVersion)) {
    throw ("FILEVERSION_EMPTY: EXE has no usable FileVersion resource ({0}); raw value was [{1}]" -f $full,$rawFileVersion)
}
$versionMatches = $false
try {
    $actualVersionObject = [version]$actualFileVersion
    $expectedVersionObject = [version]$expectedFileVersion
    $versionMatches = $actualVersionObject.Equals($expectedVersionObject)
}
catch {
    $versionMatches = [string]::Equals($actualFileVersion,$expectedFileVersion,[StringComparison]::OrdinalIgnoreCase)
}
if (-not $versionMatches) {
    throw ("STALE_OR_WRONG_EXE: expected normalized FileVersion [{0}], got raw [{1}] and normalized [{2}] ({3})" -f $expectedFileVersion,$rawFileVersion,$actualFileVersion,$full)
}

$sha = New-Object System.Security.Cryptography.SHA256Managed
$stream = [IO.File]::OpenRead($full)
try { $hash = ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace("-","").ToLowerInvariant() }
finally { $stream.Dispose(); $sha.Dispose() }

$sourceHash = ""
$root = ""
if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
    $root = Resolve-VerifiedPath -Value $SourceRoot -Label "SOURCE_ROOT"
    if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "SOURCE_ROOT_NOT_FOUND: $root" }
    $sourceFiles = @("WindowsVersionSwitcherPRO.cs","WindowsVersionSwitcherPRO.Modules.cs","AssemblyInfo.cs","app.manifest","NaprawaPC.ico","CentrumMigracjiHero.png","SETUP_MODERN.iss","SETUP_LEGACY_XP.iss","InstallerWizard.bmp","InstallerSmall.bmp","VERIFY_PAYLOAD.ps1","CHECK_FIX069_REGRESSION.ps1","CHECK_FIX123_INSTALLER_INITIALIZATION.ps1","CHECK_FIX130_DIAGNOSTICS_MONITORING.ps1","FIX130_RELEASE_NOTES.txt","FIX130_MODULE_MAP.txt","BUILD_PORTABLE.cmd","BUILD_INSTALLER_MODERN.cmd","BUILD_INSTALLER_XP.cmd","VERIFY_BUILD.cmd","CHECK_SOURCE.cmd","README.txt","README_PORTABLE.txt","CHANGELOG.txt","VERSION.txt","FIX123_RELEASE_NOTES.txt","FIX123_MODULE_MAP.txt","WYTYCZNE_WYGLADU.txt","WindowsVersionSwitcherPRO_LegacyFallback.ps1","LegacyMode.hta","UPDATE_MANIFEST_TEMPLATE.xml","GLOBAL_UPDATE_DEPLOYMENT.txt","GENERATE_UPDATE_MANIFEST.ps1","VERIFY_GLOBAL_UPDATE_SERVER.ps1","PUBLISH_GITHUB_RELEASES.ps1","PUBLISH_GITHUB_SOURCE.ps1","BOOTSTRAP_BUILD_TOOLS.ps1","INSTALL_PUBLISHED_BUILD.ps1","CHECK_FIX072_UPDATE_ENDPOINTS.ps1","GITHUB_REPOSITORY.txt.template","URUCHOM_TYLKO_TEN_PLIK.cmd","KCS_FIX101_WORKER.cmd","BUILD_ALL.cmd","BUILD_MANAGER.cmd","BUILD_INSTALLERS.cmd","GLOBAL_UPDATE_DEPLOYMENT.txt","CHECK_FIX072_REPOSITORY_INPUT.ps1","CHECK_FIX136_SOURCE_BUILD_IDENTITY.ps1","FIX136_RELEASE_NOTES.txt","FIX136_MODULE_MAP.txt","CHECK_FIX137_SERVICE_PRO.ps1","FIX137_RELEASE_NOTES.txt","FIX137_MODULE_MAP.txt","CHECK_FIX139_APPOINTMENTS.ps1","FIX139_RELEASE_NOTES.txt","FIX139_MODULE_MAP.txt","FIX072_RELEASE_NOTES.txt","FIX072_MODULE_MAP.txt","CHECK_FIX108_RELEASE_PUBLISHING.ps1","FIX108_RELEASE_NOTES.txt","FIX108_MODULE_MAP.txt","VERIFY_BUILD.ps1","CHECK_FIX112_VERIFICATION.ps1","FIX112_RELEASE_NOTES.txt","FIX112_MODULE_MAP.txt")
    $sourceSha = New-Object System.Security.Cryptography.SHA256Managed
    $memory = New-Object IO.MemoryStream
    try {
        foreach ($relative in $sourceFiles) {
            $path = Join-Path $root $relative
            if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "SOURCE_FILE_MISSING: $relative (root: $root)" }
            $nameBytes = [Text.Encoding]::UTF8.GetBytes($relative)
            $fileBytes = [IO.File]::ReadAllBytes($path)
            $memory.Write($nameBytes,0,$nameBytes.Length)
            $zero = [byte[]](0)
            $memory.Write($zero,0,1)
            $memory.Write($fileBytes,0,$fileBytes.Length)
            $memory.Write($zero,0,1)
        }
        $memory.Position = 0
        $sourceHash = ([BitConverter]::ToString($sourceSha.ComputeHash($memory))).Replace("-","").ToLowerInvariant()
    }
    finally { $memory.Dispose(); $sourceSha.Dispose() }
}

if ([string]::IsNullOrWhiteSpace($StampPath)) { $StampPath = $full + ".buildinfo" }
$stampFull = Resolve-VerifiedPath -Value $StampPath -Label "STAMP"

if ($CreateStamp) {
    if ([string]::IsNullOrWhiteSpace($sourceHash)) { throw "SOURCE_ROOT_REQUIRED_FOR_STAMP" }
    $stampDir = [IO.Path]::GetDirectoryName($stampFull)
    if (-not [string]::IsNullOrWhiteSpace($stampDir) -and -not (Test-Path -LiteralPath $stampDir -PathType Container)) {
        New-Item -ItemType Directory -Force -Path $stampDir | Out-Null
    }
    $lines = @("FIX=$ExpectedFix", "FILEVERSION=$ExpectedVersion", "SHA256=$hash", "SOURCE_SHA256=$sourceHash", "EXE=$ExpectedFix verified application payload", "UTC=$([DateTime]::UtcNow.ToString('o'))")
    [IO.File]::WriteAllLines($stampFull, $lines, [Text.Encoding]::ASCII)
    Write-Output ("[PASS] Fresh payload {0} | FileVersion {1} | SHA256 {2} | SourceSHA256 {3}" -f $full,$actualFileVersion,$hash,$sourceHash)
    exit 0
}

if ($CheckStamp) {
    if (-not (Test-Path -LiteralPath $stampFull -PathType Leaf)) { throw "BUILD_STAMP_MISSING: $stampFull" }
    $map = @{}
    foreach ($line in [IO.File]::ReadAllLines($stampFull)) {
        $pos = $line.IndexOf("=")
        if ($pos -gt 0) { $map[$line.Substring(0,$pos)] = $line.Substring($pos+1) }
    }
    if ($map["FIX"] -ne $ExpectedFix) { throw "BUILD_STAMP_FIX_MISMATCH: $($map['FIX'])" }
    if ($map["FILEVERSION"] -ne $ExpectedVersion) { throw "BUILD_STAMP_VERSION_MISMATCH: $($map['FILEVERSION'])" }
    if ($map["SHA256"] -ne $hash) { throw "BUILD_STAMP_HASH_MISMATCH: payload EXE does not match the verified build stamp" }
    if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
        if ([string]::IsNullOrWhiteSpace($sourceHash)) { throw "SOURCE_HASH_UNAVAILABLE" }
        if ($map["SOURCE_SHA256"] -ne $sourceHash) { throw "BUILD_STAMP_SOURCE_MISMATCH: source changed after the EXE was compiled; rebuild Portable first" }
    }
    Write-Output ("[PASS] Provenance verified: {0} | FIX={1} | FileVersion={2} | SHA256={3}" -f $full,$map['FIX'],$actualFileVersion,$hash)
    exit 0
}
Write-Output ("[PASS] EXE version verified: {0} | {1}" -f $full,$actualFileVersion)
