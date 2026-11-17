# FIX207 — audyt Hyper-V i analiza statyczna plików

## Audyt VM
`VERIFY_LABORATORIUM_FIX207.cmd` uruchamia tylko odczytową kontrolę: VM ma być wyłączona, bez kart sieciowych, bez aktywnych usług integracji, z istniejącymi VHDX, aktywnym Secure Boot, punktem kontrolnym i bez automatycznego startu. Raport jest JSON. Skrypt nie uruchamia VM.

## Analiza pliku
`ANALIZA_PLIKU_FIX207.cmd` wykonuje SHA-256, odczytuje status Authenticode, znacznik Zone.Identifier i podstawowy nagłówek pliku. Nie uruchamia, nie przesyła i nie oznacza pliku jako bezpiecznego lub złośliwego. Brak podpisu nie jest dowodem malware.

## Ograniczenia
Nie jest to pełny antywirus, skaner YARA ani potwierdzony sandbox próbek malware. Hyper-V i PowerShell muszą być rzeczywiście sprawdzone na obsługiwanym Windows; testy tej sesji nie uruchamiały tych poleceń.
