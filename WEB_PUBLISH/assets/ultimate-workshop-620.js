/* NAPRAWA PC AKADEMIA 6.2.0 — Ultimate Workshop modules */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Multimeter training
function meter(){
 const mode=$('np62-meter-mode'), point=$('np62-test-point'), out=$('np62-meter-value'), state=$('np62-meter-state');
 if(!mode||!point||!out)return;
 const v=Number(point.value), m=mode.value;
 if(m==='voltage'){out.textContent=v.toFixed(2)+' V';state.textContent='Odczyt przykładowy napięcia DC';}
 else if(m==='resistance'){out.textContent=(v===0?'0.0':'1.20 k')+' Ω';state.textContent='Wartość demonstracyjna — rezystancję mierz przy odłączonym zasilaniu';}
 else if(m==='continuity'){out.textContent=v===0?'BEEP / 0.2 Ω':'OL / BRAK';state.textContent='Symulacja ciągłości, nie rzeczywisty test zwarcia';}
 else {out.textContent='— A';state.textContent='Prąd wymaga właściwego wpięcia miernika szeregowo; ćwiczenie tylko teoretyczne';}
}
['np62-meter-mode','np62-test-point'].forEach(id=>$(id)?.addEventListener('change',meter)); meter();
function ohm(){
 const u=Number($('np62-voltage')?.value),r=Number($('np62-resistance')?.value);
 const i=$('np62-current'),p=$('np62-power'); if(!i||!p)return;
 if(!Number.isFinite(u)||!Number.isFinite(r)||r<=0||u<0){i.textContent='—';p.textContent='Podaj U ≥ 0 i R > 0';return;}
 const a=u/r,w=u*a;i.textContent=a.toFixed(4)+' A';p.textContent='Moc: '+w.toFixed(3)+' W';
}
['np62-voltage','np62-resistance'].forEach(id=>$(id)?.addEventListener('input',ohm));ohm();
$('np62-case-options')?.addEventListener('click',e=>{
 const b=e.target.closest('button[data-answer]');if(!b)return;
 const ok=b.dataset.answer==='correct',f=$('np62-case-feedback');
 f.className='np62-feedback '+(ok?'good':'bad');
 f.textContent=ok?'Prawidłowo. Najpierw oględziny i bezpieczne pomiary według dokumentacji. Nie wymieniaj układów bez potwierdzenia przyczyny.':'Nieprawidłowo. Wymiana „na próbę” lub losowy BIOS może pogłębić uszkodzenie. Zacznij od oględzin i kontrolowanych pomiarów.';
});
// Model finder is an explicitly labelled starter directory; no fabricated boardview files.
const models=[
 ['Lenovo','ThinkPad T / X / L series','Laptop','Oznaczenie płyty zależy od generacji i konfiguracji. Weryfikuj FRU i board ID z laminatu.'],
 ['Dell','Latitude / Precision / XPS','Laptop','Weryfikuj Service Tag, DP/N oraz rewizję PCB.'],
 ['HP','EliteBook / ProBook / ZBook','Laptop','Weryfikuj product number i oznaczenie płyty.'],
 ['ASUS','ROG / TUF / VivoBook / ZenBook','Laptop','Weryfikuj pełny model i rewizję płyty.'],
 ['Acer','Aspire / Nitro / Predator / TravelMate','Laptop','Weryfikuj platformę i oznaczenie PCB.'],
 ['MSI','Gaming / Creator / Modern','Laptop','Weryfikuj kod płyty i rewizję.'],
 ['Gigabyte','AORUS / Gaming / Eagle','Karta graficzna','Weryfikuj dokładny P/N, rewizję i wariant PCB.'],
 ['ASUS','GeForce / Radeon series','Karta graficzna','Ten sam GPU może mieć różne PCB i sekcje zasilania.'],
 ['MSI','GeForce / Radeon series','Karta graficzna','Weryfikuj P/N oraz rewizję laminatu.'],
 ['Intel / AMD','Desktop motherboard platforms','Płyta główna','Weryfikuj model, chipset i rewizję PCB.']
];
function renderModels(){
 const host=$('np62-model-results');if(!host)return;
 const q=($('np62-model-search')?.value||'').toLowerCase(),type=$('np62-model-type')?.value||'all';
 const found=models.filter(x=>(type==='all'||x[2]===type)&&x.join(' ').toLowerCase().includes(q));
 host.innerHTML=found.map(x=>`<article class="np62-model-card"><span>${safe(x[2])}</span><h3>${safe(x[0])} · ${safe(x[1])}</h3><p>${safe(x[3])}</p><small>Wpis katalogowy / wymaga identyfikacji konkretnego egzemplarza</small></article>`).join('')||'<p>Brak wyników. Spróbuj krótszej nazwy lub sprawdź kategorię.</p>';
}
$('np62-model-search')?.addEventListener('input',renderModels);$('np62-model-type')?.addEventListener('change',renderModels);renderModels();
})();
