$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$verifier = Join-Path $root 'VERIFY_BUILD.ps1'
$wrapper = Join-Path $root 'VERIFY_BUILD.cmd'
$checks = @()
function Quote-ProcessArgument { param([string]$Value) return '"' + $Value.Replace('"','\"') + '"' }
foreach ($path in @($verifier,$wrapper)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw ("Missing FIX112 verifier file: {0}" -f $path) }
}
foreach ($path in @($verifier)) {
    $tokens = $null; $errors = $null
    [System.Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors) | Out-Null
    if ($errors.Count -gt 0) { throw ("PowerShell parser errors in {0}: {1}" -f $path,(($errors | ForEach-Object { $_.Message }) -join '; ')) }
    $checks += 'VERIFY_BUILD.ps1 parses without PowerShell syntax errors'
}
$source = Get-Content -LiteralPath $verifier -Raw
foreach ($required in @('dist/portable/KomputeroweCentrumSerwisu_FIX070_PORTABLE.exe','dist/setup-files/KomputeroweCentrumSerwisu.exe','dist/setup-files/BUILD_ID.txt','dist/portable/BUILD_ID.txt','dist/portable/portable.mode','dist/installers/KomputeroweCentrumSerwisu_FIX070_INSTALATOR.exe','dist/installers/SETUP_BUILD_ID.txt')) {
    if (-not $source.Contains($required)) { throw ("Verifier is missing required output check: {0}" -f $required) }
}
$checks += 'All required EXE, BUILD_ID and portable marker checks are present'
if (-not ($source.Contains('VERIFY_PAYLOAD.ps1') -and $source.Contains('ExpectedVersion') -and $source.Contains('CheckStamp') -and $source.Contains('SourceRoot'))) {
    throw 'Verifier no longer checks FileVersion, BUILD_ID SHA-256 and source identity.'
}
$checks += 'FileVersion, BUILD_ID SHA-256 and source identity verification remain enabled'
if (-not ($source.Contains('[SKIP] XP installer is optional') -and $source.Contains('MODERN INSTALLER'))) {
    throw 'Optional XP or required modern installer handling is missing.'
}
$checks += 'XP remains optional and modern installer remains required'
$wrapperText = Get-Content -LiteralPath $wrapper -Raw
if (-not ($wrapperText.Contains('VERIFY_BUILD.ps1') -and $wrapperText.Contains('set "RC=%ERRORLEVEL%"') -and $wrapperText.Contains('exit /b %RC%'))) {
    throw 'CMD wrapper does not invoke PowerShell verifier and propagate its exit code.'
}
$checks += 'CMD wrapper invokes the verifier and propagates its real exit code'
$psExe = Join-Path $PSHOME 'powershell.exe'
$proc = Start-Process -FilePath $psExe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',(Quote-ProcessArgument $verifier),'-SelfTest') -Wait -PassThru -NoNewWindow
if ($proc.ExitCode -ne 0) { throw ("FIX112 verifier self-test failed with exit code {0}." -f $proc.ExitCode) }
$checks += 'Verifier self-test: valid fixture passes; missing required output fails'
foreach ($item in $checks) { Write-Host ('[PASS] ' + $item) }
Write-Host ("[PASS] FIX112 verification regression checks: {0}/{0}" -f $checks.Count)
exit 0

