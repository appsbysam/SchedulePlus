(()=>{
 const PHONE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 3.5 9.2 8l-1.8 1.7c1.3 2.8 3.1 4.6 5.9 5.9l1.7-1.8 4.5 2.5-.7 3.1c-.2.8-.9 1.4-1.8 1.4C9.3 20.8 3.2 14.7 3.2 7c0-.9.6-1.6 1.4-1.8z"/></svg>';
 const CAL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2z"/></svg>';
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
 const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s_-]+/g,'');
 const statusLabel=j=>({new:'New',to_schedule:'To schedule',scheduled:'Scheduled',in_progress:'In Progress',waiting:'Follow-Up',completed:'Completed'}[j?.status]||String(j?.status||'').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase())||'Unscheduled');
 const tone=j=>{const x=norm(statusLabel(j));return x.includes('site')?'site':x.includes('progress')?'progress':x.includes('follow')?'followup':x.includes('complete')?'completed':x.includes('schedule')?'scheduled':'new'};
 const suburb=j=>j?.suburb||(typeof suburbFromAddress==='function'?suburbFromAddress(j?.address_line||''):'')||'Suburb not set';
 const fmtDate=(v,t='')=>{if(!v)return'—';const d=new Date(`${v}T12:00:00`);return `${new Intl.DateTimeFormat('en-AU',{weekday:'short'}).format(d)} ${String(d.getDate()).padStart(2,'0')} ${new Intl.DateTimeFormat('en-AU',{month:'short'}).format(d)}${t?` [${t}]`:''}`};
 function card(j){
   const phone=j.customer_phone?`<button class="compact-phone icon-only" type="button" aria-label="Contact ${esc(j.customer_name||'customer')}">${PHONE}</button>`:`<span class="compact-phone icon-only missing" aria-hidden="true">${PHONE}</span>`;
   return `<div class="swipe-row sp-job-row" data-id="${esc(j.id)}">
     <button class="swipe-delete swipe-delete-right" type="button" aria-label="Delete ${esc(j.customer_name||'job')}">Delete</button>
     <article class="job-card compact-job-card sp-job-card" data-id="${esc(j.id)}">
       <div class="sp-job-top"><div class="sp-job-name"><strong>${esc(j.customer_name||'No customer')}</strong><span>${esc(suburb(j))}</span></div><span class="compact-status sp-status" data-tone="${tone(j)}">${esc(statusLabel(j))}</span></div>
       <div class="sp-job-bottom"><span class="job-type-chip">${esc(j.title||'Job')}</span><span class="sp-job-date">${CAL}<span>${esc(fmtDate(j.scheduled_date,j.time_of_day||''))}</span></span>${phone}</div>
     </article>
   </div>`;
 }
 function reset(row){row.classList.remove('swipe-open');const c=row.querySelector('.sp-job-card');if(c)c.style.transform=''}
 function closeOthers(except){document.querySelectorAll('#jobsList .sp-job-row.swipe-open').forEach(r=>{if(r!==except)reset(r)})}
 function bindRows(){
   const root=document.getElementById('jobsList');if(!root)return;
   root.querySelectorAll('.sp-job-row').forEach(row=>{
     if(row.dataset.spBound)return;row.dataset.spBound='1';
     const cardEl=row.querySelector('.sp-job-card'),del=row.querySelector('.swipe-delete-right');let sx=0,sy=0,dx=0,moved=false,horizontal=false;
     cardEl.addEventListener('pointerdown',e=>{if(e.target.closest('.compact-phone'))return;sx=e.clientX;sy=e.clientY;dx=0;moved=false;horizontal=false;cardEl.setPointerCapture?.(e.pointerId)});
     cardEl.addEventListener('pointermove',e=>{if(!sx)return;const x=e.clientX-sx,y=e.clientY-sy;if(!horizontal&&Math.abs(x)>8&&Math.abs(x)>Math.abs(y))horizontal=true;if(!horizontal)return;dx=Math.min(0,Math.max(-92,x));if(Math.abs(dx)>6)moved=true;cardEl.style.transition='none';cardEl.style.transform=`translateX(${dx}px)`;e.preventDefault()});
     const finish=()=>{if(!sx)return;cardEl.style.transition='';if(horizontal&&dx<-46){closeOthers(row);row.classList.add('swipe-open');cardEl.style.transform='translateX(-86px)'}else reset(row);sx=0;sy=0;dx=0;setTimeout(()=>{moved=false},0)};
     cardEl.addEventListener('pointerup',finish);cardEl.addEventListener('pointercancel',finish);
     cardEl.addEventListener('click',e=>{if(e.target.closest('.compact-phone')||moved)return;const j=(Array.isArray(window.jobs)?window.jobs:(typeof jobs!=='undefined'?jobs:[])).find(x=>String(x.id)===String(row.dataset.id));if(j&&typeof openJob==='function')openJob(j)});
     del.onclick=async e=>{e.preventDefault();e.stopPropagation();if(typeof deleteJobFromDashboard==='function')await deleteJobFromDashboard(row.dataset.id);else if(typeof safeDeleteJob==='function')await safeDeleteJob(row.dataset.id,true)};
   });
 }
 function install(){
   try{jobCardHtml=card}catch(_){window.jobCardHtml=card}
   try{bindSwipeRows=bindRows}catch(_){window.bindSwipeRows=bindRows}
   if(typeof render==='function')render();
   const root=document.getElementById('jobsList');if(root)new MutationObserver(bindRows).observe(root,{childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();