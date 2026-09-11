(() => {
  const WARNING_KEY='schedule_plus_unsupported_browser_dismissed';
  const ua=navigator.userAgent||'';
  const brave=!!navigator.brave||/Brave/i.test(ua);
  const edge=/Edg\//i.test(ua)||/EdgA|EdgiOS/i.test(ua);
  const opera=/OPR\//i.test(ua)||/Opera/i.test(ua);
  const samsung=/SamsungBrowser/i.test(ua);
  const firefox=/Firefox|FxiOS/i.test(ua);
  const chrome=!brave&&!edge&&!opera&&!samsung&&!firefox&&(/Chrome\//i.test(ua)||/CriOS\//i.test(ua));
  const safari=!brave&&!edge&&!opera&&!samsung&&!firefox&&!/Chrome|CriOS|Chromium/i.test(ua)&&/Safari\//i.test(ua);
  const supported=chrome||safari;
  window.SchedulePlusBrowserSupported=supported;
  document.documentElement.classList.toggle('unsupported-browser',!supported);
  const appName=()=>window.SchedulePlusBusiness?.business?.business_name||'Schedule+';

  function closeOtherDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>{if(d.id!=='installCompleteDialog'){try{d.close()}catch(_){d.removeAttribute('open')}}})}
  function ensureUi(){
    if(!document.getElementById('browserSupportWarning')){
      const warning=document.createElement('div');warning.id='browserSupportWarning';warning.className='browser-support-warning hidden';warning.innerHTML='<div><strong>Unsupported browser</strong><span>Schedule+ is designed for Chrome and Safari. Some functions, including app installation, may not work correctly in this browser.</span></div><button type="button" aria-label="Dismiss browser warning">×</button>';document.body.appendChild(warning);warning.querySelector('button').onclick=()=>{localStorage.setItem(WARNING_KEY,String(Date.now()));warning.classList.add('hidden')};
    }
    if(!document.getElementById('installCompleteDialog')){
      const dialog=document.createElement('dialog');dialog.id='installCompleteDialog';dialog.className='install-complete-dialog';dialog.innerHTML='<div class="install-complete-card"><div class="install-complete-icon">✓</div><div><p class="eyebrow">INSTALL COMPLETE</p><h2 id="installCompleteTitle">App installed</h2><p id="installCompleteText">The app has been added to your device.</p><p id="installCompleteStatus" class="install-complete-status"></p></div><div class="install-complete-actions"><button id="installCompleteDone" class="primary" type="button">Got it</button></div></div>';document.body.appendChild(dialog);document.getElementById('installCompleteDone').onclick=()=>dialog.close();
    }
  }
  function showWarning(){if(supported)return;closeOtherDialogs();const dismissed=Number(localStorage.getItem(WARNING_KEY)||0);if(dismissed&&Date.now()-dismissed<30*86400000)return;document.getElementById('browserSupportWarning')?.classList.remove('hidden')}
  function hideUnsupportedInstallUi(){if(supported)return;document.getElementById('pwaInstallBanner')?.classList.add('hidden')}
  function showInstallComplete(){if(!supported)return;ensureUi();closeOtherDialogs();const name=appName(),title=document.getElementById('installCompleteTitle'),text=document.getElementById('installCompleteText');if(title)title.textContent=`${name} is installed`;if(text)text.textContent=`Installation is complete. The ${name} icon should now be on your Home screen or in your app drawer. You can close this browser tab and open the app from the new icon.`;const dialog=document.getElementById('installCompleteDialog');if(dialog&&!dialog.open){try{dialog.showModal()}catch(_){}}}
  function init(){ensureUi();showWarning();hideUnsupportedInstallUi();if(!supported){const observer=new MutationObserver(()=>{hideUnsupportedInstallUi();closeOtherDialogs()});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']})}}
  window.addEventListener('appinstalled',()=>{setTimeout(showInstallComplete,1800)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();