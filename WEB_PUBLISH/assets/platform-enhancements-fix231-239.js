/* FIX231–FIX239: konto, powiadomienia, dostępność, język, offline, opiekunowie i jakość treści. */
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const text = (node, value) => { if (node) node.textContent = String(value ?? ''); };
  const api = async (path, options={}) => {
    const response = await fetch(`/api${path}`, { credentials:'same-origin', cache:'no-store', ...options,
      headers: { accept:'application/json', ...(options.body ? {'content-type':'application/json'} : {}), ...(options.headers||{}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.message || data.error || `HTTP ${response.status}`); error.status=response.status; error.data=data; throw error; }
    return data;
  };
  const post = (path, body) => api(path, {method:'POST',body:JSON.stringify(body)});
  const patch = (path, body) => api(path, {method:'PATCH',body:JSON.stringify(body)});
  const b64url = value => { const raw=String(value||'').replace(/-/g,'+').replace(/_/g,'/'); const padded=raw+'='.repeat((4-raw.length%4)%4); return Uint8Array.from(atob(padded),c=>c.charCodeAt(0)); };

  // FIX232 — inbox, category preferences, Web Push subscription and read state.
  const inbox=$('#fix232Inbox'), status232=$('#fix232Status');
  let notificationData=null;
  function renderInbox(items){
    if(!inbox)return; inbox.replaceChildren();
    if(!items?.length){const empty=document.createElement('p');empty.className='muted';empty.textContent=currentLanguageFromApp()==='en'?'No notifications yet. New announcements, assignments and grades will appear here.':'Brak powiadomień. Nowe ogłoszenia, zadania i oceny pojawią się tutaj.';inbox.append(empty);return;}
    for(const item of items){
      const card=document.createElement('article');card.className=`fix232-notice${item.read_at?' is-read':''}`;
      const heading=document.createElement('b');heading.textContent=item.title||'Powiadomienie';
      const body=document.createElement('p');body.textContent=item.body||'';
      const meta=document.createElement('small');meta.textContent=new Date(item.created_at).toLocaleString();
      card.append(heading,body,meta);
      if(item.resource_url){const link=document.createElement('a');link.href=item.resource_url.startsWith('/')&&!item.resource_url.startsWith('//')?item.resource_url:'/?view=account';link.textContent='Otwórz';card.append(link);}
      if(!item.read_at){const button=document.createElement('button');button.type='button';button.className='btn btn-quiet btn-small';button.textContent='Oznacz jako przeczytane';button.addEventListener('click',async()=>{button.disabled=true;try{await post('/notifications',{action:'read',id:item.notification_id});await loadNotifications();}catch(e){text(status232,e.message);button.disabled=false;}});card.append(button);}
      inbox.append(card);
    }
  }
  async function loadNotifications(){
    if(!inbox)return;
    try{
      notificationData=await api('/notifications');
      for(const input of $$('[data-fix232-pref]'))input.checked=notificationData.preferences?.[input.dataset.fix232Pref]===true;
      renderInbox(notificationData.notifications);
      text(status232,`Nieprzeczytane: ${notificationData.unread}. Push: ${notificationData.push.configured?'skonfigurowany':'wymaga konfiguracji VAPID'}. E-mail: ${notificationData.emailReady?'dostępny po potwierdzeniu adresu':'wymaga potwierdzonego adresu i Resend'}.`);
      const pushButton=$('#fix232EnablePush');if(pushButton)pushButton.disabled=!notificationData.push.configured||!('PushManager'in window)||!('serviceWorker'in navigator);
    }catch(error){text(status232,error.status===401?'Zaloguj się, aby zarządzać powiadomieniami.':`Nie udało się pobrać powiadomień: ${error.message}`);}
  }
  $('#fix232SavePrefs')?.addEventListener('click',async()=>{
    const preferences={};for(const input of $$('[data-fix232-pref]'))preferences[input.dataset.fix232Pref]=input.checked;
    const button=$('#fix232SavePrefs');button.disabled=true;
    try{const data=await patch('/notifications',{preferences});text(status232,'Zapisano ustawienia powiadomień.');notificationData={...notificationData,preferences:data.preferences};}
    catch(error){text(status232,error.message);}
    finally{button.disabled=false;}
  });
  $('#fix232EnablePush')?.addEventListener('click',async()=>{
    const button=$('#fix232EnablePush');button.disabled=true;
    try{
      if(!notificationData?.push?.configured)throw new Error('Administrator nie skonfigurował kluczy VAPID.');
      if(!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window))throw new Error('Ta przeglądarka nie obsługuje Web Push.');
      const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Zgoda na powiadomienia nie została udzielona.');
      const registration=await navigator.serviceWorker.ready;
      const subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64url(notificationData.push.publicKey)});
      await post('/notifications',{action:'subscribe',subscription:subscription.toJSON()});
      const preferences={...(notificationData.preferences||{}),push:true};await patch('/notifications',{preferences});
      text(status232,'Powiadomienia Push włączone dla tego urządzenia.');await loadNotifications();
    }catch(error){text(status232,`Nie udało się włączyć Push: ${error.message}`);}
    finally{button.disabled=false;}
  });
  $('#fix232UnsubscribePush')?.addEventListener('click',async()=>{try{const registration=await navigator.serviceWorker.ready,subscription=await registration.pushManager.getSubscription();if(!subscription){text(status232,'Na tym urządzeniu nie ma aktywnej subskrypcji Push. Inne urządzenia nie zostały zmienione.');return;}const endpoint=subscription.endpoint;await subscription.unsubscribe();await api('/notifications',{method:'DELETE',body:JSON.stringify({action:'unsubscribe',endpoint})});text(status232,'Wyłączono Push tylko dla tego urządzenia. Pozostałe urządzenia zachowują swoje subskrypcje.');await loadNotifications();}catch(e){text(status232,e.message);}});
  $('#fix232ReadAll')?.addEventListener('click',async()=>{try{await post('/notifications',{action:'read-all'});await loadNotifications();}catch(e){text(status232,e.message);}});
  loadNotifications();

  // FIX233 — coherent PL/EN setting; lesson engine uses its own title/content EN fields.
  const language=$('#fix233Language');
  const uiTexts={
    pl:{fix231239Title:'Centrum powiadomień, dostępności i prywatności',fix232Title:'Powiadomienia',fix233Title:'Język interfejsu',fix234Title:'Dostępność',fix237Title:'Opiekun / rodzic — udostępnianie postępów',fix238Title:'Moje materiały offline',fix236Title:'Zgłoś błąd materiału',fix232Description:'Ogłoszenia, zadania, oddane prace i oceny są widoczne w skrzynce platformy. E-mail i Web Push wymagają konfiguracji usług po stronie serwera.',fix233Description:'Wybierz język kontrolek i głównych elementów nawigacji. Treści lekcji używają dostępnych tłumaczeń PL/EN.',fix234Description:'Te ustawienia są przechowywane lokalnie w tej przeglądarce.',fix237Description:'Uczeń tworzy jednorazowy kod, opiekun wysyła prośbę, a uczeń musi ją zatwierdzić. Opiekun widzi wyłącznie zagregowane postępy, wyniki egzaminów i liczbę certyfikatów.',fix238Description:'Zapisz lokalną tekstową kopię aktualnie otwartego materiału. Sesje logowania, sekrety, multimedia i chronione treści API nie są kopiowane.',fix236Description:'Zgłoszenie trafia do ręcznej moderacji i nie zmienia lekcji automatycznie. Nie wklejaj haseł, kluczy API ani danych klientów.',savePrefs:'Zapisz ustawienia',enablePush:'Włącz Push na tym urządzeniu',readAll:'Oznacz wszystkie jako przeczytane',saveCurrent:'Zapisz aktualny materiał',refresh:'Odśwież listę',createInvite:'Utwórz kod zaproszenia',requestLink:'Poproś o dostęp',report:'Wyślij do weryfikacji'},
    en:{fix231239Title:'Notifications, accessibility and privacy',fix232Title:'Notifications',fix233Title:'Interface language',fix234Title:'Accessibility',fix237Title:'Parent / guardian — share learning progress',fix238Title:'My offline materials',fix236Title:'Report a content issue',fix232Description:'Class announcements, assignments, submissions and grades appear in the platform inbox. Email and Web Push require server-side configuration.',fix233Description:'Choose the language for controls and main navigation. Lesson content uses available PL/EN translations.',fix234Description:'These settings are stored locally in this browser.',fix237Description:'The student creates a one-time code, the guardian requests access and the student must approve. The guardian sees only aggregated progress, exam results and certificate counts.',fix238Description:'Save a local text copy of the currently open material. Login sessions, secrets, media players and protected API content are not copied.',fix236Description:'Reports go to manual moderation and do not change lessons automatically. Do not paste passwords, API keys or customer data.',savePrefs:'Save settings',enablePush:'Enable Push on this device',readAll:'Mark all as read',saveCurrent:'Save current material',refresh:'Refresh list',createInvite:'Create invitation code',requestLink:'Request access',report:'Submit for review'}
  };
  const translatable=[['#fix231239Title','fix231239Title'],['#fix232Title','fix232Title'],['#fix233Title','fix233Title'],['#fix234Title','fix234Title'],['#fix237Title','fix237Title'],['#fix238Title','fix238Title'],['#fix236Title','fix236Title'],['#fix232Description','fix232Description'],['#fix233Description','fix233Description'],['#fix234Description','fix234Description'],['#fix237Description','fix237Description'],['#fix238Description','fix238Description'],['#fix236Help','fix236Description'],['#fix232SavePrefs','savePrefs'],['#fix232EnablePush','enablePush'],['#fix232ReadAll','readAll'],['#fix238SaveCurrent','saveCurrent'],['#fix238Refresh','refresh'],['#fix237CreateInvite','createInvite'],['#fix237RequestForm button','requestLink'],['#fix236ReportForm button','report']];
  function applyLanguage(lang){const map=uiTexts[lang]||uiTexts.pl;for(const [selector,key]of translatable){const node=$(selector);if(!node)continue;if(!node.dataset.fix233Original)node.dataset.fix233Original=node.textContent;node.textContent=map[key]||node.dataset.fix233Original;}if(language)language.value=lang;document.documentElement.lang=lang;}
  if(language){const current=localStorage.getItem('academyLanguage')==='en'?'en':'pl';applyLanguage(current);language.addEventListener('change',()=>{const target=language.value==='en'?'en':'pl',previous=currentLanguageFromApp();const toggle=$('#languageToggle');if(toggle&&((target==='en')!==(previous==='en')))toggle.click();else{try{localStorage.setItem('academyLanguage',target);}catch{}}applyLanguage(target);text($('#fix233Status'),target==='en'?'Interface language preference saved.':'Zapisano preferencję języka.');});}
  function currentLanguageFromApp(){try{return localStorage.getItem('academyLanguage')||'pl';}catch{return 'pl';}}
  $('#languageToggle')?.addEventListener('click',()=>{const selected=currentLanguageFromApp()==='en'?'en':'pl';applyLanguage(selected);});

  // FIX234 — accessibility preference controls.
  const accessKeys={font:'fix234-font',contrast:'fix234-contrast',links:'fix234-links',motion:'fix234-motion'};
  function loadAccessibility(){let saved={};try{saved=JSON.parse(localStorage.getItem('nauka.fix234.a11y')||'{}');}catch{}
    const root=document.documentElement;root.dataset.fix234Font=saved.font||'normal';root.classList.toggle('fix234-contrast',!!saved.contrast);root.classList.toggle('fix234-links',!!saved.links);root.classList.toggle('fix234-motion',!!saved.motion);
    if($('#fix234Font'))$('#fix234Font').value=saved.font||'normal';for(const [id,key]of [['fix234Contrast','contrast'],['fix234Links','links'],['fix234Motion','motion']])if($(`#${id}`))$(`#${id}`).checked=!!saved[key];
  }
  function saveAccessibility(){const data={font:$('#fix234Font')?.value||'normal',contrast:!!$('#fix234Contrast')?.checked,links:!!$('#fix234Links')?.checked,motion:!!$('#fix234Motion')?.checked};try{localStorage.setItem('nauka.fix234.a11y',JSON.stringify(data));}catch{}loadAccessibility();}
  ['#fix234Font','#fix234Contrast','#fix234Links','#fix234Motion'].forEach(selector=>$(selector)?.addEventListener('change',saveAccessibility));
  $('#fix234Reset')?.addEventListener('click',()=>{try{localStorage.removeItem('nauka.fix234.a11y');}catch{}loadAccessibility();});loadAccessibility();

  // FIX237 — explicit, two-sided consent for guardian access. No chat or private notes are exposed.
  const guardianStatus=$('#fix237Status'),guardianLinks=$('#fix237Links');
  function renderGuardian(data){if(!guardianLinks)return;guardianLinks.replaceChildren();
    const groups=[['Prośby dotyczące Twojego profilu',data.asStudent||[],true],['Połączenia jako opiekun',data.asGuardian||[],false]];
    for(const [heading,items,isStudent]of groups){const title=document.createElement('b');title.textContent=heading;guardianLinks.append(title);
      if(!items.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Brak wpisów.';guardianLinks.append(empty);continue;}
      for(const link of items){const row=document.createElement('article');row.className='fix232-notice';const name=document.createElement('b');name.textContent=link.nickname||'Użytkownik';const detail=document.createElement('p');detail.textContent=`Status: ${link.status} · ${new Date(link.created_at).toLocaleString()}`;row.append(name,detail);
        const actions=[];if(isStudent&&link.status==='pending'){actions.push(['Zatwierdź','approve'],['Odrzuć','reject']);}if(link.status==='approved'||link.status==='pending')actions.push(['Cofnij dostęp','revoke']);
        for(const [label,action]of actions){const button=document.createElement('button');button.type='button';button.className='btn btn-quiet btn-small';button.textContent=label;button.addEventListener('click',async()=>{button.disabled=true;try{await post('/guardians',{action,linkId:link.link_id});await loadGuardians();}catch(e){text(guardianStatus,e.message);button.disabled=false;}});row.append(button);}guardianLinks.append(row);
      }
    }
    for(const child of data.children||[]){const row=document.createElement('article');row.className='fix232-notice';const name=document.createElement('b');name.textContent=`Postępy: ${child.nickname}`;const details=document.createElement('p');details.textContent=`Lekcje: ${child.lessons.completed}/${child.lessons.total} · Egzaminy zaliczone: ${child.exams.passed}/${child.exams.total} · Certyfikaty: ${child.certificates}`;row.append(name,details);guardianLinks.append(row);}
  }
  async function loadGuardians(){try{const data=await api('/guardians');renderGuardian(data);text(guardianStatus,'Dane opiekunów są chronione zgodą ucznia.');}catch(e){text(guardianStatus,e.status===401?'Zaloguj się i włącz dobrowolną synchronizację konta.':e.message);}}
  $('#fix237CreateInvite')?.addEventListener('click',async()=>{const button=$('#fix237CreateInvite');button.disabled=true;try{const data=await post('/guardians',{action:'create-invite'});$('#fix237InviteCode').value=data.code;text(guardianStatus,`Kod ważny do ${new Date(data.expiresAt).toLocaleString()}. Przekaż go wybranej osobie dorosłej.`);}catch(e){text(guardianStatus,e.message);}finally{button.disabled=false;}});
  $('#fix237CopyInvite')?.addEventListener('click',async()=>{const value=$('#fix237InviteCode')?.value;if(!value){text(guardianStatus,'Najpierw utwórz kod zaproszenia.');return;}try{if(!navigator.clipboard?.writeText)throw new Error('Schowek jest niedostępny. Zaznacz kod i skopiuj go ręcznie.');await navigator.clipboard.writeText(value);text(guardianStatus,'Skopiowano kod.');}catch(error){text(guardianStatus,error.message);}});
  $('#fix237RequestForm')?.addEventListener('submit',async event=>{event.preventDefault();try{await post('/guardians',{action:'request-link',code:$('#fix237RequestCode').value.trim()});$('#fix237RequestCode').value='';text(guardianStatus,'Prośba wysłana. Czekaj na zatwierdzenie ucznia.');await loadGuardians();}catch(e){text(guardianStatus,e.message);}});
  loadGuardians();

  // FIX238 — IndexedDB text snapshots of the currently opened lesson. This is an offline copy, not a complete PWA mirror.
  const OFFLINE_DB='nauka-offline-fix238',OFFLINE_STORE='snapshots';
  function openOfflineDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(OFFLINE_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(OFFLINE_STORE,{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function offlineAction(mode,record){const db=await openOfflineDb();return new Promise((resolve,reject)=>{const tx=db.transaction(OFFLINE_STORE,mode),store=tx.objectStore(OFFLINE_STORE);let result;if(mode==='readonly'){const req=store.getAll();req.onsuccess=()=>{result=req.result;};req.onerror=()=>reject(req.error);}else{const req=store.put(record);req.onsuccess=()=>{result=req.result;};req.onerror=()=>reject(req.error);}tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};});}
  async function refreshOffline(){const list=$('#fix238List');if(!list)return;try{const items=(await offlineAction('readonly')).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));list.replaceChildren();if(!items.length){const p=document.createElement('p');p.className='muted';p.textContent='Nie zapisano jeszcze materiałów offline.';list.append(p);return;}for(const item of items){const card=document.createElement('article');card.className='fix232-notice';const title=document.createElement('b');title.textContent=item.title;const meta=document.createElement('small');meta.textContent=`Zapisano: ${new Date(item.savedAt).toLocaleString()} · ${item.text.length} znaków`;const open=document.createElement('button');open.type='button';open.className='btn btn-quiet btn-small';open.textContent='Otwórz offline';open.addEventListener('click',()=>{const modal=$('#contentModal');text($('#modalTitle'),item.title);const body=$('#modalBody');body.replaceChildren();const pre=document.createElement('pre');pre.className='fix238-offline-text';pre.textContent=item.text;body.append(pre);modal?.classList.remove('hidden');});const del=document.createElement('button');del.type='button';del.className='btn btn-quiet btn-small';del.textContent='Usuń kopię';del.addEventListener('click',async()=>{const db=await openOfflineDb();await new Promise((resolve,reject)=>{const tx=db.transaction(OFFLINE_STORE,'readwrite');tx.objectStore(OFFLINE_STORE).delete(item.id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();await refreshOffline();});card.append(title,meta,open,del);list.append(card);}}catch(error){text($('#fix238Status'),`Magazyn offline niedostępny: ${error.message}`);}}
  $('#fix238SaveCurrent')?.addEventListener('click',async()=>{const body=$('#modalBody'),modal=$('#contentModal');if(!body||!modal||modal.classList.contains('hidden')){text($('#fix238Status'),'Najpierw otwórz lekcję lub materiał, który chcesz zapisać.');return;}const clone=body.cloneNode(true);clone.querySelectorAll('script,style,form,button,input,textarea,select,video,audio,iframe,object,embed').forEach(node=>node.remove());clone.querySelectorAll('*').forEach(node=>{for(const attr of [...node.attributes])if(/^on/i.test(attr.name)||['src','href','style'].includes(attr.name))node.removeAttribute(attr.name);});const content=(clone.innerText||clone.textContent||'').replace(/\n{3,}/g,'\n\n').trim();if(content.length<40){text($('#fix238Status'),'Materiał nie zawiera wystarczającej ilości tekstu do zapisania.');return;}const title=($('#modalTitle')?.textContent||'Materiał edukacyjny').trim().slice(0,180),savedAt=new Date().toISOString(),id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;try{const current=await offlineAction('readonly');if(current.length>=100)throw new Error('Limit wynosi 100 zapisanych materiałów. Usuń starsze kopie.');await offlineAction('readwrite',{id,title,text:content,savedAt,source:location.pathname+location.search});text($('#fix238Status'),'Zapisano tekstową kopię materiału offline. Multimedia i chronione zasoby nie są kopiowane.');await refreshOffline();}catch(e){text($('#fix238Status'),e.message);}});
  $('#fix238Refresh')?.addEventListener('click',refreshOffline);refreshOffline();

  // FIX236 — student reports; administrator moderation through same admin token.
  $('#fix236ReportForm')?.addEventListener('submit',async event=>{event.preventDefault();const button=event.currentTarget.querySelector('[type=submit]');button.disabled=true;try{const data=await post('/content-reports',{resourceId:$('#fix236Resource').value.trim(),category:$('#fix236Category').value,description:$('#fix236Description').value.trim()});text($('#fix236Status'),data.message);event.currentTarget.reset();}catch(e){text($('#fix236Status'),e.message);}finally{button.disabled=false;}});
  $('#fix236LoadReports')?.addEventListener('click',async()=>{const token=$('#u6AdminToken')?.value.trim()||$('#adminToken')?.value.trim();const queue=$('#fix236AdminQueue');text($('#fix236AdminStatus'),'Pobieram kolejkę…');if(!token){text($('#fix236AdminStatus'),'Wpisz sekret administratora w istniejącym panelu.');return;}try{const response=await fetch('/api/admin/content-reports',{credentials:'same-origin',cache:'no-store',headers:{authorization:`Bearer ${token}`,accept:'application/json'}});const data=await response.json();if(!response.ok)throw new Error(data.message||data.error||`HTTP ${response.status}`);queue.replaceChildren();for(const item of data.reports||[]){const card=document.createElement('article');card.className='fix232-notice';const title=document.createElement('b');title.textContent=`${item.category} · ${item.status} · ${item.resource_id}`;const description=document.createElement('p');description.textContent=item.description;const meta=document.createElement('small');meta.textContent=`${item.nickname} · ${new Date(item.created_at).toLocaleString()}`;card.append(title,description,meta);for(const [label,value]of [['W trakcie','reviewing'],['Naprawione','fixed'],['Odrzuć','rejected']]){const button=document.createElement('button');button.type='button';button.className='btn btn-quiet btn-small';button.textContent=label;button.addEventListener('click',async()=>{button.disabled=true;try{await fetch('/api/admin/content-reports',{method:'PATCH',credentials:'same-origin',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({reportId:item.report_id,status:value})}).then(async r=>{if(!r.ok)throw new Error((await r.json()).message||'Nie zapisano statusu');});$('#fix236LoadReports').click();}catch(e){text($('#fix236AdminStatus'),e.message);button.disabled=false;}});card.append(button);}queue.append(card);}text($('#fix236AdminStatus'),`Pobrano ${data.reports?.length||0} zgłoszeń.`);}catch(e){text($('#fix236AdminStatus'),`Nie udało się pobrać zgłoszeń: ${e.message}`);}});
})();
