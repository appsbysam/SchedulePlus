(()=>{
  const REMEMBER_KEY='schedule_plus_keep_signed_in';
  const SESSION_KEY='schedule_plus_session_tab';
  const REDIRECT='https://appsbysam.github.io/SchedulePlus/';
  const $=s=>document.querySelector(s);
  let recoveryMode=false;

  function normaliseAuthExtras(){
    const form=$('#authForm');
    if(!form)return;
    const rows=[...form.querySelectorAll('.auth-extra-row')];
    rows.slice(1).forEach(r=>r.remove());
    let row=rows[0];
    if(!row){
      row=document.createElement('div');
      row.className='auth-extra-row';
      row.innerHTML=`<label class="auth-remember"><input id="keepSignedIn" type="checkbox" checked> Keep me logged in</label><button id="forgotPasswordBtn" class="auth-forgot" type="button">Forgot password?</button>`;
      const submit=form.querySelector('button[type="submit"]');
      if(submit)form.insertBefore(row,submit);else form.appendChild(row);
    }
    row.querySelectorAll('#keepSignedIn').forEach((el,i)=>{if(i)el.remove()});
    row.querySelectorAll('#forgotPasswordBtn').forEach((el,i)=>{if(i)el.remove()});
    const stored=localStorage.getItem(REMEMBER_KEY);
    const keep=row.querySelector('#keepSignedIn');
    if(keep)keep.checked=stored===null?true:stored==='1';
    const forgot=row.querySelector('#forgotPasswordBtn');
    if(forgot)forgot.onclick=openRecoveryRequest;
    if(!form.dataset.authEnhancementsBound){
      form.dataset.authEnhancementsBound='1';
      form.addEventListener('submit',()=>{
        const keepNow=$('#keepSignedIn')?.checked!==false;
        localStorage.setItem(REMEMBER_KEY,keepNow?'1':'0');
        if(keepNow)sessionStorage.removeItem(SESSION_KEY);else sessionStorage.setItem(SESSION_KEY,'1');
      },true);
    }
  }

  function ensureUi(){
    normaliseAuthExtras();
    if(!$('#passwordRecoveryRequestDialog')){
      const request=document.createElement('dialog');
      request.id='passwordRecoveryRequestDialog';
      request.className='auth-recovery-dialog';
      request.innerHTML=`<div class="auth-recovery-card"><div class="dialog-head"><h2>Reset password</h2><button id="passwordRecoveryRequestClose" class="ghost" type="button">✕</button></div><p>Enter your Schedule+ email address and we'll send you a secure password reset link.</p><form id="passwordRecoveryRequestForm"><label>Email<input id="passwordRecoveryEmail" type="email" autocomplete="email" required></label><p id="passwordRecoveryRequestMessage" class="auth-recovery-message"></p><div class="auth-recovery-actions"><button id="passwordRecoveryRequestCancel" class="secondary" type="button">Cancel</button><button class="primary" type="submit">Send reset email</button></div></form></div>`;
      document.body.appendChild(request);
      $('#passwordRecoveryRequestClose').onclick=()=>request.close();
      $('#passwordRecoveryRequestCancel').onclick=()=>request.close();
      $('#passwordRecoveryRequestForm').onsubmit=sendRecovery;
    }
    if(!$('#passwordRecoverySetDialog')){
      const reset=document.createElement('dialog');
      reset.id='passwordRecoverySetDialog';
      reset.className='auth-recovery-dialog';
      reset.innerHTML=`<div class="auth-recovery-card"><div class="dialog-head"><h2>Choose a new password</h2></div><p>Enter a new password for your Schedule+ account.</p><form id="passwordRecoverySetForm"><label>New password<input id="passwordRecoveryNew" type="password" autocomplete="new-password" minlength="6" required></label><label>Confirm password<input id="passwordRecoveryConfirm" type="password" autocomplete="new-password" minlength="6" required></label><p id="passwordRecoverySetMessage" class="auth-recovery-message"></p><div class="auth-recovery-actions"><button class="primary" type="submit">Save new password</button></div></form></div>`;
      document.body.appendChild(reset);
      $('#passwordRecoverySetForm').onsubmit=saveNewPassword;
    }
  }

  function restoreAuthScreen(message=''){
    recoveryMode=false;
    document.querySelectorAll('.auth-recovery-dialog[open]').forEach(d=>{try{d.close()}catch(_){d.removeAttribute('open')}});
    $('#appView')?.classList.add('hidden');
    $('#pinView')?.classList.add('hidden');
    $('#authView')?.classList.remove('hidden');
    normaliseAuthExtras();
    const form=$('#authForm');
    form?.querySelectorAll('input,button').forEach(el=>{el.disabled=false});
    const pass=$('#password');if(pass)pass.value='';
    const msg=$('#authMessage');if(msg&&message)msg.textContent=message;
    history.replaceState({},'',location.pathname);
    setTimeout(()=>$('#password')?.focus(),50);
  }

  function openRecoveryRequest(){
    ensureUi();
    const email=$('#email')?.value?.trim()||'';
    $('#passwordRecoveryEmail').value=email;
    const msg=$('#passwordRecoveryRequestMessage');msg.textContent='';msg.classList.remove('ok');
    $('#passwordRecoveryRequestDialog').showModal();
    setTimeout(()=>$('#passwordRecoveryEmail').focus(),50);
  }

  async function sendRecovery(e){
    e.preventDefault();
    const email=$('#passwordRecoveryEmail').value.trim();
    const msg=$('#passwordRecoveryRequestMessage');
    const btn=e.submitter;
    btn.disabled=true;btn.textContent='Sending…';msg.classList.remove('ok');msg.textContent='';
    try{
      const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:`${REDIRECT}?reset=1`});
      if(error)throw error;
      msg.textContent='Reset email sent. Check your inbox and junk folder.';msg.classList.add('ok');
    }catch(err){msg.textContent=err?.message||'Could not send reset email.'}
    finally{btn.disabled=false;btn.textContent='Send reset email'}
  }

  function showNewPassword(){
    ensureUi();recoveryMode=true;
    $('#authView')?.classList.add('hidden');
    $('#pinView')?.classList.add('hidden');
    $('#appView')?.classList.add('hidden');
    const d=$('#passwordRecoverySetDialog');
    if(d&&!d.open)d.showModal();
  }

  async function saveNewPassword(e){
    e.preventDefault();
    const a=$('#passwordRecoveryNew').value,b=$('#passwordRecoveryConfirm').value,msg=$('#passwordRecoverySetMessage'),btn=e.submitter;
    msg.classList.remove('ok');msg.textContent='';
    if(a.length<6){msg.textContent='Password must be at least 6 characters.';return}
    if(a!==b){msg.textContent='Passwords do not match.';return}
    btn.disabled=true;btn.textContent='Saving…';
    try{
      const {error}=await supabaseClient.auth.updateUser({password:a});
      if(error)throw error;
      msg.textContent='Password updated. You can now sign in.';msg.classList.add('ok');
      await supabaseClient.auth.signOut();
      setTimeout(()=>restoreAuthScreen('Password updated. Sign in with your new password.'),350);
    }catch(err){msg.textContent=err?.message||'Could not update password.'}
    finally{btn.disabled=false;btn.textContent='Save new password'}
  }

  async function enforceSessionPreference(){
    const keep=localStorage.getItem(REMEMBER_KEY);
    if(keep!=='0')return;
    if(sessionStorage.getItem(SESSION_KEY)==='1')return;
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(session)await supabaseClient.auth.signOut();
  }

  async function init(){
    ensureUi();
    await enforceSessionPreference();
    const resetRequested=new URLSearchParams(location.search).has('reset');
    if(resetRequested){
      const {data:{session}}=await supabaseClient.auth.getSession();
      if(session)showNewPassword();
    }else if(!$('#authView')?.classList.contains('hidden')){
      restoreAuthScreen();
    }
    supabaseClient.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY')showNewPassword();
      if(event==='SIGNED_IN'&&localStorage.getItem(REMEMBER_KEY)==='0')sessionStorage.setItem(SESSION_KEY,'1');
      if(event==='SIGNED_OUT'&&!recoveryMode)sessionStorage.removeItem(SESSION_KEY);
    });
    const form=$('#authForm');
    if(form){new MutationObserver(()=>normaliseAuthExtras()).observe(form,{childList:true,subtree:false})}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();