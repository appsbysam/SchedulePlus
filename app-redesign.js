(() => {
  const ICONS={
    home:'<svg viewBox="0 0 24 24"><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H4a1 1 0 0 1-1-1z"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2z"/></svg>',
    jobs:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z"/><path d="m19.4 15 .9 1.7-2 3.5-1.7-.7a8 8 0 0 1-2 .8L13.4 21H10.6L10 19.2a8 8 0 0 1-2-.8l-1.7.9-2.6-2.6.9-1.7a8 8 0 0 1-.8-2L2 12.4V9.6L3.8 9a8 8 0 0 1 .8-2l-.9-1.7 2.6-2.6 1.7.9a8 8 0 0 1 2-.8L10.6 1h2.8l.6 1.8a8 8 0 0 1 2 .8l1.7-.9 2.6 2.6-.9 1.7a8 8 0 0 1 .8 2l1.8.6v2.8l-1.8.6a8 8 0 0 1-.8 2z"/></svg>',
    profile:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 21c.6-4.3 3.1-6.5 7.5-6.5s6.9 2.2 7.5 6.5"/></svg>',
    business:'<svg viewBox="0 0 24 24"><path d="M4 21V5h7v16M11 9h9v12M7 8h1M7 12h1M7 16h1M14 12h2M14 16h2"/></svg>',
    config:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m19 13.5 1.5 1-2 3.5-1.7-.7a8.2 8.2 0 0 1-2.6 1.5L14 21h-4l-.2-2.2a8.2 8.2 0 0 1-2.6-1.5l-1.7.7-2-3.5 1.5-1a8.4 8.4 0 0 1 0-3l-1.5-1 2-3.5 1.7.7a8.2 8.2 0 0 1 2.6-1.5L10 3h4l.2 2.2a8.2 8.2 0 0 1 2.6 1.5l1.7-.7 2 3.5-1.5 1a8.4 8.4 0 0 1 0 3z"/></svg>',
    users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14.2 14.7c3.7-.6 5.8 1.1 6.3 5.3"/></svg>',
    news:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    update:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/></svg>',
    account:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.5-4.1 2.8-6.2 7-6.2s6.5 2.1 7 6.2"/></svg>',
    signout:'<svg viewBox="0 0 24 24"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg>',
    phone:'<svg viewBox="0 0 24 24"><path d="M6.7 3.5 9.2 8l-1.8 1.7c1.3 2.8 3.1 4.6 5.9 5.9l1.7-1.8 4.5 2.5-.7 3.1c-.2.8-.9 1.4-1.8 1.4C9.3 20.8 3.2 14.7 3.2 7c0-.9.6-1.6 1.4-1.8z"/></svg>',
    date:'<svg viewBox="0 0 24 24"><path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2z"/></svg>'
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmtDate=(v,tod='')=>{if(!v)return'Unscheduled';const d=new Date(`${v}T12:00:00`);const wd=new Intl.DateTimeFormat('en-AU',{weekday:'short'}).format(d);const day=String(d.getDate()).padStart(2,'0');const mon=new Intl.DateTimeFormat('en-AU',{month:'short'}).format(d);return `${wd} ${day} ${mon}${tod?` [${tod}]`:''}`};
  const statusText=j=>{const s=String(j?.status||'');const map={new:'New',to_schedule:'To schedule',scheduled:'Scheduled',in_progress:'In Progress',waiting:'Follow-Up',completed:'Completed'};return map[s]||s.replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase())||'Unscheduled'};
  const toneFor=j=>{const x=statusText(j).toLowerCase();if(x.includes('site'))return'site';if(x.includes('progress'))return'progress';if(x.includes('follow')||x.includes('waiting'))return'followup';if(x.includes('complete'))return'completed';if(x.includes('schedule'))return'scheduled';return'new'};
  const suburb=j=>j?.suburb||(typeof suburbFromAddress==='function'?suburbFromAddress(j?.address_line||''):'')||'Suburb not set';

  function nav(){
    if(document.getElementById('spBottomNav'))return;
    const n=document.createElement('nav');n.id='spBottomNav';n.className='sp-bottom-nav';n.setAttribute('aria-label','Main navigation');
    n.innerHTML=[['home','Home'],['calendar','Calendar'],['jobs','Jobs'],['settings','Settings'],['profile','Profile']].map(([k,l])=>`<button class="sp-nav-btn${k==='home'?' active':''}" data-sp-view="${k}" type="button">${ICONS[k]}<span>${l}</span></button>`).join('');
    document.getElementById('appView')?.appendChild(n);
    n.querySelectorAll('button').forEach(b=>b.onclick=()=>showView(b.dataset.spView));
  }

  function ensureViews(){
    const main=document.querySelector('#appView>main');if(!main)return;
    const dash=document.getElementById('dashboardView'),cal=document.getElementById('calendarView');
    if(dash){dash.classList.add('sp-view');dash.classList.remove('hidden');dash.dataset.spView='jobs';}
    if(cal){cal.classList.add('sp-view');cal.classList.remove('hidden');cal.dataset.spView='calendar';}
    if(!document.getElementById('spHomeView')){
      const home=document.createElement('section');home.id='spHomeView';home.className='sp-view active';home.dataset.spView='home';
      home.innerHTML='<div class="sp-home-wrap"><div class="sp-home-left"><div class="sp-home-brand"><img id="spHomeLogo" alt="Business logo"></div><div class="sp-greeting"><span class="hello">Good morning,</span><strong id="spGreetingName">Welcome</strong><small id="spGreetingDate"></small></div><div id="spStats" class="sp-stat-grid"></div></div><div><div class="sp-section-title"><h2>Upcoming Jobs</h2><button id="spViewAllJobs" type="button">View all ›</button></div><div id="spUpcoming" class="sp-upcoming"></div></div></div>';
      main.insertBefore(home,main.firstChild);document.getElementById('spViewAllJobs').onclick=()=>showView('jobs');
    }
    if(!document.getElementById('spSettingsView')){
      const s=document.createElement('section');s.id='spSettingsView';s.className='sp-view';s.dataset.spView='settings';
      s.innerHTML=`<div class="sp-screen-head"><div><h1>Settings</h1><p>All app preferences and configuration</p></div></div><div class="sp-settings-list">${settingCard('business','Business settings','Business details, preferences','spBusinessSettings','sp-ico-business')}${settingCard('config','Configuration','Job types, statuses, priorities','spConfig','sp-ico-config')}${settingCard('users','Users & Staff','Manage team access','spUsers','sp-ico-users')}${settingCard('news',"What's New",'See the latest updates','spWhatsNew','sp-ico-news')}${settingCard('update','Check for Updates',`Current version: ${typeof APP_VERSION!=='undefined'?APP_VERSION:'—'}`,'spUpdates','sp-ico-update')}</div>`;
      main.appendChild(s);bindSettings();
    }
    if(!document.getElementById('spProfileView')){
      const p=document.createElement('section');p.id='spProfileView';p.className='sp-view';p.dataset.spView='profile';
      p.innerHTML=`<div class="sp-screen-head"><div><h1>Profile</h1><p>Account options and sign out</p></div></div><div class="sp-profile-hero"><div id="spAvatar" class="sp-avatar">U</div><h2 id="spProfileName">User</h2><p id="spProfileEmail"></p></div><div class="sp-profile-list"><button class="sp-profile-card" id="spMyAccount" type="button"><span class="sp-profile-icon">${ICONS.account}</span><span class="sp-setting-copy"><strong>My account</strong><small>Profile details and PIN access</small></span><span class="sp-chevron">›</span></button><button class="sp-profile-card sp-signout" id="spSignOut" type="button"><span class="sp-profile-icon">${ICONS.signout}</span><span class="sp-setting-copy"><strong>Sign out</strong><small>Log out from this device</small></span><span class="sp-chevron">›</span></button></div>`;
      main.appendChild(p);document.getElementById('spMyAccount').onclick=()=>document.getElementById('userProfileMenuBtn')?.click();document.getElementById('spSignOut').onclick=()=>document.getElementById('signOutBtn')?.click();
    }
  }
  function settingCard(icon,title,sub,id,cls){return `<button class="sp-setting-card" id="${id}" type="button"><span class="sp-setting-icon ${cls}">${ICONS[icon]}</span><span class="sp-setting-copy"><strong>${title}</strong><small>${sub}</small></span><span class="sp-chevron">›</span></button>`}
  function bindSettings(){const bind=(id,target)=>{const b=document.getElementById(id);if(b)b.onclick=()=>{const el=document.getElementById(target);if(el)el.click();else setTimeout(()=>document.getElementById(target)?.click(),150)}};bind('spBusinessSettings','businessSettingsBtn');bind('spConfig','businessConfigBtn');bind('spUsers','businessUsersBtn');bind('spWhatsNew','whatsNewBtn');bind('spUpdates','checkUpdatesBtn')}
  function showView(name){
    ensureViews();
    document.querySelectorAll('.sp-view').forEach(v=>{v.classList.remove('hidden');v.classList.toggle('active',v.dataset.spView===name)});
    document.querySelectorAll('.sp-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.spView===name));
    if(name==='calendar'&&typeof renderCalendar==='function'){renderCalendar();setTimeout(decorateCalendar,0)}
    if(name==='home')renderHome();if(name==='profile')renderProfile();window.scrollTo({top:0,behavior:'instant'});
  }

  async function renderProfile(){try{const u=(await supabaseClient.auth.getUser()).data?.user||window.currentUser;const name=String(u?.user_metadata?.display_name||u?.email?.split('@')[0]||'User').replace(/[._-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());const initials=name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();document.getElementById('spProfileName').textContent=name;document.getElementById('spProfileEmail').textContent=u?.email||'';document.getElementById('spAvatar').textContent=initials||'U'}catch(_){}}
  function renderHome(){
    if(!document.getElementById('spHomeView'))return;const b=window.SchedulePlusBusiness?.business;const logo=b?.logo_dark_url||b?.logo_url||'assets/icons/icon.svg';document.getElementById('spHomeLogo').src=logo;
    const now=new Date(),h=now.getHours();document.querySelector('#spHomeView .hello').textContent=`Good ${h<12?'morning':h<18?'afternoon':'evening'},`;document.getElementById('spGreetingDate').textContent=new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(now).replace(',','');
    let nm='';try{nm=window.currentUser?.user_metadata?.display_name||window.currentUser?.email?.split('@')[0]||''}catch(_){}document.getElementById('spGreetingName').textContent=nm?nm.replace(/[._-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase()):(b?.business_name||'Welcome');
    const all=Array.isArray(window.jobs)?window.jobs:(typeof jobs!=='undefined'?jobs:[]);const today=(typeof localDate==='function'?localDate():new Date().toISOString().slice(0,10));const counts={total:all.length,scheduled:all.filter(j=>j.scheduled_date&&j.status!=='completed').length,progress:all.filter(j=>j.status==='in_progress').length,followup:all.filter(j=>j.status==='waiting').length,completed:all.filter(j=>j.status==='completed').length,overdue:all.filter(j=>j.scheduled_date&&j.scheduled_date<today&&j.status!=='completed').length};
    document.getElementById('spStats').innerHTML=[['total','Total Jobs'],['scheduled','Scheduled'],['progress','In Progress'],['followup','Follow Up'],['completed','Completed'],['overdue','Overdue']].map(([k,l])=>`<div class="sp-stat-tile ${k}"><strong>${counts[k]}</strong><span>${l}</span></div>`).join('');
    const upcoming=all.filter(j=>j.status!=='completed').sort((a,b)=>(a.scheduled_date||'9999').localeCompare(b.scheduled_date||'9999')||(a.scheduled_start||'99:99').localeCompare(b.scheduled_start||'99:99')).slice(0,6);const root=document.getElementById('spUpcoming');root.innerHTML=upcoming.length?upcoming.map(homeCard).join(''):'<div class="empty">No upcoming jobs.</div>';
    root.querySelectorAll('.sp-home-job').forEach(el=>el.onclick=e=>{if(e.target.closest('[data-phone]'))return;const j=all.find(x=>String(x.id)===String(el.dataset.id));if(j&&typeof openJob==='function')openJob(j)});root.querySelectorAll('[data-phone]').forEach(a=>a.onclick=e=>e.stopPropagation());
  }
  function homeCard(j){const phone=j.customer_phone?`<a data-phone class="sp-phone icon-only" href="tel:${esc(String(j.customer_phone).replace(/\s+/g,''))}" aria-label="Call ${esc(j.customer_name||'customer')}">${ICONS.phone}</a>`:`<span class="sp-phone icon-only missing">${ICONS.phone}</span>`;return `<article class="sp-home-job" data-id="${j.id}"><div class="sp-home-job-top"><strong>${esc(j.customer_name||'No customer')}</strong><span class="sp-status" data-tone="${toneFor(j)}">${esc(statusText(j))}</span></div><div class="sp-home-job-suburb">${esc(suburb(j))}</div><div class="sp-home-job-bottom"><span>${esc(j.title||'Job')}</span><span class="sp-date">${ICONS.date}<span>${esc(fmtDate(j.scheduled_date,j.time_of_day||''))}</span></span>${phone}</div></article>`}

  function enhanceCards(){document.querySelectorAll('.compact-job-card').forEach(card=>{const row=card.closest('.swipe-row'),id=row?.dataset.id;const all=Array.isArray(window.jobs)?window.jobs:(typeof jobs!=='undefined'?jobs:[]);const j=all.find(x=>String(x.id)===String(id));if(!j)return;const stat=card.querySelector('.compact-status');if(stat)stat.dataset.tone=toneFor(j)})}
  function decorateCalendar(){document.querySelectorAll('.month-day[data-date]').forEach(day=>{day.querySelector('.sp-cal-dots')?.remove();const all=Array.isArray(window.jobs)?window.jobs:(typeof jobs!=='undefined'?jobs:[]);const js=all.filter(j=>j.scheduled_date===day.dataset.date);if(!js.length)return;const d=document.createElement('span');d.className='sp-cal-dots';d.innerHTML=js.slice(0,4).map(j=>`<i class="sp-cal-dot ${toneFor(j)}"></i>`).join('');day.appendChild(d)})}
  function wrapRenderers(){if(typeof render==='function'&&!render.__spRedesign){const old=render;render=function(){old();setTimeout(()=>{enhanceCards();renderHome()},0)};render.__spRedesign=true}if(typeof renderCalendar==='function'&&!renderCalendar.__spRedesign){const oldc=renderCalendar;renderCalendar=function(){oldc();setTimeout(decorateCalendar,0)};renderCalendar.__spRedesign=true}}
  function boot(){nav();ensureViews();renderProfile();renderHome();wrapRenderers();let n=0;const t=setInterval(()=>{n++;ensureViews();wrapRenderers();enhanceCards();decorateCalendar();bindSettings();if(n>35)clearInterval(t)},200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();