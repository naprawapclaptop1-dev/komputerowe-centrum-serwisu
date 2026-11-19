[CmdletBinding()]
param(
    [string]$Root,
    [switch]$SelfTest
)
$ErrorActionPreference = 'Stop'

# Resolve the default only after PowerShell has completed parameter binding.
# Automatic script variables are read after parameter binding, not from a param default.
# Resolve the final directory through the PowerShell filesystem provider.
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = $PSScriptRoot
}
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Get-Location).ProviderPath
}

$script:RequiredOutputs = @(
    @{ Rel = 'dist/portable/KomputeroweCentrumSerwisu_FIX070_PORTABLE.exe'; Label = 'PORTABLE EXE' },
    @{ Rel = 'dist/setup-files/KomputeroweCentrumSerwisu.exe'; Label = 'COMMON INSTALLER PAYLOAD' },
    @{ Rel = 'dist/setup-files/BUILD_ID.txt'; Label = 'STAGING BUILD ID' },
    @{ Rel = 'dist/portable/BUILD_ID.txt'; Label = 'PORTABLE BUILD ID' },
    @{ Rel = 'dist/portable/portable.mode'; Label = 'PORTABLE MODE FLAG' },
    @{ Rel = 'dist/portable/NaprawaPC.ico'; Label = 'PORTABLE ICON' },
    @{ Rel = 'dist/portable/CentrumMigracjiHero.png'; Label = 'PORTABLE HERO ART' },
    @{ Rel = 'dist/setup-files/CentrumMigracjiHero.png'; Label = 'INSTALLER HERO ART' },
    @{ Rel = 'NaprawaPC.ico'; Label = 'SOURCE ICON' },
    @{ Rel = 'CentrumMigracjiHero.png'; Label = 'SOURCE HERO ART' },
    @{ Rel = 'dist/setup-files/README.txt'; Label = 'STAGED README' },
    @{ Rel = 'dist/setup-files/CHANGELOG.txt'; Label = 'STAGED CHANGELOG' },
    @{ Rel = 'dist/installers/KomputeroweCentrumSerwisu_FIX070_INSTALATOR.exe'; Label = 'MODERN SETUP EXE' },
    @{ Rel = 'dist/installers/SETUP_BUILD_ID.txt'; Label = 'MODERN SETUP BUILD ID' }
)

function Write-ReportLine {
    param([string]$LogPath, [string]$Message)
    Write-Host $Message
    Add-Content -LiteralPath $LogPath -Value $Message -Encoding UTF8
}

function Quote-ProcessArgument {
    param([string]$Value)
    # The current package paths do not contain literal quote characters. Quoting
    # every argument protects spaces and parentheses in paths such as "Nowy folder (7)".
    return '"' + $Value.Replace('"', '\"') + '"'
}

function Invoke-PayloadVerification {
    param(
        [string]$RootPath,
        [string]$LogPath,
        [string]$ExePath,
        [string]$StampPath,
        [string]$Label
    )
    $verifier = Join-Path $RootPath 'VERIFY_PAYLOAD.ps1'
    if (-not (Test-Path -LiteralPath $verifier -PathType Leaf)) {
        Write-ReportLine $LogPath ("[FAIL] {0}: missing VERIFY_PAYLOAD.ps1" -f $Label)
        return $false
    }
    $psExe = Join-Path $PSHOME 'powershell.exe'
    if (-not (Test-Path -LiteralPath $psExe -PathType Leaf)) {
        Write-ReportLine $LogPath ("[FAIL] {0}: Windows PowerShell executable not found: {1}" -f $Label,$psExe)
        return $false
    }
    $values = @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $verifier,
        '-ExePath', $ExePath, '-ExpectedVersion', '1.0.0.70',
        '-StampPath', $StampPath, '-SourceRoot', $RootPath, '-CheckStamp'
    )
    $quoted = @($values | ForEach-Object { Quote-ProcessArgument ([string]$_) })
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $psExe
    $psi.Arguments = ($quoted -join ' ')
    $psi.WorkingDirectory = $RootPath
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    try {
        if (-not $process.Start()) {
            Write-ReportLine $LogPath ("[FAIL] {0}: could not start verifier process" -f $Label)
            return $false
        }
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if (-not [string]::IsNullOrWhiteSpace($stdout)) {
            foreach ($line in ($stdout -split '\r?\n')) {
                if (-not [string]::IsNullOrWhiteSpace($line)) { Write-ReportLine $LogPath $line }
            }
        }
        if (-not [string]::IsNullOrWhiteSpace($stderr)) {
            foreach ($line in ($stderr -split '\r?\n')) {
                if (-not [string]::IsNullOrWhiteSpace($line)) { Write-ReportLine $LogPath ("[STDERR] " + $line) }
            }
        }
        if ($process.ExitCode -ne 0) {
            Write-ReportLine $LogPath ("[FAIL] {0}: VERIFY_PAYLOAD exit code {1}" -f $Label,$process.ExitCode)
            return $false
        }
        Write-ReportLine $LogPath ("[PASS] {0}: version, SHA-256 and source identity verified" -f $Label)
        return $true
    }
    catch {
        Write-ReportLine $LogPath ("[FAIL] {0}: verifier process error: {1}" -f $Label,$_.Exception.Message)
        return $false
    }
    finally {
        $process.Dispose()
    }
}

