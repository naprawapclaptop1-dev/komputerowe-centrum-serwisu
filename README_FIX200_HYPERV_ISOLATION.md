# FIX200 — Przygotowanie odizolowanej maszyny Hyper-V

## Wymagania
Windows Pro/Enterprise/Education obsługujący Hyper-V, włączona funkcja Hyper-V, moduł PowerShell Hyper-V i uprawnienia administratora. Dostępność zależy od hosta.

## Przygotowanie
Uruchom `UTWORZ_LABORATORIUM_HYPERV_FIX200.cmd` jako administrator. Aby podłączyć nośnik instalacyjny systemu testowego, uruchom PowerShell jako administrator i podaj ISO przez parametr `-IsoPath`, np. `powershell -ExecutionPolicy Bypass -File tools\FIX200_CREATE_ISOLATED_HYPERV_VM.ps1 -IsoPath "D:\ISO\Windows.iso"`. Skrypt tworzy generację 2, VHDX, wyłącza automatyczny start, nie dodaje przełącznika sieciowego ani karty sieciowej, sprawdza brak adapterów, wyłącza usługi integracji i tworzy standardowy punkt kontrolny i pozostawia VM wyłączoną.

Start po ponownej kontroli:
`powershell -ExecutionPolicy Bypass -File tools\FIX200_START_ISOLATED_HYPERV_VM.ps1`

Usuwanie definicji VM bez kasowania VHDX:
`powershell -ExecutionPolicy Bypass -File tools\FIX200_REMOVE_ISOLATED_HYPERV_VM.ps1`

Usunięcie pliku dysku wymaga świadomego użycia `-DeleteFiles`.

## Ograniczenia
Skrypty nie zostały wykonane w tym środowisku, a VM nie została utworzona. Brak karty sieciowej nie jest certyfikatem absolutnej izolacji. Nie uruchamiaj rzeczywistych próbek malware na tym środowisku bez niezależnej oceny konfiguracji bezpieczeństwa.
