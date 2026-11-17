# KOMPUTEROWE CENTRUM SERWISU

**To repozytorium należy wyłącznie do programu KOMPUTEROWE CENTRUM SERWISU.**

- Stały adres projektu: https://github.com/naprawapclaptop1-dev/komputerowe-centrum-serwisu
- Strona publiczna na całym świecie: https://naprawapclaptop1-dev.github.io/komputerowe-centrum-serwisu/
- Kolejne aktualizacje tego programu trafiają do tego samego repozytorium.
- Inne programy muszą mieć własne, odrębne repozytoria i własne adresy aktualizacji.
- Każde wydanie otrzymuje nowy, unikalny tag i własne pliki instalacyjne.
- Nie wolno używać `--clobber`, usuwać wcześniejszych wydań ani zastępować plików z istniejących wydań.

## Stan publikacji — 17 listopada 2026

- Repozytorium jest publiczne, a źródła i pliki strony są zsynchronizowane.
- GitHub Pages jest skonfigurowany dla gałęzi `main` i źródła GitHub Actions.
- Ostatni przebieg wdrażania strony zakończył się powodzeniem: konfiguracja Pages, wysłanie plików strony i publikacja witryny — PASS.
- Publiczna strona działa w języku polskim, zawiera opis programu, modułów, film prezentacyjny i informacje o bezpłatnym pobieraniu.
- **GitHub Releases nie zawiera jeszcze pierwszego wydania instalatora.** Instalator, wersja portable i manifesty Stable/Beta nie są jeszcze opublikowane, więc pobieranie z sekcji wydań nie jest jeszcze dostępne.

## Pierwsze wydanie programu

Uruchom na Windows jedyny główny plik `URUCHOM_TYLKO_TEN_PLIK.cmd` z kompletnego pakietu. Automat sprawdza autoryzację, synchronizuje źródła, buduje aplikację, wersję portable i instalator, publikuje nowe wydanie wraz z manifestami oraz sprawdza publiczne adresy i sumy SHA-256.

Tworzenie witryny Pages i jej wdrażanie są już skonfigurowane. Jeżeli workflow wymaga ponownego wyzwolenia, automat używa nieinteraktywnego wywołania GitHub CLI i pokazuje jego kod wyjścia oraz pełną odpowiedź.

## Wersja produktu

- Wersja aplikacji pozostaje **1.0.0.69**.
- FIX086 naprawia zatrzymanie automatu po konfiguracji Pages; nie zmienia numeru wersji produktu.
