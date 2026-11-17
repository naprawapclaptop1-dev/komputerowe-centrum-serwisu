/* NAUKA OD A DO Z — browser hardware bridge 6.3.0
 * Camera: MediaDevices/UVC. Serial: Web Serial raw read only. USB: WebUSB device selection.
 * No automatic instrument commands and no PSU output switching.
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const log = $('np62DeviceLog');
  const lines = [];
  const note = (message) => {
    const stamp = new Date().toLocaleTimeString('pl-PL');
    lines.unshift(`[${stamp}] ${message}`);
    if (log) log.textContent = lines.slice(0, 8).join('\n');
  };
  const set = (id, message) => { const el = $(id); if (el) el.textContent = message; };

  // Photo selector: keep a local fallback if the external Commons image is unavailable.
  const mainPhoto = $('np62PhotoMain');
  if (mainPhoto) {
    mainPhoto.addEventListener('error', () => {
      const fallback = mainPhoto.dataset.fallback;
      if (fallback && mainPhoto.src !== new URL(fallback, location.href).href) {
        mainPhoto.src = fallback;
        mainPhoto.dataset.fallback = '';
      }
    });
  }
  document.querySelectorAll('.np62-photo-thumbs button').forEach((button) => {
    const thumb = button.querySelector('img');
    if (thumb && button.dataset.photoFallback) thumb.addEventListener('error', () => { thumb.src = button.dataset.photoFallback; });
    button.addEventListener('click', () => {
      document.querySelectorAll('.np62-photo-thumbs button').forEach((b) => b.classList.toggle('active', b === button));
      if (mainPhoto) {
        mainPhoto.dataset.fallback = button.dataset.photoFallback || '';
        mainPhoto.src = button.dataset.photoSrc || '';
      }
      set('np62PhotoTitle', button.dataset.photoTitle || 'Fotografia stanowiska');
      set('np62PhotoDesc', button.dataset.photoDesc || '');
      set('np62PhotoLabel', button.dataset.photoLabel || 'FOTOGRAFIA WARSZTATOWA');
    });
  });

  // UVC camera preview. Browser permissions are requested only after a user click.
  let cameraStream = null;
  const video = $('np62CameraPreview');
  const cameraSelect = $('np62CameraSelect');
  async function refreshCameras() {
    if (!navigator.mediaDevices?.enumerateDevices || !cameraSelect) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === 'videoinput');
    cameraSelect.innerHTML = '<option value="">Domyślna kamera</option>';
    cameras.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Kamera ${index + 1}`;
      cameraSelect.appendChild(option);
    });
  }
  async function stopCamera() {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    if (video) video.srcObject = null;
    set('np62CameraStatus', 'Podgląd kamery zatrzymany.');
    note('Zatrzymano podgląd kamery.');
  }
  $('np62CameraStart')?.addEventListener('click', async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Przeglądarka nie udostępnia getUserMedia. Otwórz stronę przez HTTPS w Chrome lub Edge.');
      await stopCamera();
      const selected = cameraSelect?.value;
      const videoConstraint = selected ? { deviceId: { exact: selected } } : true;
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false });
      if (video) { video.srcObject = cameraStream; await video.play(); }
      await refreshCameras();
      set('np62CameraStatus', 'Kamera działa — podgląd na żywo aktywny.');
      note('Uruchomiono podgląd kamery/mikroskopu UVC.');
    } catch (error) {
      set('np62CameraStatus', `Nie udało się uruchomić kamery: ${error.message}`);
      note(`Błąd kamery: ${error.message}`);
    }
  });
  $('np62CameraStop')?.addEventListener('click', stopCamera);
  cameraSelect?.addEventListener('focus', () => refreshCameras().catch(() => {}));

  // Web Serial: read-only stream display. Do not send undocumented commands to instruments.
  let serialPort = null;
  let serialReader = null;
  let serialReading = false;
  async function stopSerial() {
    serialReading = false;
    try { if (serialReader) await serialReader.cancel(); } catch (_) {}
    serialReader = null;
    try { if (serialPort?.readable) await serialPort.close(); } catch (_) {}
    serialPort = null;
    set('np62SerialStatus', 'Port szeregowy rozłączony.');
    note('Rozłączono port szeregowy.');
  }
  $('np62SerialConnect')?.addEventListener('click', async () => {
    try {
      if (!('serial' in navigator)) throw new Error('Brak Web Serial API. Użyj aktualnego Chrome/Edge na Windows i strony HTTPS.');
      serialPort = await navigator.serial.requestPort();
      const baudRate = Number($('np62Baud')?.value || 115200);
      await serialPort.open({ baudRate });
      set('np62SerialStatus', `Port otwarty (${baudRate} baud). Oczekiwanie na dane — tryb tylko do odczytu.`);
      note(`Otwarto port szeregowy ${baudRate} baud. Nie wysłano żadnych komend.`);
      serialReading = true;
      while (serialPort?.readable && serialReading) {
        serialReader = serialPort.readable.getReader();
        try {
          while (serialReading) {
            const { value, done } = await serialReader.read();
            if (done) break;
            if (value) {
              const decoded = new TextDecoder().decode(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
              if (decoded.trim()) {
                set('np62SerialStatus', `Dane z urządzenia: ${decoded.trim().slice(0, 180)}`);
                note(`Odebrano ${value.length} bajtów z portu.`);
              }
            }
          }
        } finally { serialReader.releaseLock(); serialReader = null; }
      }
    } catch (error) {
      set('np62SerialStatus', `Port niedostępny: ${error.message}`);
      note(`Port szeregowy: ${error.message}`);
      try { if (serialPort?.readable) await serialPort.close(); } catch (_) {}
      serialPort = null;
    }
  });
  $('np62SerialStop')?.addEventListener('click', stopSerial);

  // WebUSB device chooser. Selection is not the same as a working manufacturer driver.
  let usbDevice = null;
  $('np62UsbConnect')?.addEventListener('click', async () => {
    try {
      if (!navigator.usb?.requestDevice) throw new Error('Brak WebUSB API. Użyj Chrome/Edge na HTTPS albo lokalnego mostka Windows.');
      const vidText = ($('np62UsbVid')?.value || '').trim();
      const pidText = ($('np62UsbPid')?.value || '').trim();
      if (!/^[0-9a-fA-F]{4}$/.test(vidText)) throw new Error('Wpisz czterocyfrowy VID urządzenia z Menedżera urządzeń Windows.');
      const filter = { vendorId: parseInt(vidText, 16) };
      if (pidText) {
        if (!/^[0-9a-fA-F]{4}$/.test(pidText)) throw new Error('PID musi mieć cztery znaki szesnastkowe.');
        filter.productId = parseInt(pidText, 16);
      }
      usbDevice = await navigator.usb.requestDevice({ filters: [filter] });
      const label = `${usbDevice.productName || 'Urządzenie USB'} (VID ${usbDevice.vendorId.toString(16).padStart(4, '0').toUpperCase()} / PID ${usbDevice.productId.toString(16).padStart(4, '0').toUpperCase()})`;
      set('np62UsbStatus', `Wybrano: ${label}. Komunikacja wymaga sterownika/protokołu tego modelu.`);
      note(`Wybrano urządzenie USB: ${label}. Nie otwarto interfejsu i nie wysłano danych.`);
    } catch (error) {
      set('np62UsbStatus', `USB: ${error.message}`);
      note(`USB: ${error.message}`);
    }
  });
  $('np62UsbStop')?.addEventListener('click', () => {
    usbDevice = null;
    set('np62UsbStatus', 'Wybór urządzenia USB wyczyszczony.');
    note('Wyczyszczono wybór urządzenia USB.');
  });
  navigator.usb?.addEventListener?.('disconnect', (event) => {
    if (usbDevice && event.device === usbDevice) {
      usbDevice = null;
      set('np62UsbStatus', 'Urządzenie USB zostało odłączone.');
      note('Urządzenie USB odłączone.');
    }
  });

  if (!navigator.serial) set('np62SerialStatus', 'Web Serial niedostępny w tej przeglądarce. Wymagany Chrome/Edge na HTTPS.');
  if (!navigator.usb) set('np62UsbStatus', 'WebUSB niedostępny w tej przeglądarce. Wymagany Chrome/Edge na HTTPS.');
  if (!window.isSecureContext) {
    set('np62CameraStatus', 'Połączenie sprzętowe wymaga bezpiecznego HTTPS lub localhost.');
    note('Uwaga: strona nie jest w bezpiecznym kontekście HTTPS.');
  }
  window.addEventListener('pagehide', () => {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    try { if (serialReader) serialReader.cancel(); } catch (_) {}
  });
})();
