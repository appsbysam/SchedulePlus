(() => {
  let lastChecked = 0;
  const MIN_RECHECK_MS = 5 * 60 * 1000;
  const RELOAD_ATTEMPT_KEY='schedule_plus_update_reload_attempt';
  const SILENT_VERSION='0.7.28';

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

  function parseVersion(text){
    const match=String(text||'').match(/APP_VERSION\s*=\s*['\"]([^'\"]+)['\"]/);
    return match?.[1]||null;
  }

  function compareVersions(a,b){
    const pa=String(a||'').split('.').map(n=>Number(n));
    const pb=String(b||'').split('.').map(n=>Number(n));
    const len=Math.max(pa.length,pb.length);
    for(let i=0;i<len;i++){
      const na=Number.isFinite(pa[i])?pa[i]:0;
      const nb=Number.isFinite(pb[i])?pb[i]:0;
      if(na>nb)return 1;
      if(na<nb)return -1;
    }
    return 0;
  }

  async function remoteVersion(){
    // Check the actual published site, not GitHub main: Pages can deploy later than the commit.
    const stamp=Date.now();
    const opts={cache:'no-store',headers:{'cache-control':'no-cache','pragma':'no-cache'}};
    const [versionResponse,htmlResponse]=await Promise.all([
      fetch(`./version.js?check=${stamp}`,opts),
      fetch(`./index.html?check=${stamp}`,opts)
    ]);
    if(!versionResponse.ok||!htmlResponse.ok)throw new Error('Published update is not ready');
    const version=parseVersion(await versionResponse.text());
    const html=await htmlResponse.text();
    const bootstrap=html.match(/(?:src=["'][^"']*\/)?version\.js\?v=([0-9.]+)/)?.[1];
    // Both the published bootstrap and version file must agree before offering an update.
    if(!version||!bootstrap||version!==bootstrap)throw new Error('Published update is still deploying');
    return version;
  }

  async function refreshServiceWorkerSilently(){
    try{
      const reg=await navigator.serviceWorker?.getRegistration?.();
      if(reg)await reg.update();
    }catch(_){}
  }

  async function reloadLatest(){
    const current=typeof APP_VERSION!=='undefined'?String(APP_VERSION):'';
    localStorage.setItem(RELOAD_ATTEMPT_KEY,JSON.stringify({from:current,at:Date.now()}));
    toast('Updating Schedule+…','Clearing the old app cache and loading the latest version.');
    try{
      const regs=await navigator.serviceWorker?.getRegistrations?.();
      if(regs?.length)await Promise.all(regs.map(r=>r.unregister().catch(()=>false)));
    }catch(_){}
    try{
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>k.startsWith('schedule-plus-v')).map(k=>caches.delete(k)));
      }
    }catch(_){}
    const url=new URL(location.href);
    url.searchParams.set('update',Date.now());
    location.replace(url.toString());
  }

  async function checkForUpdates({manual=false}={}){
    const btn=document.getElementById('checkUpdatesBtn');
    const original=btn?.textContent||'Check for updates';
    if(btn&&manual){btn.disabled=true;btn.textContent='Checking…';}
    try{
      const latest=await remoteVersion();
      lastChecked=Date.now();
      const current=typeof APP_VERSION!=='undefined'?String(APP_VERSION):'';
      const attempt=JSON.parse(localStorage.getItem(RELOAD_ATTEMPT_KEY)||'null');
      if(attempt&&compareVersions(current,attempt.from)>0)localStorage.removeItem(RELOAD_ATTEMPT_KEY);
      const recentlyRetried=attempt&&attempt.from===current&&Date.now()-attempt.at<10*60*1000;
      if(latest&&current&&compareVersions(latest,current)>0){
        if(recentlyRetried){
          if(manual)toast('Update not loaded yet','Open Schedule+ from its website once, then return to the app.');
          return;
        }
        if(!manual&&latest===SILENT_VERSION)await refreshServiceWorkerSilently();
        else toast('Update available',`Version ${latest} is ready.`,'Reload now',reloadLatest,0);
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