
(() => {
  'use strict';
  const root = document.getElementById('fix195Labs');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';
  const parts = {
    cpu:['Procesor (CPU)','Wykonuje instrukcje i steruje pracą systemu.','Objawy: brak POST, restarty, przegrzewanie. Kontrola: oględziny socketu przy odłączonym zasilaniu, chłodzenie, pasta, zgodność BIOS i test obciążeniowy monitorowany temperaturą.'],
    ram:['Pamięć RAM','Przechowuje dane robocze używane przez system i aplikacje.','Objawy: BSOD, błędy instalacji, niestabilność. Kontrola: test pojedynczego modułu, właściwe sloty, ustawienia JEDEC, następnie XMP/EXPO.'],
    vrm:['Sekcja zasilania VRM','Stabilizuje napięcie zasilające CPU i inne układy.','Objawy: wyłączanie pod obciążeniem, throttling, przegrzewanie. Kontrola: oględziny, przepływ powietrza i odczyt czujników; pomiary elektryczne wyłącznie odpowiednim sprzętem i przez technika.'],
    m2:['Gniazdo M.2','Obsługuje dyski SSD NVMe lub SATA zależnie od płyty.','Objawy: brak dysku, spadki wydajności, błędy I/O. Kontrola: zgodność protokołu, montaż, temperatura, SMART i logi Storage.'],
    pcie:['PCI Express / GPU','Łączy kartę graficzną i inne urządzenia rozszerzeń.','Objawy: brak obrazu, artefakty, reset sterownika. Kontrola: zasilanie GPU, osadzenie karty, przewody, sterownik i test poza obciążeniem ekstremalnym.'],
    chipset:['Chipset','Zapewnia obsługę wybranych magistral i urządzeń płyty.','Objawy: problemy USB, SATA lub urządzeń PCIe. Kontrola: dziennik urządzeń, sterowniki chipsetu, BIOS i test portów.']
  };
  const info = document.getElementById('f195PartInfo');
  const stage = document.getElementById('f196Stage');
  const rotate = document.getElementById('f196Rotate');
  const viewStatus = document.getElementById('f196ViewStatus');
  rotate?.addEventListener('click', () => { const active = stage.classList.toggle('is-rotated'); rotate.setAttribute('aria-pressed', String(active)); viewStatus.textContent = active ? 'Widok przestrzenny — obrót' : 'Widok izometryczny'; });
  document.getElementById('f196Reset')?.addEventListener('click', () => { stage.classList.remove('is-rotated'); rotate.setAttribute('aria-pressed','false'); viewStatus.textContent = 'Widok izometryczny'; });
  root.querySelectorAll('[data-part]').forEach(btn => btn.addEventListener('click', () => {
    const item = parts[btn.dataset.part]; if (!item) return;
    root.querySelectorAll('[data-part]').forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    info.innerHTML = `<b></b><span></span>`;
    info.querySelector('b').textContent = item[0];
    info.querySelector('span').textContent = `${item[1]} ${item[2]}`;
  }));
  const scenarios = {
    macro:['Wysokie ryzyko — nie włączaj makr','Zapisz źródło i sumę SHA-256, sprawdź podpis, rozszerzenie i pochodzenie dokumentu. Nie otwieraj go na stanowisku produkcyjnym. Przekaż do firmowego sandboxa/EDR.'],
    startup:['Wymaga weryfikacji wpisu','Zapisz ścieżkę, wydawcę, podpis i hash pliku. Sprawdź lokalizację oraz czas utworzenia. Nie usuwaj wpisu bez kopii i potwierdzenia wpływu na system.'],
    network:['Wymaga korelacji zdarzeń','Zbierz adres docelowy, proces, port, czas i DNS z logów zapory/EDR. Porównaj z ruchem bazowym. Nie blokuj usług systemowych bez potwierdzenia.'],
    ransom:['Incydent krytyczny — odłącz od sieci','Nie restartuj i nie uruchamiaj podejrzanych plików. Odizoluj urządzenie sieciowo, zachowaj logi i nośniki, uruchom procedurę reagowania oraz zweryfikuj kopie zapasowe. Nie podłączaj backupu do podejrzanego hosta.']
  };
  const button = document.getElementById('f195Analyze');
  button.addEventListener('click', () => {
    const item = scenarios[document.getElementById('f195Sample').value];
    const out = document.getElementById('f195SecurityInfo');
    out.innerHTML = '<b></b><span></span>';
    out.querySelector('b').textContent = item[0];
    out.querySelector('span').textContent = item[1];
  });
})();