function Invoke-BuildVerification {
    param(
        [string]$RootPath,
        [string]$LogPath,
        [switch]$SkipPayloadValidation
    )
    $failed = $false
    $dist = Join-Path $RootPath 'dist'
    $logDir = Join-Path $dist 'build-logs'
    if (-not (Test-Path -LiteralPath $logDir -PathType Container)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    if (Test-Path -LiteralPath $LogPath -PathType Leaf) {
        Remove-Item -LiteralPath $LogPath -Force
    }
    Write-ReportLine $LogPath 'KOMPUTEROWE CENTRUM SERWISU FIX070 - RAPORT WERYFIKACJI FIX115'
    Write-ReportLine $LogPath ("Date: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
    Write-ReportLine $LogPath ("Root: {0}" -f $RootPath)
    Write-ReportLine $LogPath '--- REQUIRED OUTPUT FILES ---'

    foreach ($item in $script:RequiredOutputs) {
        $path = Join-Path $RootPath ($item.Rel.Replace('/', [IO.Path]::DirectorySeparatorChar))
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            Write-ReportLine $LogPath ("[FAIL] {0} missing: {1}" -f $item.Label,$path)
            $failed = $true
            continue
        }
        $file = Get-Item -LiteralPath $path -Force
        if ($file.Length -le 0) {
            Write-ReportLine $LogPath ("[FAIL] {0} empty: {1}" -f $item.Label,$path)
            $failed = $true
            continue
        }
        Write-ReportLine $LogPath ("[PASS] {0} - {1} bytes" -f $item.Label,$file.Length)
    }

    $xpSetup = Join-Path $dist 'installers/KomputeroweCentrumSerwisu_FIX070_INSTALATOR_XP.exe'
    if (Test-Path -LiteralPath $xpSetup -PathType Leaf) {
        $xpFile = Get-Item -LiteralPath $xpSetup -Force
        if ($xpFile.Length -gt 0) { Write-ReportLine $LogPath ("[PASS] OPTIONAL XP SETUP EXE - {0} bytes" -f $xpFile.Length) }
        else { Write-ReportLine $LogPath '[WARN] Optional XP Setup exists but is empty; it does not block the required release outputs.' }
    }
    else {
        Write-ReportLine $LogPath '[SKIP] XP installer is optional and was not built.'
    }

    if (-not $SkipPayloadValidation -and -not $failed) {
        Write-ReportLine $LogPath '--- BUILD ID / FILEVERSION / SHA-256 / SOURCE IDENTITY ---'
        $payloadChecks = @(
            @{ Label='STAGING EXE'; Exe='dist/setup-files/KomputeroweCentrumSerwisu.exe'; Stamp='dist/setup-files/BUILD_ID.txt' },
            @{ Label='PORTABLE EXE'; Exe='dist/portable/KomputeroweCentrumSerwisu_FIX070_PORTABLE.exe'; Stamp='dist/portable/BUILD_ID.txt' },
            @{ Label='MODERN INSTALLER'; Exe='dist/installers/KomputeroweCentrumSerwisu_FIX070_INSTALATOR.exe'; Stamp='dist/installers/SETUP_BUILD_ID.txt' }
        )
        foreach ($check in $payloadChecks) {
            $exe = Join-Path $RootPath ($check.Exe.Replace('/', [IO.Path]::DirectorySeparatorChar))
            $stamp = Join-Path $RootPath ($check.Stamp.Replace('/', [IO.Path]::DirectorySeparatorChar))
            if (-not (Invoke-PayloadVerification -RootPath $RootPath -LogPath $LogPath -ExePath $exe -StampPath $stamp -Label $check.Label)) {
                $failed = $true
            }
        }
    }
    elseif ($SkipPayloadValidation) {
        Write-ReportLine $LogPath '[INFO] Payload verifier execution skipped only for FIX112 self-test.'
    }
    elseif ($failed) {
        Write-ReportLine $LogPath '[BLOCKED] Payload checks were not run because required output files are missing or empty.'
    }

    foreach ($statusName in @('PORTABLE.status','MODERN_INSTALLER.status','XP_INSTALLER.status')) {
        $statusPath = Join-Path $logDir $statusName
        if (Test-Path -LiteralPath $statusPath -PathType Leaf) {
            $statusText = ((Get-Content -LiteralPath $statusPath -ErrorAction SilentlyContinue) -join ' ').Trim()
            Write-ReportLine $LogPath ("[INFO] {0}: {1}" -f $statusName,$statusText)
        }
    }

    if ($failed) {
        Write-ReportLine $LogPath '[FAIL] FIX070 output verification failed. Review the preceding [FAIL] lines.'
        return 1
    }
    Write-ReportLine $LogPath '[PASS] FIX070 required outputs and payload provenance verified.'
    return 0
}

function Invoke-Fix112SelfTest {
    # Exercise the exact script-root resolution used by a no-argument CMD launch.
    $scriptRootItem = Get-Item -LiteralPath $Root -Force -ErrorAction Stop
    if (-not $scriptRootItem.PSIsContainer) { throw 'FIX115 script root is not a directory.' }
    Write-Host ('[PASS] FIX115 script root resolved: ' + $scriptRootItem.FullName)
    $tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('KCS_FIX112_SELFTEST_' + [Guid]::NewGuid().ToString('N'))
    $logDir = Join-Path $tempRoot 'dist/build-logs'
    $log = Join-Path $logDir '04-verification.log'
    try {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        foreach ($item in $script:RequiredOutputs) {
            $path = Join-Path $tempRoot ($item.Rel.Replace('/', [IO.Path]::DirectorySeparatorChar))
            $parent = Split-Path -Parent $path
            if (-not (Test-Path -LiteralPath $parent -PathType Container)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
            [IO.File]::WriteAllText($path, 'FIX112 TEST FILE')
        }
        $passCode = Invoke-BuildVerification -RootPath $tempRoot -LogPath $log -SkipPayloadValidation
        if ($passCode -ne 0) { throw 'Valid fixture was not accepted.' }
        $missing = Join-Path $tempRoot 'dist/portable/KomputeroweCentrumSerwisu_FIX070_PORTABLE.exe'
        Remove-Item -LiteralPath $missing -Force
        $failCode = Invoke-BuildVerification -RootPath $tempRoot -LogPath $log -SkipPayloadValidation
        if ($failCode -eq 0) { throw 'Missing required output was incorrectly accepted.' }
        Write-Host '[PASS] FIX112 self-test: valid outputs pass; missing required Portable EXE fails.'
        return 0
    }
    catch {
        Write-Host ('[FAIL] FIX112 self-test: ' + $_.Exception.Message)
        return 1
    }
    finally {
        if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

if ($SelfTest) {
    $selfTestResult = Invoke-Fix112SelfTest
    exit $selfTestResult
}

try {
    if ([string]::IsNullOrWhiteSpace($Root)) {
        throw 'Package root could not be determined from the verifier script or current directory.'
    }
    # Get-Item resolves a filesystem path through the PowerShell provider and
    # returns the canonical FullName. Avoid the .NET path-normalization call, which
    # raised an invalid-format exception in the user's Windows PowerShell 5.1 run.
    $rootItem = Get-Item -LiteralPath $Root -Force -ErrorAction Stop
    if (-not $rootItem.PSIsContainer) { throw ("Package root is not a directory: {0}" -f $Root) }
    $resolvedRoot = $rootItem.FullName
    $resolvedLog = Join-Path $resolvedRoot 'dist/build-logs/04-verification.log'
    $result = Invoke-BuildVerification -RootPath $resolvedRoot -LogPath $resolvedLog
    exit $result
}
catch {
    $rootText = if ($null -eq $Root) { '<null>' } else { [string]$Root }
    $rootLength = 0
    if ($null -ne $Root) { $rootLength = $rootText.Length }
    Write-Host ('[FAIL] FIX115 verification runner: ' + $_.Exception.Message)
    Write-Host ('[DIAG] Root=[' + $rootText + '] Length=' + $rootLength)
    Write-Host ('[DIAG] ScriptRoot=[' + $PSScriptRoot + '] CurrentDirectory=[' + (Get-Location).Path + ']')
    exit 2
}
