/* Akademia Serwisu PRO 3.9.8 — konta, OAuth, moderacja wiedzy i czat Google Gemini wyłącznie dla serwisu PC. */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const API = '/api';
  const LOCAL_CHAT_KEY = 'academyChatHistory';
  const LOCAL_CONV_KEY = 'academyChatConversationsV360';
  let active = false, hasCloudProfile = false, contributorReady = false, user = null, conversationId = null, localConversationId = null, adminToken = '', chatTranscript = [], emailAuthMode = 'register', passwordResetToken = '';
  const fmt = n => new Intl.NumberFormat(document.documentElement.lang || 'pl-PL').format(Number(n || 0));
  async function api(path, options={}) {
    const headers = { 'accept':'application/json', ...(options.headers||{}) };
    if (options.body && !headers['content-type']) headers['content-type']='application/json';
    const response = await fetch(`${API}${path}`, { credentials:'same-origin', cache:'no-store', ...options, headers });
    let data={}; try { data=await response.json(); } catch {}
    if (!response.ok) { const error = new Error(data.message || data.error || `HTTP ${response.status}`); error.status=response.status; error.data=data; throw error; }
    return data;
  }
  const say = (id, message, ok=false) => { const el=$(id); if(el){el.textContent=message;const tone=ok===true?'success':(ok==='info'?'info':(ok==='warning'?'warning':(ok==='error'?'error':(!message?'': 'error'))));el.classList.toggle('success',tone==='success');el.classList.toggle('error',tone==='error');el.classList.toggle('info',tone==='info');el.classList.toggle('warning',tone==='warning');el.dataset.tone=tone;} };
  const sayInfo = (id, message) => say(id, message, 'info');
  function focusAuthIssue(selector){const el=$(selector);if(!el)return;el.setAttribute('aria-invalid','true');el.focus({preventScroll:true});el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});}
  function clearAuthInvalid(){['#emailAuthEmail','#emailAuthPassword','#emailAuthPasswordConfirm','#emailAuthTerms'].forEach(sel=>$(sel)?.removeAttribute('aria-invalid'));$('#emailAuthTermsWrap')?.classList.remove('needs-attention');}
  function updatePasswordGuide(){const pass=$('#emailAuthPassword')?.value||'',confirm=$('#emailAuthPasswordConfirm')?.value||'';const length=$('#authPassLength'),match=$('#authPassMatch'),meter=$('#emailAuthPasswordMeter');const lengthOK=pass.length>=(emailAuthMode==='register'?12:1),matchOK=!!confirm&&pass===confirm;length?.classList.toggle('ok',lengthOK);if(length)length.textContent=`${lengthOK?'✓':'○'} ${emailAuthMode==='register'?'Co najmniej 12 znaków':'Hasło wpisane'}`;match?.classList.toggle('ok',matchOK);if(match)match.textContent=`${matchOK?'✓':'○'} Hasła są zgodne`;if(meter){const score=Math.min(100,Math.round(Math.max(0,pass.length-4)/16*100));meter.style.width=`${score}%`;}}
  function togglePasswordVisibility(inputId,buttonId){const input=$(inputId),button=$(buttonId);if(!input||!button)return;const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'◌':'◉';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',show?'Ukryj hasło':'Pokaż hasło');}
  function localGet(key, fallback) { try { const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback; } catch { return fallback; } }
  function localSet(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); } catch {} }
  function localConversations(){const x=localGet(LOCAL_CONV_KEY,[]);return Array.isArray(x)?x:[];}
  function setLocalConversations(x){localSet(LOCAL_CONV_KEY,x.slice(0,40));}
  function ensureLocalConversation(){
    if(localConversationId)return localConversationId;
    localConversationId=(crypto.randomUUID?.()||`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    const list=localConversations();list.unshift({id:localConversationId,title:'Nowa rozmowa',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),messages:[]});setLocalConversations(list);
    return localConversationId;
  }
  function localAppend(role,content,sources=[],mode='local-search'){
    const id=ensureLocalConversation(),list=localConversations(),conv=list.find(x=>x.id===id);
    if(!conv)return;
    conv.messages=Array.isArray(conv.messages)?conv.messages:[];
    conv.messages.push({id:`local-msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,role,content:String(content||''),sources,mode,at:new Date().toISOString()});
    if(conv.messages.filter(x=>x.role==='user').length===1)conv.title=String(content||'Rozmowa').slice(0,72);
    conv.updatedAt=new Date().toISOString();list.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));setLocalConversations(list);
    const flat=localGet(LOCAL_CHAT_KEY,[]);flat.push({role,content:String(content||''),sources,mode,at:new Date().toISOString(),conversationId:id});localSet(LOCAL_CHAT_KEY,flat.slice(-160));
  }
  function announceSessionChange() {
    window.dispatchEvent(new CustomEvent('academy:session-changed', { detail: { active: contributorReady, email: user?.email || null } }));
  }
  function setAccountUI() {
    const state=$('#cloudAccountState'); if(state)state.textContent=active?'CHMURA':user?.email?'KONTO':contributorReady?'PSEUDONIM':'LOKALNIE';
    $('#cloudConsentControls')?.classList.toggle('hidden',active);
    $('#cloudProfilePanel')?.classList.toggle('hidden',!hasCloudProfile);
    $('#cloudDisabledNotice')?.classList.toggle('hidden',!hasCloudProfile||active);
    $('#disableCloudSync')?.classList.toggle('hidden',!active);
    $('#contributionProfileGate')?.classList.toggle('hidden',contributorReady);
    $('#contributionFormPanel')?.classList.toggle('hidden',!contributorReady);
    $('#emailAuthSessionInfo')?.classList.toggle('hidden',!user?.email);
    $('#emailAuthFormWrap')?.classList.toggle('hidden',!!user?.email);
    const sessionLabel=$('#emailAuthSessionLabel'); if(sessionLabel)sessionLabel.textContent=`${user?.email || ''} · ${user?.nickname || ''}`;
    const emailRow=$('#cloudUserEmailRow'); emailRow?.classList.toggle('hidden',!user?.email);
    const emailNode=$('#cloudUserEmail'); if(emailNode)emailNode.textContent=user?.email||'';
    const author=$('#activeContributorNickname'); if(author)author.textContent=user?.nickname||'—';
    if(hasCloudProfile&&user){const id=$('#cloudUserId'), nick=$('#cloudUserNickname'), cloudNick=$('#cloudNickname');if(id)id.textContent=user.id;if(nick)nick.textContent=user.nickname||'';if(cloudNick)cloudNick.value=user.nickname||'';}
  }
  function setEmailAuthMode(mode, keepStatus=false) {
    emailAuthMode = mode === 'login' ? 'login' : 'register';
    const register = emailAuthMode === 'register';
    $('#emailAuthRegisterMode')?.classList.toggle('active', register);
    $('#emailAuthLoginMode')?.classList.toggle('active', !register);
    $('#emailAuthRegisterMode')?.setAttribute('aria-pressed',String(register));
    $('#emailAuthLoginMode')?.setAttribute('aria-pressed',String(!register));
    $('#emailAuthNicknameWrap')?.classList.toggle('hidden', !register);
    $('#emailAuthConfirmWrap')?.classList.toggle('hidden', !register);
    $('#emailAuthTermsWrap')?.classList.toggle('hidden', !register);
    $('#emailForgotPasswordButton')?.classList.toggle('hidden', register);
    $('#emailAuthPasswordGuide')?.classList.toggle('hidden', !register);
    const pass=$('#emailAuthPassword'); if(pass){pass.autocomplete=register?'new-password':'current-password';pass.placeholder=register?'Minimum 12 znaków':'Wpisz hasło do konta';pass.minLength=register?12:1;}
    const confirm=$('#emailAuthPasswordConfirm'); if(confirm)confirm.required=register;
    const terms=$('#emailAuthTerms'); if(terms)terms.required=register;
    const submit=$('#emailAuthSubmit'); if(submit)submit.textContent=register?'Utwórz bezpłatne konto →':'Zaloguj się →';
    const hint=$('#authPasswordHint');if(hint)hint.textContent=register?'Minimum 12 znaków':'Wpisz hasło do konta';
    updatePasswordGuide();clearAuthInvalid();
    if(!keepStatus)sayInfo('#emailAuthStatus',register?'Wypełnij e-mail, hasło (minimum 12 znaków), powtórz hasło i zaznacz wymaganą zgodę.':'Wpisz adres e-mail i hasło przypisane do istniejącego konta.');
  }
  async function loadEmailSecurity() {
    const panel=$('#accountEmailSecurityPanel');if(!panel||!hasCloudProfile)return;
    try{
      const r=await api('/auth/email');
      const status=$('#accountEmailSecurityStatus'),button=$('#sendEmailVerification');
      if(r.verified){if(status)status.textContent='Adres '+(r.email||'e-mail')+' jest potwierdzony.';if(button)button.classList.add('hidden');}
      else if(!r.deliveryReady){if(status)status.textContent='Wysyłka potwierdzeń jest nieaktywna. Brakuje konfiguracji: '+(r.deliveryMissing||[]).join(', ')+'.';if(button){button.classList.remove('hidden');button.disabled=true;button.textContent='Skonfiguruj pocztę, aby wysłać link';}}
      else{if(status)status.textContent='Adres '+(r.email||'e-mail')+' nie jest jeszcze potwierdzony.';if(button){button.classList.remove('hidden');button.disabled=false;button.textContent='Wyślij link potwierdzający';}}
    }catch(e){say('#accountEmailSecurityStatus',e.message||'Nie można odczytać statusu e-mail.');}
  }
  async function sendEmailVerification() {
    const button=$('#sendEmailVerification');if(button){button.disabled=true;button.textContent='Wysyłam…';}
    try{const r=await api('/auth/email',{method:'POST',body:JSON.stringify({action:'send-verification'})});say('#accountEmailSecurityStatus',r.message||'Wysłano wiadomość potwierdzającą.',true);}
    catch(e){say('#accountEmailSecurityStatus',e.message||'Nie udało się wysłać wiadomości.');}
    finally{if(button){button.disabled=false;button.textContent='Wyślij ponownie link';}}
  }
  function showPasswordResetRequest() {
    const panel=$('#emailForgotPanel');panel?.classList.remove('hidden');$('#emailPasswordResetPanel')?.classList.add('hidden');
    const email=$('#emailAuthEmail')?.value||'';if($('#emailForgotAddress'))$('#emailForgotAddress').value=email;
    $('#emailForgotAddress')?.focus();
  }
  async function requestPasswordReset() {
    const input=$('#emailForgotAddress'),button=$('#emailForgotSend'),email=String(input?.value||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){say('#emailForgotStatus','Wpisz prawidłowy adres e-mail.');input?.focus();return;}
    if(button){button.disabled=true;button.textContent='Wysyłam…';}
    try{const r=await api('/auth/password/forgot',{method:'POST',body:JSON.stringify({email})});say('#emailForgotStatus',r.message||'Jeśli konto istnieje, wysłaliśmy link resetujący.',true);}
    catch(e){say('#emailForgotStatus',e.message||'Nie udało się wysłać linku resetującego.');}
    finally{if(button){button.disabled=false;button.textContent='Wyślij link resetujący';}}
  }
  async function submitPasswordReset() {
    const password=$('#emailResetPassword')?.value||'',confirm=$('#emailResetPasswordConfirm')?.value||'',button=$('#emailResetSubmit');
    if(!passwordResetToken){say('#emailResetStatus','Brak tokenu resetującego. Poproś o nowy link.');return;}
    if(password.length<12||password.length>128){say('#emailResetStatus','Hasło musi mieć od 12 do 128 znaków.');$('#emailResetPassword')?.focus();return;}
    if(password!==confirm){say('#emailResetStatus','Powtórzone hasło jest inne.');$('#emailResetPasswordConfirm')?.focus();return;}
    if(button){button.disabled=true;button.textContent='Zapisuję…';}
    try{const r=await api('/auth/password/reset',{method:'POST',body:JSON.stringify({token:passwordResetToken,password})});passwordResetToken='';$('#emailResetPassword').value='';$('#emailResetPasswordConfirm').value='';$('#emailPasswordResetPanel')?.classList.add('hidden');history.replaceState(null,'',location.pathname+'#view=account');setEmailAuthMode('login',true);say('#emailAuthStatus',r.message||'Hasło zostało zmienione. Zaloguj się ponownie.',true);}
    catch(e){say('#emailResetStatus',e.message||'Link resetujący jest nieprawidłowy lub wygasł.');}
    finally{if(button){button.disabled=false;button.textContent='Zapisz nowe hasło';}}
  }

  function showTotpChallenge(message='Dodatkowa weryfikacja jest wymagana. Wpisz kod z aplikacji uwierzytelniającej.') {
    $('#emailAuthFormWrap')?.classList.add('hidden');
    $('#emailAuthTotpChallenge')?.classList.remove('hidden');
    sayInfo('#emailAuthStatus',message);
    $('#emailAuthTotpCode')?.focus();
  }
  function hideTotpChallenge() {
    $('#emailAuthTotpChallenge')?.classList.add('hidden');
    $('#emailAuthFormWrap')?.classList.remove('hidden');
    if($('#emailAuthTotpCode'))$('#emailAuthTotpCode').value='';
  }
  async function finishTotpChallenge() {
    const input=$('#emailAuthTotpCode'),button=$('#emailAuthTotpVerify');
    const code=String(input?.value||'').trim();
    if(!code){say('#emailAuthStatus','Wpisz kod z aplikacji albo kod odzyskiwania.');input?.focus();return;}
    if(button){button.disabled=true;button.textContent='Sprawdzam kod…';}
    try{
      const r=await api('/auth/totp/verify',{method:'POST',body:JSON.stringify({code})});
      hideTotpChallenge();
      const sessionReady=await refreshSession();
      if(!sessionReady){say('#emailAuthStatus','Kod został potwierdzony, ale przeglądarka nie potwierdziła nowej sesji. Zaloguj się ponownie.','warning');return;}
      if(r.usedRecoveryCode)say('#emailAuthStatus','Zalogowano. Użyty kod odzyskiwania został unieważniony — wygeneruj nowy zestaw w ustawieniach 2FA.','warning');
      else say('#emailAuthStatus',r.message||'Kod 2FA potwierdzony. Zalogowano.',true);
    }catch(e){say('#emailAuthStatus',e.message||'Nie udało się potwierdzić kodu 2FA.');input?.select();}
    finally{if(button){button.disabled=false;button.textContent='Potwierdź i zaloguj →';}}
  }
  async function loadTotpSecurity() {
    const panel=$('#accountTotpPanel');if(!panel||!hasCloudProfile)return;
    try{
      const r=await api('/auth/totp');
      const status=$('#accountTotpStatus');
      if(!r.encryptionReady){if(status)status.textContent='2FA niedostępne: serwer nie ma sekretu AUTH_TOTP_ENCRYPTION_KEY. Uruchom konfigurator FIX19.';$('#totpSetupStart').disabled=true;return;}
      if(r.enabled){if(status)status.textContent=`2FA jest aktywne. Pozostało ${r.recoveryCodesRemaining} niewykorzystanych kodów odzyskiwania.`;$('#totpSetupStart')?.classList.add('hidden');$('#totpSetupBlock')?.classList.add('hidden');$('#totpEnabledBlock')?.classList.remove('hidden');}
      else{if(status)status.textContent=r.pending?'Konfiguracja 2FA rozpoczęta. Wpisz kod z aplikacji, aby ją potwierdzić.':'2FA jest wyłączone. Włącz je, aby zabezpieczyć logowanie e-mail i konta społecznościowe.';$('#totpSetupStart')?.classList.remove('hidden');$('#totpEnabledBlock')?.classList.add('hidden');}
    }catch(e){const status=$('#accountTotpStatus');if(status)status.textContent=e.status===503?'2FA wymaga migracji 0011 i sekretu szyfrującego.':(e.message||'Nie można pobrać ustawień 2FA.');$('#totpSetupStart')?.setAttribute('disabled','disabled');}
  }
  async function startTotpSetup() {
    const button=$('#totpSetupStart');if(button){button.disabled=true;button.textContent='Przygotowuję…';}
    try{const r=await api('/auth/totp',{method:'POST',body:JSON.stringify({action:'setup'})});$('#totpSetupSecret').textContent=r.secret;$('#totpSetupUri').textContent=r.otpauthUri;$('#totpSetupBlock')?.classList.remove('hidden');say('#accountTotpStatus','Zeskanuj lub wpisz ręcznie klucz w aplikacji Authenticator. Konfiguracja wygasa za 10 minut.',true);$('#totpSetupCode')?.focus();}
    catch(e){say('#accountTotpStatus',e.message||'Nie udało się rozpocząć konfiguracji 2FA.');}
    finally{if(button){button.disabled=false;button.textContent='Włącz 2FA';}}
  }
  async function confirmTotpSetup() {
    const input=$('#totpSetupCode'),button=$('#totpSetupConfirm');
    if(button){button.disabled=true;button.textContent='Weryfikuję…';}
    try{const r=await api('/auth/totp',{method:'POST',body:JSON.stringify({action:'confirm',code:input?.value||''})});
      $('#totpSetupBlock')?.classList.add('hidden');$('#totpRecoveryCodes')?.classList.remove('hidden');$('#totpRecoveryCodesList').textContent=(r.recoveryCodes||[]).join('\n');
      say('#accountTotpStatus','2FA zostało włączone. Zapisz kody odzyskiwania teraz — nie będą ponownie wyświetlone.',true);await loadTotpSecurity();
    }catch(e){say('#accountTotpStatus',e.message||'Nie udało się potwierdzić 2FA.');}
    finally{if(button){button.disabled=false;button.textContent='Potwierdź konfigurację';}}
  }
  async function runTotpManagement(action) {
    const code=$('#totpManageCode')?.value||'';if(!code){say('#accountTotpStatus','Wpisz aktualny kod z aplikacji uwierzytelniającej.');$('#totpManageCode')?.focus();return;}
    if(action==='disable'&&!confirm('Wyłączyć uwierzytelnianie dwuetapowe?'))return;
    const button=action==='disable'?$('#totpDisable'):$('#totpRecoveryRegenerate');if(button)button.disabled=true;
    try{const r=await api('/auth/totp',{method:'POST',body:JSON.stringify({action:action==='disable'?'disable':'regenerate-recovery',code})});
      $('#totpManageCode').value='';
      if(r.recoveryCodes){$('#totpRecoveryCodes')?.classList.remove('hidden');$('#totpRecoveryCodesList').textContent=r.recoveryCodes.join('\n');}
      else $('#totpRecoveryCodes')?.classList.add('hidden');
      say('#accountTotpStatus',r.message||'Zaktualizowano ustawienia 2FA.',true);await loadTotpSecurity();
    }catch(e){say('#accountTotpStatus',e.message||'Nie udało się zmienić ustawień 2FA.');}
    finally{if(button)button.disabled=false;}
  }
  async function submitEmailAuth(form) {
    clearAuthInvalid();
    const email=String($('#emailAuthEmail')?.value||'').trim().toLowerCase();
    const password=String($('#emailAuthPassword')?.value||'');
    const nickname=String($('#emailAuthNickname')?.value||'').trim();
    const confirmPassword=String($('#emailAuthPasswordConfirm')?.value||'');
    const register=emailAuthMode==='register';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){say('#emailAuthStatus','Wpisz prawidłowy adres e-mail, np. technik@domena.pl.');focusAuthIssue('#emailAuthEmail');return;}
    if((register&&password.length<12)||(!register&&password.length<1)||password.length>128){say('#emailAuthStatus',register?'Hasło musi mieć od 12 do 128 znaków. Aktualnie: '+password.length+'.':'Wpisz hasło przypisane do istniejącego konta.');focusAuthIssue('#emailAuthPassword');updatePasswordGuide();return;}
    if(register&&password!==confirmPassword){say('#emailAuthStatus','Powtórzone hasło różni się od pierwszego. Wpisz identyczne hasło w obu polach.');focusAuthIssue('#emailAuthPasswordConfirm');updatePasswordGuide();return;}
    if(register&&!$('#emailAuthTerms')?.checked){$('#emailAuthTermsWrap')?.classList.add('needs-attention');say('#emailAuthStatus','Zaznacz pole „Akceptuję zasady korzystania i politykę prywatności”. Bez tej zgody konto nie zostanie utworzone.');focusAuthIssue('#emailAuthTerms');return;}
    if(register&&nickname&&nickname.length<3){say('#emailAuthStatus','Pseudonim musi mieć co najmniej 3 znaki albo pozostaw to pole puste.');focusAuthIssue('#emailAuthNickname');return;}
    const button=$('#emailAuthSubmit'); if(button){button.disabled=true;button.textContent=register?'Tworzę konto…':'Loguję…';}
    sayInfo('#emailAuthStatus',register?'Łączę się z Akademią i zapisuję nowe konto…':'Sprawdzam dane logowania…');
    try {
      const body=register?{purpose:'register',email,password,nickname,termsAccepted:true,locale:localStorage.getItem('academyLanguage')||'pl'}:{purpose:'login',email,password};
      const r=await api('/session',{method:'POST',body:JSON.stringify(body)});
      if(r.requiresTotp){showTotpChallenge(r.message||'Hasło poprawne. Potwierdź kod 2FA.');return;}
      // Verify that the browser accepted the HttpOnly session cookie before declaring login complete.
      const sessionCheck=await api('/session');
      if(!sessionCheck.active||!sessionCheck.user){
        if(register){setEmailAuthMode('login',true);if($('#emailAuthEmail'))$('#emailAuthEmail').value=email;}
        say('#emailAuthStatus','Konto zostało zapisane, ale przeglądarka nie potwierdziła sesji logowania. Włącz obsługę cookies dla tej strony i zaloguj się ponownie.','warning');
        return;
      }
      contributorReady=true;hasCloudProfile=true;active=!!sessionCheck.consented;user=sessionCheck.user||r.user||null;setAccountUI();announceSessionChange();
      say('#contributorAccessStatus',`Konto ${user?.email||email} jest aktywne. Możesz dodawać modele i przypadki do moderacji.`,true);
      if(active){await pullCloudState();await syncLocalToCloud();await importLocalConversations();await refreshMetrics();await loadConversations();}
      await loadProfile();
      if(register){form.reset();setEmailAuthMode('register',true);updatePasswordGuide();}
      say('#emailAuthStatus',r.message||(register?'Konto utworzone i zalogowano.':'Zalogowano.'),true);
    } catch(e) {
      const code=e.data?.error||'';
      if(e.status===409||code==='ACCOUNT_EXISTS'||code==='ACCOUNT_CREATE_FAILED'){
        setEmailAuthMode('login',true);if($('#emailAuthEmail'))$('#emailAuthEmail').value=email;
        say('#emailAuthStatus','Konto z tym adresem e-mail już istnieje. Przełączyłem formularz na logowanie — wpisz hasło i kliknij „Zaloguj się”.','warning');
      } else if(code==='EMAIL_NOT_VERIFIED'){say('#emailAuthStatus',e.message||'Potwierdź adres e-mail, a następnie zaloguj się ponownie.','warning');}
      else if(e.status===429){say('#emailAuthStatus',e.message||'Limit prób został osiągnięty. Odczekaj i spróbuj ponownie.','warning');}
      else if(e.status===503){say('#emailAuthStatus',e.message||'Serwer kont lub baza D1 są chwilowo niedostępne. Użyj „Sprawdź ponownie” i spróbuj później.','error');}
      else if(e.status===401){say('#emailAuthStatus','Nieprawidłowy adres e-mail lub hasło. Sprawdź dane i spróbuj ponownie.','error');focusAuthIssue('#emailAuthPassword');}
      else {say('#emailAuthStatus',e.message||'Nie udało się połączyć z usługą kont. Sprawdź internet i spróbuj ponownie.','error');}
    } finally { if(button){button.disabled=false;button.textContent=emailAuthMode==='register'?'Utwórz bezpłatne konto →':'Zaloguj się →';} }
  }
  function setEmailAccountAvailability(ready, message='') {
    const form=$('#emailAuthForm');
    const submit=$('#emailAuthSubmit');
    if (form) form.querySelectorAll('input').forEach(input=>{ input.disabled = !ready; });
    if (submit) submit.disabled = !ready;
    const state=$('#emailAuthBackendState'),dot=$('#emailAuthBackendDot'),label=$('#emailAuthBackendLabel'),detail=$('#emailAuthBackendDetail');
    state?.setAttribute('data-state',ready?'online':'offline');
    if(dot)dot.title=ready?'API kont działa':'API kont niedostępne';
    if(label)label.textContent=ready?'SERWER KONT ONLINE':'SERWER KONT NIEDOSTĘPNY';
    if(detail)detail.textContent=ready?'API /api/session odpowiada, a schemat kont i limitów jest gotowy.':'Sprawdź połączenie z Cloudflare Pages i binding istniejącej bazy D1.';
    if (!ready && message) say('#emailAuthStatus', message, 'error');
    else if (ready && !$('#emailAuthStatus')?.classList.contains('success')) sayInfo('#emailAuthStatus','Serwer kont odpowiada. Rejestracja wymaga hasła minimum 12 znaków; logowanie akceptuje istniejące hasła.');
  }
  async function refreshSession() {
    try {
      const r=await api('/session');
      setEmailAccountAvailability(r.accountRegistrationAvailable !== false, r.accountRegistrationMessage || 'Rejestracja e-mail/hasło wymaga kompletnego schematu kont, w tym migracji 0013.');
      contributorReady=!!r.active;hasCloudProfile=contributorReady;active=!!(r.active&&r.consented);user=hasCloudProfile?r.user:null;
      setAccountUI();
      if(active){await pullCloudState();await syncLocalToCloud();await importLocalConversations();}
      if(hasCloudProfile)await loadProfile();
      announceSessionChange();
      return !!r.active;
    } catch(e) { active=false;hasCloudProfile=false;contributorReady=false;user=null;setAccountUI();setEmailAccountAvailability(false,'Nie udało się połączyć z /api/session. Konto nie zostanie utworzone, dopóki API i istniejąca baza D1 nie będą dostępne. Naciśnij „Sprawdź ponownie”.');announceSessionChange();say('#cloudAccountStatus','Backend nie jest jeszcze podłączony: '+e.message); return false; }
  }
  async function createContributorProfile(){
    const nickname=$('#contributorNickname')?.value.trim()||'';
    if(nickname.length<3||nickname.length>32){say('#contributorAccessStatus','Wpisz pseudonim od 3 do 32 znaków.');return;}
    const button=$('#createContributorProfile');if(button){button.disabled=true;button.textContent='Tworzę profil…';}
    try{
      const r=await api('/session',{method:'POST',body:JSON.stringify({purpose:'contribution',nickname,locale:localStorage.getItem('academyLanguage')||'pl'})});
      contributorReady=true;hasCloudProfile=true;active=false;user=r.user;setAccountUI();
      say('#contributorAccessStatus',r.message||'Profil autora gotowy. Możesz dodać przypadek.',true);
      say('#knowledgeFormStatus','Profil autora aktywny. Wypełnij opis naprawy i wyślij go do moderacji.',true);
      announceSessionChange();
      await loadProfile();
    }catch(e){say('#contributorAccessStatus','Nie udało się utworzyć profilu: '+e.message);}
    finally{if(button){button.disabled=false;button.textContent='Utwórz profil autora i przejdź dalej →';}}
  }
  async function logoutContributor(){
    if(!confirm('Wylogować bieżący profil autora z tej przeglądarki? Zgłoszenia i dane w Akademii nie zostaną usunięte.'))return;
    try{await api('/session',{method:'DELETE'});active=false;hasCloudProfile=false;contributorReady=false;user=null;setAccountUI();announceSessionChange();say('#contributorAccessStatus','Profil wylogowany. Możesz utworzyć nowy profil lub zalogować się ponownie.',true);say('#cloudAccountStatus','Wylogowano bieżącą sesję. Dane nie zostały usunięte.');}
    catch(e){say('#contributorAccessStatus','Nie udało się wylogować: '+e.message);}
  }
  async function refreshOAuthProviders(){
    const status=$('#oauthProviderStatus');
    const accountStatus=$('#accountOAuthStatus');
    const accountDiagnostics=$('#accountOAuthDiagnostics');
    const names={google:'Google',facebook:'Facebook',microsoft:'Microsoft',github:'GitHub',discord:'Discord'};
    const allButtons=[...document.querySelectorAll('[data-oauth-start]')];
    const setAllUnavailable=(message)=>{
      allButtons.forEach(button=>{
        button.hidden=false;button.removeAttribute('aria-hidden');button.disabled=true;button.setAttribute('aria-disabled','true');
        button.title=message;
        let state=button.querySelector('.social-provider-state');
        if(!state){state=document.createElement('small');state.className='social-provider-state';button.append(state);}
        state.textContent='Sprawdź API';
      });
      if(status)status.textContent=message;
      if(accountStatus)accountStatus.textContent=message;
      if(accountDiagnostics)accountDiagnostics.textContent=message;
    };
    try{
      const r=await api('/auth/status');
      const pageBuild=document.querySelector('meta[name="academy-build"]')?.content||'';
      const buildMismatch=!!(pageBuild&&(!r.build||r.build!==pageBuild));
      allButtons.forEach(button=>{
        const provider=button.dataset.oauthStart;
        const detail=r.providerDetails?.[provider]||{configured:!!r.providers?.[provider],missingKeys:[]};
        const configured=!!detail.configured;
        const enabled=!!r.databaseReady&&!!r.schemaReady&&!buildMismatch&&configured;
        button.hidden=false;button.removeAttribute('aria-hidden');button.disabled=!enabled;button.setAttribute('aria-disabled',String(!enabled));
        let label='Gotowe';
        if(buildMismatch)label='Inna wersja strony/API';
        else if(!r.databaseReady)label='Brak bazy D1';
        else if(!r.schemaReady)label='Migracja D1';
        else if(!configured)label='Wymaga konfiguracji';
        let state=button.querySelector('.social-provider-state');
        if(!state){state=document.createElement('small');state.className='social-provider-state';button.append(state);}
        state.textContent=label;
        const why=buildMismatch?'Strona i API są z różnych wdrożeń.':!r.databaseReady?'Brak produkcyjnego bindingu D1.':!r.schemaReady?'Brakuje migracji OAuth: '+(r.schemaMissing||[]).join(', '):!configured?'Brak sekretów: '+(detail.missingKeys||[]).join(', '):'Uruchom logowanie przez '+(names[provider]||provider)+'.';
        button.title=why;
      });
      const ready=Object.keys(names).filter(k=>!!r.databaseReady&&!!r.schemaReady&&!buildMismatch&&!!r.providers?.[k]);
      let message='';
      if(buildMismatch){message='Niezgodne wdrożenie: HTML '+pageBuild+'; API '+(r.build||'brak wersji API')+'. Opublikuj jednocześnie nowy HTML i Pages Functions.';}
      else if(!r.databaseReady){message='API nie widzi bindingu D1=DB w środowisku produkcyjnym. Logowanie społecznościowe jest wstrzymane.';}
      else if(!r.schemaReady){message='Baza D1 istnieje, ale brakuje migracji logowania: '+(r.schemaMissing||[]).join(', ')+'. Uruchom kontrolowany publikator na istniejącej bazie.';}
      else if(ready.length){
        const missing=Object.keys(names).filter(k=>!r.providers?.[k]);
        message='Aktywne metody: '+ready.map(k=>names[k]).join(', ')+'.'+(missing.length?' Pozostałe: '+missing.map(k=>names[k]+' — brak '+(r.providerDetails?.[k]?.missingKeys||[]).join('/')).join('; ')+'.':'');
      }else{
        const missing=Object.keys(names).map(k=>names[k]+': '+(r.providerDetails?.[k]?.missingKeys||[]).join(', ')).join(' | ');
        message='Logowanie społecznościowe nie jest skonfigurowane na serwerze. Brakujące sekrety: '+missing+'. Wpisz Client ID i Client Secret w lokalnym konfiguratorze OAuth, a następnie wykonaj nowe wdrożenie Pages.';
      }
      if(status)status.textContent=message;
      if(accountStatus)accountStatus.textContent=message;
      if(accountDiagnostics)accountDiagnostics.textContent=message;
      const callback=$('#oauthCallbackUrl');if(callback)callback.textContent=r.callbackUrl||'';
      const deployment=$('#oauthDeploymentBuild');if(deployment)deployment.textContent='HTML: '+(pageBuild||'brak')+' · API: '+(r.build||'brak');
    }catch(e){
      setAllUnavailable('Nie można odczytać /api/auth/status ('+(e.status||'brak odpowiedzi')+'). Przyciski pozostają widoczne, ale logowanie czeka na działające Pages Functions, D1 i wdrożenie tej samej wersji strony oraz API.');
    }
  }
  async function loadLinkedLoginMethods(){
    const list=$('#linkedLoginMethodsList');
    if(!list||!hasCloudProfile)return;
    const names={google:'Google',facebook:'Facebook',microsoft:'Microsoft',github:'GitHub',discord:'Discord'};
    try{
      const result=await api('/auth/identities');
      const methods=Array.isArray(result.identities)?result.identities:[];
      list.replaceChildren();
      const email=document.createElement('div');email.className='linked-login-item';
      const emailLabel=document.createElement('span');emailLabel.textContent='E-mail i hasło';
      const emailState=document.createElement('small');emailState.textContent=result.hasPasswordLogin?'Aktywne':'Niepołączone';emailState.className=result.hasPasswordLogin?'is-linked':'is-not-linked';
      email.append(emailLabel,emailState);list.append(email);
      for(const item of methods){
        if(!names[item.provider])continue;
        const row=document.createElement('div');row.className='linked-login-item';
        const label=document.createElement('span');label.textContent=names[item.provider];
        const unlink=document.createElement('button');unlink.type='button';unlink.className='btn btn-quiet btn-small';unlink.textContent='Odłącz';unlink.dataset.authUnlink=item.provider;
        unlink.disabled=!result.canUnlink;
        unlink.title=result.canUnlink?'Odłącz tę metodę logowania':'Najpierw dodaj inną metodę logowania';
        row.append(label,unlink);list.append(row);
      }
      if(!methods.length&&!result.hasPasswordLogin){const empty=document.createElement('p');empty.className='muted';empty.textContent='Profil pseudonimowy nie ma jeszcze stałej metody logowania. Połącz dostawcę albo dodaj konto e-mail i hasło.';list.append(empty);}
    }catch(e){list.textContent=e.status===401?'Zaloguj się, aby zarządzać metodami.':'Zarządzanie metodami wymaga migracji FIX18 i działającej sesji.';}
  }
  async function unlinkLoginMethod(provider,button){
    const names={google:'Google',facebook:'Facebook',microsoft:'Microsoft',github:'GitHub',discord:'Discord'};
    if(!names[provider]||!confirm(`Odłączyć ${names[provider]} od tego konta? Upewnij się, że masz inną metodę logowania.`))return;
    button.disabled=true;
    try{const result=await api('/auth/identities',{method:'DELETE',body:JSON.stringify({provider})});say('#cloudAccountStatus',result.message||'Metoda odłączona.',true);await loadLinkedLoginMethods();}
    catch(e){say('#cloudAccountStatus',e.message||'Nie udało się odłączyć metody.');button.disabled=false;}
  }
  async function loadSecurityEvents(){
    const list=$('#accountSecurityEventsList');if(!list||!hasCloudProfile)return;
    try{const result=await api('/auth/security-events');list.replaceChildren();const labels={oauth_login:'Logowanie zewnętrzne',account_linked:'Połączono metodę logowania',sessions_revoked:'Wylogowano inne sesje',totp_enabled:'Włączono 2FA',totp_disabled:'Wyłączono 2FA',recovery_codes_regenerated:'Wygenerowano nowe kody odzyskiwania',email_verified:'Potwierdzono e-mail',password_reset:'Zmieniono hasło'};
      for(const item of result.events||[]){const row=document.createElement('div');row.className='linked-login-item';const title=document.createElement('span');title.textContent=labels[item.type]||'Zdarzenie bezpieczeństwa';const meta=document.createElement('small');meta.textContent=[item.provider?`Dostawca: ${item.provider}`:'',Number.isInteger(item.details?.revoked)?`Wylogowane sesje: ${item.details.revoked}`:'',new Date(item.createdAt).toLocaleString('pl-PL')].filter(Boolean).join(' · ');row.append(title,meta);list.append(row);}
      if(!list.children.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Brak zapisanych zdarzeń. Historia zaczyna się po zastosowaniu migracji FIX211.';list.append(empty);}
    }catch(e){list.textContent=e.status===503?'Historia bezpieczeństwa wymaga migracji FIX211.':e.status===401?'Zaloguj się, aby zobaczyć zdarzenia.':`Nie udało się pobrać historii: ${e.message}`;}
  }
  async function exportSecurityReport(){
    const button=$('#exportSecurityReport');if(button)button.disabled=true;
    try{
      const [security,sessions,identities,email,totp]=await Promise.all([
        api('/auth/security-events'),api('/auth/sessions'),api('/auth/identities'),api('/auth/email'),api('/auth/totp')
      ]);
      const report={productVersion:'6.8.0',hotfix:'FIX223',generatedAt:new Date().toISOString(),privacy:'Raport nie zawiera haseł, tokenów, adresów IP, user-agent ani sekretów 2FA.',account:{hasPasswordLogin:!!identities.hasPasswordLogin,emailVerified:!!email.verified,twoFactorEnabled:!!totp.enabled,linkedProviders:(identities.identities||[]).map(item=>item.provider).filter(provider=>['google','microsoft','facebook','github','discord'].includes(provider))},activeSessions:(sessions.sessions||[]).map(item=>({isCurrent:!!item.isCurrent,createdAt:item.createdAt,expiresAt:item.expiresAt})),events:(security.events||[]).map(item=>({type:item.type,provider:item.provider||null,details:item.details||{},createdAt:item.createdAt}))};
      const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NaukaOdAdoZ_RaportBezpieczenstwa_FIX223.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('#cloudAccountStatus','Pobrano raport bezpieczeństwa. Nie zawiera sekretów ani identyfikatorów aktywnych sesji.',true);
    }catch(error){say('#cloudAccountStatus',`Nie udało się utworzyć raportu bezpieczeństwa: ${error.message}`,'warning');}
    finally{if(button)button.disabled=false;}
  }
  async function loadAccountSessions(){
    const list=$('#accountSessionsList'), revoke=$('#revokeOtherSessions');if(!list||!hasCloudProfile)return;
    try{
      const result=await api('/auth/sessions');const sessions=Array.isArray(result.sessions)?result.sessions:[];list.replaceChildren();
      for(const item of sessions){const row=document.createElement('div');row.className='linked-login-item';const title=document.createElement('span');title.textContent=item.isCurrent?'Bieżąca sesja':'Inna sesja';const meta=document.createElement('small');meta.textContent=`Utworzono: ${new Date(item.createdAt).toLocaleString('pl-PL')} · ważna do: ${new Date(item.expiresAt).toLocaleDateString('pl-PL')}`;meta.className=item.isCurrent?'is-linked':'is-not-linked';row.append(title,meta);list.append(row);}
      if(!sessions.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Nie znaleziono aktywnych sesji.';list.append(empty);}
      if(revoke)revoke.disabled=!result.canRevokeOthers;
    }catch(e){list.textContent=e.status===401?'Zaloguj się, aby zarządzać sesjami.':'Zarządzanie sesjami wymaga aktualnej funkcji API.';if(revoke)revoke.disabled=true;}
  }
  async function revokeOtherSessions(button){
    if(!confirm('Wylogować wszystkie pozostałe urządzenia? Bieżąca sesja pozostanie aktywna.'))return;
    button.disabled=true;try{const result=await api('/auth/sessions',{method:'DELETE',body:'{}'});say('#cloudAccountStatus',`${result.message} (${result.revoked} sesji).`,true);await loadAccountSessions();}catch(e){say('#cloudAccountStatus',e.message||'Nie udało się wylogować pozostałych urządzeń.');button.disabled=false;}
  }
  function beginOAuth(button){
    const provider=button.dataset.oauthStart;
    if(!['google','facebook','microsoft','github','discord'].includes(provider))return;
    const nickname=$('#contributorNickname')?.value.trim()||user?.nickname||'';
    const link=!!contributorReady;
    const params=new URLSearchParams({provider});
    if(nickname)params.set('nickname',nickname);
    if(link){params.set('link','1');}
    else {
      const terms=button.closest('.account-social-footer')?.querySelector('#accountOAuthTerms') || button.closest('.contributor-social-box')?.querySelector('#contributorOAuthTerms');
      if(terms && !terms.checked && localStorage.getItem('academyAccountTermsVersion')==='2026-11-02-v1')terms.checked=true;
      if(!terms?.checked){const message='Przed rejestracją lub logowaniem zewnętrznym zaakceptuj zasady korzystania i politykę prywatności.';say('#contributorAccessStatus',message);say('#accountOAuthStatus',message);terms?.focus();return;}
      localStorage.setItem('academyAccountTermsVersion','2026-11-02-v1');
      params.set('termsAccepted','1');
    }
    window.location.assign('/api/auth/start?'+params.toString());
  }
  async function enableSync() {
    const nickname=$('#cloudNickname')?.value.trim()||'';
    if(!$('#cloudConsent')?.checked){say('#cloudAccountStatus','Zaznacz zgodę, aby włączyć zapis.');return;}
    const b=$('#enableCloudSync');if(b)b.disabled=true;
    try { const r=await api('/session',{method:'POST',body:JSON.stringify({consent:true,nickname,locale:localStorage.getItem('academyLanguage')||'pl'})});active=true;hasCloudProfile=true;user=r.user;setAccountUI();say('#cloudAccountStatus','Synchronizacja została włączona. Historia, lekcje i rozmowy będą zapisywane w chmurze.',true);await pullCloudState();await syncLocalToCloud();await importLocalConversations();await loadProfile();await refreshMetrics();await loadConversations(); }
    catch(e){say('#cloudAccountStatus','Nie udało się włączyć synchronizacji: '+e.message);}
    finally{if(b)b.disabled=false;}
  }
  async function disableSync() {
    if(!confirm('Wyłączyć dalszą synchronizację? Zapisane wcześniej dane pozostaną w chmurze, dopóki ich nie usuniesz.'))return;
    try{await api('/me',{method:'PATCH',body:JSON.stringify({consent:false})});active=false;hasCloudProfile=true;conversationId=null;setAccountUI();say('#cloudAccountStatus','Synchronizacja wyłączona. Nowe działania nie są dopisywane do chmury. Wcześniejsze dane nadal możesz wyeksportować lub usunąć.',true);await loadProfile();await loadConversations();}
    catch(e){say('#cloudAccountStatus','Nie udało się wyłączyć synchronizacji: '+e.message);}
  }
  async function deleteCloudData() {
    if(!confirm('Czy na pewno usunąć wszystkie Twoje dane zapisane w chmurze: historię, pytania, odpowiedzi, postęp i zgłoszenia? Tej operacji nie można cofnąć.'))return;
    try{await api('/me',{method:'DELETE'});active=false;hasCloudProfile=false;user=null;conversationId=null;setAccountUI();say('#cloudAccountStatus','Wszystkie dane tego profilu zostały usunięte z chmury.',true);await loadConversations();}
    catch(e){say('#cloudAccountStatus','Nie udało się usunąć danych: '+e.message);}
  }
  async function exportCloudData() {
    try{const data=await api('/export');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='akademia-moje-dane.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
    catch(e){say('#cloudAccountStatus','Eksport nie powiódł się: '+e.message);}
  }
  async function track(type, resourceId='', title='', details={}) {
    if(!active)return;
    try{await api('/events',{method:'POST',body:JSON.stringify({type,resourceId,title,details})});}catch(e){if(e.status===401){active=false;user=null;setAccountUI();}}
  }
  // FIX202: pełna lista kluczy dopuszczonych przez /api/state; rozmowy czatu mają osobny endpoint.
  const SYNC_KEYS=['academyCompletedLessons','academyGuideSteps','academyChecklist','academyBookmarks','academyLanguage','academyLab45ESD','academyLab45Stock','academyLab45Inspector','academyLab45Assignments','academyLab45PowerDone','academyLab45Recovery','academyLabTraining','academyLabModels','academyLabExamLast','academyLabLastTriage','nauka.academy.fix162.v1'];
  let pullingCloudState=false;
  const syncTimers=new Map();
  const SYNC_QUEUE_KEY='nauka.academy.fix213.sync-queue.v1';
  const SYNC_VERSION_KEY='nauka.academy.fix221.sync-revisions.v1';
  const SYNC_CONFLICT_KEY='nauka.academy.fix221.sync-conflicts.v1';
  function readSyncQueue(){const value=localGet(SYNC_QUEUE_KEY,{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function readSyncVersions(){const value=localGet(SYNC_VERSION_KEY,{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function readSyncConflicts(){const value=localGet(SYNC_CONFLICT_KEY,{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function renderSyncQueue(){const node=$('#cloudSyncQueueStatus');if(!node)return;const queue=readSyncQueue(),keys=Object.keys(queue).filter(key=>SYNC_KEYS.includes(key)),conflicts=keys.filter(key=>queue[key]?.conflict);node.textContent=keys.length?`Oczekuje na synchronizację: ${keys.length} grup danych. Konflikty wymagające ręcznego sprawdzenia: ${conflicts.length}. Dane lokalne nie są automatycznie nadpisywane.`:'Brak oczekujących zmian synchronizacji.';let button=$('#cloudSyncConflictExport');if(conflicts.length){if(!button){button=document.createElement('button');button.id='cloudSyncConflictExport';button.type='button';button.className='btn btn-quiet btn-small';button.textContent='Pobierz raport konfliktów synchronizacji';node.insertAdjacentElement('afterend',button);button.addEventListener('click',downloadSyncConflictReport);}button.hidden=false;}else if(button)button.hidden=true;}
  function enqueueSync(key,error){const queue=readSyncQueue(),old=queue[key]||{},attempts=Math.min(999,Number(old.attempts||0)+1),conflict=error?.status===409||error?.data?.error==='STATE_REVISION_CONFLICT';const delay=Math.min(1800000,1000*Math.pow(2,Math.min(attempts,10)));queue[key]={queuedAt:old.queuedAt||new Date().toISOString(),attempts,lastAttemptAt:new Date().toISOString(),nextRetryAt:conflict?null:new Date(Date.now()+delay).toISOString(),conflict:conflict||!!old.conflict,serverRevision:conflict?Number(error?.data?.currentRevision)||0:old.serverRevision,lastError:String(error?.message||'Brak połączenia').slice(0,160)};localSet(SYNC_QUEUE_KEY,queue);if(conflict){const conflicts=readSyncConflicts();conflicts[key]={detectedAt:new Date().toISOString(),serverRevision:queue[key].serverRevision,localValuePreserved:true};localSet(SYNC_CONFLICT_KEY,conflicts);}renderSyncQueue();}
  function removeSyncQueue(key){const queue=readSyncQueue();if(queue[key]){delete queue[key];localSet(SYNC_QUEUE_KEY,queue);}const conflicts=readSyncConflicts();if(conflicts[key]){delete conflicts[key];localSet(SYNC_CONFLICT_KEY,conflicts);}renderSyncQueue();}
  async function downloadSyncConflictReport(){try{const conflicts=readSyncConflicts(),remote=await api('/state'),report={productVersion:'6.8.0',fix:'FIX221',createdAt:new Date().toISOString(),note:'Raport zawiera kopię lokalną i zdalną. Nie rozstrzyga automatycznie, która wersja jest właściwa.',conflicts:{}};for(const key of Object.keys(conflicts)){report.conflicts[key]={...conflicts[key],local:localGet(key,null),remote:remote.state?.[key]??null,remoteVersion:remote.versions?.[key]||null};}const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NaukaOdAdoZ_KonfliktySynchronizacji_FIX221.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){say('#cloudAccountStatus','Nie udało się pobrać raportu konfliktów: '+error.message,'warning');}}
  async function syncState(key) {
    if(!active||!SYNC_KEYS.includes(key))return;
    try{const value=localGet(key,null);if(value===null){removeSyncQueue(key);return;}const queue=readSyncQueue();if(queue[key]?.conflict)return;const raw=JSON.stringify(value),versions=readSyncVersions(),expectedRevision=Number(versions[key]?.revision)||0;let payload={key,expectedRevision};if(raw.length>30000){if(raw.length>360000){removeSyncQueue(key);say('#cloudAccountStatus',`Nie zsynchronizowano ${key}: stan przekracza limit 360 KB. Zmniejsz dane lub pobierz kopię JSON; automatyczne ponawianie nie pomoże.`, 'warning');return;}const chunks=[];for(let i=0;i<raw.length;i+=30000)chunks.push(raw.slice(i,i+30000));payload.chunks=chunks;}else payload.value=value;const result=await api('/state',{method:'POST',body:JSON.stringify(payload)});versions[key]={revision:Number(result.revision)||expectedRevision+1,updatedAt:result.updatedAt||new Date().toISOString()};localSet(SYNC_VERSION_KEY,versions);removeSyncQueue(key);}catch(e){enqueueSync(key,e);say('#cloudAccountStatus',e.status===409?`Konflikt synchronizacji ${key}: zachowano dane lokalne i zablokowano automatyczny zapis. Pobierz raport konfliktów, aby porównać obie wersje.`:`Zmiana ${key} pozostała lokalnie i czeka w kolejce synchronizacji: ${e.message||'błąd połączenia'}`,'warning');}
  }
  async function replaySyncQueue(){if(!active||!navigator.onLine)return;const queue=readSyncQueue(),keys=Object.keys(queue).filter(key=>SYNC_KEYS.includes(key)&&!queue[key]?.conflict&&(!queue[key]?.nextRetryAt||Date.parse(queue[key].nextRetryAt)<=Date.now()));for(const key of keys){await syncState(key);if(!navigator.onLine)break;}renderSyncQueue();}
  window.addEventListener('online',()=>{replaySyncQueue();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')replaySyncQueue();});
  function queueStateSync(key){if(!active||pullingCloudState||!SYNC_KEYS.includes(key))return;const old=syncTimers.get(key);if(old)clearTimeout(old);syncTimers.set(key,setTimeout(()=>{syncTimers.delete(key);syncState(key);},650));}
  // Storage API hook catches same-tab writes made by all existing Academy modules, not only five hard-coded forms.
  try{const proto=Storage.prototype,original=proto.setItem;if(!original.__academyFix202){const wrapped=function(key,value){const result=original.call(this,key,value);try{if(this===window.localStorage&&SYNC_KEYS.includes(String(key)))window.dispatchEvent(new CustomEvent('academy:state-dirty',{detail:{key:String(key)}}));}catch{}return result;};Object.defineProperty(wrapped,'__academyFix202',{value:true});proto.setItem=wrapped;}}catch{}
  window.addEventListener('academy:state-dirty',event=>queueStateSync(event.detail?.key));
  window.addEventListener('storage',event=>{if(event.key)queueStateSync(event.key);});
  async function syncLocalToCloud(){for(const key of SYNC_KEYS)await syncState(key);renderSyncQueue();}
  async function importLocalConversations(){
    if(!active||!user?.id)return;
    // Idempotent merge: synchronizuj także nowe wiadomości dopisywane do istniejących wątków.
    const local=localConversations().filter(c=>Array.isArray(c.messages)&&c.messages.length).slice(0,40);
    if(!local.length)return;
    let imported=0,messagesImported=0;
    try{
      for(let i=0;i<local.length;i+=3){
        const batch=local.slice(i,i+3).map(c=>({
          id:c.id,title:c.title,
          messages:(c.messages||[]).slice(-20).map(m=>({
            id:m.id,role:m.role,content:String(m.content||'').slice(0,1200),
            sources:(Array.isArray(m.sources)?m.sources:[]).slice(0,3).map(x=>({title:x.title,url:x.url,kind:x.kind,group:x.group,id:x.id}))
          }))
        }));
        const r=await api('/conversations',{method:'POST',body:JSON.stringify({conversations:batch})});
        imported+=Number(r.imported||0);messagesImported+=Number(r.messagesImported||0);
      }
      if(localConversationId && local.some(c=>c.id===localConversationId)){conversationId=localConversationId;localConversationId=null;}
      if(imported>0||messagesImported>0)say('#cloudAccountStatus',`Synchronizacja historii czatu: ${fmt(imported)} nowych wątków, ${fmt(messagesImported)} wiadomości przesłanych do sprawdzenia duplikatów.`,true);
    }catch(e){say('#cloudAccountStatus','Synchronizacja działa, ale nie udało się jeszcze przenieść części lokalnej historii czatu: '+e.message);}
  }
  function mergeState(local,remote){
    if(Array.isArray(local)||Array.isArray(remote))return [...new Set([...(Array.isArray(local)?local:[]),...(Array.isArray(remote)?remote:[])])];
    if(local&&remote&&typeof local==='object'&&typeof remote==='object'){const out={...remote};for(const [k,v] of Object.entries(local))out[k]=k in out?mergeState(v,out[k]):v;return out;}
    return local??remote;
  }
  async function pullCloudState(){
    if(!active)return;
    pullingCloudState=true;
    try{const r=await api('/state');const versions=readSyncVersions();for(const [key,version] of Object.entries(r.versions||{})){if(SYNC_KEYS.includes(key))versions[key]=version;}localSet(SYNC_VERSION_KEY,versions);for(const [key,remote] of Object.entries(r.state||{})){if(!SYNC_KEYS.includes(key))continue;const queue=readSyncQueue();if(queue[key]?.conflict)continue;const merged=mergeState(localGet(key,null),remote);localSet(key,merged);}window.dispatchEvent(new StorageEvent('storage',{key:'academyCompletedLessons'}));window.ACADEMY_LOCAL_METRICS?.refresh();}
    catch(e){say('#cloudAccountStatus',`Nie udało się pobrać części postępów z chmury: ${e.message||'błąd synchronizacji'}`,'warning');}
    finally{pullingCloudState=false;}
  }
  async function loadProfile(){
    if(!hasCloudProfile)return;
    try{
      const r=await api('/me');const s=r.stats||{};
      $('#cloudProfileStats').innerHTML=[['Zapisane zdarzenia',s.events],['Otwarte lekcje',s.lessons_opened],['Ukończone lekcje',s.lessons_completed],['Pytania czatu',s.questions],['Zgłoszone przypadki',s.contributions],['Rozmowy',s.conversations]].map(([k,v])=>`<article><small>${esc(k)}</small><b>${fmt(v)}</b></article>`).join('');
      const history=$('#cloudHistory');if(history){history.innerHTML=(r.history||[]).length?(r.history||[]).map(x=>`<div class="cloud-history-row"><span>${esc(x.event_type)}</span><b>${esc(x.title||x.resource_id||'Aktywność')}</b><small>${new Date(x.created_at).toLocaleString()}</small></div>`).join(''):'<p class="muted">Nie zapisano jeszcze działań.</p>';}
      await loadLinkedLoginMethods();
      await loadAccountSessions();
      renderSyncQueue();
      await replaySyncQueue();
      await loadSecurityEvents();
      await loadEmailSecurity();
      await loadTotpSecurity();
    }catch(e){say('#cloudAccountStatus','Nie można pobrać profilu: '+e.message);}
  }
  async function refreshMetrics(){
    try{const r=await api('/metrics');const m=r.metrics||{};const el=$('#cloudGlobalMetrics');if(el)el.innerHTML=[['Użytkownicy z aktywną synchronizacją',m.opted_in_users],['Zapisane odsłony',m.tracked_views],['Pytania czatu',m.questions],['Zatwierdzone przypadki',m.approved_cases]].map(([k,v])=>`<div><small>${esc(k)}</small><b>${fmt(v)}</b></div>`).join('');}
    catch{}
  }
  function showChatWelcome(){const box=$('#cloudChatMessages');if(box)box.innerHTML='<div class="chat-welcome-card"><span class="chat-welcome-icon">✦</span><h3>Od czego zaczynamy?</h3><p>Opisz urządzenie, dokładny model, rewizję płyty, objawy i wykonane testy. Poprowadzę Cię przez hipotezy, bezpieczne kontrole i kryteria potwierdzenia usterki.</p><div class="chat-welcome-tags"><span>Diagnostyka krok po kroku</span><span>Źródła i odnośniki</span><span>Historia po zgodzie</span></div><small>Nie wklejaj haseł, kluczy BitLocker, numerów seryjnych klientów ani danych osobowych.</small></div>';}
  function addMessage(role,message,sources=[],opts={}){
    const box=$('#cloudChatMessages');if(!box)return null;
    const wrap=document.createElement('article');wrap.className=`cloud-chat-bubble ${role}`;
    const head=document.createElement('b');head.textContent=role==='user'?'Ty':'Akademia';wrap.append(head);
    const p=document.createElement('p');p.textContent=String(message||'');wrap.append(p);
    if(sources.length){const list=document.createElement('div');list.className='cloud-chat-sources';const title=document.createElement('b');title.textContent='Źródła i materiały Akademii';list.append(title);sources.forEach((src,i)=>{if(src.group&&src.id){const b=document.createElement('button');b.type='button';b.className='free-chat-source';b.dataset.freeSourceGroup=src.group;b.dataset.freeSourceId=src.id;b.textContent=`[${i+1}] ${src.title||src.id} · ${src.kind||src.group}`;list.append(b);return;}try{const u=new URL(src.url);if(u.protocol==='https:'){const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`[${i+1}] ${src.title||u.hostname}`;list.append(a);return;}}catch{}if(src.title){const label=document.createElement('span');label.textContent=`[${i+1}] ${src.title}${src.kind?' · '+src.kind:''}`;list.append(label);}});wrap.append(list);}
    if(role==='assistant'){
      const actions=document.createElement('div');actions.className='chat-message-actions';
      const copy=document.createElement('button');copy.type='button';copy.textContent='Kopiuj odpowiedź';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(String(message||''));copy.textContent='Skopiowano';}catch{copy.textContent='Kopiowanie niedostępne';}});actions.append(copy);
      if(opts.messageId){for(const [rating,label] of [['helpful','Pomocne'],['not_helpful','Niepomocne']]){const fb=document.createElement('button');fb.type='button';fb.textContent=label;fb.dataset.feedbackMessage=opts.messageId;fb.dataset.feedbackRating=rating;actions.append(fb);}}
      const time=document.createElement('small');time.className='chat-message-time';time.textContent=new Date(opts.at||Date.now()).toLocaleTimeString();actions.append(time);wrap.append(actions);
    }
    box.append(wrap);box.scrollTop=box.scrollHeight;return wrap;
  }
  async function sendFeedback(messageId,rating,button){
    if(!active){button.textContent='Włącz synchronizację, aby ocenić';return;}
    button.disabled=true;
    try{await api('/feedback',{method:'POST',body:JSON.stringify({messageId,rating})});const parent=button.closest('.chat-message-actions');if(parent){parent.querySelectorAll('[data-feedback-message]').forEach(x=>x.disabled=true);const note=document.createElement('small');note.className='chat-feedback-status';note.textContent='Dziękuję za ocenę.';parent.append(note);}track('chat_feedback',messageId,'Ocena odpowiedzi',{rating});}
    catch(e){button.disabled=false;button.textContent=e.message||'Nie zapisano oceny';}
  }
  function renderLocalConversationList(){
    const root=$('#cloudConversationList');if(!root)return;
    const rows=localConversations().slice(0,30);
    root.innerHTML=rows.length?'':'<div class="chat-history-empty">Nie ma jeszcze zapisanych rozmów na tym urządzeniu.</div>';
    for(const conv of rows){const b=document.createElement('button');b.type='button';b.className='chat-conversation-item'+(conv.id===localConversationId?' active':'');b.dataset.localConversation=conv.id;const title=document.createElement('b');title.textContent=conv.title||'Rozmowa';const info=document.createElement('small');info.textContent=`${(conv.messages||[]).filter(m=>m.role==='user').length} pytań · ${new Date(conv.updatedAt||conv.createdAt||Date.now()).toLocaleDateString()}`;b.append(title,info);root.append(b);}
  }
  async function loadConversations(){
    const root=$('#cloudConversationList');if(!root)return;
    if(!active){renderLocalConversationList();return;}
    try{const r=await api('/conversations');const rows=r.conversations||[];root.innerHTML=rows.length?'':'<div class="chat-history-empty">Brak rozmów w chmurze. Naciśnij „Nowa”, aby zacząć.</div>';
      for(const conv of rows){const b=document.createElement('button');b.type='button';b.className='chat-conversation-item'+(conv.id===conversationId?' active':'');b.dataset.cloudConversation=conv.id;const title=document.createElement('b');title.textContent=conv.title||'Rozmowa';const info=document.createElement('small');info.textContent=`${Number(conv.message_count||0)} wiadomości · ${new Date(conv.updated_at||conv.created_at).toLocaleDateString()}`;b.append(title,info);root.append(b);}
    }catch(e){root.innerHTML='<div class="chat-history-empty">Nie udało się pobrać historii. Sprawdź połączenie z bazą.</div>';}
  }
  async function openCloudConversation(id){
    if(!active||!id)return;
    try{const r=await api(`/conversation?id=${encodeURIComponent(id)}`);conversationId=id;localConversationId=null;chatTranscript=(r.messages||[]).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content}));showChatWelcome();(r.messages||[]).forEach(m=>addMessage(m.role,m.content,m.sources||[],{messageId:m.role==='assistant'?m.id:null,at:m.created_at}));await loadConversations();}
    catch(e){say('#cloudChatStatus','Nie można otworzyć rozmowy: '+e.message);}
  }
  function openLocalConversation(id){
    const conv=localConversations().find(x=>x.id===id);if(!conv)return;
    localConversationId=id;conversationId=null;chatTranscript=(conv.messages||[]).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content}));showChatWelcome();(conv.messages||[]).forEach(m=>addMessage(m.role,m.content,m.sources||[],{at:m.at}));renderLocalConversationList();
  }
  async function newConversation(){conversationId=null;localConversationId=null;chatTranscript=[];showChatWelcome();if(!active)ensureLocalConversation();await loadConversations();$('#cloudChatQuestion')?.focus();}
  function findLocalAnswer(question,history=[]){
    if(window.ACADEMY_FREE_CHAT?.answer){const result=window.ACADEMY_FREE_CHAT.answer(question,history);return result;}
    return {answer:'Bezpłatny czat lokalny: silnik wiedzy nie został załadowany. Odśwież stronę i spróbuj ponownie.',sources:[],mode:'free-local-library'};
  }
  function setChatProviderStatus(provider, model){
    const status=$('#cloudChatStatus');
    const label=provider==='gemini'?'Google Gemini · jedyny model AI':'Gemini niedostępne';
    if(status)status.textContent=`${label}${model?' · '+model:''}`;
    const notice=$('#cloudAiConfigNotice');
    if(notice)notice.textContent=provider==='gemini'
      ?`Nauczyciel korzysta wyłącznie z Google Gemini (${model||'model skonfigurowany'}). Zakres odpowiedzi jest ograniczony do nauki, diagnostyki, naprawy i konserwacji komputerów oraz laptopów. Klucz pozostaje po stronie Cloudflare.`
      :'Google Gemini nie jest obecnie dostępne. Uruchom URUCHOM_AKADEMIE.cmd, aby jednorazowo skonfigurować klucz w CMD. Nie ma zapasowego dostawcy AI.';
  }
  async function refreshChatProviderStatus(){
    const status=$('#cloudChatStatus'),note=$('#cloudAiConfigNotice');
    try{
      const r=await api('/chat');
      if(r.geminiConfigured){if(status)status.textContent=`Google Gemini gotowe · ${r.geminiModel}`;if(note)note.textContent=`Nauczyciel korzysta wyłącznie z Google Gemini (${r.geminiModel}). Zakres: nauka, diagnostyka, naprawa i konserwacja komputerów oraz laptopów. Klucz jest przechowywany po stronie Cloudflare.`;}
      else{if(status)status.textContent='Brak klucza Google Gemini';if(note)note.textContent='Uruchom URUCHOM_AKADEMIE.cmd. CMD pokaże oficjalny link do Google AI Studio i poprosi o jednorazowe, ukryte wklejenie klucza. Klucz zapisze się jako sekret Cloudflare. Nie ma zapasowego dostawcy AI.';}
    }catch(e){if(status)status.textContent='Nie można sprawdzić statusu Gemini';if(note)note.textContent='Status Google Gemini jest chwilowo niedostępny. Czat spróbuje połączyć się z serwerem przy wysłaniu pytania.';}
  }
  async function consumeChatStream(response, onMeta, onDelta, onSources, onReset){
    if(!response.body)throw new Error('Przeglądarka nie obsługuje strumieniowej odpowiedzi czatu.');
    const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',answer='',streamError='';
    const handleBlock=(block)=>{
      let eventName='message';const data=[];
      for(const line of block.split(/\r?\n/)){if(line.startsWith('event:'))eventName=line.slice(6).trim();else if(line.startsWith('data:'))data.push(line.slice(5).trim());}
      if(!data.length)return;let payload;try{payload=JSON.parse(data.join('\n'));}catch{return;}
      if(eventName==='meta')onMeta?.(payload);
      else if(eventName==='delta'&&typeof payload.text==='string'){answer+=payload.text;onDelta?.(payload.text);}
      else if(eventName==='sources')onSources?.(payload.sources||[]);
      else if(eventName==='reset'){answer='';onReset?.(payload);}
      else if(eventName==='error')streamError=payload.message||'Strumień AI został przerwany.';
    };
    while(true){const {value,done}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});let idx;while((idx=pending.search(/\r?\n\r?\n/))>=0){const sep=pending.match(/\r?\n\r?\n/);handleBlock(pending.slice(0,idx));pending=pending.slice(idx+sep[0].length);}}
    pending+=decoder.decode();if(pending.trim())handleBlock(pending);
    if(streamError)throw new Error(streamError);
    if(!answer.trim())throw new Error('Model nie zwrócił tekstu odpowiedzi.');
    return answer;
  }
  async function sendChat(question){
    question=String(question||'').trim();if(question.length<3)return;
    if(!active&&!localConversationId)ensureLocalConversation();
    if(active&&!conversationId)conversationId=(crypto.randomUUID?.()||'').toLowerCase();
    const cloudId=active?conversationId:null;
    const conv=localConversationId?localConversations().find(c=>c.id===localConversationId):null;
    const prior=chatTranscript.length?chatTranscript:(conv?.messages||[]).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content}));
    const messages=[...prior.slice(-10).map(m=>({role:m.role,content:String(m.content||'').slice(0,3500)})),{role:'user',content:question}];
    addMessage('user',question);chatTranscript.push({role:'user',content:question});if(!active)localAppend('user',question);
    const send=$('#cloudChatSend');if(send){send.disabled=true;send.textContent='Łączę z Akademią AI…';}
    let answer='',sources=[],provider='local-search',model='',remoteSucceeded=false;
    let assistantBubble=null,assistantText=null;
    try{
      const response=await fetch(`${API}/chat`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'accept':'text/event-stream','content-type':'application/json'},body:JSON.stringify({messages,conversationId:cloudId})});
      if(!response.ok){let data={};try{data=await response.json();}catch{}throw new Error(data.message||data.error||`HTTP ${response.status}`);}
      answer=await consumeChatStream(response,
        meta=>{provider=meta.provider||provider;model=meta.model||'';if(meta.conversationId)conversationId=meta.conversationId;setChatProviderStatus(provider,model);if(send)send.textContent='Gemini odpowiada…';},
        delta=>{if(!assistantBubble){assistantBubble=addMessage('assistant','');assistantText=assistantBubble?.querySelector('p');}if(assistantText){assistantText.textContent+=delta;const box=$('#cloudChatMessages');if(box)box.scrollTop=box.scrollHeight;}},
        found=>{sources=Array.isArray(found)?found:[];},
        ()=>{answer='';sources=[];if(assistantText)assistantText.textContent='';if(assistantBubble)assistantBubble.querySelector('.cloud-chat-sources')?.remove();}
      );
      remoteSucceeded=true;
    }catch(remoteError){
      answer=String(remoteError?.message||'Google Gemini jest chwilowo niedostępne.');
      sources=[];provider='gemini-unavailable';
      setChatProviderStatus('gemini-unavailable','');
    }
    if(assistantBubble){
      const p=assistantBubble.querySelector('p');if(p)p.textContent=answer;
      if(sources.length){const sourceHolder=document.createElement('div');sourceHolder.className='cloud-chat-sources';const title=document.createElement('b');title.textContent='Materiały wykorzystane przez asystenta';sourceHolder.append(title);sources.forEach((src,i)=>{const span=document.createElement('span');span.textContent=`[${i+1}] ${src.title||'Materiał Akademii'}${src.kind?' · '+src.kind:''}`;sourceHolder.append(span);});assistantBubble.append(sourceHolder);}
    }else addMessage('assistant',answer,sources,{at:new Date().toISOString()});
    chatTranscript.push({role:'assistant',content:answer});chatTranscript=chatTranscript.slice(-24);
    if(!active||!remoteSucceeded){localAppend('assistant',answer,sources,provider);if(active){try{await importLocalConversations();}catch{}}}
    await loadConversations();
    if(send){send.disabled=false;send.innerHTML='Wyślij pytanie <span>→</span>';}
  }
  async function loadCommunity(){
    const root=$('#communityList');if(!root)return;
    try{const r=await api('/knowledge');const items=r.items||[];root.innerHTML=items.length?items.map(x=>`<article class="community-card"><div class="eyebrow">${esc(x.category||'PRZYPADEK SERWISOWY')} · ZATWIERDZONO</div><h3>${esc(x.title)}</h3><p><b>Objawy:</b> ${esc(x.symptoms)}</p><p><b>Diagnoza:</b> ${esc(x.diagnosis)}</p><p><b>Procedura:</b> ${esc(x.procedure)}</p><p><b>Wynik:</b> ${esc(x.result||'Nie podano')}</p><small>Autor: ${esc(x.attribution||'Użytkownik Akademii')} · Licencja: ${esc(x.license_code?'zgłoszenie z licencją':'materiał zatwierdzony')}</small></article>`).join(''):'<p class="muted">Brak zatwierdzonych zgłoszeń. Możesz dodać pierwszy sprawdzony przypadek.</p>';}
    catch(e){root.textContent='Baza społeczności będzie dostępna po konfiguracji D1: '+e.message;}
  }
  async function submitKnowledge(form){
    if(!contributorReady){say('#knowledgeFormStatus','Najpierw utwórz profil pseudonimowy albo zaloguj się przez skonfigurowanego dostawcę. Nie musisz włączać synchronizacji historii nauki.');return;}
    const fd=new FormData(form);const licenseChecked=fd.get('licenseAgreement')==='on';
    const payload={title:fd.get('title'),category:fd.get('category'),symptoms:fd.get('symptoms'),diagnosis:fd.get('diagnosis'),procedure:fd.get('procedure'),result:fd.get('result'),attribution:fd.get('attribution'),sourceUrls:String(fd.get('sourceUrls')||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),shareConsent:fd.get('shareConsent')==='on',rightsConfirmed:fd.get('rightsConfirmed')==='on',licenseAgreement:licenseChecked,licenseCode:licenseChecked?'ACADEMY_NONEXCLUSIVE_2026':''};
    try{const r=await api('/knowledge',{method:'POST',body:JSON.stringify(payload)});say('#knowledgeFormStatus',r.message,true);form.reset();await loadProfile();}
    catch(e){say('#knowledgeFormStatus','Nie udało się wysłać zgłoszenia: '+e.message);}
  }
  async function loadAdminQueue(){
    adminToken=$('#adminToken')?.value||'';if(adminToken.length<16){$('#adminQueue').textContent='Wpisz token administratora.';return;}
    try{const r=await api('/admin/knowledge',{headers:{authorization:`Bearer ${adminToken}`}});$('#adminMetrics').innerHTML=Object.entries(r.metrics||{}).map(([k,v])=>`<div><small>${esc(k)}</small><b>${fmt(v)}</b></div>`).join('');const items=r.pending||[];$('#adminQueue').innerHTML=items.length?items.map(x=>`<article class="community-card admin-review-card"><div class="eyebrow">DO WERYFIKACJI · ${esc(x.id)}</div><h3>${esc(x.title)}</h3><p><b>Objawy:</b> ${esc(x.symptoms)}</p><p><b>Diagnoza:</b> ${esc(x.diagnosis)}</p><p><b>Procedura:</b> ${esc(x.procedure)}</p><p><b>Prawa potwierdzone:</b> ${x.rights_confirmed_at?'Tak':'Brak'} · <b>Licencja:</b> ${esc(x.license_code||'brak')} · <b>Autor:</b> ${esc(x.attribution||'anonimowo')}</p><div><button class="btn btn-primary btn-small" data-review-id="${esc(x.id)}" data-review-status="approved">Zatwierdź</button> <button class="btn btn-danger btn-small" data-review-id="${esc(x.id)}" data-review-status="rejected">Odrzuć</button></div></article>`).join(''):'<p class="muted">Brak zgłoszeń oczekujących.</p>';}
    catch(e){$('#adminQueue').textContent='Błąd dostępu lub tokenu: '+e.message;}
  }
  async function reviewItem(id,status){try{await api('/admin/knowledge',{method:'POST',headers:{authorization:`Bearer ${adminToken}`},body:JSON.stringify({id,status})});await loadAdminQueue();await loadCommunity();}catch(e){$('#adminQueue').textContent='Nie udało się zmienić statusu: '+e.message;}}
  function bindTracking(){
    document.addEventListener('click',e=>{
      const nav=e.target.closest('[data-view],[data-nav]');if(nav){const id=nav.dataset.view||nav.dataset.nav;track('section_view',id,document.querySelector(`#view-${CSS.escape(id)}`)?.dataset.sectionLabel||id);}
      const lesson=e.target.closest('[data-course-id]');if(lesson)track('lesson_open',lesson.dataset.courseId,lesson.querySelector('b')?.textContent||'Lekcja');
      const repair=e.target.closest('[data-open-repair]');if(repair)track('repair_open',repair.dataset.openRepair,'Procedura naprawy');
      const comp=e.target.closest('[data-open-component]');if(comp)track('component_open',comp.dataset.openComponent,'Element encyklopedii');
      const tool=e.target.closest('[data-tool-id]');if(tool)track('tool_open',tool.dataset.toolId,tool.querySelector('b')?.textContent||'Narzędzie serwisowe');
      const method=e.target.closest('[data-method-id]');if(method)track('repair_open',method.dataset.methodId,method.querySelector('b')?.textContent||'Metoda serwisowa');
      const doc=e.target.closest('[data-open-doc-id],[data-open-doc-path],[data-open-pdf-page]');if(doc)track('document_open',doc.dataset.openDocId||doc.dataset.openDocPath||doc.dataset.pdfPath,'Dokument biblioteki');
      const video=e.target.closest('[data-open-video]');if(video)track('video_open',video.dataset.openVideo,'Film edukacyjny');
      const complete=e.target.closest('[data-complete-id]');if(complete){const id=complete.dataset.completeId;track('lesson_complete',id,'Ukończona lekcja');setTimeout(()=>syncState('academyCompletedLessons'),100);}
      if(e.target.closest('#refreshCommunity'))loadCommunity();
      const review=e.target.closest('[data-review-id]');if(review)reviewItem(review.dataset.reviewId,review.dataset.reviewStatus);
      const row=e.target.closest('[data-check-row]');if(row)setTimeout(()=>syncState('academyChecklist'),100);
      const prompt=e.target.closest('[data-chat-prompt]');if(prompt){const input=$('#cloudChatQuestion');if(input){input.value=prompt.dataset.chatPrompt;input.focus();}}
      const freeSource=e.target.closest('[data-free-source-group][data-free-source-id]');if(freeSource){window.ACADEMY_OPEN_SOURCE?.(freeSource.dataset.freeSourceGroup,freeSource.dataset.freeSourceId);}
      const cloudConv=e.target.closest('[data-cloud-conversation]');if(cloudConv)openCloudConversation(cloudConv.dataset.cloudConversation);
      const localConv=e.target.closest('[data-local-conversation]');if(localConv)openLocalConversation(localConv.dataset.localConversation);
      const feedback=e.target.closest('[data-feedback-message]');if(feedback)sendFeedback(feedback.dataset.feedbackMessage,feedback.dataset.feedbackRating,feedback);
      if(e.target.closest('#newCloudChat'))newConversation();
    },true);
    document.addEventListener('change',e=>{
      if(e.target.matches('[data-guide-check]')){track('checklist_tick',e.target.dataset.guideCheck,'Krok lekcji');setTimeout(()=>syncState('academyGuideSteps'),100);}
      if(e.target.matches('[data-check-row]'))setTimeout(()=>syncState('academyChecklist'),100);
      if(e.target.id==='globalSearch'&&e.target.value.trim().length>=3)track('site_search','academy-search','Wyszukiwanie w Akademii',{queryLength:e.target.value.trim().length,locale:localStorage.getItem('academyLanguage')||'pl'});
      if(e.target.id==='pdfSearchInput'&&e.target.value.trim().length>=3)track('manual_search','academy-manuals','Wyszukiwanie w podręcznikach',{queryLength:e.target.value.trim().length});
    },true);
    $('#cloudChatForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#cloudChatQuestion');const q=input.value.trim();input.value='';sendChat(q);});
    $('#cloudChatQuestion')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#cloudChatForm')?.requestSubmit();}});
    $('#enableCloudSync')?.addEventListener('click',enableSync);$('#disableCloudSync')?.addEventListener('click',disableSync);$('#deleteCloudData')?.addEventListener('click',deleteCloudData);$('#exportCloudData')?.addEventListener('click',exportCloudData);$('#exportSecurityReport')?.addEventListener('click',exportSecurityReport);
    $('#knowledgeForm')?.addEventListener('submit',e=>{e.preventDefault();submitKnowledge(e.currentTarget);});$('#loadAdminQueue')?.addEventListener('click',loadAdminQueue);$('#refreshCommunity')?.addEventListener('click',loadCommunity);
    $('#createContributorProfile')?.addEventListener('click',createContributorProfile);$('#contributorLogout')?.addEventListener('click',logoutContributor);
    $('#emailAuthRegisterMode')?.addEventListener('click',()=>setEmailAuthMode('register'));$('#emailAuthLoginMode')?.addEventListener('click',()=>setEmailAuthMode('login'));
    $('#emailAuthForm')?.addEventListener('submit',e=>{e.preventDefault();submitEmailAuth(e.currentTarget);});$('#emailAccountLogout')?.addEventListener('click',logoutContributor);
    $('#emailForgotPasswordButton')?.addEventListener('click',showPasswordResetRequest);$('#emailForgotSend')?.addEventListener('click',requestPasswordReset);$('#emailForgotCancel')?.addEventListener('click',()=>$('#emailForgotPanel')?.classList.add('hidden'));$('#emailResetSubmit')?.addEventListener('click',submitPasswordReset);$('#sendEmailVerification')?.addEventListener('click',sendEmailVerification);
    $('#emailAuthTotpVerify')?.addEventListener('click',finishTotpChallenge);$('#emailAuthTotpCode')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();finishTotpChallenge();}});$('#emailAuthTotpCancel')?.addEventListener('click',()=>{hideTotpChallenge();sayInfo('#emailAuthStatus','Wrócono do formularza logowania.');});
    $('#totpSetupStart')?.addEventListener('click',startTotpSetup);$('#totpSetupConfirm')?.addEventListener('click',confirmTotpSetup);$('#totpDisable')?.addEventListener('click',()=>runTotpManagement('disable'));$('#totpRecoveryRegenerate')?.addEventListener('click',()=>runTotpManagement('regenerate-recovery'));
    $('#totpRecoveryCopy')?.addEventListener('click',async()=>{const value=$('#totpRecoveryCodesList')?.textContent||'';try{await navigator.clipboard.writeText(value);say('#accountTotpStatus','Skopiowano kody. Zapisz je w bezpiecznym miejscu.',true);}catch{say('#accountTotpStatus','Nie udało się skopiować — zaznacz kody i zapisz je ręcznie.');}});
    $('#emailAuthRetry')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Sprawdzam…';try{await refreshSession();await refreshOAuthProviders();}finally{b.disabled=false;b.textContent='Sprawdź ponownie ↻';}});
    $('#emailAuthTogglePassword')?.addEventListener('click',()=>togglePasswordVisibility('#emailAuthPassword','#emailAuthTogglePassword'));
    $('#emailAuthToggleConfirm')?.addEventListener('click',()=>togglePasswordVisibility('#emailAuthPasswordConfirm','#emailAuthToggleConfirm'));
    $('#emailAuthPassword')?.addEventListener('input',()=>{updatePasswordGuide();$('#emailAuthPassword')?.removeAttribute('aria-invalid');});
    $('#emailAuthPasswordConfirm')?.addEventListener('input',()=>{updatePasswordGuide();$('#emailAuthPasswordConfirm')?.removeAttribute('aria-invalid');});
    $('#emailAuthEmail')?.addEventListener('input',()=>$('#emailAuthEmail')?.removeAttribute('aria-invalid'));
    $('#emailAuthTerms')?.addEventListener('change',()=>{if($('#emailAuthTerms')?.checked){$('#emailAuthTermsWrap')?.classList.remove('needs-attention');$('#emailAuthTerms')?.removeAttribute('aria-invalid');}});
    document.addEventListener('click',e=>{const copy=e.target.closest('[data-copy-oauth-callback]');if(copy){e.preventDefault();const value=$('#oauthCallbackUrl')?.textContent?.trim()||'';if(value&&navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(()=>say('#accountOAuthStatus','Skopiowano adres callback OAuth.',true)).catch(()=>say('#accountOAuthStatus','Nie udało się skopiować callbacku. Zaznacz adres ręcznie.'));}else say('#accountOAuthStatus','Adres callback jest wyświetlony poniżej — zaznacz go i skopiuj ręcznie.');return;}const revoke=e.target.closest('#revokeOtherSessions');if(revoke){e.preventDefault();revokeOtherSessions(revoke);return;}const unlink=e.target.closest('[data-auth-unlink]');if(unlink){e.preventDefault();unlinkLoginMethod(unlink.dataset.authUnlink,unlink);return;}const button=e.target.closest('[data-oauth-start]');if(button){e.preventDefault();if(!button.disabled)beginOAuth(button);}});
  }
  async function init(){
    bindTracking();
    {const status=$('#cloudChatStatus');if(status)status.textContent='Sprawdzam Google Gemini…';
     const note=$('#cloudAiConfigNotice');if(note)note.textContent='Google Gemini jest jedynym modelem AI. Asystent odpowiada wyłącznie na tematy nauki, diagnostyki, naprawy i konserwacji komputerów oraz laptopów. Klucz pozostaje po stronie Cloudflare.';}
    setEmailAuthMode('register');
    passwordResetToken=new URLSearchParams(location.hash.replace(/^#/, '')).get('password_reset')||new URLSearchParams(location.search).get('password_reset')||'';
    if(passwordResetToken){$('#emailAuthFormWrap')?.classList.add('hidden');$('#emailForgotPanel')?.classList.add('hidden');$('#emailPasswordResetPanel')?.classList.remove('hidden');}
    await refreshSession();await refreshOAuthProviders();await refreshChatProviderStatus();
    const authParams=new URLSearchParams(location.search);const authResult=authParams.get('auth_result');
    if(authResult){const error=authParams.get('auth_error')||'';if(authResult==='two_factor_required'){showTotpChallenge('Dostawca potwierdził konto. Dokończ logowanie kodem 2FA.');sayInfo('#accountOAuthStatus','Wymagane potwierdzenie 2FA.');history.replaceState(null,'',location.pathname+location.hash);}else if(authResult==='email_verified'){say('#emailAuthStatus','Adres e-mail został potwierdzony. Możesz teraz zalogować się do Akademii.',true);history.replaceState(null,'',location.pathname+location.hash);}else if(authResult==='email_verification_invalid'||authResult==='email_verification_expired'){say('#emailAuthStatus','Link potwierdzający jest nieprawidłowy, wygasł lub został już użyty. Zaloguj się i poproś o nową wiadomość.','warning');history.replaceState(null,'',location.pathname+location.hash);}else{const provider=Object.keys({google:1,facebook:1,microsoft:1,github:1,discord:1}).find(key=>error===key+'_not_configured');const providerNames={google:'Google',facebook:'Facebook',microsoft:'Microsoft',github:'GitHub',discord:'Discord'};const friendly={terms_required:'Zaznacz zgodę na zasady korzystania i politykę prywatności, aby utworzyć konto lub się zalogować.',link_session_expired:'Sesja wygasła podczas łączenia dostawcy. Zaloguj się ponownie i powtórz operację.',provider_not_configured:'Ta metoda logowania nie jest skonfigurowana na serwerze.',oauth_schema_not_ready:'Baza D1 nie ma wymaganych migracji OAuth. Uruchom kontrolowany publikator, który wykona kopię i uzupełni schemat.',provider_token_exchange_failed:'Dostawca odrzucił wymianę kodu. Sprawdź Client ID, Client Secret i dokładny adres callback zapisany w panelu dostawcy.',provider_verification_failed:'Dostawca nie potwierdził tożsamości. Sprawdź typ aplikacji, dozwolone konto i zakresy OAuth.',stan_logowania_wygasl:'Próba logowania wygasła. Rozpocznij ją ponownie.',logowanie_anulowane_lub_nieprawidlowy_stan:'Logowanie anulowano lub nie udało się potwierdzić bezpiecznej sesji.'};const message=authResult==='success'?'Logowanie zakończone. Profil autora jest gotowy.':`Logowanie nie powiodło się: ${provider?providerNames[provider]+' nie jest skonfigurowany. Dodaj '+providerNames[provider]+' Client ID i Client Secret w konfiguratorze OAuth.':friendly[error]||'spróbuj ponownie lub sprawdź diagnostykę logowania.'}`;say('#contributorAccessStatus',message,authResult==='success');say('#accountOAuthStatus',message,authResult==='success');history.replaceState(null,'',location.pathname+location.hash);}}
    if(active)track('page_view','academy-home','Otwarcie Akademii');await loadCommunity();await refreshMetrics();await loadConversations();
    if(!active){const list=localConversations();if(list.length){const recent=list.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];openLocalConversation(recent.id);}else{localConversationId=null;showChatWelcome();}}
    else{showChatWelcome();}
    const form=$('#knowledgeForm');if(form&&!contributorReady)say('#knowledgeFormStatus','Aby wysłać przypadek, utwórz profil pseudonimowy lub zaloguj się. Synchronizacja historii nauki jest opcjonalna.');
  }
  window.ACADEMY_CLOUD={track,refreshCommunity:loadCommunity,refreshSession,ask:async q=>{track('chat_question','lesson-tutor',String(q).slice(0,100));const r=findLocalAnswer(q,[]);return typeof r==='string'?{answer:r,mode:'free-local-library',sources:[]}:{...r,mode:'free-local-library'};},refresh:refreshSession};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
