(() => {
  const RELEASE_KEY='schedule_plus_last_seen_version';
  const FIRST_USE_KEY='schedule_plus_has_used_app';
  const appView=()=>document.getElementById('appView');
  const authView=()=>document.getElementById('authView');
  const loggedOutScreen=()=>{
    const app=appView(),auth=authView();
    return !!auth && !auth.classList.contains('hidden') && !!app && app.classList.contains('hidden');
  };

  function closeHiddenAppDialogs(){
    if(!loggedOutScreen())return;
    document.querySelectorAll('#appView dialog[open]').forEach(dialog=>{
      try{dialog.close()}catch(_){dialog.removeAttribute('open')}
    });
  }

  function maybeShowWhatsNew(){
    const app=appView();
    if(!app || app.classList.contains('hidden'))return;
    const modal=document.getElementById('updateModal');
    if(!modal || modal.open)return;
    const version=typeof APP_VERSION!=='undefined'?String(APP_VERSION):'';
    if(!version)return;
    const seen=localStorage.getItem(RELEASE_KEY);
    const hasUsed=localStorage.getItem(FIRST_USE_KEY)==='1';

    if(!hasUsed){
      localStorage.setItem(FIRST_USE_KEY,'1');
      if(!seen){
        localStorage.setItem(RELEASE_KEY,version);
        return;
      }
    }

    if(seen===version)return;
    const versionLabel=document.getElementById('updateVersion');
    if(versionLabel)versionLabel.textContent=`Version ${version}`;
    try{modal.showModal()}catch(_){}
  }

  function reconcile(){
    if(loggedOutScreen())closeHiddenAppDialogs();
    else maybeShowWhatsNew();
  }

  window.addEventListener('load',()=>{
    setTimeout(reconcile,0);
    setTimeout(reconcile,150);
  });

  document.addEventListener('DOMContentLoaded',()=>{
    const targets=[authView(),appView()].filter(Boolean);
    if(targets.length){
      const observer=new MutationObserver(()=>setTimeout(reconcile,0));
      targets.forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));
    }
    setTimeout(reconcile,0);
  },{once:true});

  try{
    supabaseClient?.auth?.onAuthStateChange?.(()=>setTimeout(reconcile,75));
  }catch(_){}
})();
