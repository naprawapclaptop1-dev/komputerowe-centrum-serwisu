# KOMPUTEROWE CENTRUM SERWISU

**To repozytorium należy wyłącznie do programu KOMPUTEROWE CENTRUM SERWISU.**

- Stały adres projektu: https://github.com/naprawapclaptop1-dev/komputerowe-centrum-serwisu
- Kolejne aktualizacje tego programu trafiają do tego samego repozytorium.
- Inne programy muszą mieć własne, odrębne repozytoria i własne adresy aktualizacji.
- Każde wydanie otrzymuje nowy, unikalny tag i własne pliki instalacyjne.
- Nie wolno używać `--clobber`, usuwać wcześniejszych wydań ani zastępować plików z istniejących wydań.
- Linki do aktualizacji wskazują konkretny tag wydania.

## Aktualny stan

- Repozytorium jest publiczne.
- Źródła programu, statyczna strona WWW, materiały wideo, napisy i workflow GitHub Actions zostały zsynchronizowane z repozytorium.
- Workflow strony działa w trybie ręcznego uruchamiania po utworzeniu witryny GitHub Pages przez konto właściciela.
- Pierwsza konfiguracja GitHub Pages nie została jeszcze potwierdzona.
- Nie ma jeszcze opublikowanego GitHub Release ani załączonych instalatorów, wersji portable i manifestów. Repozytorium nie powinno być traktowane jako źródło gotowego instalatora do czasu opublikowania i zweryfikowania wydania.

## Pierwsze wdrożenie

Uruchom jedyny główny plik `URUCHOM_TYLKO_TEN_PLIK.cmd` z kompletnego pakietu projektu na Windows. Automat:
1. Sprawdza autoryzację konta GitHub i uprawnienia zapisu.
2. Synchronizuje źródła i stronę, wykluczając lokalny cache narzędzi `.tools/`.
3. Tworzy/konfiguruje GitHub Pages dla gałęzi `main` i ścieżki `/` przy użyciu uwierzytelnionego konta właściciela.
4. Ręcznie uruchamia workflow Pages po skonfigurowaniu witryny.
5. Buduje instalator i wersję portable, tworzy manifesty Stable/Beta oraz plik SHA-256.
6. Publikuje nowe wydanie i sprawdza publiczne adresy HTTP 200.

Tworzenie witryny Pages wymaga uprawnień administratora repozytorium oraz tokenu z wymaganymi uprawnieniami. Jeśli GitHub odmówi operacji API, jednorazowo wybierz w repozytorium **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Wersja produktu

- Wersja aplikacji pozostaje **1.0.0.69**.
- FIX084 to poprawka automatyzacji publikacji, konfiguracji GitHub Pages, wykluczania lokalnego cache i obsługi CMD/PowerShell; nie jest zmianą numeru wersji produktu.
