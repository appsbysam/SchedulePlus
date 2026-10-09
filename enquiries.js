(() => {
const JAYCO_BUSINESS_ID='9359127c-6929-4b2c-b25e-b9bd835d567c';
let enquiries=[],enabled=false,setupDone=false,selectedType="";
const $e=s=>document.querySelector(s);
const escE=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const typeLabel=t=>({solar:'Solar',solar_battery:'Solar + Battery',battery_only:'Battery Only'}[t]||t);
const statusLabel=s=>({new:'New',contacted:'Contacted',quoted:'Quoted',won:'Won',lost:'Lost'}[s]||s);
async function setup(){
 if(setupDone)return;
 if(typeof supabaseClient==='undefined'){setTimeout(setup,200);return}
 const {data:{session}}=await supabaseClient.auth.getSession(); if(!session?.user){setTimeout(setup,300);return}
 enabled=true; setupDone=true;
 const main=document.querySelector('#appView main')||document.querySelector('#appView')||document.querySelector('main'); if(main&&!$e('#enquiriesView')) main.insertAdjacentHTML('beforeend',`<section id="enquiriesView" class="sp-view" data-sp-view="enquiries"><div class="sp-screen-head"><div><h1>Enquiries</h1><p>DanCo customer leads</p></div></div><div class="enquiry-toolbar"><input id="enquirySearch" type="search" placeholder="Search name, phone, email or notes…"><select id="enquiryStatusFilter"><option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="won">Won</option><option value="lost">Lost</option></select></div><div class="enquiry-type-filters" role="group" aria-label="Filter enquiries by type"><button type="button" class="enquiry-type-filter active" data-type="" aria-pressed="true">All</button><button type="button" class="enquiry-type-filter" data-type="solar" aria-pressed="false">Solar</button><button type="button" class="enquiry-type-filter" data-type="solar_battery" aria-pressed="false">Solar + Battery</button><button type="button" class="enquiry-type-filter" data-type="battery_only" aria-pressed="false">Battery Only</button></div><div id="enquiriesList" class="enquiries-list"></div></section>`);
 if(!$e('#enquiriesView')){setupDone=false;setTimeout(setup,250);return} $e('#enquirySearch').oninput=render; $e('#enquiryStatusFilter').onchange=render; document.querySelectorAll('#enquiriesView .enquiry-type-filter').forEach(b=>b.onclick=()=>{selectedType=b.dataset.type;document.querySelectorAll('#enquiriesView .enquiry-type-filter').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});render();}); await load();
}
function bindNav(){
 const b=$e('[data-view="enquiries"]'); if(!b)return;
 b.onclick=async()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');$e('#dashboardView')?.classList.add('hidden');$e('#calendarView')?.classList.add('hidden');$e('#enquiriesView')?.classList.remove('hidden');document.querySelector('#sideMenu')?.classList.remove('open');document.querySelector('#drawerBackdrop')?.classList.add('hidden');await load();};
 document.querySelectorAll('.nav-item:not([data-view="enquiries"])').forEach(x=>x.addEventListener('click',()=> $e('#enquiriesView')?.classList.add('hidden')));
}
async function load(){
 if(!enabled)return;
 const {data,error}=await supabaseClient.rpc('get_my_customer_enquiries',{p_business_id:JAYCO_BUSINESS_ID});
 if(error){if($e('#enquiriesList'))$e('#enquiriesList').innerHTML='<div class="empty">'+escE(error.message)+'</div>';return}
 enquiries=data||[]; render(); updateBadge();
}
function updateBadge(){const n=enquiries.filter(x=>!x.read_at).length;[$e('#spEnquiryBadge'),$e('#enquiryBadge')].filter(Boolean).forEach(b=>{b.textContent=n;b.classList.toggle('hidden',!n)})}
function render(){
 const root=$e('#enquiriesList');if(!root)return;const q=($e('#enquirySearch')?.value||'').toLowerCase().trim(),st=$e('#enquiryStatusFilter')?.value||'';
 const rows=enquiries.filter(x=>(!st||x.status===st)&&(!selectedType||x.enquiry_type===selectedType)&&(!q||`${x.customer_name} ${x.customer_phone} ${x.customer_email||''} ${x.property_address||''} ${x.notes||''} ${typeLabel(x.enquiry_type)}`.toLowerCase().includes(q)));
 root.innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">No enquiries here yet.</div>';
 root.querySelectorAll('.enquiry-status').forEach(s=>s.onchange=()=>setStatus(s.dataset.id,s.value)); root.querySelectorAll('.enquiry-read-toggle').forEach(b=>b.onclick=()=>setRead(b.dataset.id,b.dataset.read!=='true')); root.querySelectorAll('.enquiry-delete').forEach(b=>b.onclick=()=>deleteEnquiry(b.dataset.id));
}
function card(x){
 const when=new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(x.created_at));
 const email=x.customer_email?`<a href="mailto:${escE(x.customer_email)}">${escE(x.customer_email)}</a>`:'';
 return `<article class="enquiry-card ${x.read_at?'is-read':'is-unread'}"><div class="enquiry-head"><div><strong>${escE(x.customer_name)}</strong><div class="enquiry-time">Received ${escE(when)}</div></div><span class="enquiry-type">${escE(typeLabel(x.enquiry_type))}</span></div><div class="enquiry-contact"><a href="tel:${escE(x.customer_phone.replace(/\s+/g,''))}">${escE(x.customer_phone)}</a>${email}</div>${x.property_address?`<div class="enquiry-address"><strong>Property:</strong> ${escE(x.property_address)}</div>`:'' }${x.notes?`<div class="enquiry-notes">${escE(x.notes)}</div>`:''}<div class="enquiry-actions"><div class="enquiry-action-buttons"><button type="button" class="enquiry-read-toggle" data-id="${x.id}" data-read="${x.read_at?'true':'false'}">${x.read_at?'Mark unread':'Mark read'}</button><button type="button" class="enquiry-delete" data-id="${x.id}">Delete</button></div><label>Status <select class="enquiry-status" data-id="${x.id}">${['new','contacted','quoted','won','lost'].map(s=>`<option value="${s}" ${x.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}</select></label></div></article>`;
}
async function setRead(id,read){const {error}=await supabaseClient.from('customer_enquiries').update({read_at:read?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',id).eq('business_id',JAYCO_BUSINESS_ID);if(error){alert(error.message);return}const x=enquiries.find(e=>e.id===id);if(x)x.read_at=read?new Date().toISOString():null;updateBadge();render()}
async function deleteEnquiry(id){
 if(!confirm('Are you sure you want to delete this record? This cannot be undone.'))return;
 const {error}=await supabaseClient.from('customer_enquiries').delete().eq('id',id).eq('business_id',JAYCO_BUSINESS_ID);
 if(error){alert('Could not delete this enquiry: '+error.message);return}
 enquiries=enquiries.filter(e=>e.id!==id); updateBadge(); render();
}
async function setStatus(id,status){const {error}=await supabaseClient.from('customer_enquiries').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('business_id',JAYCO_BUSINESS_ID);if(error){alert(error.message);await load();return}const x=enquiries.find(e=>e.id===id);if(x)x.status=status;updateBadge();render()}
window.addEventListener('scheduleplus:enquiries-enabled',()=>{setup().then(load);});
window.addEventListener('scheduleplus:show-enquiries',()=>{setup().then(load);});
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',setup,{once:true});else setTimeout(setup,0);
})();