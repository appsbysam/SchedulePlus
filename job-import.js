(()=>{
  let pendingDate=null;
  const $=s=>document.querySelector(s);
  const setValue=(id,value)=>{const el=document.getElementById(id);if(!el)return;el.value=value??'';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};

  function normaliseLabel(label){return String(label||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function parseClipboardText(text){
    const result={};
    const lines=String(text||'').replace(/\r/g,'').split('\n');
    let currentKey=null;
    const aliases={
      'customer name':'customerName','customer':'customerName',
      'address':'addressLine',
      'nmi':'nmi',
      'email':'customerEmail','email address':'customerEmail',
      'contact no':'customerPhone','contact number':'customerPhone','contact':'customerPhone','phone':'customerPhone','mobile':'customerPhone',
      'system details':'systemDetails','system detail':'systemDetails'
    };
    for(const raw of lines){
      const line=raw.trim();
      if(!line)continue;
      const m=line.match(/^(.{1,40}?)\s*(?::|[-–—])\s*(.*)$/);
      if(m){
        const key=aliases[normaliseLabel(m[1])];
        if(key){currentKey=key;result[key]=m[2].trim();continue}
      }
      if(currentKey)result[currentKey]=`${result[currentKey]||''}${result[currentKey]?' ':''}${line}`.trim();
    }
    if(result.systemDetails){
      const parts=result.systemDetails.split(/[;|]/).map(x=>x.trim()).filter(Boolean);
      const all=result.systemDetails.toLowerCase();
      if(/battery\s*\+\s*solar|solar\s*\+\s*battery/.test(all))result.jobTitle='Battery + Solar';
      else if(all.includes('battery'))result.jobTitle='Battery';
      else if(all.includes('solar'))result.jobTitle='Solar';
      const leftovers=parts.filter(p=>!/^\s*(battery\s*\+\s*solar|solar\s*\+\s*battery|battery|solar)\s*$/i.test(p));
      if(leftovers.length)result.workInvolved=leftovers.join('; ');
    }
    return result;
  }

  function ensureExtraFields(){
    const form=$('#jobForm');
    if(!form||$('#customerEmail'))return;
    const customer=$('#customerName')?.closest('.grid2');
    if(customer){
      const row=document.createElement('div');
      row.className='grid2 sp-import-extra-fields';
      row.innerHTML='<label>Email<input id="customerEmail" type="email" autocomplete="email"></label><label>NMI<input id="jobNmi" autocomplete="off"></label>';
      customer.insertAdjacentElement('afterend',row);
    }
  }

  function ensureDialogs(){
    if(!$('#addJobChoiceDialog')){
      const d=document.createElement('dialog');
      d.id='addJobChoiceDialog';d.className='sp-import-dialog';
      d.innerHTML='<div class="sp-import-card"><div class="dialog-head"><div><p class="eyebrow">ADD JOB</p><h2>How would you like to add it?</h2></div><button id="addJobChoiceClose" class="ghost" type="button">✕</button></div><div class="sp-import-actions"><button id="addJobClipboard" class="primary" type="button">Paste from clipboard</button><button id="addJobManual" class="secondary" type="button">Fill form manually</button></div><p class="muted sp-import-hint">Clipboard text will be read and used to pre-fill the normal job form for you to check before saving.</p></div>';
      document.body.appendChild(d);
      $('#addJobChoiceClose').onclick=()=>d.close();
      $('#addJobManual').onclick=()=>{d.close();openBlankForm()};
      $('#addJobClipboard').onclick=()=>readClipboard();
    }
    if(!$('#pasteJobTextDialog')){
      const d=document.createElement('dialog');d.id='pasteJobTextDialog';d.className='sp-import-dialog';
      d.innerHTML='<div class="sp-import-card"><div class="dialog-head"><div><p class="eyebrow">PASTE JOB DETAILS</p><h2>Paste the copied text</h2></div><button id="pasteJobTextClose" class="ghost" type="button">✕</button></div><textarea id="pasteJobText" rows="9" placeholder="Customer name:\nAddress:\nNMI:\nEmail:\nContact no:\nSystem details:"></textarea><p id="pasteJobMessage" class="message"></p><div class="dialog-actions"><button id="pasteJobCancel" class="secondary" type="button">Cancel</button><button id="pasteJobUse" class="primary" type="button">Use text</button></div></div>';
      document.body.appendChild(d);
      $('#pasteJobTextClose').onclick=$('#pasteJobCancel').onclick=()=>d.close();
      $('#pasteJobUse').onclick=()=>{const text=$('#pasteJobText').value;const parsed=parseClipboardText(text);if(!Object.keys(parsed).length){$('#pasteJobMessage').textContent='I could not find any recognised job fields in that text.';return}d.close();openPrefilledForm(parsed)};
    }
  }

  function openBlankForm(){
    ensureExtraFields();
    if(typeof openJob==='function')openJob(null,pendingDate);
  }

  function openPrefilledForm(data){
    ensureExtraFields();
    if(typeof openJob!=='function')return;
    openJob(null,pendingDate);
    requestAnimationFrame(()=>{
      setValue('customerName',data.customerName||'');
      setValue('customerPhone',data.customerPhone||'');
      setValue('customerEmail',data.customerEmail||'');
      setValue('jobNmi',data.nmi||'');
      setValue('addressLine',data.addressLine||'');
      if(data.jobTitle)setValue('jobTitle',data.jobTitle);
      if(data.workInvolved)setValue('workInvolved',data.workInvolved);
    });
  }

  async function readClipboard(){
    const choice=$('#addJobChoiceDialog');
    try{
      const text=await navigator.clipboard.readText();
      const parsed=parseClipboardText(text);
      if(!text.trim()||!Object.keys(parsed).length)throw new Error('No recognised clipboard text');
      choice?.close();
      openPrefilledForm(parsed);
    }catch(_){
      choice?.close();
      const d=$('#pasteJobTextDialog');
      $('#pasteJobText').value='';$('#pasteJobMessage').textContent='';
      d?.showModal();
      setTimeout(()=>$('#pasteJobText')?.focus(),50);
    }
  }

  function showChoice(date=null){
    pendingDate=date||null;
    ensureExtraFields();ensureDialogs();
    const d=$('#addJobChoiceDialog');if(d&&!d.open)d.showModal();
  }

  function wireButtons(){
    const bind=(id,getDate)=>{const b=document.getElementById(id);if(!b||b.dataset.spImportBound)return;b.dataset.spImportBound='1';b.onclick=e=>{e.preventDefault();e.stopPropagation();if(id==='dayAddJobBtn')$('#dayJobsDialog')?.close();showChoice(getDate?getDate(b):null)}};
    bind('newJobBtn');bind('calendarNewJobBtn');bind('dayAddJobBtn',b=>b.dataset.date||null);
  }

  function wrapOpenJob(){
    if(typeof openJob!=='function'||openJob.__spImportWrapped)return;
    const original=openJob;
    const wrapped=function(j=null,defaultDate=null){ensureExtraFields();const r=original(j,defaultDate);requestAnimationFrame(()=>{setValue('customerEmail',j?.customer_email||'');setValue('jobNmi',j?.nmi||'')});return r};
    wrapped.__spImportWrapped=true;openJob=wrapped;
  }

  function install(){ensureExtraFields();ensureDialogs();wrapOpenJob();wireButtons();setTimeout(()=>{wrapOpenJob();wireButtons()},500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
