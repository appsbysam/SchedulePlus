(()=>{
'use strict';
const KEYS=['new','to_schedule','scheduled','in_progress','waiting','completed'];
const DEFAULT=['New','To Schedule','Scheduled','In Progress','Follow Up','Completed'];
let labels={},positions={},businessId=null,loading=false;
const id=()=>window.SchedulePlusBusiness?.business?.id||null;
const label=k=>labels[k]||DEFAULT[KEYS.indexOf(k)]||k;
const ready=()=>!!businessId&&businessId===id();
const order=()=>[...KEYS].sort((a,b)=>(positions[a]??KEYS.indexOf(a)+1)-(positions[b]??KEYS.indexOf(b)+1));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
function refresh(){
 for(const selectId of ['status','statusFilter']){
  const el=document.getElementById(selectId);if(!el)continue;
  const existing=new Map([...el.options].map(o=>[o.value,o]));
  const ordered=order().map(k=>existing.get(k)).filter(Boolean);
  for(const o of ordered){o.textContent=label(o.value);el.appendChild(o)}
  const other=[...el.options].filter(o=>!KEYS.includes(o.value));
  for(const o of other)el.insertBefore(o,el.firstChild);
 }
 const jobs=Array.isArray(window.jobs)?window.jobs:[];
 document.querySelectorAll('.status-chip,.compact-status,.sp-status').forEach(el=>{
  const card=el.closest('[data-id]');if(!card)return;
  const job=jobs.find(j=>String(j.id)===String(card.dataset.id));if(job&&KEYS.includes(job.status))el.textContent=label(job.status);
 });
 document.dispatchEvent(new CustomEvent('scheduleplus:status-labels-changed'));
}
async function load(force=false){
 const current=id();
 if(!current){labels={};positions={};businessId=null;return}
 if(loading||(!force&&current===businessId))return;
 loading=true;
 try{
  const {data,error}=await supabaseClient.from('business_status_labels').select('status_key,display_label,sort_order').eq('business_id',current);
  if(error)throw error;
  if(id()!==current)return;
  businessId=current;labels={};positions={};
  for(const r of data||[])if(KEYS.includes(r.status_key)){labels[r.status_key]=r.display_label;if(Number.isInteger(r.sort_order))positions[r.status_key]=r.sort_order}
  refresh();
 }catch(e){console.warn('Status workflow configuration unavailable',e)}
 finally{loading=false}
}
function section(){
 const body=document.getElementById('businessConfigBody');
 if(!body||body.querySelector('#spStatusNames'))return;
 const details=document.createElement('details');details.id='spStatusNames';details.className='config-category';
 details.innerHTML='<summary><span class="config-group-summary"><span class="config-group-copy"><strong>Job Workflow</strong><small>Rename and reorder job stages</small></span></span></summary><div class="config-category-body"><p>Rename your stages and move them into your preferred workflow order. Existing jobs retain their assigned status.</p><p class="pu-note">The underlying functions of each stage remain unchanged. For example, Completed still closes a job even if renamed or moved.</p><div id="spStatusFields"></div><p id="spStatusMessage" role="status"></p><div class="sp-status-actions"><button type="button" id="spSaveStatuses" class="primary">Save workflow</button><button type="button" id="spResetStatuses" class="secondary">Reset to defaults</button></div></div>';
 body.appendChild(details);
 const fields=details.querySelector('#spStatusFields');
 let localOrder=order();
 function fill(){
  fields.innerHTML=localOrder.map((k,i)=>'<div class="sp-workflow-row" data-key="'+k+'" draggable="true" style="display:flex;align-items:center;gap:7px;margin:9px 0;padding:8px;border:1px solid #555;border-radius:10px"><span aria-label="Drag to reorder" title="Drag to reorder" style="cursor:grab;font-size:20px">☰</span><strong style="min-width:22px">'+(i+1)+'</strong><input aria-label="Stage '+(i+1)+' name" data-status-key="'+k+'" maxlength="45" value="'+escape(label(k))+'" style="min-width:0;flex:1;width:50%;padding:8px"><button type="button" data-move="up" aria-label="Move stage up" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-move="down" aria-label="Move stage down" '+(i===localOrder.length-1?'disabled':'')+'>↓</button></div>').join('');
 }
 function redraw(){
  const names=Object.fromEntries([...fields.querySelectorAll('[data-status-key]')].map(el=>[el.dataset.statusKey,el.value]));
  fill();
  for(const el of fields.querySelectorAll('[data-status-key]'))if(names[el.dataset.statusKey]!==undefined)el.value=names[el.dataset.statusKey];
 }
 function move(from,to){
  if(from<0||to<0||to>=localOrder.length||from===to)return;
  const [item]=localOrder.splice(from,1);localOrder.splice(to,0,item);redraw();
 }
 fields.addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(!b)return;const i=localOrder.indexOf(b.closest('[data-key]').dataset.key);move(i,i+(b.dataset.move==='up'?-1:1))});
 let dragging=null;
 fields.addEventListener('dragstart',e=>{const row=e.target.closest('[data-key]');if(!row)return;dragging=row.dataset.key;e.dataTransfer.effectAllowed='move'});
 fields.addEventListener('dragover',e=>{if(dragging&&e.target.closest('[data-key]'))e.preventDefault()});
 fields.addEventListener('drop',e=>{const row=e.target.closest('[data-key]');if(!row||!dragging)return;e.preventDefault();move(localOrder.indexOf(dragging),localOrder.indexOf(row.dataset.key));dragging=null});
 fields.addEventListener('dragend',()=>dragging=null);
 details.addEventListener('toggle',()=>{if(details.open){body.querySelectorAll('details.config-category').forEach(x=>{if(x!==details)x.open=false});load().then(()=>{localOrder=order();fill()})}});
 async function save(reset){
  const b=id();if(!b)return;
  const seq=reset?[...KEYS]:[...localOrder];
  const entries=seq.map((k,i)=>({status_key:k,display_label:reset?DEFAULT[KEYS.indexOf(k)]:fields.querySelector('[data-status-key="'+k+'"]').value.trim(),sort_order:i+1,business_id:b}));
  const msg=details.querySelector('#spStatusMessage');
  if(entries.some(x=>!x.display_label)){msg.textContent='Every stage needs a name.';return}
  if(new Set(entries.map(x=>x.display_label.toLowerCase())).size!==entries.length){msg.textContent='Each stage name must be different.';return}
  const button=details.querySelector('#spSaveStatuses');button.disabled=true;
  try{
   const {error}=await supabaseClient.from('business_status_labels').upsert(entries,{onConflict:'business_id,status_key'});if(error)throw error;
   labels=Object.fromEntries(entries.map(x=>[x.status_key,x.display_label]));positions=Object.fromEntries(entries.map(x=>[x.status_key,x.sort_order]));localOrder=order();fill();refresh();
   msg.textContent=reset?'Default workflow restored.':'Workflow saved.';
  }catch(e){msg.textContent='Could not save workflow: '+(e.message||'Please try again.')}
  finally{button.disabled=false}
 }
 details.querySelector('#spSaveStatuses').onclick=()=>save(false);
 details.querySelector('#spResetStatuses').onclick=()=>save(true);
 fill();
}
const observer=new MutationObserver(()=>{if(document.getElementById('businessConfigBody'))section();if(id()!==businessId&&!loading)load()});
function boot(){observer.observe(document.body,{childList:true,subtree:true});section();load();document.addEventListener('click',e=>{if(e.target.closest('#businessConfigBtn,#spConfig'))setTimeout(section,0)});document.addEventListener('change',e=>{if(e.target.id==='status'||e.target.id==='statusFilter')refresh()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.SchedulePlusStatusLabels={label,order,refresh,load,ready};
})();