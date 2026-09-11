(() => {
  const MAP = {
    description:{id:'description',label:'Job descriptions'},
    panel_brand:{id:'panelBrand',label:'Panel brands'},
    panel_type:{id:'panelType',label:'Panel types / models'},
    panel_quantity:{id:'panelQuantity',label:'Panel quantities',numeric:true},
    solar_capacity:{id:'solarCapacity',label:'Solar sizes (kW)',numeric:true},
    phase_type:{id:'phaseType',label:'Phase types'},
    battery_brand:{id:'batteryBrand',label:'Battery brands'},
    battery_type:{id:'batteryType',label:'Battery types / models'},
    battery_capacity:{id:'batteryCapacity',label:'Battery sizes (kWh)',numeric:true},
    inverter_brand:{id:'inverterBrand',label:'Inverter brands'},
    inverter_type:{id:'inverterType',label:'Inverter types / models'},
    inverter_capacity:{id:'inverterCapacity',label:'Inverter sizes (kW)',numeric:true}
  };
  const DEFAULTS = {
    description:['Installation','Replacement','Upgrade','Service / repair','Fault finding','Site inspection'],
    panel_brand:['Aiko','Canadian Solar','Jinko','LONGi','REC','Trina'],
    panel_type:[], panel_quantity:['6','8','10','12','14','16','18','20','22','24','30','40'],
    solar_capacity:['3.3','5','6.6','8','10','13.2','15','20'], phase_type:['Single phase','Three phase'],
    battery_brand:['BYD','Enphase','Sigenergy','Sungrow','Tesla'], battery_type:[], battery_capacity:['5','10','13.5','20','25','30'],
    inverter_brand:['Enphase','Fronius','GoodWe','Huawei','Sigenergy','SMA','SolarEdge','Sungrow'], inverter_type:[], inverter_capacity:['5','6','8','10','15','20']
  };
  const LOCAL_MAP={description:'description',panelBrand:'panel_brand',panelType:'panel_type',panelQuantity:'panel_quantity',solarCapacity:'solar_capacity',phaseType:'phase_type',batteryBrand:'battery_brand',batteryType:'battery_type',batteryCapacity:'battery_capacity',inverterBrand:'inverter_brand',inverterType:'inverter_type',inverterCapacity:'inverter_capacity'};
  let rows=[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const business=()=>window.SchedulePlusBusiness?.business||null;
  const membership=()=>window.SchedulePlusBusiness?.membership||null;
  const canManage=()=>['owner','admin'].includes(membership()?.role);
  const closeMenu=()=>{document.getElementById('sideMenu')?.classList.remove('open');document.getElementById('drawerBackdrop')?.classList.add('hidden')};

  async function loadRows(){
    const b=business(); if(!b)return [];
    const {data,error}=await supabaseClient.from('business_dropdown_options').select('*').eq('business_id',b.id).order('category').order('sort_order').order('value');
    if(error)throw error; rows=data||[]; return rows;
  }

  async function ensureDefaults(){
    const b=business(); if(!b||!canManage())return;
    const {count,error}=await supabaseClient.from('business_dropdown_options').select('id',{count:'exact',head:true}).eq('business_id',b.id);
    if(error||count>0)return;
    const seed=[]; Object.entries(DEFAULTS).forEach(([category,values])=>values.forEach((value,i)=>seed.push({business_id:b.id,category,value,sort_order:(i+1)*10})));
    if(seed.length) await supabaseClient.from('business_dropdown_options').insert(seed);
  }

  async function migrateLocalOptions(){
    const b=business(); if(!b||!canManage())return;
    const doneKey=`schedule_plus_config_migrated_${b.id}`; if(localStorage.getItem(doneKey)==='1')return;
    let store={}; try{store=JSON.parse(localStorage.getItem('schedule_plus_custom_select_options')||'{}')||{}}catch(_){}
    for(const [id,values] of Object.entries(store)){
      const category=LOCAL_MAP[id]; if(!category||!Array.isArray(values))continue;
      for(const raw of values){const value=String(raw||'').trim(); if(!value||value==='__add_new__')continue; const {error}=await supabaseClient.from('business_dropdown_options').insert({business_id:b.id,category,value,sort_order:1000}); if(error&&!String(error.code||'').includes('23505'))console.warn('Could not migrate dropdown option',error)}
    }
    localStorage.setItem(doneKey,'1');
  }

  function activeValues(category){return rows.filter(r=>r.category===category&&r.is_active).sort((a,b)=>(a.sort_order-b.sort_order)||a.value.localeCompare(b.value));}

  function populateSelect(category){
    const cfg=MAP[category], el=document.getElementById(cfg.id); if(!el||el.tagName!=='SELECT')return;
    const current=el.value&&el.value!=='__add_new__'?el.value:'';
    const blankText=cfg.id==='description'?'Not set':'Not set';
    el.innerHTML=''; el.append(new Option(blankText,''));
    activeValues(category).forEach(r=>el.append(new Option(r.value,r.value)));
    if(current&&![...el.options].some(o=>o.value===current))el.append(new Option(current,current));
    el.value=current;
  }

  function refreshJobSelects(){
    Object.keys(MAP).forEach(populateSelect);
    const title=document.getElementById('jobTitle');
    if(title){[...title.options].filter(o=>o.value==='__add_new__').forEach(o=>o.remove()); if(![...title.options].some(o=>o.value===''))title.prepend(new Option('Select job type',''));}
  }

  function ensureUi(){
    const actions=document.querySelector('.menu-profile-actions');
    if(actions&&!document.getElementById('businessConfigBtn')){
      const btn=document.createElement('button'); btn.id='businessConfigBtn'; btn.type='button'; btn.textContent='Configuration'; btn.onclick=openConfig; actions.appendChild(btn);
    }
    if(document.getElementById('businessConfigDialog'))return;
    const dialog=document.createElement('dialog'); dialog.id='businessConfigDialog'; dialog.className='config-dialog';
    dialog.innerHTML=`<div class="config-card"><div class="dialog-head"><div><p class="eyebrow">BUSINESS SETTINGS</p><h2>Configuration</h2></div><button id="businessConfigClose" class="ghost" type="button">✕</button></div><p class="config-intro">Choose which options appear in job dropdowns. Disabling an item hides it from new jobs without changing old jobs that already use it.</p><div id="businessConfigReadonly" class="config-readonly hidden">Only a business owner or admin can change these options.</div><div id="businessConfigBody"></div><p id="businessConfigMessage" class="config-message"></p><div class="dialog-actions"><button id="businessConfigDone" class="primary" type="button">Done</button></div></div>`;
    (document.getElementById('appView')||document.body).appendChild(dialog);
    document.getElementById('businessConfigClose').onclick=()=>dialog.close(); document.getElementById('businessConfigDone').onclick=()=>dialog.close();
  }

  function renderConfig(){
    ensureUi(); const body=document.getElementById('businessConfigBody'), editable=canManage(); document.getElementById('businessConfigReadonly').classList.toggle('hidden',editable);
    body.innerHTML=Object.entries(MAP).map(([category,cfg])=>{
      const items=rows.filter(r=>r.category===category).sort((a,b)=>(a.sort_order-b.sort_order)||a.value.localeCompare(b.value));
      return `<section class="config-category" data-category="${category}"><h3>${esc(cfg.label)}</h3>${editable?`<div class="config-add-row"><input data-new-option placeholder="Add ${esc(cfg.label.toLowerCase().replace(/s$/,''))}"><button class="secondary" data-add-option type="button">Add</button></div>`:''}<div class="config-option-list">${items.length?items.map(r=>`<div class="config-option-row ${r.is_active?'':'inactive'}" data-id="${r.id}"><input data-option-value value="${esc(r.value)}" ${editable?'':'disabled'}><button class="secondary config-toggle" data-toggle-option type="button" ${editable?'':'disabled'}>${r.is_active?'Disable':'Enable'}</button>${editable?'<button class="secondary config-save" data-save-option type="button">Save</button>':''}</div>`).join(''):'<div class="config-empty">No saved options yet.</div>'}</div></section>`;
    }).join('');
    body.querySelectorAll('[data-add-option]').forEach(btn=>btn.onclick=()=>addOption(btn.closest('.config-category')));
    body.querySelectorAll('[data-toggle-option]').forEach(btn=>btn.onclick=()=>toggleOption(btn.closest('.config-option-row')));
    body.querySelectorAll('[data-save-option]').forEach(btn=>btn.onclick=()=>renameOption(btn.closest('.config-option-row')));
  }

  function message(text,ok=false){const el=document.getElementById('businessConfigMessage'); if(!el)return; el.textContent=text||''; el.classList.toggle('ok',ok)}
  function validate(category,value){const v=String(value||'').trim(); if(!v)return 'Enter a value.'; if(MAP[category]?.numeric&&(!Number.isFinite(Number(v))||Number(v)<0))return 'Enter a valid number.'; return ''}

  async function addOption(section){
    const category=section?.dataset.category,input=section?.querySelector('[data-new-option]'),raw=input?.value||'',err=validate(category,raw); if(err)return message(err);
    const value=MAP[category]?.numeric?String(Number(raw)):raw.trim(); message('Saving…');
    const {error}=await supabaseClient.from('business_dropdown_options').insert({business_id:business().id,category,value,sort_order:1000});
    if(error){message(error.code==='23505'?'That option already exists.':error.message);return} input.value=''; await loadRows(); renderConfig(); refreshJobSelects(); message('Option added.',true);
  }

  async function toggleOption(row){
    const id=row?.dataset.id,item=rows.find(r=>r.id===id); if(!item)return; message('Saving…');
    const {error}=await supabaseClient.from('business_dropdown_options').update({is_active:!item.is_active,updated_at:new Date().toISOString()}).eq('id',id).eq('business_id',business().id);
    if(error){message(error.message);return} await loadRows(); renderConfig(); refreshJobSelects(); message(item.is_active?'Option disabled.':'Option enabled.',true);
  }

  async function renameOption(row){
    const id=row?.dataset.id,item=rows.find(r=>r.id===id),input=row?.querySelector('[data-option-value]'); if(!item||!input)return;
    const err=validate(item.category,input.value); if(err)return message(err); const value=MAP[item.category]?.numeric?String(Number(input.value)):input.value.trim(); if(value===item.value)return message('No changes to save.'); message('Saving…');
    const {error}=await supabaseClient.from('business_dropdown_options').update({value,updated_at:new Date().toISOString()}).eq('id',id).eq('business_id',business().id);
    if(error){message(error.code==='23505'?'That option already exists.':error.message);return} await loadRows(); renderConfig(); refreshJobSelects(); message('Option renamed.',true);
  }

  async function openConfig(){
    closeMenu(); ensureUi(); message('Loading…'); document.getElementById('businessConfigDialog').showModal();
    try{await ensureDefaults(); await migrateLocalOptions(); await loadRows(); renderConfig(); message('')}catch(e){message(e?.message||'Could not load configuration.')}
  }

  async function init(){
    let tries=0; while(!business()&&tries++<80)await new Promise(r=>setTimeout(r,100)); if(!business())return;
    ensureUi(); try{await ensureDefaults(); await migrateLocalOptions(); await loadRows(); refreshJobSelects()}catch(e){console.warn('Schedule+ configuration unavailable',e)}
  }
  if(document.readyState==='complete')init(); else window.addEventListener('load',init,{once:true});
})();