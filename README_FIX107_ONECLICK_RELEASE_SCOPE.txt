NAUKA OD A DO Z — FIX107 — ONECLICK RELEASE SCOPE
Produkt: 6.8.0
Publikator: FIX107
Runtime zdjęć/metod: FIX106 (bez zmiany)

PRZYCZYNA
ONECLICK_AKADEMIA.js w verifyWeb() wczytywał WEB_PUBLISH/release.json do zmiennej
releaseJson, ale przy wywołaniu evaluatePhotoCatalogPublicationContract używał
localRelease, której w tym zakresie nie zadeklarowano. Powodowało to:
ReferenceError: localRelease is not defined

NAPRAWA
W verifyWeb() po parsowaniu release.json dodano jawne:
  const localRelease = releaseJson;
Bramka katalogu zdjęć otrzymuje teraz ten sam obiekt lokalnego release.json,
a expectedPhotoCatalogBuild pochodzi z localRelease.photoCatalogRuntimeBuildTag.

ZGODNOŚĆ WYDAŃ
- latestHotfix: FIX107
- latestHotfixBuild: 6.8.0-fix107-oneclick-release-scope-20261108
- photoCatalogRuntimeBuildTag pozostaje 6.8.0-fix106-method-photo-renderer-topic-map-20261108
- runtime photo-catalog-fix106.js/css nie został zmieniony.

ZABEZPIECZENIA
- OneClick nadal uruchamia verifyWeb() przed verifyPendingMigrations() i migrateDatabase().
- Nowy test FIX107 znajduje się w preflight OneClick i Auto-Publish Watcher.
- Nie zmieniono bindingu D1, SQL ani migracji.
- Nie wykonano publikacji produkcyjnej w trakcie przygotowania paczki.

URUCHOMIENIE TESTÓW
WYKONAJ_TESTY_FIX107.cmd

Po pozytywnych testach uruchom standardowy URUCHOM_NAUKE_OD_A_DO_Z.cmd.
Normalny proces OneClick zachowuje istniejące zabezpieczenia: przed ewentualnymi
addytywnymi migracjami wykonuje kopię D1, następnie weryfikuje oczekujące migracje.
