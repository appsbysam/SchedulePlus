(() => {
const JAYCO_BUSINESS_ID='9359127c-6929-4b2c-b25e-b9bd835d567c';
let enquiries=[],enabled=false,setupDone=false;
const $e=s=>document.querySelector(s);
const escE=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const typeLabel=t=>({solar:'Solar',solar_battery:'Solar + Battery',battery_only:'Battery Only'}[t]||t);
const statusLabel=s=>({new:'New',contacted:'Contacted',quoted:'Quoted',won:'Won',lost:'Lost'}[s]||s);
async function setup(){
 if(setupDone)return;
 if(!window.supabaseClient){setTimeout(setup,200);return}
 const {data:{session}}=await supabaseClient.auth.getSession(); if(!session?.user){setTimeout(setup,300);return}
 const {data}=await supabaseClient.from('business_users').select('business_id').eq('user_id',session.user.id).eq('business_id',JAYCO_BUSINESS_ID).eq('is_active',true).maybeSingle();
 if(!data)return; enabled=true; setupDone=true;
 const main=document.querySelector('#appView main'); if(main&&!$e('#enquiriesView')) main.insertAdjacentHTML('beforeend',`<section id="enquiriesView" class="sp-view" data-sp-view="enquiries"><div class="sp-screen-head"><div><h1>Enquiries</h1><p>DanCo customer leads</p></div></div><div class="enquiry-toolbar"><input id="enquirySearch" type="search" placeholder="Search name, phone, email or notes…"><select id="enquiryStatusFilter"><option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="won">Won</option><option value="lost">Lost</option></select></div><div id="enquiriesList" class="enquiries-list"></div></section>`);
 $e('#enquirySearch').oninput=render; $e('#enquiryStatusFilter').onchange=render; await load();
}
function bindNav(){
 const b=$e('[data-view="enquiries"]'); if(!b)return;
 b.onclick=async()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');$e('#dashboardView')?.classList.add('hidden');$e('#calendarView')?.classList.add('hidden');$e('#enquiriesView')?.classList.remove('hidden');document.querySelector('#sideMenu')?.classList.remove('open');document.querySelector('#drawerBackdrop')?.classList.add('hidden');await load();};
 document.querySelectorAll('.nav-item:not([data-view="enquiries"])').forEach(x=>x.addEventListener('click',()=> $e('#enquiriesView')?.classList.add('hidden')));
}
async function load(){
 if(!enabled)return;
 const {data,error}=await supabaseClient.from('customer_enquiries').select('*').eq('business_id',JAYCO_BUSINESS_ID).order('created_at',{ascending:false});
 if(error){if($e('#enquiriesList'))$e('#enquiriesList').innerHTML='<div class="empty">'+escE(error.message)+'</div>';return}
 enquiries=data||[]; render(); updateBadge();
}
function updateBadge(){const n=enquiries.filter(x=>x.status==='new').length;[$e('#spEnquiryBadge'),$e('#enquiryBadge')].filter(Boolean).forEach(b=>{b.textContent=n;b.classList.toggle('hidden',!n)})}
function render(){
 const root=$e('#enquiriesList');if(!root)return;const q=($e('#enquirySearch')?.value||'').toLowerCase().trim(),st=$e('#enquiryStatusFilter')?.value||'';
 const rows=enquiries.filter(x=>(!st||x.status===st)&&(!q||`${x.customer_name} ${x.customer_phone} ${x.customer_email||''} ${x.notes||''} ${typeLabel(x.enquiry_type)}`.toLowerCase().includes(q)));
 root.innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">No enquiries here yet.</div>';
 root.querySelectorAll('.enquiry-status').forEach(s=>s.onchange=()=>setStatus(s.dataset.id,s.value));
}
function card(x){
 const when=new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(x.created_at));
 const email=x.customer_email?`<a href="mailto:${escE(x.customer_email)}">${escE(x.customer_email)}</a>`:'';
 return `<article class="enquiry-card"><div class="enquiry-head"><div><strong>${escE(x.customer_name)}</strong><div class="enquiry-time">Received ${escE(when)}</div></div><span class="enquiry-type">${escE(typeLabel(x.enquiry_type))}</span></div><div class="enquiry-contact"><a href="tel:${escE(x.customer_phone.replace(/\s+/g,''))}">${escE(x.customer_phone)}</a>${email}</div>${x.notes?`<div class="enquiry-notes">${escE(x.notes)}</div>`:''}<div class="enquiry-actions"><label>Status <select class="enquiry-status" data-id="${x.id}">${['new','contacted','quoted','won','lost'].map(s=>`<option value="${s}" ${x.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}</select></label></div></article>`;
}
async function setStatus(id,status){const {error}=await supabaseClient.from('customer_enquiries').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('business_id',JAYCO_BUSINESS_ID);if(error){alert(error.message);await load();return}const x=enquiries.find(e=>e.id===id);if(x)x.status=status;updateBadge();render()}
window.addEventListener('scheduleplus:enquiries-enabled',()=>{setup().then(load);});
window.addEventListener('load',setup);
})();