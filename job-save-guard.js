(()=>{
  const $=s=>document.querySelector(s);
  let baseline='',allowClose=false,saving=false,installed=false;

  function form(){return $('#jobForm')}
  function dialog(){return $('#jobDialog')}
  function snapshot(){const f=form();if(!f)return'';const fd=new FormData(f),parts=[];for(const [k,v] of fd.entries())parts.push(`${k}=${v}`);f.querySelectorAll('input,select,textarea').forEach((el,i)=>{if(!el.name)parts.push(`#${el.id||i}=${el.type==='checkbox'||el.type==='radio'?el.checked:el.value}`)});return parts.sort().join('&')}
  function markClean(){setTimeout(()=>{baseline=snapshot()},0)}
  function dirty(){return !!baseline&&snapshot()!==baseline}

  function ensurePrompt(){
    if($('#jobUnsavedDialog'))return;
    const d=document.createElement('dialog');d.id='jobUnsavedDialog';d.className='job-unsaved-dialog';
    d.innerHTML='<div class="job-unsaved-card"><h3>Unsaved changes</h3><p>You have changes that haven’t been saved.</p><div class="job-unsaved-actions"><button id="jobUnsavedCancel" type="button">Keep editing</button><button id="jobUnsavedDiscard" type="button">Discard changes</button><button id="jobUnsavedSave" type="button">Save changes</button></div></div>';
    document.body.appendChild(d);
    $('#jobUnsavedCancel').onclick=()=>d.close();
    $('#jobUnsavedDiscard').onclick=()=>{d.close();allowClose=true;dialog()?.close();allowClose=false};
    $('#jobUnsavedSave').onclick=()=>{d.close();saving=true;form()?.requestSubmit()};
  }

  function askBeforeClose(){ensurePrompt();const d=$('#jobUnsavedDialog');if(d&&!d.open)d.showModal()}

  function install(){
    if(installed)return;const f=form(),dlg=dialog(),close=$('#closeJobBtn');if(!f||!dlg)return;installed=true;ensurePrompt();
    // Date is the one universal minimum field, independent of optional configuration sections.
    f.addEventListener('submit',e=>{const date=$('#scheduledDate');if(!date?.value){e.preventDefault();e.stopImmediatePropagation();saving=false;alert('Please enter a date before saving.');date?.focus();return}saving=true},true);
    f.addEventListener('input',()=>{},true);f.addEventListener('change',()=>{},true);
    // Capture the populated form after New/Edit Job is opened.
    new MutationObserver(()=>{if(dlg.open&&!baseline)markClean()}).observe(dlg,{attributes:true,attributeFilter:['open']});
    dlg.addEventListener('close',()=>{baseline='';saving=false;allowClose=false});
    if(close){close.addEventListener('click',e=>{if(allowClose||saving||!dirty())return;e.preventDefault();e.stopImmediatePropagation();askBeforeClose()},true)}
    dlg.addEventListener('cancel',e=>{if(allowClose||saving||!dirty())return;e.preventDefault();askBeforeClose()});
    // Job forms are populated immediately after showModal(); refresh the baseline once values settle.
    document.addEventListener('click',e=>{const t=e.target.closest?.('#newJobBtn,#calendarNewJobBtn,[data-job-id],.job-card,.sp-job-card');if(t)setTimeout(()=>{if(dlg.open)markClean()},120)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();