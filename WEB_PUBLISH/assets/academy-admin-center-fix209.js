/* FIX209 — panel diagnostyki środowiska dostępny wyłącznie przez istniejący token admina. */
(() => {
  'use strict';
  const button=document.getElementById('a209RunHealth');
  const output=document.getElementById('a209HealthOutput');
  const tokenInput=document.getElementById('adminToken');
  if(!button||!output||!tokenInput)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  button.addEventListener('click',async()=>{
    const token=tokenInput.value.trim();
    if(token.length<16){output.textContent='Wpisz token administratora w istniejącym polu powyżej.';return;}
    button.disabled=true;output.textContent='Sprawdzam D1, tabele, Gemini i pięciu dostawców OAuth…';
    try{
      const response=await fetch('/api/admin/health',{credentials:'same-origin',cache:'no-store',headers:{authorization:`Bearer ${token}`,accept:'application/json'}});
      let data={};try{data=await response.json();}catch{}
      if(!response.ok)throw new Error(data.message||data.error||`HTTP ${response.status}`);
      const checks=data.checks||{},status=item=>item?.ok?'OK':'UWAGA';
      const rows=[['Baza D1',status(checks.d1),checks.d1?.detail||''],['Schemat danych',status(checks.schema),(checks.schema?.missing||[]).join(', ')||'Wymagane tabele istnieją'],['Gemini',checks.gemini?.configured?'SKONFIGUROWANY':'BRAK KLUCZA','Tylko status; sekret nie jest ujawniany']];
      for(const [provider,item] of Object.entries(checks.oauth||{}))rows.push([`OAuth ${provider}`,item.configured?'SKONFIGUROWANY':'NIEKOMPLETNY',item.configured?'ID i sekret obecne':`Brak: ${(item.missingKeys||[]).join(', ')}`]);
      for(const [key,item] of Object.entries(data.analytics||{})){if(key==='personalDataReturned')continue;const label=({users:'Konta użytkowników',activeSessions:'Aktywne sesje',events:'Zdarzenia platformy',examAttempts:'Podejścia egzaminacyjne',certificates:'Certyfikaty',classes:'Klasy online',securityEvents:'Zdarzenia bezpieczeństwa'})[key]||key;if(item&&typeof item==='object'&&'available'in item)rows.push([label,item.available?'DOSTĘPNE':'BRAK TABELI',item.available?String(item.value):'Zastosuj wymaganą migrację']);}
      output.innerHTML=`<div class="a209-health-head"><b>${data.ok?'Kontrole podstawowe zakończone':'Wykryto braki lub błędy'}</b><small>${esc(data.checkedAt)} · produkt ${esc(data.productVersion)}</small></div><div class="a209-health-grid">${rows.map(([name,state,detail])=>`<article><b>${esc(name)}</b><span>${esc(state)}</span><small>${esc(detail)}</small></article>`).join('')}</div><p>${esc(data.runtime)}</p><p class="a209-health-note">Nie zwrócono sekretów ani danych kont. Ten widok nie potwierdza statusu publikacji ani nie wykonuje deployu.</p>`;
    }catch(error){output.textContent=`Nie udało się wykonać kontroli: ${error.message}`;}
    finally{button.disabled=false;}
  });
})();
