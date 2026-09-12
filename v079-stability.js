(()=>{
  const PHONE_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 3.5 9.2 8l-1.8 1.7c1.3 2.8 3.1 4.6 5.9 5.9l1.7-1.8 4.5 2.5-.7 3.1c-.2.8-.9 1.4-1.8 1.4C9.3 20.8 3.2 14.7 3.2 7c0-.9.6-1.6 1.4-1.8z"/></svg>';
  const CAL_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2z"/></svg>';
  let homeFilter='all';
  let homeStatsObserver=null;
  let jobBaseline=null;
  let jobDirty=false;
  let pendingAfterClose=null;
  let saveInFlight=false;

  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const allJobs=()=>{try{if(Array.isArray(window.jobs))return window.jobs;if(typeof jobs!=='undefined'&&Array.isArray(jobs))return jobs}catch(_){}return[]};
  const normalise=v=>String(v||'').trim().toLowerCase().replace(/[\s_-]+/g,'');
  const statusLabel=j=>{const s=String(j?.status||'');const map={new:'New',to_schedule:'To schedule',scheduled:'Scheduled',in_progress:'In Progress',waiting:'Follow-Up',completed:'Completed'};return map[s]||s.replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase())||'Unscheduled'};
  const toneFor=j=>{const x=normalise(statusLabel(j));if(x.includes('site'))return'site';if(x.includes('progress'))return'progress';if(x.includes('follow')||x.includes('waiting'))return'followup';if(x.includes('complete'))return'completed';if(x.includes('schedule'))return'scheduled';return'new'};
  const suburb=j=>j?.suburb||(typeof suburbFromAddress==='function'?suburbFromAddress(j?.address_line||''):'')||'Suburb not set';
  const fmtDate=(v,tod='')=>{if(!v)return'Unscheduled';const d=new Date(`${v}T12:00:00`);const wd=new Intl.DateTimeFormat('en-AU',{weekday:'short'}).format(d);const day=String(d.getDate()).padStart(2,'0');const mon=new Intl.DateTimeFormat('en-AU',{month:'short'}).format(d);return `${wd} ${day} ${mon}${tod?` [${tod}]`:''}`};
  const isFollowup=j=>{const raw=normalise(j?.status),label=normalise(statusLabel(j));return raw==='waiting'||raw.includes('followup')||label.includes('followup')||label.includes('waiting')};
  const isCompleted=j=>normalise(j?.status)==='completed'||normalise(statusLabel(j)).includes('completed');
  const isProgress=j=>normalise(j?.status)==='inprogress'||normalise(statusLabel(j)).includes('inprogress');
  function matches(j,key){
    if(key==='all')return true;
    if(key==='scheduled')return !!j.scheduled_date&&!isCompleted(j)&&!isFollowup(j);
    if(key==='progress')return isProgress(j);
    if(key==='followup')return isFollowup(j);
    if(key==='completed')return isCompleted(j);
    if(key==='overdue'){const today=typeof localDate==='function'?localDate():new Date().toISOString().slice(0,10);return !!j.scheduled_date&&j.scheduled_date<today&&!isCompleted(j)}
    return true;
  }
  function tileKey(tile,index){
    const txt=(tile.querySelector('span')?.textContent||'').toLowerCase();
    if(txt.includes('total')||txt.includes('all'))return'all';
    if(txt.includes('schedul')||txt.includes('book'))return'scheduled';
    if(txt.includes('progress'))return'progress';
    if(txt.includes('follow'))return'followup';
    if(txt.includes('complete'))return'completed';
    if(txt.includes('overdue'))return'overdue';
    return ['all','scheduled','progress','followup','completed','overdue'][index]||'all';
  }
  function homeCard(j){
    const phone=j.customer_phone?`<a data-phone class="sp-phone icon-only" href="tel:${esc(String(j.customer_phone).replace(/\s+/g,''))}" aria-label="Call ${esc(j.customer_name||'customer')}">${PHONE_ICON}</a>`:`<span class="sp-phone icon-only missing" aria-label="No phone">${PHONE_ICON}</span>`;
    return `<article class="sp-home-job" data-id="${esc(j.id)}"><div class="sp-home-job-top"><strong>${esc(j.customer_name||'No customer')}</strong><span class="sp-status" data-tone="${toneFor(j)}">${esc(statusLabel(j))}</span></div><div class="sp-home-job-suburb">${esc(suburb(j))}</div><div class="sp-home-job-bottom"><span>${esc(j.title||'Job')}</span><span class="sp-date">${CAL_ICON}<span>${esc(fmtDate(j.scheduled_date,j.time_of_day||''))}</span></span>${phone}</div></article>`;
  }
  function bindHomeCards(){
    const root=document.getElementById('spUpcoming');if(!root)return;
    root.querySelectorAll('.sp-home-job').forEach(el=>{el.onclick=e=>{if(e.target.closest('[data-phone]'))return;const j=allJobs().find(x=>String(x.id)===String(el.dataset.id));if(j&&typeof openJob==='function')openJob(j)}});
    root.querySelectorAll('[data-phone]').forEach(a=>a.onclick=e=>e.stopPropagation());
  }
  function renderHomeSelection(){
    const stats=document.getElementById('spStats'),root=document.getElementById('spUpcoming');if(!stats||!root)return;
    const all=allJobs();
    [...stats.querySelectorAll('.sp-stat-tile')].forEach((tile,i)=>{
      const key=tileKey(tile,i);tile.dataset.spFilter=key;tile.setAttribute('role','button');tile.tabIndex=0;tile.classList.toggle('selected',key===homeFilter);
      const count=tile.querySelector('strong');if(count)count.textContent=String(all.filter(j=>matches(j,key)).length);
      tile.onclick=()=>{homeFilter=key;renderHomeSelection()};
      tile.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();homeFilter=key;renderHomeSelection()}};
    });
    const list=all.filter(j=>matches(j,homeFilter)).sort((a,b)=>(a.scheduled_date||'9999').localeCompare(b.scheduled_date||'9999')||(a.scheduled_start||'99:99').localeCompare(b.scheduled_start||'99:99'));
    root.innerHTML=list.length?list.map(homeCard).join(''):'<div class="sp-home-empty">No jobs in this category.</div>';
    bindHomeCards();fixPhonePlaceholders(root);
  }
  function watchHomeStats(){
    const stats=document.getElementById('spStats');if(!stats)return;
    if(homeStatsObserver)homeStatsObserver.disconnect();
    homeStatsObserver=new MutationObserver(()=>queueMicrotask(renderHomeSelection));
    homeStatsObserver.observe(stats,{childList:true});
  }
  function fixPhonePlaceholders(root=document){
    root.querySelectorAll('.sp-phone.icon-only,.compact-phone.icon-only').forEach(el=>{
      const text=(el.textContent||'').trim().toLowerCase();
      if(!el.querySelector('svg')||text.includes('${')||text.includes('$(')||text==='phone')el.innerHTML=PHONE_ICON;
    });
  }
  function watchPhoneAreas(){
    ['jobsList','spUpcoming'].forEach(id=>{const root=document.getElementById(id);if(!root||root.dataset.spPhoneWatch)return;root.dataset.spPhoneWatch='1';new MutationObserver(()=>fixPhonePlaceholders(root)).observe(root,{childList:true,subtree:true})});
  }
  function ensureJobsSticky(){
    const view=document.getElementById('dashboardView');if(!view||view.querySelector(':scope > .sp-jobs-sticky'))return;
    const hero=view.querySelector(':scope > .hero-row'),types=view.querySelector(':scope > .type-filters'),toolbar=view.querySelector(':scope > .toolbar');if(!hero||!types||!toolbar)return;
    const wrap=document.createElement('div');wrap.className='sp-jobs-sticky';view.insertBefore(wrap,hero);wrap.append(hero,types,toolbar);
  }
  function syncDirections(){const btn=document.getElementById('viewOnMapBtn');if(!btn)return false;btn.textContent='Directions';btn.setAttribute('aria-label','Directions to this address');return true}

  function serialiseJobForm(){
    const form=document.getElementById('jobForm');if(!form)return'';
    return JSON.stringify([...form.querySelectorAll('input,select,textarea')].map(el=>[el.id||el.name||el.type,el.type==='checkbox'||el.type==='radio'?el.checked:el.value]));
  }
  function captureBaseline(){jobBaseline=serialiseJobForm();jobDirty=false;saveInFlight=false;pendingAfterClose=null}
  function refreshDirty(){if(jobBaseline!==null)jobDirty=serialiseJobForm()!==jobBaseline}
  function ensureUnsavedDialog(){
    let d=document.getElementById('spUnsavedDialog');if(d)return d;
    d=document.createElement('dialog');d.id='spUnsavedDialog';d.className='sp-unsaved-dialog';d.innerHTML='<div class="sp-unsaved-card"><h2>Save your changes?</h2><p>You have changes that haven’t been saved.</p><div class="sp-unsaved-actions"><button type="button" data-choice="keep">Keep editing</button><button type="button" data-choice="discard" class="danger">Discard</button><button type="button" data-choice="save" class="primary">Save changes</button></div></div>';
    document.body.appendChild(d);return d;
  }
  function askBeforeLeaving(action=null){
    refreshDirty();const jobDialog=document.getElementById('jobDialog');
    if(!jobDirty){jobDirty=false;jobBaseline=null;jobDialog?.close();if(action)setTimeout(action,0);return}
    const d=ensureUnsavedDialog();d.returnValue='';d.showModal();
    d.querySelector('[data-choice="keep"]').onclick=()=>d.close();
    d.querySelector('[data-choice="discard"]').onclick=()=>{d.close();jobDirty=false;jobBaseline=null;pendingAfterClose=action;jobDialog?.close()};
    d.querySelector('[data-choice="save"]').onclick=()=>{const form=document.getElementById('jobForm');if(!form)return;if(!form.checkValidity()){d.close();form.reportValidity();return}d.close();pendingAfterClose=action;saveInFlight=true;form.requestSubmit();setTimeout(()=>{if(document.getElementById('jobDialog')?.open){saveInFlight=false;pendingAfterClose=null}},8000)};
  }
  function installDirtyGuard(){
    const form=document.getElementById('jobForm'),jobDialog=document.getElementById('jobDialog'),close=document.getElementById('closeJobBtn');if(!form||!jobDialog||!close)return false;
    if(form.dataset.spDirtyGuard)return true;form.dataset.spDirtyGuard='1';
    form.addEventListener('input',refreshDirty);form.addEventListener('change',refreshDirty);
    close.onclick=e=>{e.preventDefault();askBeforeLeaving()};
    jobDialog.addEventListener('cancel',e=>{if(jobDirty){e.preventDefault();askBeforeLeaving()}});
    jobDialog.addEventListener('close',()=>{const action=pendingAfterClose;pendingAfterClose=null;if(saveInFlight){saveInFlight=false;jobDirty=false;jobBaseline=null}else if(!jobDirty){jobBaseline=null}if(action)setTimeout(action,0)});
    if(typeof openJob==='function'&&!openJob.__spDirtyGuard){const original=openJob;const wrapped=function(...args){original(...args);requestAnimationFrame(()=>setTimeout(captureBaseline,0))};wrapped.__spDirtyGuard=true;openJob=wrapped}
    document.addEventListener('click',e=>{const nav=e.target.closest?.('.sp-nav-btn[data-sp-view]');if(!nav||!jobDialog.open||!jobDirty)return;e.preventDefault();e.stopImmediatePropagation();askBeforeLeaving(()=>nav.click())},true);
    window.addEventListener('beforeunload',e=>{refreshDirty();if(!jobDirty)return;e.preventDefault();e.returnValue=''});
    return true;
  }
  function boot(){
    ensureJobsSticky();watchHomeStats();watchPhoneAreas();renderHomeSelection();fixPhonePlaceholders();installDirtyGuard();syncDirections();
    document.addEventListener('click',e=>{const nav=e.target.closest?.('.sp-nav-btn[data-sp-view="home"]');if(nav)setTimeout(()=>{watchHomeStats();renderHomeSelection()},0)});
    let tries=0;const timer=setInterval(()=>{tries++;ensureJobsSticky();watchHomeStats();watchPhoneAreas();installDirtyGuard();syncDirections();if(tries>=30)clearInterval(timer)},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();