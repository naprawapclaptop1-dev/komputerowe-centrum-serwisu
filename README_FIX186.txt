NAUKA OD A DO Z 6.8.0 — FIX186
PRAWDZIWE LABORATORIUM SERWISOWE PRO
====================================

CO ZAWIERA
----------
- Import: CSV, XML, JSON i TXT (limit 25 MiB na plik).
- Analiza zdarzeń WHEA/PCIe, Storage i GPU/Display.
- Generator dodatkowych przypadków przez istniejący endpoint Gemini /api/chat.
- Laboratorium zdjęć PCB: ręczne oznaczanie oraz opcjonalna analiza wizualna AI.
- Kontrola SHA-256 i raportowanie Authenticode/SignTool.
- Egzamin praktyczny z oceną kolejności działań, hipotezy i raportu.
- Kolektor Windows do pozyskiwania śladów i zdarzeń.

INSTALACJA W ISTNIEJĄCYM PROJEKCIE
----------------------------------
1. Zamknij uruchomione procesy build/publish projektu.
2. Wykonaj kopię folderu G:\AKADEMIA_SERWISU_PRO.
3. Rozpakuj zawartość ZIP do istniejącego G:\AKADEMIA_SERWISU_PRO.
   Nie twórz dodatkowego folderu nadrzędnego i nie kasuj plików konfiguracyjnych.
4. Zachowaj istniejące: wrangler.toml, .dev.vars, TOOLS_CLOUDFLARE, Node path,
   zapisane sekrety Cloudflare/Gemini i kopie bazy D1.
5. Uruchom WYKONAJ_TESTY_FIX186.cmd.
6. Dopiero po pełnym PASS uruchom dotychczasowy START_FIX105.cmd.
7. Po publikacji prześlij START_FIX105.log do sprawdzenia wdrożenia i endpointu.

PRAWDZIWE LOGI WINDOWS
----------------------
WYKONAJ_LABORATORIUM_FIX186.cmd uruchamia tools\FIX186_COLLECTOR.ps1.
Kolektor poprosi o UAC, ponieważ WPR/StorDiag i część dzienników wymagają uprawnień
administratora. Wyniki zapisuje na Pulpicie w folderze AKADEMIA_FIX186_RAPORTY.

Opcje kolektora:
1. WPR GeneralProfile -> ETL i próba eksportu XML przez tracerpt.
2. StorDiag -collectEtw + eksport zdarzeń System (WHEA/PCIe/Storage/GPU).
3. Eksport wskazanego EVTX do JSON/CSV.
4. SHA-256 i kontrola podpisu pakietu/katalogu firmware.
5. Spakowanie raportów do ZIP.

Do Akademii importuj wyeksportowane XML, CSV, JSON lub TXT. Surowe ETL i EVTX nie
są bezpośrednio parsowane przez przeglądarkowy importer.

ANALIZA PCB AI — PRYWATNOŚĆ
--------------------------
Ręczne adnotacje zdjęcia pozostają lokalnym narzędziem. Analiza AI jest opcjonalna:
- wczytaj zdjęcie płyty głównej komputera/laptopa;
- przed analizą zaznacz osobną zgodę;
- przytnij/zasłoń etykiety, numery seryjne i dane klienta;
- naciśnij przycisk analizy.
Po zgodzie obraz jest przesyłany do Google Gemini przez istniejący endpoint serwerowy.
Endpoint nie zapisuje surowego zdjęcia w D1 ani localStorage. Wynik jest obserwacją
wizualną, nie diagnozą elektryczną. Nie można na tej podstawie potwierdzić zwarcia,
przerwy, napięcia lub stanu wewnętrznych warstw PCB.

BEZPIECZEŃSTWO
--------------
Nie używaj importu diagnostycznego do przesyłania nieprzejrzanych logów klientów.
Ślady ETW/EVTX mogą zawierać nazwy kont, procesów, ścieżki i inne dane środowiska.
Uzyskaj zgodę właściciela sprzętu i usuń dane wrażliwe przed udostępnieniem.
Kolektor jest przeznaczony do zbierania i kontroli, nie do naprawy ani flashowania.

OGRANICZENIA TESTÓW
-------------------
Testy Node.js weryfikują parsery, schematy, endpoint, kontrolę zgody, integrację PWA,
publishera i watchera. Skrypt PowerShell nie był uruchomiony w tym środowisku Linux;
należy sprawdzić go na docelowym Windows 10/11. Publikacja online wymaga logu START.


LOGOWANIE ZEWNĘTRZNE — FIX194
-----------------------------
W aktualnym interfejsie pozostają wyłącznie Google, Microsoft i Facebook. X, GitHub i Discord zostały wyłączone z bieżącego UI i backendowego startu OAuth. Historyczne migracje oraz zapisane tożsamości nie są usuwane. Do uruchomienia logowania potrzebne są Client ID/Client Secret tych trzech dostawców w Cloudflare Pages oraz rzeczywisty test callbacku po publikacji.
