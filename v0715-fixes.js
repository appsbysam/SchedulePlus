(()=>{
  let lastVisible=false;
  const updateReload=new URLSearchParams(location.search).has('update');
  let updateLandingActive=updateReload;
  let updateDialogObserver=null;

  function appVisible(){
    const app=document.getElementById('appView');
    return !!app&&!app.classList.contains('hidden');
  }

  function syncScrollLock(){
    const on=appVisible();
    document.documentElement.classList.toggle('sp-app-locked',on);
    document.body?.classList.toggle('sp-app-locked',on);
    return on;
  }

  function closeDialog(id){
    const d=document.getElementById(id);
    if(d?.open){try{d.close()}catch(_){d.removeAttribute('open')}}
  }

  function closeTransientViews(){
    closeDialog('jobDialog');
    closeDialog('dayJobsDialog');
  }

  function forceHome(){
    closeTransientViews();
    const homeBtn=document.querySelector('.sp-nav-btn[data-sp-view="home"]');
    if(homeBtn){
      if(!homeBtn.classList.contains('active'))homeBtn.click();
      return true;
    }
    const home=document.getElementById('spHomeView');
    if(!home)return false;
    document.querySelectorAll('.sp-view').forEach(v=>v.classList.toggle('active',v===home));
    return true;
  }

  function selectTotalJobs(){
    const stats=document.getElementById('spStats');
    if(!stats)return false;
    const tiles=[...stats.querySelectorAll('.sp-stat-tile')];
    const total=tiles.find(t=>t.dataset.homeFilter==='all'||/total\s*jobs/i.test(t.textContent||''));
    if(!total)return false;
    if(!total.classList.contains('selected'))total.click();
    return true;
  }

  function finishUpdateLanding(){
    if(!updateLandingActive||!appVisible())return;
    forceHome();
    requestAnimationFrame(()=>selectTotalJobs());
  }

  function guardJobDialogDuringUpdate(){
    if(!updateLandingActive)return;
    const dialog=document.getElementById('jobDialog');
    if(!dialog)return;
    closeDialog('jobDialog');
    updateDialogObserver?.disconnect();
    updateDialogObserver=new MutationObserver(()=>{
      if(updateLandingActive&&dialog.open){
        closeDialog('jobDialog');
        forceHome();
        selectTotalJobs();
      }
    });
    updateDialogObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
  }

  function endUpdateLandingGuard(){
    if(!updateLandingActive)return;
    finishUpdateLanding();
    closeTransientViews();
    selectTotalJobs();
    updateLandingActive=false;
    updateDialogObserver?.disconnect();
    updateDialogObserver=null;
    try{
      const url=new URL(location.href);
      url.searchParams.delete('update');
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }catch(_){}
  }

  function onVisibilityChange(){
    const visible=syncScrollLock();
    if(visible&&!lastVisible){
      requestAnimationFrame(()=>setTimeout(()=>{
        forceHome();
        if(updateLandingActive)selectTotalJobs();
      },0));
    }
    lastVisible=visible;
  }

  function boot(){
    const app=document.getElementById('appView');
    if(!app)return;
    lastVisible=appVisible();
    syncScrollLock();
    forceHome();
    new MutationObserver(onVisibilityChange).observe(app,{attributes:true,attributeFilter:['class']});
    window.addEventListener('pageshow',()=>{
      syncScrollLock();
      requestAnimationFrame(()=>setTimeout(forceHome,0));
    });

    if(updateReload){
      guardJobDialogDuringUpdate();
      [80,250,650,1200,1800,2400].forEach(ms=>setTimeout(finishUpdateLanding,ms));
      window.addEventListener('load',()=>{
        guardJobDialogDuringUpdate();
        setTimeout(finishUpdateLanding,50);
      },{once:true});
      setTimeout(endUpdateLandingGuard,2800);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();