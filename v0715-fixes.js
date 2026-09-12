(()=>{
  let lastVisible=false;

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

  function onVisibilityChange(){
    const visible=syncScrollLock();
    if(visible&&!lastVisible){
      requestAnimationFrame(()=>setTimeout(forceHome,0));
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
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();