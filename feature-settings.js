(()=>{
  const DEFAULTS={job_details:true,customer_details:true,scheduling:true,solar:true,battery:true,inverter:true,electrical:true,workflow:true};
  let state={...DEFAULTS},observer=null,applyQueued=false;
  const business=()=>window.SchedulePlusBusiness?.business||null;
  const enabled=k=>state[k]!==false;
  const setHidden=(el,hide)=>{if(!el)return;el.classList.toggle('sp-feature-hidden',!!hide)};
  const closestLabel=id=>document.getElementById(id)?.closest('label');
  const detailsFor=id=>document.getElementById(id)?.closest('details');
  const fieldGroup=id=>document.getElementById(id)?.closest('.grid2,.grid3');

  function applyForm(){
    const form=document.getElementById('jobForm');if(!form)return;
    const job=enabled('job_details'),customer=enabled('customer_details'),sched=enabled('scheduling'),solar=enabled('solar'),battery=enabled('battery'),inv=enabled('inverter'),elec=enabled('electrical'),workflow=enabled('workflow');
    setHidden(fieldGroup('customerName'),!customer);setHidden(closestLabel('addressLine'),!customer);setHidden(document.querySelector('.sp-import-extra-fields'),!customer);
    setHidden(closestLabel('jobTitle'),!job);setHidden(closestLabel('description'),!job);setHidden(closestLabel('workInvolved'),!job);
    setHidden(detailsFor('panelBrand'),!solar);setHidden(detailsFor('batteryBrand'),!battery);setHidden(detailsFor('inverterBrand'),!inv);setHidden(closestLabel('phaseType'),!elec);
    setHidden(fieldGroup('scheduledDate'),!sched);setHidden(document.querySelector('.job-time-of-day,.job-time-period,.time-of-day-row'),!sched);setHidden(document.getElementById('removeCalendarBtn'),!sched);
    setHidden(fieldGroup('status'),!workflow);
    const title=document.getElementById('jobTitle');if(title)title.required=false;
  }

  function applyCards(){
    document.querySelectorAll('.job-type-line,.job-description').forEach(el=>setHidden(el,!enabled('job_details')));
    document.querySelectorAll('.status-chip').forEach(el=>setHidden(el,!enabled('workflow')));
    document.querySelectorAll('.system-detail').forEach(el=>{
      const label=(el.querySelector('span')?.textContent||'').trim().toLowerCase();
      let key=null;
      if(label==='panels'||label==='solar size')key='solar';else if(label==='battery')key='battery';else if(label==='inverter')key='inverter';else if(label==='phase')key='electrical';else if(label==='work involved')key='job_details';
      if(key)setHidden(el,!enabled(key));
    });
  }

  function applyDashboard(){
    setHidden(document.querySelector('.type-filters'),!enabled('job_details'));
    setHidden(document.getElementById('statusFilter'),!enabled('workflow'));
    document.querySelectorAll('.sp-stat-tile.progress,.sp-stat-tile.followup,.sp-stat-tile.completed').forEach(el=>setHidden(el,!enabled('workflow')));
    document.querySelectorAll('.sp-stat-tile.scheduled,.sp-stat-tile.overdue').forEach(el=>setHidden(el,!enabled('scheduling')));
    const calNav=document.querySelector('.sp-nav-btn[data-sp-view="calendar"]');setHidden(calNav,!enabled('scheduling'));
    if(!enabled('scheduling')&&document.querySelector('.sp-view[data-sp-view="calendar"].active'))document.querySelector('.sp-nav-btn[data-sp-view="home"]')?.click();
  }

  function apply(){applyQueued=false;applyForm();applyCards();applyDashboard();document.documentElement.dataset.spFeatures=Object.entries(state).filter(([,v])=>v!==false).map(([k])=>k).join(',')}
  function queueApply(){if(applyQueued)return;applyQueued=true;requestAnimationFrame(apply)}
  async function load(){const b=business();if(!b?.id)return;const{data,error}=await supabaseClient.from('business_feature_settings').select('feature_key,is_enabled').eq('business_id',b.id);if(error){console.warn('Schedule+ feature settings',error);return}state={...DEFAULTS};(data||[]).forEach(r=>{if(r.feature_key in state)state[r.feature_key]=r.is_enabled!==false});queueApply();window.dispatchEvent(new CustomEvent('scheduleplus:featureschanged',{detail:{...state}}))}
  async function init(){let n=0;while(!business()&&n++<80)await new Promise(r=>setTimeout(r,100));if(!business())return;await load();observer=new MutationObserver(queueApply);observer.observe(document.getElementById('appView')||document.body,{childList:true,subtree:true});window.addEventListener('scheduleplus:feature-refresh',load)}
  window.SchedulePlusFeatures={isEnabled:enabled,getAll:()=>({...state}),refresh:load};
  if(document.readyState==='complete')init();else addEventListener('load',init,{once:true});
})();
