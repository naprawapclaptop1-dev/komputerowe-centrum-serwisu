NAUKA OD A DO Z — FIX98 — ZDJĘCIA KART MODUŁÓW I SPECJALIZACJI
==============================================================

CO ZMIENIONO
-----------
- Katalog 19 modułów: 15 brakujących kart otrzymało własne zdjęcia.
- Specjalizacje PRO: wszystkie 6 ścieżek ma osobną fotografię.
- Cztery istniejące lokalne zdjęcia kart modułów nie zostały zastąpione.
- Baner i pokaz slajdów FIX96 (3 + 6 fotografii) nie zostały zmienione.
- W manifeście jest 37 kuratorowanych źródeł ze stronami, autorami,
  kategoriami i informacją o licencji.

WAŻNE O ZDJĘCIACH
-----------------
21 nowych slotów korzysta z wyselekcjonowanych zdalnych adresów zdjęć
(Pexels / Wikimedia Commons). Pliki nie zostały w tej poprawce pobrane
fizycznie do archiwum, ponieważ środowisko budowania nie miało dostępu
sieciowego do CDN. Zdjęcia pojawią się po pobraniu manifestu i obrazu
przez przeglądarkę. Gdy obraz online jest niedostępny, karta pokazuje
jawnie podpisaną ilustrację techniczną offline; nie udaje ona fotografii.

Uruchomienie samych 21 zdjęć nie wymaga wcześniejszego zapytania Openverse:
sloty pobierają najpierw pasujące źródła startowe z manifestu.

TESTY NA WINDOWS
----------------
1. Rozpakuj całe archiwum do nowego folderu.
2. Uruchom WYKONAJ_TESTY_FIX98.cmd.
3. Poprawny wynik kończy się komunikatem 188/188 PASS.
4. Publikację uruchom dopiero po pomyślnym teście, przez istniejący
   URUCHOM_NAUKE_OD_A_DO_Z.cmd.

UWAGA DOTYCZĄCA PUBLIKACJI
--------------------------
W tej sesji przygotowano i przetestowano lokalny pakiet. Nie opublikowano
go na Cloudflare Pages. Istniejący OneClick może sprawdzać konfigurację
D1 i uruchamiać wymagane migracje, jeśli wykryje zaległe migracje.
Ten FIX98 sam nie dodaje migracji i nie modyfikuje D1.

WERSJA I OCHRONA DANYCH
-----------------------
Produkt: 6.8.0
Hotfix/runtime: FIX98
Zachowane: poprzednie 13 lokalnych fotografii, 19 modułów, 6 ścieżek,
wcześniejsze kursy, nawigacja i istniejący kontrakt D1.
