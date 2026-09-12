(()=>{
  let lastVisible=false;
  const updateReload=new URLSearchParams(location.search).has('update');

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

  function closeTransientViews(){
    ['jobDialog','dayJobsDialog'].forEach(id=>{
      const d=document.getElementById(id);
      if(d?.open){try{d.close()}catch(_){}}
    });
  }

  function forceHome(){
    closeTransientViews();
    const homeBtn=document.querySelector('.sp-nav-btn[data-sp-view="home"]');
    if(homeBtn){
      homeBtn.click();
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
    if(!updateReload||!appVisible())return;
    forceHome();
    requestAnimationFrame(()=>selectTotalJobs());
  }

  function onVisibilityChange(){
    const visible=syncScrollLock();
    if(visible&&!lastVisible){
      requestAnimationFrame(()=>setTimeout(()=>{
        forceHome();
        if(updateReload)selectTotalJobs();
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
      // Update reloads can finish rendering asynchronously. Repeat only on this
      // one update startup so later initialisers cannot restore an old job card.
      [80,250,650,1200].forEach(ms=>setTimeout(finishUpdateLanding,ms));
      window.addEventListener('load',()=>setTimeout(finishUpdateLanding,50),{once:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();