(() => {
  const VERSION = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '0.4.08';
  const RELEASE_KEY = 'schedule_plus_last_seen_version';
  const DEVICE_KEY = 'schedule_plus_device_id';
  const CUSTOM_OPTIONS_KEY = 'schedule_plus_custom_select_options';
  const ADD_NEW_VALUE = '__add_new__';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function fallbackFriendlyName(email=''){
    const local = String(email || '').split('@')[0] || 'Signed in';
    return local.replace(/[._-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  }

  function displayName(user){
    const saved = String(user?.user_metadata?.display_name || '').trim();
    return saved || fallbackFriendlyName(user?.email || '');
  }

  function getDeviceId(){
    let id = localStorage.getItem(DEVICE_KEY);
    if(!id){
      const raw = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9]/gi,'').toUpperCase();
      id = `SCH-${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}`;
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function getDeviceType(){
    const ua = navigator.userAgent || '';
    if(/iPad|Tablet/i.test(ua)) return 'Tablet';
    if(/Android/i.test(ua) && /Mobile/i.test(ua)) return 'Android phone';
    if(/iPhone/i.test(ua)) return 'iPhone';
    if(/Android/i.test(ua)) return 'Android device';
    if(/Windows/i.test(ua)) return 'Windows computer';
    if(/Macintosh|Mac OS/i.test(ua)) return 'Mac computer';
    return 'Web browser';
  }

  function getBrowserName(){
    const ua = navigator.userAgent || '';
    if(/Edg\//i.test(ua)) return 'Microsoft Edge';
    if(/Chrome\//i.test(ua)) return 'Chrome / Chromium';
    if(/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if(/Firefox/i.test(ua)) return 'Firefox';
    return 'Browser';
  }

  function dashboardStatus(j){
    if(j.status === 'waiting') return 'Follow-Up';
    if(j.status === 'completed') return 'Completed';
    if(j.status === 'in_progress') return 'In progress';
    if(j.scheduled_date) return 'Scheduled';
    return 'Unscheduled';
  }

  function dashboardSuburb(j){
    if(j.suburb) return j.suburb;
    if(typeof suburbFromAddress === 'function') return suburbFromAddress(j.address_line || '') || 'Suburb not set';
    return 'Suburb not set';
  }

  if(typeof jobCardHtml === 'function'){
    jobCardHtml = function(j){
      const phone = j.customer_phone
        ? `<button class="compact-phone" type="button" aria-label="Contact ${esc(j.customer_name || 'customer')}">${esc(j.customer_phone)}</button>`
        : '<span class="compact-phone missing">No phone</span>';
      return `<div class="swipe-row compact-swipe-row" data-id="${j.id}">
        <button class="swipe-delete swipe-delete-left" type="button" aria-label="Delete ${esc(j.customer_name || 'job')}">Delete</button>
        <article class="job-card compact-job-card" data-id="${j.id}">
          <div class="compact-card-top"><strong>${esc(j.customer_name || 'No customer')}</strong><span class="chip compact-status">${esc(dashboardStatus(j))}</span></div>
          <div class="compact-card-middle"><span class="compact-suburb">${esc(dashboardSuburb(j))}</span>${phone}</div>
          <div class="compact-card-bottom"><span class="job-type-chip">${esc(j.title || 'Job')}</span></div>
        </article>
        <button class="swipe-delete swipe-delete-right" type="button" aria-label="Delete ${esc(j.customer_name || 'job')}">Delete</button>
      </div>`;
    };
    if(typeof render === 'function') render();
  }

  function getCustomOptions(){try{return JSON.parse(localStorage.getItem(CUSTOM_OPTIONS_KEY)||'{}')||{}}catch(_){return{}}}
  function saveCustomOption(id,value){const store=getCustomOptions();store[id]=Array.from(new Set([...(store[id]||[]),String(value)])).filter(Boolean);localStorage.setItem(CUSTOM_OPTIONS_KEY,JSON.stringify(store))}
  function selectChoices(){return {jobTitle:['Battery','Solar','Battery + Solar'],description:['Installation','Replacement','Upgrade','Service / repair','Fault finding','Site inspection'],panelBrand:['Aiko','Canadian Solar','Jinko','LONGi','REC','Trina'],panelType:[],panelQuantity:['6','8','10','12','14','16','18','20','22','24','30','40'],solarCapacity:['3.3','5','6.6','8','10','13.2','15','20'],phaseType:['Single phase','Three phase'],batteryBrand:['BYD','Enphase','Sigenergy','Sungrow','Tesla'],batteryType:[],batteryCapacity:['5','10','13.5','20','25','30'],inverterBrand:['Enphase','Fronius','GoodWe','Huawei','Sigenergy','SMA','SolarEdge','Sungrow'],inverterCapacity:['5','6','8','10','15','20'],inverterType:[]}}
  const numericSelects=new Set(['panelQuantity','solarCapacity','batteryCapacity','inverterCapacity']);
  function addOption(select,value){if(!select||value===null||value===undefined||String(value).trim()==='')return;const v=String(value).trim();if(![...select.options].some(o=>o.value===v))select.add(new Option(v,v))}
  function convertToAddableSelect(id,choices=[]){const old=document.getElementById(id);if(!old)return null;const previousValue=old.value||'';let select=old;if(old.tagName!=='SELECT'){select=document.createElement('select');select.id=old.id;select.className=old.className;if(old.required)select.required=true;if(old.getAttribute('aria-label'))select.setAttribute('aria-label',old.getAttribute('aria-label'));old.replaceWith(select)}const stored=getCustomOptions()[id]||[];const existing=[...select.options].map(o=>o.value).filter(v=>v&&v!==ADD_NEW_VALUE);const combined=Array.from(new Set([...choices.map(String),...existing,...stored.map(String)])).filter(Boolean);select.innerHTML='';select.append(new Option('+ Add new…',ADD_NEW_VALUE));const blank=new Option(id==='jobTitle'?'Select job type':'Not set','');blank.selected=true;select.append(blank);combined.forEach(v=>select.append(new Option(v,v)));if(previousValue)addOption(select,previousValue);select.value=previousValue||'';select.classList.add('addable-select');const remember=()=>{if(select.value!==ADD_NEW_VALUE)select.dataset.previousValue=select.value};select.addEventListener('pointerdown',remember);select.addEventListener('focus',remember);select.addEventListener('change',()=>{if(select.value!==ADD_NEW_VALUE)return;const previous=select.dataset.previousValue||'';let value=prompt(`Add new ${select.closest('label')?.childNodes?.[0]?.textContent?.trim().toLowerCase()||'option'}:`);if(value===null){select.value=previous;return}value=value.trim();if(!value){select.value=previous;return}if(numericSelects.has(id)){const n=Number(value);if(!Number.isFinite(n)||n<0){alert('Please enter a valid number.');select.value=previous;return}value=String(n)}addOption(select,value);saveCustomOption(id,value);select.value=value;select.dataset.previousValue=value;select.dispatchEvent(new Event('input',{bubbles:true}))});return select}
  function buildJobDetailsSection(){const form=document.getElementById('jobForm');if(!form||form.querySelector('details.job-details-section'))return;const jobTypeLabel=document.getElementById('jobTitle')?.closest('label'),descriptionLabel=document.getElementById('description')?.closest('label'),firstTech=form.querySelector('details.tech-section');if(!jobTypeLabel||!descriptionLabel||!firstTech)return;const details=document.createElement('details');details.className='tech-section job-details-section';details.innerHTML='<summary><span>Job details<small>Job type and description</small></span></summary><div class="tech-content"></div>';details.querySelector('.tech-content').append(jobTypeLabel,descriptionLabel);firstTech.insertAdjacentElement('beforebegin',details)}
  buildJobDetailsSection();Object.entries(selectChoices()).forEach(([id,values])=>convertToAddableSelect(id,values));
  function renameStartLabel(){const input=document.getElementById('scheduledStart'),label=input?.closest('label');if(!label)return;const textNode=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(textNode)textNode.textContent='Start time'}renameStartLabel();
  function removeDuplicateTechSections(){const seen=new Set();document.querySelectorAll('#jobForm details.tech-section, #jobForm details.job-accordion').forEach(section=>{const heading=section.querySelector('summary')?.textContent?.trim().toLowerCase()||'';const key=heading.startsWith('job details')?'job details':heading.startsWith('system details')?'system details':heading.startsWith('battery')?'battery':heading.startsWith('inverter')?'inverter':heading;if(!key)return;if(seen.has(key))section.remove();else seen.add(key)})}removeDuplicateTechSections();
  document.querySelectorAll('#jobForm details.tech-section').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('#jobForm details.tech-section[open]').forEach(x=>{if(x!==d)x.removeAttribute('open')})}));
  function ensureJobSelectValues(j){if(!j)return;const values={jobTitle:j.title,description:j.description,panelBrand:j.panel_brand,panelType:j.panel_type,panelQuantity:j.panel_quantity,solarCapacity:j.solar_capacity_kw,phaseType:j.phase_type,batteryBrand:j.battery_brand,batteryType:j.battery_type,batteryCapacity:j.battery_capacity_kwh,inverterBrand:j.inverter_brand,inverterCapacity:j.inverter_capacity_kw,inverterType:j.inverter_type};Object.entries(values).forEach(([id,value])=>addOption(document.getElementById(id),value))}
  function closeSideMenu(){document.getElementById('sideMenu')?.classList.remove('open');document.getElementById('drawerBackdrop')?.classList.add('hidden')}
  function updateSignedInUser(user){const btn=document.getElementById('signedInUser');if(btn)btn.textContent=displayName(user)}
  function profileRow(label,value,copy=false){const safe=esc(value||'—');return `<div class="profile-row"><div class="profile-row-label">${esc(label)}</div><div class="profile-row-value"><span>${safe}</span>${copy&&value?`<button class="profile-copy" type="button" data-copy-value="${esc(value)}">Copy</button>`:''}</div></div>`}
  async function openUserProfile(){closeSideMenu();const modal=document.getElementById('profileModal'),body=document.getElementById('profileBody');if(!modal||!body)return;let user=null;try{user=(await supabaseClient.auth.getUser()).data?.user||currentUser||null}catch(_){user=currentUser||null}body.innerHTML=`<div class="profile-row profile-edit-row"><div class="profile-row-label">Username</div><div class="profile-username-edit"><input id="profileUsernameInput" maxlength="40" value="${esc(displayName(user))}" autocomplete="off"><button id="saveUsernameBtn" type="button">Save</button></div><div id="profileUsernameMessage" class="profile-username-message"></div></div>${profileRow('Email',user?.email||'')}${profileRow('User ID',user?.id||'',true)}${profileRow('Device ID',getDeviceId(),true)}${profileRow('Device Type',getDeviceType())}${profileRow('Browser',getBrowserName())}${profileRow('App Version',`v${VERSION}`)}`;body.querySelectorAll('[data-copy-value]').forEach(btn=>btn.onclick=async()=>{try{await navigator.clipboard.writeText(btn.dataset.copyValue);const old=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=old,900)}catch(_){}});document.getElementById('saveUsernameBtn')?.addEventListener('click',async()=>{const input=document.getElementById('profileUsernameInput'),message=document.getElementById('profileUsernameMessage'),name=String(input?.value||'').trim();if(name.length<2){if(message)message.textContent='Enter at least 2 characters.';input?.focus();return}const btn=document.getElementById('saveUsernameBtn');if(btn){btn.disabled=true;btn.textContent='Saving…'}const{data,error}=await supabaseClient.auth.updateUser({data:{display_name:name}});if(btn){btn.disabled=false;btn.textContent='Save'}if(error){if(message)message.textContent=error.message;return}if(data?.user)currentUser=data.user;updateSignedInUser(data?.user||currentUser);if(message){message.textContent='Username updated.';message.classList.add('ok')}});modal.showModal()}
  function showWhatsNew(force=false){const modal=document.getElementById('updateModal');if(!modal||modal.open)return;const seen=localStorage.getItem(RELEASE_KEY);if(!force&&seen===VERSION)return;document.getElementById('updateVersion').textContent=`Version ${VERSION}`;modal.showModal()}
  const originalOpenJob=typeof openJob==='function'?openJob:null;if(originalOpenJob){openJob=function(j=null,defaultDate=null){removeDuplicateTechSections();ensureJobSelectValues(j);originalOpenJob(j,defaultDate);requestAnimationFrame(()=>{const d=document.getElementById('jobDialog');d?.scrollTo?.({top:0});document.activeElement?.blur?.()})}}
  document.getElementById('userProfileMenuBtn')?.addEventListener('click',openUserProfile);document.getElementById('signedInUser')?.addEventListener('click',openUserProfile);document.getElementById('profileClose')?.addEventListener('click',()=>document.getElementById('profileModal')?.close());document.getElementById('profileDone')?.addEventListener('click',()=>document.getElementById('profileModal')?.close());document.getElementById('whatsNewBtn')?.addEventListener('click',()=>{closeSideMenu();showWhatsNew(true)});document.getElementById('updateDone')?.addEventListener('click',()=>{localStorage.setItem(RELEASE_KEY,VERSION);document.getElementById('updateModal')?.close()});
  window.addEventListener('load',async()=>{try{const u=(await supabaseClient.auth.getUser()).data?.user||currentUser;updateSignedInUser(u)}catch(_){}showWhatsNew(false)});
})();