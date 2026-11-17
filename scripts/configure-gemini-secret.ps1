[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$NodeExe,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$NodeScript = Join-Path $PSScriptRoot 'configure-gemini-secret.js'
$KeyUrl = 'https://aistudio.google.com/api-keys'
$ExitCode = 0
$SecureValue = $null
$PlainValue = $null
$Bstr = [IntPtr]::Zero
$Child = $null
$SkipInput = $false

try {
    if (-not (Test-Path -LiteralPath $NodeExe -PathType Leaf)) {
        throw 'Nie znaleziono Node.js. Uruchom ponownie START_FIX105.'
    }
    if (-not (Test-Path -LiteralPath $NodeScript -PathType Leaf)) {
        throw 'Brak scripts\configure-gemini-secret.js.'
    }

    if (-not $Force) {
        & $NodeExe $NodeScript --check-only
        $CheckCode = $LASTEXITCODE
        if ($CheckCode -eq 0) {
            Write-Host '[OK] Klucz Gemini jest już zapisany. Nie trzeba go wklejać ponownie.' -ForegroundColor Green
            $SkipInput = $true
            $ExitCode = 0
        } elseif ($CheckCode -ne 2) {
            $SkipInput = $true
            $ExitCode = $CheckCode
        }
    }

    if (-not $SkipInput) {
        Write-Host ''
        Write-Host '======================================================' -ForegroundColor Cyan
        Write-Host 'BEZPIECZNE WKLEJANIE KLUCZA GOOGLE GEMINI' -ForegroundColor Cyan
        Write-Host 'Wpisz lub wklej klucz w tym samym oknie CMD.' -ForegroundColor White
        Write-Host 'Znaki klucza są maskowane gwiazdkami. Wklej Ctrl+V / Shift+Insert i naciśnij Enter.' -ForegroundColor White
        Write-Host 'Klucz nie pojawi się na ekranie, w logu ani w pliku.' -ForegroundColor Green
        Write-Host '======================================================' -ForegroundColor Cyan
        Write-Host "[LINK] Oficjalne tworzenie klucza: $KeyUrl" -ForegroundColor Yellow
        try { Start-Process $KeyUrl | Out-Null } catch { Write-Host '[INFO] Otwórz link ręcznie; możesz wkleić klucz w tym oknie CMD.' -ForegroundColor Yellow }

        $SecureValue = Read-Host -Prompt 'Wklej klucz Gemini (Ctrl+V / Shift+Insert; Enter zatwierdza)' -AsSecureString
        if ($null -eq $SecureValue -or $SecureValue.Length -eq 0) {
            throw 'Nie otrzymano klucza. Niczego nie zapisano. Uruchom START_FIX105 i wklej cały klucz.'
        }

        $Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
        $PlainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Bstr)
        if ([string]::IsNullOrWhiteSpace($PlainValue)) {
            throw 'Wklejony klucz jest pusty. Niczego nie zapisano.'
        }

        $Arguments = '"' + $NodeScript + '" --stdin-secret'
        if ($Force) { $Arguments += ' --force' }
        $StartInfo = New-Object System.Diagnostics.ProcessStartInfo
        $StartInfo.FileName = $NodeExe
        $StartInfo.Arguments = $Arguments
        $StartInfo.WorkingDirectory = $Root
        $StartInfo.UseShellExecute = $false
        $StartInfo.RedirectStandardInput = $true
        $StartInfo.CreateNoWindow = $false

        $Child = New-Object System.Diagnostics.Process
        $Child.StartInfo = $StartInfo
        if (-not $Child.Start()) { throw 'Nie udało się uruchomić konfiguratora Gemini.' }
        $Child.StandardInput.WriteLine($PlainValue)
        $Child.StandardInput.Flush()
        $Child.StandardInput.Close()
        $Child.WaitForExit()
        $ExitCode = $Child.ExitCode
    }
} catch {
    Write-Host "[BLAD KONFIGURACJI GEMINI] $($_.Exception.Message)" -ForegroundColor Red
    $ExitCode = 1
} finally {
    if ($Bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)
        $Bstr = [IntPtr]::Zero
    }
    if ($null -ne $SecureValue) { $SecureValue.Dispose() }
    $PlainValue = $null
    $SecureValue = $null
    if ($null -ne $Child) { $Child.Dispose() }
}

exit $ExitCode
