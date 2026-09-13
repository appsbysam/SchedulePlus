(() => {
  const RELEASE_KEY='schedule_plus_last_seen_version';
  const FIRST_USE_KEY='schedule_plus_has_used_app';
  const appView=()=>document.getElementById('appView');
  const authView=()=>document.getElementById('authView');
  const loggedOutScreen=()=>{const app=appView(),auth=authView();return !!auth&&!auth.classList.contains('hidden')&&!!app&&app.classList.contains('hidden')};
  function closeUpdate(){const d=document.getElementById('updateModal');if(d?.open){try{d.close()}catch(_){d.removeAttribute('open')}}}
  function closeHiddenAppDialogs(){if(!loggedOutScreen())return;document.querySelectorAll('#appView dialog[open]').forEach(dialog=>{try{dialog.close()}catch(_){dialog.removeAttribute('open')}})}
  function recordCurrentRelease(){
    const version=typeof APP_VERSION!=='undefined'?String(APP_VERSION):'';
    if(!version)return;
    localStorage.setItem(FIRST_USE_KEY,'1');
    localStorage.setItem(RELEASE_KEY,version);
  }
  function reconcile(){
    closeUpdate();
    if(loggedOutScreen())closeHiddenAppDialogs();
    else recordCurrentRelease();
  }
  window.addEventListener('load',()=>{setTimeout(reconcile,0);setTimeout(reconcile,150)});
  document.addEventListener('DOMContentLoaded',()=>{const targets=[authView(),appView()].filter(Boolean);if(targets.length){const observer=new MutationObserver(()=>setTimeout(reconcile,0));targets.forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}))}setTimeout(reconcile,0)},{once:true});
  try{supabaseClient?.auth?.onAuthStateChange?.(()=>setTimeout(reconcile,75))}catch(_){}
})();