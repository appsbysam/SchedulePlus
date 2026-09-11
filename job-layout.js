(() => {
  const SENTINEL={AM:'12',PM:'24'};
  const $=id=>document.getElementById(id);

  function formatDashboardDate(value,timeOfDay=''){
    if(!value)return '—';
    const d=new Date(`${value}T12:00:00`);
    if(Number.isNaN(d.getTime()))return '—';
    const weekday=new Intl.DateTimeFormat('en-AU',{weekday:'short'}).format(d);
    const day=String(d.getDate()).padStart(2,'0');
    const month=new Intl.DateTimeFormat('en-AU',{month:'short'}).format(d);
    const suffix=timeOfDay?` [${timeOfDay}]`:'';
    return `${weekday} ${day} ${month}${suffix}`;
  }
  function statusLabel(value){
    const map={new:'New',to_schedule:'To schedule',scheduled:'Scheduled',in_progress:'In progress',waiting:'Follow-Up',completed:'Completed'};
    if(map[value])return map[value];
    return String(value||'').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase())||'Unscheduled';
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

  function buildTimeOfDay(){
    const select=$('estimatedHours');
    if(!select||$('timeOfDayGroup'))return;
    const label=select.closest('label');
    if(!label)return;
    [...label.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>{if(n.textContent.trim())n.textContent='Time of day'});
    select.innerHTML='<option value=""></option><option value="12">AM</option><option value="24">PM</option>';
    select.classList.add('job-time-hidden-select');
    const group=document.createElement('div');
    group.id='timeOfDayGroup';group.className='time-of-day-group';
    group.innerHTML='<label class="time-of-day-option"><input type="radio" name="timeOfDayChoice" value="AM"><span>AM</span></label><label class="time-of-day-option"><input type="radio" name="timeOfDayChoice" value="PM"><span>PM</span></label>';
    label.appendChild(group);
    group.querySelectorAll('input').forEach(r=>r.addEventListener('change',()=>{select.value=SENTINEL[r.value]||''}));
  }

  function arrangeJobForm(){
    const form=$('jobForm');if(!form)return;
    buildTimeOfDay();
    const address=$('addressLine')?.closest('label');
    const statusGrid=$('status')?.closest('.grid2');
    const scheduleGrid=$('scheduledDate')?.closest('.grid3');
    if(address&&statusGrid&&scheduleGrid){
      address.insertAdjacentElement('afterend',statusGrid);
      statusGrid.insertAdjacentElement('afterend',scheduleGrid);
      scheduleGrid.classList.add('job-schedule-grid');
    }
    const battery=[...form.querySelectorAll('details.tech-section')].find(d=>(d.querySelector('summary')?.textContent||'').trim().toLowerCase().startsWith('battery'));
    const work=$('workInvolved')?.closest('label');
    if(battery&&work)battery.insertAdjacentElement('afterend',work);
  }

  function syncTimeOfDay(job){
    const select=$('estimatedHours'),group=$('timeOfDayGroup');if(!select||!group)return;
    const value=job?.time_of_day||'';
    group.querySelectorAll('input').forEach(r=>r.checked=r.value===value);
    select.value=SENTINEL[value]||'';
  }

  function guardOpeningFocus(){
    const d=$('jobDialog');if(!d)return;
    d.classList.add('job-opening-guard');
    const blur=()=>{try{document.activeElement?.blur?.()}catch(_){}};
    blur();requestAnimationFrame(blur);setTimeout(blur,80);setTimeout(blur,220);
    setTimeout(()=>d.classList.remove('job-opening-guard'),300);
  }

  function installOpenJobWrapper(){
    if(typeof openJob!=='function'||openJob.__scheduleTimeWrapped)return false;
    const original=openJob;
    const wrapped=function(j=null,defaultDate=null){
      arrangeJobForm();
      original(j,defaultDate);
      guardOpeningFocus();
      requestAnimationFrame(()=>{syncTimeOfDay(j);guardOpeningFocus()});
    };
    wrapped.__scheduleTimeWrapped=true;
    openJob=wrapped;
    return true;
  }

  function installDashboard(){
    if(typeof jobCardHtml!=='function'||jobCardHtml.__scheduleDateLayout)return false;
    const replacement=function(j){
      const phone=j.customer_phone?`<button class="compact-phone" type="button" aria-label="Contact ${esc(j.customer_name||'customer')}">${esc(j.customer_phone)}</button>`:'<span class="compact-phone missing">No phone</span>';
      const suburb=j.suburb||(typeof suburbFromAddress==='function'?suburbFromAddress(j.address_line||''):'')||'Suburb not set';
      const date=formatDashboardDate(j.scheduled_date,j.time_of_day||'');
      return `<div class="swipe-row compact-swipe-row" data-id="${j.id}">
        <button class="swipe-delete swipe-delete-left" type="button" aria-label="Delete ${esc(j.customer_name||'job')}">Delete</button>
        <article class="job-card compact-job-card dashboard-three-line" data-id="${j.id}">
          <div class="dashboard-line dashboard-line-one"><strong>${esc(j.customer_name||'No customer')}</strong><span class="chip compact-status">${esc(statusLabel(j.status))}</span></div>
          <div class="dashboard-line dashboard-line-two"><span class="compact-suburb">${esc(suburb)}</span><span class="compact-date">${esc(date)}</span></div>
          <div class="dashboard-line dashboard-line-three"><span class="job-type-chip">${esc(j.title||'Job')}</span>${phone}</div>
        </article>
        <button class="swipe-delete swipe-delete-right" type="button" aria-label="Delete ${esc(j.customer_name||'job')}">Delete</button>
      </div>`;
    };
    replacement.__scheduleDateLayout=true;
    jobCardHtml=replacement;
    if(typeof render==='function')render();
    return true;
  }

  function boot(){
    arrangeJobForm();
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      arrangeJobForm();
      const a=installOpenJobWrapper(),b=installDashboard();
      if((a||typeof openJob==='function')&&(b||typeof jobCardHtml==='function')&&tries>12)clearInterval(timer);
      if(tries>100)clearInterval(timer);
    },100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();