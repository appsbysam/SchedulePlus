(()=>{
  const DEFAULTS={job_details:true,solar:true,battery:true,inverter:true};
  let state={...DEFAULTS},observer=null,applyQueued=false;
  const business=()=>window.SchedulePlusBusiness?.business||null;
  const enabled=k=>state[k]!==false;
  const setHidden=(el,hide)=>{if(!el)return;el.classList.toggle('sp-feature-hidden',!!hide)};
  const closestLabel=id=>document.getElementById(id)?.closest('label');
  const detailsFor=id=>document.getElementById(id)?.closest('details');

  function applyForm(){
    const form=document.getElementById('jobForm');if(!form)return;
    const job=enabled('job_details'),system=enabled('solar'),battery=enabled('battery'),inv=enabled('inverter');
    setHidden(closestLabel('jobTitle'),!job);setHidden(closestLabel('description'),!job);
    setHidden(detailsFor('panelBrand'),!system);setHidden(closestLabel('phaseType'),!system);
    setHidden(detailsFor('batteryBrand'),!battery);setHidden(detailsFor('inverterBrand'),!inv);
    const title=document.getElementById('jobTitle');if(title)title.required=false;
  }

  function applyCards(){
    document.querySelectorAll('.job-type-line,.job-description').forEach(el=>setHidden(el,!enabled('job_details')));
    document.querySelectorAll('.system-detail').forEach(el=>{
      const label=(el.querySelector('span')?.textContent||'').trim().toLowerCase();
      let key=null;
      if(label==='panels'||label==='solar size'||label==='phase')key='solar';else if(label==='battery')key='battery';else if(label==='inverter')key='inverter';
      if(key)setHidden(el,!enabled(key));
    });
  }

  function applyDashboard(){
    setHidden(document.querySelector('.type-filters'),!enabled('job_details'));
  }

  function apply(){applyQueued=false;applyForm();applyCards();applyDashboard();document.documentElement.dataset.spFeatures=Object.entries(state).filter(([,v])=>v!==false).map(([k])=>k).join(',')}
  function queueApply(){if(applyQueued)return;applyQueued=true;requestAnimationFrame(apply)}
  async function load(){const b=business();if(!b?.id)return;const{data,error}=await supabaseClient.from('business_feature_settings').select('feature_key,is_enabled').eq('business_id',b.id);if(error){console.warn('Schedule+ feature settings',error);return}state={...DEFAULTS};(data||[]).forEach(r=>{if(r.feature_key in state)state[r.feature_key]=r.is_enabled!==false});queueApply();window.dispatchEvent(new CustomEvent('scheduleplus:featureschanged',{detail:{...state}}))}
  async function init(){let n=0;while(!business()&&n++<80)await new Promise(r=>setTimeout(r,100));if(!business())return;await load();observer=new MutationObserver(queueApply);observer.observe(document.getElementById('appView')||document.body,{childList:true,subtree:true});window.addEventListener('scheduleplus:feature-refresh',load)}
  window.SchedulePlusFeatures={isEnabled:enabled,getAll:()=>({...state}),refresh:load};
  if(document.readyState==='complete')init();else addEventListener('load',init,{once:true});
})();