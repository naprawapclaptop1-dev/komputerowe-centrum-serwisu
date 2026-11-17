/* NAUKA OD A DO Z — FIX51: tematyczna biblioteka zdjęć i ilustracji. */
(() => {
  'use strict';
  const api = window.ACADEMY_ART;
  if (!api) return;
  const ASSETS = [{"id":"01-motherboard-map","title":"Mapa płyty głównej ATX / laptop","category":"board","description":"Rozpoznawanie stref płyty: CPU, RAM, VRM, PCIe, M.2, chipset i I/O.","src":"assets/artwork-fix51/01-motherboard-map.svg","keywords":["płyta główna","motherboard","boardview","cpu","ram"]},{"id":"02-power-vrm","title":"Sekcja zasilania VRM — blok funkcjonalny","category":"power","description":"Przepływ energii i rola zabezpieczeń, MOSFET-ów, kontrolera PWM, cewek i szyn.","src":"assets/artwork-fix51/02-power-vrm.svg","keywords":["vrm","zasilanie","mosfet","cewka","przetwornica"]},{"id":"03-laptop-exploded","title":"Laptop — widok warstwowy i podzespoły","category":"laptop","description":"Schemat warstwowy obudowy, matrycy, płyty, chłodzenia, baterii, SSD i zawiasów.","src":"assets/artwork-fix51/03-laptop-exploded.svg","keywords":["laptop","demontaż","exploded","zawiasy"]},{"id":"04-ram-ddr4-ddr5","title":"RAM DDR4 i DDR5 — porównanie","category":"ram","description":"Różnice generacji, napięć nominalnych i architektury modułów pamięci.","src":"assets/artwork-fix51/04-ram-ddr4-ddr5.svg","keywords":["ram","ddr4","ddr5","pamięć"]},{"id":"05-ssd-sata-nvme","title":"SATA, M.2 i NVMe — mapa pojęć","category":"storage","description":"Rozdzielenie formatu M.2, interfejsu SATA i protokołu NVMe.","src":"assets/artwork-fix51/05-ssd-sata-nvme.svg","keywords":["ssd","nvme","sata","m2","dysk"]},{"id":"06-multimeter-guide","title":"Multimetr cyfrowy — porty i funkcje","category":"meter","description":"Rozmieszczenie portów COM, V/Ω i podstawowych trybów pomiarowych.","src":"assets/artwork-fix51/06-multimeter-guide.svg","keywords":["multimetr","pomiar","rezystancja","napięcie"]},{"id":"07-oscilloscope-guide","title":"Oscyloskop — przebieg i skale","category":"meter","description":"Siatka przebiegu, amplituda, podstawa czasu i wyzwalanie.","src":"assets/artwork-fix51/07-oscilloscope-guide.svg","keywords":["oscyloskop","sygnał","pomiar"]},{"id":"08-cooling-flow","title":"Układ chłodzenia — przepływ energii","category":"cooling","description":"Droga ciepła od CPU/GPU przez pastę, heatpipe i radiator do strumienia powietrza.","src":"assets/artwork-fix51/08-cooling-flow.svg","keywords":["chłodzenie","fan","temperatura","heatpipe"]},{"id":"09-display-chain","title":"Tor obrazu laptopa — eDP i podświetlenie","category":"display","description":"Zależności między GPU, taśmą eDP, panelem LCD, zawiasem i zasilaniem LED.","src":"assets/artwork-fix51/09-display-chain.svg","keywords":["matryca","ekran","edp","display","zawias"]},{"id":"10-bios-boot","title":"BIOS / UEFI — sekwencja rozruchu","category":"board","description":"Uproszczony przepływ zasilania, EC, SPI firmware, POST i bootloadera.","src":"assets/artwork-fix51/10-bios-boot.svg","keywords":["bios","uefi","spi","boot"]},{"id":"11-usbc-pd","title":"USB-C Power Delivery — negocjacja","category":"port","description":"Ogólny schemat Source/Sink, linie CC, profile PDO/PPS i zabezpieczenia.","src":"assets/artwork-fix51/11-usbc-pd.svg","keywords":["usb-c","power delivery","pd","port"]},{"id":"12-esd-safety","title":"Stanowisko ESD i bezpieczna praca","category":"safety","description":"Przygotowanie stanowiska, opaska i mata ESD, odłączenie zasilania i ochrona części.","src":"assets/artwork-fix51/12-esd-safety.svg","keywords":["esd","bezpieczeństwo","bhp"]},{"id":"13-gpu-layout","title":"Karta graficzna — GPU, VRAM i VRM","category":"gpu","description":"Poglądowa mapa głównych bloków GPU, pamięci VRAM, sekcji zasilania i chłodzenia.","src":"assets/artwork-fix51/13-gpu-layout.svg","keywords":["gpu","vram","grafika","karta graficzna"]},{"id":"14-smart-drive","title":"Diagnostyka dysku — SMART i powierzchnia","category":"storage","description":"Kolejność zabezpieczenia danych, odczytu SMART i bezpiecznych testów nośnika.","src":"assets/artwork-fix51/14-smart-drive.svg","keywords":["smart","dysk","hdd","ssd","odzyskiwanie danych"]},{"id":"15-wifi-network","title":"Sieć Wi-Fi — ścieżka diagnostyczna","category":"network","description":"Rozdzielenie problemów operatora, routera, pasma radiowego, sterownika i klienta.","src":"assets/artwork-fix51/15-wifi-network.svg","keywords":["wifi","router","sieć","network","ethernet"]},{"id":"16-diagnostic-flow","title":"Diagnostyka krok po kroku — metoda","category":"diagnostics","description":"Metodyczne przejście od objawu przez wywiad i pomiary do testu potwierdzającego.","src":"assets/artwork-fix51/16-diagnostic-flow.svg","keywords":["diagnostyka","procedura","flow","usterka"]},{"id":"17-audio-circuit","title":"Tor audio — wejście, kodek i wyjście","category":"audio","description":"Uproszczony tor wejściowy i wyjściowy dźwięku w laptopie.","src":"assets/artwork-fix51/17-audio-circuit.svg","keywords":["audio","dźwięk","kodek","speaker"]},{"id":"18-connector-pinout","title":"Złącza i grupy sygnałów — schemat","category":"port","description":"Poglądowa ilustracja grup sygnałów zasilania, danych i konfiguracji złącza.","src":"assets/artwork-fix51/18-connector-pinout.svg","keywords":["usb","złącze","pinout","port"]}];
  const PHOTOS = Object.fromEntries(['ram','storage','gpu','cooling','display','port','power','board','meter','network','audio','safety','software','laptop'].map((key,i)=>[key,[`assets/artwork-fix77/lesson-${String(i+1).padStart(2,'0')}.svg`]]));
  const DIAGRAM = {
    board:'assets/artwork-fix51/01-motherboard-map.svg', power:'assets/artwork-fix51/02-power-vrm.svg',
    laptop:'assets/artwork-fix51/03-laptop-exploded.svg', ram:'assets/artwork-fix51/04-ram-ddr4-ddr5.svg',
    storage:'assets/artwork-fix51/05-ssd-sata-nvme.svg', meter:'assets/artwork-fix51/06-multimeter-guide.svg',
    cooling:'assets/artwork-fix51/08-cooling-flow.svg', display:'assets/artwork-fix51/09-display-chain.svg',
    port:'assets/artwork-fix51/11-usbc-pd.svg', safety:'assets/artwork-fix51/12-esd-safety.svg',
    gpu:'assets/artwork-fix51/13-gpu-layout.svg', network:'assets/artwork-fix51/15-wifi-network.svg',
    audio:'assets/artwork-fix51/17-audio-circuit.svg', diagnostics:'assets/artwork-fix51/16-diagnostic-flow.svg'
  };
  const DIAGRAM_TERMS = [
    [/sekcja zasilania|vrm|mosfet|przetwornica|buck converter/i,'power'],
    [/schemat|boardview|topologi|mapa płyty|rozmieszczenie elementów|chipset|bios|uefi|spi flash|boot sequence/i,'board'],
    [/multimetr|oscyloskop|przebieg|pomiar napię|rezystancj|ciągłoś|sonda/i,'meter'],
    [/ddr[45]|pamięć ram|moduł pamięci|slot ram/i,'ram'],
    [/nvme|sata|smart|odzyskiwanie danych|dysk ssd|dysk hdd/i,'storage'],
    [/chłodzenie|heat.?pipe|radiator|wentylator|temperatur/i,'cooling'],
    [/matryca|ekran|edp|zawias|podświetlenie/i,'display'],
    [/usb.?c|power delivery|thunderbolt|pinout|złącze/i,'port'],
    [/esd|antystaty|bezpieczeństwo pracy/i,'safety'],
    [/gpu|vram|karta graficzna/i,'gpu'],
    [/wi.?fi|wifi|router|ethernet|sieć komputerowa/i,'network'],
    [/audio|kodek|głośnik|mikrofon/i,'audio'],
    [/diagnostyka krok|drzewo decyzji|metoda diagnost/i,'diagnostics']
  ];
  const hash = s => { let h=2166136261; for(const c of String(s||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; };
  const safeLocal = value => /^(?:media|assets)\/[a-z0-9_./-]+\.(?:jpe?g|png|webp|avif|svg)$/i.test(String(value||''));
  const appendFallback = (url,fallback) => {
    const marker = `fix51-fallback=${encodeURIComponent(fallback)}`;
    return `${url}${String(url).includes('#')?'&':'#'}${marker}`;
  };
  function localPhoto(item,scope) {
    const kind = api.kind(item||{});
    const list = PHOTOS[kind] || PHOTOS.laptop;
    const identity = [scope,item?.id,item?.title,item?.titleEn,item?.name,item?.category].filter(Boolean).join('|');
    return list[hash(identity)%list.length];
  }
  function diagramFor(item,scope) {
    const text = [item?.title,item?.titleEn,item?.name,item?.category,item?.categoryEn,item?.tags,item?.purpose,scope].filter(Boolean).join(' ');
    for (const [pattern,key] of DIAGRAM_TERMS) if(pattern.test(text) && DIAGRAM[key]) return DIAGRAM[key];
    return DIAGRAM[api.kind(item||{})] || DIAGRAM.laptop;
  }
  function dataUrl(item={},scope='lesson') {
    const supplied = typeof item?.image === 'string' ? item.image.trim() : '';
    const fallback = localPhoto(item,scope);
    // Supplied local files are trusted only when the path is a known project asset path.
    if (safeLocal(supplied)) return supplied;
    // FIX77: photographic reuse is disabled; visual content is represented by a unique/local SVG illustration.
    if (/^https:\/\//i.test(supplied) && /\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(supplied)) return diagramFor(item,scope);
    const text=[item?.title,item?.titleEn,item?.name,item?.category,item?.categoryEn,item?.tags,item?.purpose,scope].filter(Boolean).join(' ');
    if (DIAGRAM_TERMS.some(([pattern])=>pattern.test(text))) return diagramFor(item,scope);
    return diagramFor(item,scope);
  }
  function fallbackOnError(event) {
    const img=event.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fix51FallbackApplied==='1') return;
    const src=img.getAttribute('src')||'';
    const match=src.match(/#(?:fix51|np630)-fallback=([^&]+)/);
    if (match) {
      img.dataset.fix51FallbackApplied='1';
      try { img.src=decodeURIComponent(match[1]); const button=img.closest('.photo-card-image-button'); if(button) button.dataset.openImage=img.src; const caption=button?.closest('.photo-card')?.querySelector('.photo-card-caption'); const credit=caption?.querySelector('a'); if(credit){const note=document.createElement('small');note.textContent='Zdjęcie lokalne · dostępne offline';credit.replaceWith(note);} return; } catch (_) {}
    }
    // A missing local raster switches to a relevant local vector illustration.
    if (/^(?:media|assets)\//i.test(src) && !/artwork-fix51\//i.test(src)) {
      img.dataset.fix51FallbackApplied='1';
      const alt=img.alt||'';
      img.src=diagramFor({title:alt,category:alt},'fallback'); const button=img.closest('.photo-card-image-button'); if(button) button.dataset.openImage=img.src;
    }
  }
  document.addEventListener('error',fallbackOnError,true);
  api.dataUrl=dataUrl;
  api.photoPools=api.photoPools||{};
  Object.assign(api.photoPools,PHOTOS);
  api.visualAssets=ASSETS;
  api.visualAssetCount=ASSETS.length;
  api.photoUniqueness={version:'6.8.0-fix51',poolSize:Object.values(PHOTOS).flat().length,uniqueWithinRepairCard:true,reuseAcrossLessons:false,globalSingleAssignment:true,photosOnlyOnHomeCards:true,isPhoto:url=>/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(String(url||'')),isIllustration:url=>/\.svg(?:[?#]|$)/i.test(String(url||''))};
  window.ACADEMY_VISUAL_ASSETS=ASSETS;
  window.NP_PHOTO_UNIQUENESS_FIX51=api.photoUniqueness;
})();
