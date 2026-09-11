(() => {
  const RELEASE_KEY='schedule_plus_last_seen_version';
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
    if(!version || localStorage.getItem(RELEASE_KEY)===version)return;
    const versionLabel=document.getElementById('updateVersion');
    if(versionLabel)versionLabel.textContent=`Version ${version}`;
    try{modal.showModal()}catch(_){}
  }

  function reconcile(){
    if(loggedOutScreen())closeHiddenAppDialogs();
    else maybeShowWhatsNew();
  }

  // ui-enhancements may attempt to open What's New during window.load.
  // Run after all load handlers so a hidden modal can never block the login form.
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
