(()=>{
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
      const all=result.systemDetails.toLowerCase();
      const hasBattery=/\bbattery\b|\bess\b|energy\s*storage|\bstorage\b|\bkwh\b/.test(all);
      const hasSolar=/\bsolar\b|\bpanel(s)?\b|\bmodule(s)?\b|\btrina\b|\bjinko\b|\baiko\b|\blongi\b|\brec\b|canadian\s+solar|\d+\s*[x×]\s*[a-z0-9 .-]+\s*\d{3,4}\s*w\b/i.test(result.systemDetails);
      if(/battery\s*\+\s*solar|solar\s*\+\s*battery/.test(all)||(hasBattery&&hasSolar))result.jobTitle='Battery + Solar';
      else if(hasBattery)result.jobTitle='Battery';
      else if(hasSolar)result.jobTitle='Solar';
      result.workInvolved=result.systemDetails.trim();
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

  function ensurePasteButton(){
    const title=$('#jobDialogTitle');
    const head=title?.closest('.dialog-head');
    if(!head||$('#jobPasteClipboardBtn'))return;
    const b=document.createElement('button');
    b.id='jobPasteClipboardBtn';b.type='button';b.className='primary sp-job-paste-btn';b.textContent='Paste from clipboard';
    const close=$('#closeJobBtn');if(close)head.insertBefore(b,close);else head.appendChild(b);
    b.onclick=()=>readClipboardIntoOpenJob();
  }

  function ensurePasteDialog(){
    if($('#pasteJobTextDialog'))return;
    const d=document.createElement('dialog');d.id='pasteJobTextDialog';d.className='sp-import-dialog';
    d.innerHTML='<div class="sp-import-card"><div class="dialog-head"><div><p class="eyebrow">PASTE JOB DETAILS</p><h2>Paste the copied text</h2></div><button id="pasteJobTextClose" class="ghost" type="button">✕</button></div><textarea id="pasteJobText" rows="9" placeholder="Customer name:\nAddress:\nNMI:\nEmail:\nContact no:\nSystem details:"></textarea><p id="pasteJobMessage" class="message"></p><div class="dialog-actions"><button id="pasteJobCancel" class="secondary" type="button">Cancel</button><button id="pasteJobUse" class="primary" type="button">Use text</button></div></div>';
    document.body.appendChild(d);
    $('#pasteJobTextClose').onclick=$('#pasteJobCancel').onclick=()=>d.close();
    $('#pasteJobUse').onclick=()=>{const parsed=parseClipboardText($('#pasteJobText').value);if(!Object.keys(parsed).length){$('#pasteJobMessage').textContent='I could not find any recognised job fields in that text.';return}d.close();fillOpenForm(parsed)};
  }

  function fillOpenForm(data){
    ensureExtraFields();
    setValue('customerName',data.customerName||'');
    setValue('customerPhone',data.customerPhone||'');
    setValue('customerEmail',data.customerEmail||'');
    setValue('jobNmi',data.nmi||'');
    setValue('addressLine',data.addressLine||'');
    if(data.jobTitle)setValue('jobTitle',data.jobTitle);
    if(data.workInvolved)setValue('workInvolved',data.workInvolved);
  }

  async function readClipboardIntoOpenJob(){
    try{
      const text=await navigator.clipboard.readText();
      const parsed=parseClipboardText(text);
      if(!text.trim()||!Object.keys(parsed).length)throw new Error('No recognised clipboard text');
      fillOpenForm(parsed);
    }catch(_){
      ensurePasteDialog();
      $('#pasteJobText').value='';$('#pasteJobMessage').textContent='';
      $('#pasteJobTextDialog')?.showModal();
      setTimeout(()=>$('#pasteJobText')?.focus(),50);
    }
  }

  function setPasteButtonVisibility(j){ensurePasteButton();const b=$('#jobPasteClipboardBtn');if(b)b.classList.toggle('hidden',!!j)}

  function wireAddButtons(){
    const n=$('#newJobBtn');if(n)n.onclick=e=>{e.preventDefault();if(typeof openJob==='function')openJob()};
    const c=$('#calendarNewJobBtn');if(c)c.onclick=e=>{e.preventDefault();if(typeof openJob==='function')openJob()};
    const d=$('#dayAddJobBtn');if(d)d.onclick=e=>{e.preventDefault();const date=e.currentTarget.dataset.date;$('#dayJobsDialog')?.close();if(typeof openJob==='function')openJob(null,date||null)};
  }

  function wrapOpenJob(){
    if(typeof openJob!=='function'||openJob.__spImportWrapped)return;
    const original=openJob;
    const wrapped=function(j=null,defaultDate=null){ensureExtraFields();ensurePasteButton();const r=original(j,defaultDate);requestAnimationFrame(()=>{setValue('customerEmail',j?.customer_email||'');setValue('jobNmi',j?.nmi||'');setPasteButtonVisibility(j)});return r};
    wrapped.__spImportWrapped=true;openJob=wrapped;
  }

  function install(){ensureExtraFields();ensurePasteDialog();ensurePasteButton();wrapOpenJob();wireAddButtons();setTimeout(()=>{wrapOpenJob();wireAddButtons();ensurePasteButton()},500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();