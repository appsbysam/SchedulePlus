(() => {
  let lastChecked = 0;
  const MIN_RECHECK_MS = 5 * 60 * 1000;

  function closeMenu(){
    document.getElementById('sideMenu')?.classList.remove('open');
    document.getElementById('drawerBackdrop')?.classList.add('hidden');
  }

  function toast(title, detail='', actionLabel='', action=null, ttl=2600){
    let el=document.getElementById('scheduleUpdateToast');
    if(!el){
      el=document.createElement('div'); el.id='scheduleUpdateToast'; el.className='update-toast hidden';
      el.innerHTML='<div class="update-toast-copy"><strong></strong><small></small></div><button class="primary hidden" type="button"></button>';
      document.body.appendChild(el);
    }
    el.querySelector('strong').textContent=title;
    el.querySelector('small').textContent=detail;
    const btn=el.querySelector('button');
    btn.classList.toggle('hidden',!actionLabel); btn.textContent=actionLabel||''; btn.onclick=action||null;
    el.classList.remove('hidden');
    clearTimeout(el._hideTimer);
    if(!actionLabel&&ttl)el._hideTimer=setTimeout(()=>el.classList.add('hidden'),ttl);
  }

  async function remoteVersion(){
    const response=await fetch(`version.js?check=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache'}});
    if(!response.ok)throw new Error(`Update check failed (${response.status})`);
    const text=await response.text();
    const match=text.match(/APP_VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
    return match?.[1]||null;
  }

  async function reloadLatest(){
    toast('Updating Schedule+…','Loading the latest version.');
    try{
      const reg=await navigator.serviceWorker?.getRegistration?.();
      if(reg){await reg.update(); if(reg.waiting)reg.waiting.postMessage?.({type:'SKIP_WAITING'});}
    }catch(_){}
    setTimeout(()=>location.reload(),250);
  }

  async function checkForUpdates({manual=false}={}){
    const btn=document.getElementById('checkUpdatesBtn');
    const original=btn?.textContent||'Check for updates';
    if(btn&&manual){btn.disabled=true;btn.textContent='Checking…';}
    try{
      const reg=await navigator.serviceWorker?.getRegistration?.();
      if(reg)await reg.update();
      const latest=await remoteVersion();
      lastChecked=Date.now();
      const current=typeof APP_VERSION!=='undefined'?String(APP_VERSION):'';
      if(latest&&current&&latest!==current){
        toast('Update available',`Version ${latest} is ready.`,'Reload now',reloadLatest,0);
      }else if(manual){
        toast('You’re up to date',current?`Schedule+ v${current}`:'Latest version loaded.');
      }
    }catch(err){
      console.error('Schedule+ update check failed',err);
      if(manual)toast('Could not check for updates','Check your internet connection and try again.');
    }finally{
      if(btn&&manual){btn.disabled=false;btn.textContent=original;}
    }
  }

  function install(){
    const accountActions=document.querySelector('.menu-account-actions');
    if(accountActions&&!document.getElementById('checkUpdatesBtn')){
      const signOut=document.getElementById('signOutBtn');
      const btn=document.createElement('button');
      btn.id='checkUpdatesBtn'; btn.type='button'; btn.textContent='Check for updates';
      btn.onclick=()=>{closeMenu();checkForUpdates({manual:true})};
      if(signOut)accountActions.insertBefore(btn,signOut);else accountActions.appendChild(btn);
    }
    setTimeout(()=>checkForUpdates({manual:false}),1400);
  }

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&Date.now()-lastChecked>=MIN_RECHECK_MS)checkForUpdates({manual:false});
  });
  window.addEventListener('online',()=>{if(Date.now()-lastChecked>=MIN_RECHECK_MS)checkForUpdates({manual:false})});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();