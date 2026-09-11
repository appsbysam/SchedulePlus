(() => {
  const DEFAULT_ICON='assets/icons/icon.svg';
  const DISMISS_DAYS=7;
  const state={deferred:null,manifestUrl:null,ready:false,image:null,imageUrl:null,drag:false,lastX:0,lastY:0,baseScale:1,scale:1,offsetX:0,offsetY:0,targetFile:null};
  const $=id=>document.getElementById(id);
  const business=()=>window.SchedulePlusBusiness?.business||null;
  const canManage=()=>['owner','admin'].includes(window.SchedulePlusBusiness?.membership?.role);
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent||'');
  const isSafari=()=>/^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent||'');
  const slugify=s=>String(s||'schedule-plus').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'schedule-plus';
  const abs=u=>{try{return new URL(u,location.href).href}catch(_){return u}};

  function iconChoice(b,size){
    if(!b)return abs(DEFAULT_ICON);
    if(size===192)return b.app_icon_192_url||b.app_icon_512_url||abs(DEFAULT_ICON);
    if(size==='maskable')return b.app_icon_maskable_url||b.app_icon_512_url||abs(DEFAULT_ICON);
    return b.app_icon_512_url||abs(DEFAULT_ICON);
  }

  function applyTenantManifest(){
    const b=business();if(!b)return;
    const base=new URL('./',location.href).href;
    const name=b.business_name||'Schedule+';
    const manifest={
      name,
      short_name:name.length>16?name.slice(0,16):name,
      description:`${name} job scheduling powered by Schedule+.`,
      id:`${base}?tenant=${encodeURIComponent(b.slug||slugify(name))}`,
      start_url:base,
      scope:base,
      display:'standalone',
      display_override:['standalone','minimal-ui'],
      background_color:'#0b0b0d',
      theme_color:b.accent_color||'#0b0b0d',
      prefer_related_applications:false,
      icons:[
        {src:abs(iconChoice(b,192)),sizes:'192x192',type:b.app_icon_192_url?'image/png':'image/svg+xml',purpose:'any'},
        {src:abs(iconChoice(b,512)),sizes:'512x512',type:b.app_icon_512_url?'image/png':'image/svg+xml',purpose:'any'},
        {src:abs(iconChoice(b,'maskable')),sizes:'512x512',type:b.app_icon_maskable_url?'image/png':'image/svg+xml',purpose:'maskable'}
      ]
    };
    if(state.manifestUrl)URL.revokeObjectURL(state.manifestUrl);
    state.manifestUrl=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'}));
    let link=document.querySelector('link[rel="manifest"]');if(!link){link=document.createElement('link');link.rel='manifest';document.head.appendChild(link)}link.href=state.manifestUrl;
    let apple=document.querySelector('link[rel="apple-touch-icon"]');if(!apple){apple=document.createElement('link');apple.rel='apple-touch-icon';document.head.appendChild(apple)}apple.href=abs(iconChoice(b,512));
    let title=document.querySelector('meta[name="apple-mobile-web-app-title"]');if(!title){title=document.createElement('meta');title.name='apple-mobile-web-app-title';document.head.appendChild(title)}title.content=name;
    let appName=document.querySelector('meta[name="application-name"]');if(!appName){appName=document.createElement('meta');appName.name='application-name';document.head.appendChild(appName)}appName.content=name;
    refreshInstallUi();
  }

  function ensureUi(){
    if(state.ready)return;
    const appearance=document.querySelector('.appearance-settings');
    if(!appearance)return;
    state.ready=true;
    const panel=document.createElement('section');panel.className='pwa-branding-panel';panel.innerHTML=`
      <div class="pwa-branding-head"><strong>App icon & installation</strong><small>Create the icon customers see on their home screen, app drawer and installed Schedule+ app.</small></div>
      <div class="pwa-icon-row"><div class="pwa-icon-preview"><img id="pwaIconPreview" src="${DEFAULT_ICON}" alt="App icon preview"></div><div class="pwa-icon-actions"><button id="pwaCropFromLogo" class="pwa-icon-primary" type="button">Create from business logo</button><button id="pwaChooseDifferent" class="pwa-icon-secondary" type="button">Upload different image</button><input id="pwaIconFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden></div></div>
      <div class="pwa-branding-help">A square icon is generated in 192×192, 512×512 and maskable formats for proper PWA installation.</div><p id="pwaBrandingStatus" class="pwa-branding-status"></p>`;
    appearance.insertAdjacentElement('afterend',panel);
    document.body.insertAdjacentHTML('beforeend',`<dialog id="pwaCropDialog" class="pwa-crop-dialog"><div class="pwa-crop-card"><div class="dialog-head"><h2>Crop app icon</h2><button id="pwaCropClose" class="ghost" type="button">✕</button></div><div id="pwaCropStage" class="pwa-crop-stage"><canvas id="pwaCropCanvas" width="1024" height="1024"></canvas></div><label class="pwa-crop-zoom">Zoom<input id="pwaCropZoom" type="range" min="1" max="3" step="0.01" value="1"></label><p class="pwa-branding-help">Drag and zoom until the important part of the logo sits comfortably inside the square.</p><div class="pwa-crop-actions"><button id="pwaCropCancel" class="secondary" type="button">Cancel</button><button id="pwaCropApply" class="primary" type="button">Save app icon</button></div></div></dialog>`);
    document.body.insertAdjacentHTML('beforeend',`<div id="pwaInstallBanner" class="pwa-install-banner hidden"><div class="pwa-install-icon"><img id="pwaInstallIcon" src="${DEFAULT_ICON}" alt=""></div><div class="pwa-install-copy"><strong id="pwaInstallTitle">Install Schedule+</strong><small id="pwaInstallText">Add this app to your device for quick access.</small></div><button id="pwaInstallButton" class="pwa-install-btn" type="button">Install</button><button id="pwaInstallDismiss" class="pwa-install-dismiss" type="button" aria-label="Dismiss">×</button></div>`);
    document.body.insertAdjacentHTML('beforeend',`<dialog id="pwaInstallHelp" class="pwa-install-help"><div class="pwa-install-help-card"><div class="dialog-head"><h2>Install app</h2><button id="pwaInstallHelpClose" class="ghost" type="button">✕</button></div><ol id="pwaInstallSteps" class="pwa-install-steps"></ol><button id="pwaInstallHelpDone" class="primary" type="button">Got it</button></div></dialog>`);
    $('pwaCropFromLogo').onclick=useBusinessLogo;$('pwaChooseDifferent').onclick=()=>canManage()&&$('pwaIconFile').click();$('pwaIconFile').onchange=e=>startCropFile(e.target.files?.[0]);
    $('pwaCropClose').onclick=closeCrop;$('pwaCropCancel').onclick=closeCrop;$('pwaCropApply').onclick=saveCrop;
    $('pwaCropZoom').oninput=e=>{state.scale=state.baseScale*Number(e.target.value);draw()};
    const stage=$('pwaCropStage');stage.onpointerdown=startDrag;stage.onpointermove=drag;stage.onpointerup=endDrag;stage.onpointercancel=endDrag;
    $('pwaInstallButton').onclick=installAction;$('pwaInstallDismiss').onclick=dismissInstall;$('pwaInstallHelpClose').onclick=()=>$('pwaInstallHelp').close();$('pwaInstallHelpDone').onclick=()=>$('pwaInstallHelp').close();
    refreshSettingsPreview();refreshInstallUi();
  }

  function refreshSettingsPreview(){const b=business();const img=$('pwaIconPreview');if(img)img.src=iconChoice(b,512);const editable=canManage();['pwaCropFromLogo','pwaChooseDifferent'].forEach(id=>{const el=$(id);if(el)el.disabled=!editable})}
  async function useBusinessLogo(){
    if(!canManage())return;const b=business();const src=b?.logo_dark_url||b?.logo_url||b?.logo_light_url;if(!src){alert('Upload a business logo first, or choose a different image.');return}
    await startCropUrl(src);
  }
  function startCropFile(file){if(!file)return;if(file.size>2097152){alert('Image must be 2 MB or smaller.');return}if(state.imageUrl)URL.revokeObjectURL(state.imageUrl);state.imageUrl=URL.createObjectURL(file);loadImage(state.imageUrl,false)}
  async function startCropUrl(url){loadImage(url,true)}
  function loadImage(url,cross){const img=new Image();if(cross)img.crossOrigin='anonymous';state.image=img;img.onload=()=>{const c=$('pwaCropCanvas');state.baseScale=Math.max(c.width/img.naturalWidth,c.height/img.naturalHeight);state.scale=state.baseScale;state.offsetX=(c.width-img.naturalWidth*state.scale)/2;state.offsetY=(c.height-img.naturalHeight*state.scale)/2;$('pwaCropZoom').value='1';draw();$('pwaCropDialog').showModal()};img.onerror=()=>alert('That image could not be opened.');img.src=url}
  function draw(){const c=$('pwaCropCanvas'),ctx=c?.getContext('2d');if(!ctx||!state.image)return;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(state.image,state.offsetX,state.offsetY,state.image.naturalWidth*state.scale,state.image.naturalHeight*state.scale)}
  function startDrag(e){if(!state.image)return;state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;e.currentTarget.setPointerCapture?.(e.pointerId)}
  function drag(e){if(!state.drag)return;const c=$('pwaCropCanvas'),r=c.getBoundingClientRect();state.offsetX+=(e.clientX-state.lastX)*(c.width/r.width);state.offsetY+=(e.clientY-state.lastY)*(c.height/r.height);state.lastX=e.clientX;state.lastY=e.clientY;draw()}
  function endDrag(){state.drag=false}
  function closeCrop(){$('pwaCropDialog')?.close()}
  function canvasBlob(canvas,type='image/png',quality){return new Promise(resolve=>canvas.toBlob(resolve,type,quality))}
  async function resizedBlob(size,maskable=false){
    const src=$('pwaCropCanvas'),out=document.createElement('canvas');out.width=out.height=size;const ctx=out.getContext('2d');
    if(maskable){const b=business();ctx.fillStyle=b?.accent_color||'#0b0b0d';ctx.fillRect(0,0,size,size);const pad=Math.round(size*.1);ctx.drawImage(src,pad,pad,size-pad*2,size-pad*2)}else ctx.drawImage(src,0,0,size,size);
    return await canvasBlob(out,'image/png');
  }
  async function uploadBlob(blob,name){const b=business();const path=`${b.id}/${name}-${Date.now()}.png`;const {error}=await supabaseClient.storage.from('business-logos').upload(path,blob,{cacheControl:'3600',upsert:false,contentType:'image/png'});if(error)throw error;return supabaseClient.storage.from('business-logos').getPublicUrl(path).data.publicUrl}
  async function saveCrop(){
    const b=business();if(!b||!canManage())return;const btn=$('pwaCropApply'),status=$('pwaBrandingStatus');btn.disabled=true;btn.textContent='Saving…';status.textContent='Generating app icons…';status.classList.remove('ok');
    try{const b192=await resizedBlob(192,false),b512=await resizedBlob(512,false),bMask=await resizedBlob(512,true);const [u192,u512,uMask]=await Promise.all([uploadBlob(b192,'app-icon-192'),uploadBlob(b512,'app-icon-512'),uploadBlob(bMask,'app-icon-maskable')]);const {error}=await supabaseClient.from('businesses').update({app_icon_192_url:u192,app_icon_512_url:u512,app_icon_maskable_url:uMask}).eq('id',b.id);if(error)throw error;await window.SchedulePlusBusiness.reload();status.textContent='App icon saved and ready for new installations.';status.classList.add('ok');refreshSettingsPreview();applyTenantManifest();closeCrop()}catch(err){status.textContent=err?.message||'Could not save the app icon.'}finally{btn.disabled=false;btn.textContent='Save app icon'}
  }

  function dismissKey(){const b=business();return `schedule_plus_install_dismissed_${b?.id||'default'}`}
  function dismissedRecently(){const t=Number(localStorage.getItem(dismissKey())||0);return t&&Date.now()-t<DISMISS_DAYS*86400000}
  function dismissInstall(){localStorage.setItem(dismissKey(),String(Date.now()));$('pwaInstallBanner')?.classList.add('hidden')}
  function refreshInstallUi(){
    const banner=$('pwaInstallBanner');if(!banner)return;const b=business();if(!b||standalone()||dismissedRecently()){banner.classList.add('hidden');return}
    $('pwaInstallIcon').src=iconChoice(b,512);$('pwaInstallTitle').textContent=`Install ${b.business_name||'Schedule+'}`;
    if(isIos()){$('pwaInstallText').textContent='Add this app to your Home Screen for the full app experience.';$('pwaInstallButton').textContent='How'}
    else if(state.deferred){$('pwaInstallText').textContent='Install the app for a standalone window, home-screen icon and faster access.';$('pwaInstallButton').textContent='Install'}
    else{$('pwaInstallText').textContent='Install this app from your browser menu for the full app experience.';$('pwaInstallButton').textContent='How'}
    banner.classList.remove('hidden');
  }
  async function installAction(){
    if(state.deferred){const p=state.deferred;state.deferred=null;await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted')$('pwaInstallBanner')?.classList.add('hidden');else refreshInstallUi();return}
    const steps=$('pwaInstallSteps');if(isIos()){steps.innerHTML='<li>Tap the Share button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li>'}else{steps.innerHTML='<li>Open your browser menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm the installation.</li>'} $('pwaInstallHelp').showModal();
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferred=e;refreshInstallUi()});
  window.addEventListener('appinstalled',()=>{$('pwaInstallBanner')?.classList.add('hidden');localStorage.removeItem(dismissKey())});
  matchMedia('(display-mode: standalone)').addEventListener?.('change',refreshInstallUi);

  function init(){ensureUi();applyTenantManifest();refreshSettingsPreview();}
  let tries=0;const timer=setInterval(()=>{tries++;ensureUi();if(business()){init();clearInterval(timer)}else if(tries>240)clearInterval(timer)},100);
  const title=document.querySelector('title');if(title)new MutationObserver(()=>{if(business())applyTenantManifest()}).observe(title,{childList:true});
  window.SchedulePlusPwa={applyTenantManifest,refreshInstallUi};
})();