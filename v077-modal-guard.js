(()=>{
 const RELEASE_KEY='schedule_plus_last_seen_version';
 const version=()=>typeof APP_VERSION!=='undefined'?String(APP_VERSION):'';
 function modal(){return document.getElementById('updateModal')}
 function closeWhatsNew(){const d=modal();if(!d)return;try{if(d.open)d.close()}catch(_){d.removeAttribute('open')}d.removeAttribute('open');document.documentElement.classList.remove('sp-update-open');document.body.classList.remove('sp-update-open')}
 function bind(){const d=modal(),btn=document.getElementById('updateDone');if(!d||!btn)return;btn.type='button';const close=e=>{e?.preventDefault?.();e?.stopPropagation?.();localStorage.setItem(RELEASE_KEY,version());closeWhatsNew()};btn.onclick=close;btn.addEventListener('pointerup',close,{capture:true});d.addEventListener('cancel',close);d.addEventListener('close',()=>{document.documentElement.classList.remove('sp-update-open');document.body.classList.remove('sp-update-open')});
 }
 function safety(){const d=modal();if(!d?.open)return;document.documentElement.classList.add('sp-update-open');document.body.classList.add('sp-update-open');setTimeout(()=>{if(d.open){const b=document.getElementById('updateDone');if(!b||getComputedStyle(b).pointerEvents==='none')closeWhatsNew()}},800)}
 function init(){bind();safety();const o=new MutationObserver(()=>{bind();safety()});o.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();