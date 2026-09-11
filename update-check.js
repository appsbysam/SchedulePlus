(() => {
  function closeMenu(){
    document.getElementById('sideMenu')?.classList.remove('open');
    document.getElementById('drawerBackdrop')?.classList.add('hidden');
  }

  async function checkForUpdates(){
    const btn=document.getElementById('checkUpdatesBtn');
    if(!btn)return;
    const original=btn.textContent;
    btn.disabled=true;
    btn.textContent='Checking…';
    try{
      const reg=await navigator.serviceWorker?.getRegistration?.();
      if(reg) await reg.update();
      await fetch(`version.js?check=${Date.now()}`,{cache:'no-store'});
      btn.textContent='Refreshing…';
      setTimeout(()=>location.reload(),150);
    }catch(err){
      console.error('Schedule+ update check failed',err);
      btn.textContent='Could not check';
      setTimeout(()=>{btn.disabled=false;btn.textContent=original},1400);
    }
  }

  function install(){
    const accountActions=document.querySelector('.menu-account-actions');
    if(!accountActions||document.getElementById('checkUpdatesBtn'))return;
    const signOut=document.getElementById('signOutBtn');
    const btn=document.createElement('button');
    btn.id='checkUpdatesBtn';
    btn.type='button';
    btn.textContent='Check for updates';
    btn.onclick=()=>{closeMenu();checkForUpdates()};
    if(signOut)accountActions.insertBefore(btn,signOut);else accountActions.appendChild(btn);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
