(()=>{
const KEYS=['new','to_schedule','scheduled','in_progress','waiting','completed'];
const DEFAULT=['New','To Schedule','Scheduled','In Progress','Follow Up','Completed'];
let labels={};let businessId=null;
const id=()=>window.SchedulePlusBusiness?.business?.id||null;
const label=k=>labels[k]||DEFAULT[KEYS.indexOf(k)]||k;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
function refresh(){
 for(const selectId of ['status','statusFilter']){const el=document.getElementById(selectId);if(!el)continue;for(const opt of el.options){if(KEYS.includes(opt.value))opt.textContent=label(opt.value)}}
 document.querySelectorAll('.status-chip').forEach(el=>{const j=el.closest('[data-id]');if(j){const jobs=typeof window.jobs!=='undefined'?window.jobs:null;const item=jobs?.find?.(x=>String(x.id)===j.dataset.id);if(item&&KEYS.includes(item.status))el.textContent=label(item.status)}});
}
async function load(){const current=id();if(!current){labels={};businessId=null;return}if(current===businessId)return;businessId=current;labels={};const {data,error}=await supabaseClient.from('business_status_labels').select('status_key,display_label').eq('business_id',current);if(error){console.warn('Status labels unavailable',error);return}for(const r of data||[])if(KEYS.includes(r.status_key))labels[r.status_key]=r.display_label;refresh()}
function section(){
 const body=document.getElementById('businessConfigBody');if(!body||body.querySelector('#spStatusNames'))return;
 const details=document.createElement('details');details.id='spStatusNames';details.className='config-category';
 details.innerHTML='<summary><span class="config-group-summary"><span class="config-group-copy"><strong>Job Statuses</strong><small>Rename workflow stages</small></span></span></summary><div class="config-category-body"><p style="line-height:1.6">Customise the names to suit your business. Ensure they follow a logical workflow from the beginning of a job through to completion.</p><p style="font-size:12px;opacity:.75">The order and underlying functions remain unchanged.</p><div id="spStatusFields"></div><p id="spStatusMessage" role="status"></p><div class="sp-status-actions"><button type="button" id="spSaveStatuses" class="primary">Save status names</button><button type="button" id="spResetStatuses" class="secondary">Reset to defaults</button></div></div>';
 body.appendChild(details);
 details.addEventListener('toggle',()=>{if(details.open){body.querySelectorAll('details.config-category').forEach(x=>{if(x!==details)x.open=false});load().then(fill)}});
 const fields=details.querySelector('#spStatusFields');
 function fill(){fields.innerHTML=KEYS.map((k,i)=>'<label style="display:block;margin:12px 0">'+(i+1)+'. '+escape(DEFAULT[i])+'<input data-status-key="'+k+'" maxlength="45" value="'+escape(label(k))+'" style="display:block;width:100%;margin-top:5px"></label>').join('')}
 async function save(reset){const b=id();if(!b)return;const entries=KEYS.map((k,i)=>({status_key:k,display_label:reset?DEFAULT[i]:fields.querySelector('[data-status-key="'+k+'"]').value.trim()}));const msg=details.querySelector('#spStatusMessage');if(entries.some(x=>!x.display_label)){msg.textContent='Every status needs a name.';return}if(new Set(entries.map(x=>x.display_label.toLowerCase())).size!==entries.length){msg.textContent='Each status name must be different.';return}
 const button=details.querySelector('#spSaveStatuses');button.disabled=true;
 try{const {error}=reset?await supabaseClient.from('business_status_labels').delete().eq('business_id',b):await supabaseClient.from('business_status_labels').upsert(entries.map(x=>({...x,business_id:b})),{onConflict:'business_id,status_key'});if(error)throw error;labels=reset?{}:Object.fromEntries(entries.map(x=>[x.status_key,x.display_label]));fill();refresh();msg.textContent=reset?'Default names restored.':'Status names saved.'}catch(e){msg.textContent='Could not save: '+(e.message||'Please try again.')}finally{button.disabled=false}}
 details.querySelector('#spSaveStatuses').onclick=()=>save(false);details.querySelector('#spResetStatuses').onclick=()=>save(true);
 fill();
}
const observer=new MutationObserver(()=>{if(document.getElementById('businessConfigBody'))section();if(id()!==businessId)load()});
function boot(){observer.observe(document.body,{childList:true,subtree:true});section();load();document.addEventListener('click',e=>{if(e.target.closest('#businessConfigBtn,#spConfig'))setTimeout(section,0)});document.addEventListener('change',refresh)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.SchedulePlusStatusLabels={label,refresh,load};
})();