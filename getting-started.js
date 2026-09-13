(()=>{
 const META_KEY='schedule_plus_getting_started_v1';
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 function closeMenu(){document.getElementById('sideMenu')?.classList.remove('open');document.getElementById('drawerBackdrop')?.classList.add('hidden')}
 function ensureUi(){
  if(!document.getElementById('gettingStartedBtn')){
   const actions=document.querySelector('.menu-profile-actions');
   if(actions){const b=document.createElement('button');b.id='gettingStartedBtn';b.className='getting-started-help-btn';b.type='button';b.textContent='Getting started';actions.appendChild(b);b.onclick=()=>open(false)}
  }
  if(document.getElementById('gettingStartedDialog'))return;
  const d=document.createElement('dialog');d.id='gettingStartedDialog';d.className='getting-started-dialog';d.innerHTML=`<div class="getting-started-card"><div class="dialog-head"><div><p class="eyebrow">WELCOME TO SCHEDULE+</p><h2>Get your business ready</h2></div><button id="gettingStartedClose" class="ghost" type="button" aria-label="Close">✕</button></div><p class="intro">Schedule+ is built for tradies to organise jobs, scheduling and day-to-day workflow. A few quick setup steps will make it fit your business.</p><div class="getting-started-steps"><div class="getting-started-step"><span class="getting-started-num">1</span><div><strong>Set up your business</strong><p>Open <b>Business settings</b> and enter your business name, contact details, address, colours and logo if you want one.</p></div></div><div class="getting-started-step"><span class="getting-started-num">2</span><div><strong>Configure your workflow</strong><p>Open <b>Configuration</b> to choose your job types, statuses, priorities, equipment brands, system options and other lists your team will use.</p></div></div><div class="getting-started-step"><span class="getting-started-num">3</span><div><strong>Add your first job</strong><p>Use <b>+ New job</b> from the Dashboard or Calendar. Add the customer, job details and schedule, then update the status as the work progresses.</p></div></div><div class="getting-started-step"><span class="getting-started-num">4</span><div><strong>Come back here anytime</strong><p>You can reopen these instructions from the menu under <b>Getting started</b>.</p></div></div></div><div class="getting-started-actions"><button id="gettingStartedDone" class="primary" type="button">Got it — start using Schedule+</button></div></div>`;
  (document.getElementById('appView')||document.body).appendChild(d);
  const done=()=>finish(true);document.getElementById('gettingStartedClose').onclick=done;document.getElementById('gettingStartedDone').onclick=done;
  d.addEventListener('cancel',e=>{e.preventDefault();finish(true)});
 }
 async function markSeen(){try{const {data:{user}}=await supabaseClient.auth.getUser();if(!user)return;const data={...(user.user_metadata||{}),[META_KEY]:true};await supabaseClient.auth.updateUser({data})}catch(e){console.warn('Could not save getting started status',e)}}
 function finish(mark){const d=document.getElementById('gettingStartedDialog');if(d?.open)d.close();if(mark)markSeen()}
 async function open(auto){ensureUi();closeMenu();const d=document.getElementById('gettingStartedDialog');if(d&&!d.open)d.showModal();if(!auto)return}
 async function init(){
  ensureUi();
  let user=null,business=null,n=0;
  while(n++<100){try{user=(await supabaseClient.auth.getUser()).data?.user||null;business=window.SchedulePlusBusiness?.business||null}catch(_){}if(user&&business)break;await sleep(100)}
  if(!user||!business)return;
  if(user.user_metadata?.[META_KEY])return;
  await sleep(450);
  const blockers=['businessOnboardingDialog','invitePasswordDialog','updateModal','jobDialog','dayJobsDialog'].some(id=>document.getElementById(id)?.open);
  if(blockers){let tries=0;while(tries++<40&&['businessOnboardingDialog','invitePasswordDialog','updateModal','jobDialog','dayJobsDialog'].some(id=>document.getElementById(id)?.open))await sleep(250)}
  if(!document.getElementById('gettingStartedDialog')?.open)open(true);
 }
 if(document.readyState==='complete')init();else addEventListener('load',init,{once:true});
})();