(() => {
  const STATUS_KEYS={'New':'new','To schedule':'to_schedule','Scheduled':'scheduled','In progress':'in_progress','Follow-Up':'waiting','Completed':'completed'};
  let dragging=null, list=null, pointerId=null, observer=null;

  function body(){return document.getElementById('businessConfigBody')}
  function statusDetails(){return body()?.querySelector('details[data-category="status"]')||null}
  function priorityDetails(){return body()?.querySelector('details[data-category="priority"]')||null}
  function activeStatusList(){return statusDetails()?.querySelector('.config-simple-list')||null}
  function rowValue(row){return row?.querySelector('[data-edit]')?.textContent?.trim()||''}
  function statusKey(value){return STATUS_KEYS[value]||value}

  function reorderCategories(){
    const root=body(),status=statusDetails(),priority=priorityDetails();if(!root||!status||!priority)return;
    if(root.firstElementChild!==status)root.insertBefore(status,root.firstElementChild);
    if(status.nextElementSibling!==priority)root.insertBefore(priority,status.nextElementSibling);
  }

  function decorate(){
    reorderCategories();
    const targetList=activeStatusList();if(!targetList)return;
    targetList.querySelectorAll('.config-list-row:not(.disabled)').forEach(row=>{
      if(row.querySelector('.config-drag-handle'))return;
      const h=document.createElement('button');h.type='button';h.className='config-drag-handle';h.setAttribute('aria-label',`Reorder ${rowValue(row)}`);h.innerHTML='<span aria-hidden="true">⠿</span>';row.insertBefore(h,row.firstChild);h.addEventListener('pointerdown',e=>startDrag(e,row,targetList));
    });
  }

  function startDrag(e,row,targetList){
    if(e.button!==undefined&&e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    dragging=row;list=targetList;pointerId=e.pointerId;row.classList.add('config-row-dragging');
    try{e.currentTarget.setPointerCapture(pointerId)}catch(_){}
    document.addEventListener('pointermove',moveDrag,true);document.addEventListener('pointerup',endDrag,true);document.addEventListener('pointercancel',endDrag,true);
  }

  function moveDrag(e){
    if(!dragging||!list)return;e.preventDefault();
    const el=document.elementFromPoint(e.clientX,e.clientY);const target=el?.closest?.('.config-list-row');
    if(!target||target===dragging||target.parentElement!==list||target.classList.contains('disabled'))return;
    const rect=target.getBoundingClientRect();
    if(e.clientY<rect.top+rect.height/2)list.insertBefore(dragging,target);else list.insertBefore(dragging,target.nextSibling);
  }

  async function endDrag(e){
    if(!dragging)return;
    e.preventDefault();const rows=[...list.querySelectorAll('.config-list-row:not(.disabled)')];dragging.classList.remove('config-row-dragging');dragging=null;
    document.removeEventListener('pointermove',moveDrag,true);document.removeEventListener('pointerup',endDrag,true);document.removeEventListener('pointercancel',endDrag,true);
    try{await Promise.all(rows.map((r,i)=>supabaseClient.from('business_dropdown_options').update({sort_order:(i+1)*10,updated_at:new Date().toISOString()}).eq('id',r.dataset.id)))}catch(err){console.error('Could not save status order',err)}
    applyStatusOrder(rows.map(rowValue));
  }

  function applyStatusOrder(values){
    const reorderSelect=(select,allLabel=false)=>{
      if(!select)return;const current=select.value;const byValue=new Map([...select.options].map(o=>[o.value,{text:o.textContent,value:o.value}]));select.innerHTML='';if(allLabel)select.append(new Option('All statuses',''));
      values.forEach(v=>{const k=statusKey(v),existing=byValue.get(k);select.append(new Option(existing?.text||v,k))});
      [...byValue.values()].forEach(o=>{if(o.value&&![...select.options].some(x=>x.value===o.value))select.append(new Option(o.text,o.value))});
      if([...select.options].some(o=>o.value===current))select.value=current;
    };
    reorderSelect(document.getElementById('status'),false);reorderSelect(document.getElementById('statusFilter'),true);
  }

  function install(){
    const root=body();if(!root)return false;decorate();
    if(!observer){observer=new MutationObserver(()=>requestAnimationFrame(decorate));observer.observe(root,{childList:true,subtree:true})}
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>200)clearInterval(timer)},100);
  document.addEventListener('click',e=>{if(e.target.closest('#businessConfigBtn'))setTimeout(decorate,100)},true);
})();