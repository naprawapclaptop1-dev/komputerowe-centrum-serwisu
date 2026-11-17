/* FIX155 pure calculation core: browser + Node VM compatible. */
(function (root) {
  'use strict';
  function ipv4ToInt(value) {
    const parts = String(value).trim().split('.');
    if (parts.length !== 4) throw new Error('Adres musi zawierać cztery oktety IPv4.');
    let out = 0;
    for (const part of parts) {
      if (!/^\d{1,3}$/.test(part)) throw new Error('Adres IPv4 zawiera nieprawidłowy oktet.');
      const n = Number(part);
      if (n < 0 || n > 255) throw new Error('Każdy oktet IPv4 musi mieścić się w zakresie 0–255.');
      out = ((out << 8) | n) >>> 0;
    }
    return out >>> 0;
  }
  function intToIpv4(value) {
    const n = Number(value) >>> 0;
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  function subnet(ip, prefix) {
    const p = Number(prefix);
    if (!Number.isInteger(p) || p < 0 || p > 32) throw new Error('Prefiks CIDR musi być liczbą całkowitą od 0 do 32.');
    const address = ipv4ToInt(ip);
    const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
    const network = (address & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const hosts = p === 32 ? 1 : p === 31 ? 2 : Math.max(0, Math.pow(2, 32 - p) - 2);
    const first = p >= 31 ? network : (network + 1) >>> 0;
    const last = p >= 31 ? broadcast : (broadcast - 1) >>> 0;
    return {ip:String(ip),prefix:p,mask:intToIpv4(mask),network:intToIpv4(network),broadcast:intToIpv4(broadcast),firstHost:intToIpv4(first),lastHost:intToIpv4(last),hosts};
  }
  function evaluateBios(s) {
    const issues = [], notes = [];
    if (s.mode === 'uefi' && s.partition !== 'gpt') issues.push('UEFI z dyskiem MBR: konfiguracja rozruchu jest niespójna dla standardowej instalacji UEFI. Zweryfikuj tryb instalatora i schemat partycji.');
    if (s.mode === 'legacy' && s.partition !== 'mbr') issues.push('Legacy/CSM z GPT: standardowa ścieżka rozruchu jest niespójna.');
    if (s.mode === 'uefi' && s.system !== 'efi') issues.push('W trybie UEFI brakuje rozpoznanej partycji EFI System Partition.');
    if (s.mode === 'legacy' && s.system !== 'active') issues.push('Tryb Legacy wymaga poprawnej aktywnej partycji rozruchowej MBR.');
    if (s.disk === 'large' && s.partition === 'mbr') issues.push('MBR nie zapewnia pełnego wykorzystania dysku większego niż 2 TB. Rozważ GPT po zabezpieczeniu danych.');
    if (s.goal === 'win11') {
      if (s.mode !== 'uefi') issues.push('Dla standardowej instalacji Windows 11 wymagany jest rozruch UEFI.');
      if (s.partition !== 'gpt') issues.push('Dla standardowej instalacji Windows 11 użyj GPT.');
      if (s.secure !== 'on') issues.push('Sprawdź obsługę i stan Secure Boot; dla tego ćwiczenia wymagane jest włączenie funkcji.');
      if (s.tpm !== 'on') issues.push('W ćwiczeniu Windows 11 wymagany jest TPM 2.0 włączony i gotowy.');
    }
    if (s.storage === 'raid') notes.push('RAID/VMD: przed instalacją lub naprawą upewnij się, że dostępny jest właściwy sterownik kontrolera.');
    if (s.storage === 'ide') notes.push('IDE to tryb historyczny; zweryfikuj obsługę systemu i ograniczenia wydajności.');
    if (s.mode === 'legacy' && s.goal === 'win10') notes.push('Legacy/MBR może być właściwe dla starszej platformy, o ile urządzenie i instalator obsługują taki tryb.');
    if (!issues.length) notes.push('Nie wykryto sprzeczności w podstawowych ustawieniach tego scenariusza. Potwierdź jeszcze wymagania producenta i sterowniki.');
    return {ok:issues.length===0,issues,notes};
  }
  root.ACADEMY_FIX155_CORE = Object.freeze({ipv4ToInt,intToIpv4,subnet,evaluateBios});
})(typeof globalThis !== 'undefined' ? globalThis : this);
