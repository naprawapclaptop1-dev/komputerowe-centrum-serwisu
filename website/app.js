(() => {
  'use strict';
  const OWNER = 'naprawapclaptop1-dev';
  const REPO = 'komputerowe-centrum-serwisu';
  const REPOSITORY = `${OWNER}/${REPO}`;
  const RELEASES_API = `https://api.github.com/repos/${REPOSITORY}/releases/latest`;
  const setupName = 'KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe';
  const portableName = 'KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe';
  const releaseStatus = document.getElementById('releaseStatus');
  const setupLink = document.getElementById('setupDownload');
  const portableLink = document.getElementById('portableDownload');
  const releaseVersion = document.getElementById('releaseVersion');
  const releaseMeta = document.getElementById('releaseMeta');
  const releaseExtra = document.getElementById('releaseExtra');
  const langSwitch = document.getElementById('langSwitch');
  const year = document.getElementById('year');
  let language = (navigator.language || 'en').toLowerCase().startsWith('pl') ? 'pl' : 'en';
  let loadInProgress = false;
  const messages = {
    pl: {
      checking:'Sprawdzam dostępność bezpłatnego wydania GitHub…',
      ready:'Wydanie jest dostępne. Pobieranie pochodzi z oficjalnego repozytorium GitHub.',
      missing:'Pierwsze publiczne wydanie nie jest jeszcze dostępne. Publikacja pobierania jest w toku lub oczekuje na pierwsze wydanie.',
      error:'Nie udało się sprawdzić wydania. Sprawdź oficjalną stronę wydań GitHub.',
      installer:'Instalator Windows', portable:'Wersja przenośna',
      published:'Publikacja', checksum:'Pobierz sumy SHA-256', releasePage:'Wszystkie wydania i historia zmian',
      rate:'GitHub chwilowo ograniczył liczbę zapytań. Spróbuj ponownie później.'
    },
    en: {
      checking:'Checking the free GitHub release…',
      ready:'A release is available. Downloads come from the official GitHub repository.',
      missing:'The first public release is not available yet. Publication is in progress or awaiting the first release.',
      error:'Could not check the release. Open the official GitHub releases page.',
      installer:'Windows installer', portable:'Portable version',
      published:'Published', checksum:'Download SHA-256 checksums', releasePage:'All releases and changelog',
      rate:'GitHub temporarily rate-limited requests. Please try again later.'
    }
  };
  function setLanguage(lang) {
    language = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-pl][data-en]').forEach(el => {
      const value = el.dataset[lang];
      if (value !== undefined) el.innerHTML = value;
    });
    langSwitch.textContent = lang === 'pl' ? 'EN' : 'PL';
    langSwitch.setAttribute('aria-label', lang === 'pl' ? 'Change language to English' : 'Zmień język na polski');
    const track = document.querySelector('video track');
    if (track) {
      track.label = lang === 'pl' ? 'Polski' : 'English';
      track.srclang = lang;
      track.src = lang === 'pl' ? './media/prezentacja.vtt' : './media/prezentacja-en.vtt';
      const video = track.parentElement;
      if (video && video.textTracks && video.textTracks[0]) video.textTracks[0].mode = 'showing';
    }
    document.title = lang === 'pl'
      ? 'Komputerowe Centrum Serwisu — bezpłatne narzędzie Windows'
      : 'Computer Service Center — free Windows toolkit';
  }
  function showStatus(type, text) {
    releaseStatus.className = `release-status ${type || ''}`;
    const label = releaseStatus.lastElementChild;
    if (label) label.textContent = text;
  }
  function disableDownloads() {
    for (const link of [setupLink, portableLink]) {
      link.classList.add('disabled');
      link.setAttribute('aria-disabled', 'true');
      link.removeAttribute('download');
      link.href = `https://github.com/${REPOSITORY}/releases`;
    }
  }
  function enableDownload(link, url, name) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || !parsed.pathname.includes('/releases/download/')) {
      throw new Error('Unexpected download host or URL.');
    }
    link.href = url;
    link.classList.remove('disabled');
    link.removeAttribute('aria-disabled');
    link.setAttribute('download', name);
  }
  function formatSize(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  async function loadRelease() {
    if (loadInProgress) return;
    loadInProgress = true;
    disableDownloads();
    releaseExtra.textContent = '';
    showStatus('', messages[language].checking);
    try {
      const response = await fetch(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'default'
      });
      if (response.status === 404) {
        releaseVersion.textContent = '—';
        showStatus('warning', messages[language].missing);
        releaseMeta.innerHTML = `<a class="text-link" href="https://github.com/${REPOSITORY}/releases" target="_blank" rel="noopener">${messages[language].releasePage} ↗</a>`;
        return;
      }
      if (response.status === 403 || response.status === 429) throw new Error(messages[language].rate);
      if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
      const release = await response.json();
      if (release.draft || release.prerelease || !release.tag_name) throw new Error('No public stable release is available.');
      const assets = Array.isArray(release.assets) ? release.assets : [];
      const installer = assets.find(a => a.name === setupName && a.state === 'uploaded' && a.size > 0);
      const portable = assets.find(a => a.name === portableName && a.state === 'uploaded' && a.size > 0);
      const sums = assets.find(a => a.name === 'SHA256SUMS.txt' && a.state === 'uploaded' && a.size > 0);
      if (!installer || !portable || !sums) throw new Error('The release is missing a required installer, portable package or checksum file.');
      enableDownload(setupLink, installer.browser_download_url, setupName);
      enableDownload(portableLink, portable.browser_download_url, portableName);
      releaseVersion.textContent = release.tag_name;
      const checksumUrl = new URL(sums.browser_download_url);
      if (checksumUrl.protocol !== 'https:' || checksumUrl.hostname !== 'github.com' || !checksumUrl.pathname.includes('/releases/download/')) {
        throw new Error('Unexpected checksum download host or URL.');
      }
      const date = release.published_at
        ? new Date(release.published_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')
        : '—';
      releaseMeta.textContent = `${messages[language].published}: ${date} · ${messages[language].installer}: ${formatSize(installer.size)} · ${messages[language].portable}: ${formatSize(portable.size)}`;
      releaseExtra.innerHTML = `<a href="${sums.browser_download_url}" target="_blank" rel="noopener">${messages[language].checksum} ↗</a>`;
      showStatus('success', messages[language].ready);
    } catch (error) {
      releaseVersion.textContent = '—';
      showStatus('error', error && error.message ? error.message : messages[language].error);
      releaseMeta.innerHTML = `<a class="text-link" href="https://github.com/${REPOSITORY}/releases" target="_blank" rel="noopener">${messages[language].releasePage} ↗</a>`;
    } finally {
      loadInProgress = false;
    }
  }
  langSwitch.addEventListener('click', () => {
    setLanguage(language === 'pl' ? 'en' : 'pl');
    loadRelease();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadRelease();
  });
  year.textContent = new Date().getFullYear();
  setLanguage(language);
  disableDownloads();
  loadRelease();
})();
