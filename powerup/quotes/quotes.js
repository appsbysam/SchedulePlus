/* Power Up-only quote editor. Cloud saving requires authenticated business membership. */
(() => {
const $ = id => document.getElementById(id);
const safe = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
const state = {lines:[{description:'Solar system supply and installation',quantity:1,unit_price:0}],quote:null};
const root = $('puQuotesView');if(!root)return;
const lineRow = (l,i) => `<div class="pu-line" data-row="${i}"><label class="pu-line-desc">Description<input data-line="${i}" data-field="description" aria-label="Item description" value="${safe(l.description)}" placeholder="Product or service"></label><label class="pu-line-qty">Qty<input data-line="${i}" data-field="quantity" type="number" min="0.001" step="any" aria-label="Quantity" value="${l.quantity}"></label><label class="pu-line-price">Unit price (ex. GST)<input data-line="${i}" data-field="unit_price" type="number" min="0" step="0.01" aria-label="Unit price" value="${l.unit_price}"></label><div class="pu-line-amount"><small>Amount</small><strong>${money(Number(l.quantity||0)*Number(l.unit_price||0))}</strong></div><button type="button" data-remove="${i}" aria-label="Remove item">×</button></div>`;
const invalidLine = l => !l.description.trim()||!(Number(l.quantity)>0)||!Number.isFinite(Number(l.quantity))||l.unit_price===''||l.unit_price===null||!Number.isFinite(Number(l.unit_price))||Number(l.unit_price)<0;
function markInvalidLines(){let first=null;state.lines.forEach((l,i)=>{const row=root.querySelector(`[data-row="${i}"]`);if(!row)return;const bad=invalidLine(l);row.classList.toggle('pu-line-invalid',bad);for(const field of ['description','quantity','unit_price']){const el=row.querySelector(`[data-field="${field}"]`);if(!el)continue;const invalid=field==='description'?!l.description.trim():field==='quantity'?!(Number(l.quantity)>0):l.unit_price===''||!Number.isFinite(Number(l.unit_price))||Number(l.unit_price)<0;el.setAttribute('aria-invalid',String(invalid));if(invalid&&!first)first=el;}});if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.focus({preventScroll:true});}return !!first;}
function requireCompleteLines(){if(!state.lines.length||state.lines.some(invalidLine)){markInvalidLines();$('puMessage').textContent='Complete the highlighted quote item before continuing.';return false;}return true;}
root.innerHTML = `<section class="hero-row"><div><p class="eyebrow">POWER UP SOLAR</p><h1>Quotes</h1></div><button type="button" id="puBack">← Jobs</button></section>
<div class="pu-tabs" role="tablist" aria-label="Quotation sections"><button type="button" class="pu-tab active" data-pu-tab="list">My Quotes</button><button type="button" class="pu-tab" data-pu-tab="editor">Create / Edit</button><button type="button" class="pu-tab" data-pu-tab="catalogue">Catalogue</button></div><div class="pu-tab-panel" data-pu-panel="list"><div class="pu-panel"><div class="pu-panel-heading"><strong>Saved quotations</strong><button type="button" id="puListNew" class="primary">+ New quote</button></div><div class="pu-actions"><button type="button" id="puActiveQuotes" class="primary">Active Quotes</button><button type="button" id="puArchivedQuotes">Archived Quotes</button></div><div id="puSavedQuotes" class="pu-note">Loading saved quotes…</div><div class="pu-actions"><label>Search saved quotes<input id="puQuoteSearch" type="search" placeholder="Customer or quote number"></label><label>Status filter<select id="puQuoteFilter"><option value="">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></label></div></div></div><div class="pu-tab-panel" data-pu-panel="editor" hidden><div class="pu-panel"><div class="pu-panel-heading"><strong>Quote editor</strong><button type="button" id="puNew">+ New quote</button></div><div class="pu-actions"><button type="button" id="puDuplicate">Duplicate quote</button><label>Quote status<select id="puStatus"><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></label></div><p class="pu-note">Preview and print without saving. Save before emailing or converting a quote. Use Send quotation email to deliver a saved quote as a PDF from sales@powerup.sydney. Only Power Up administrators can send.</p>
<div class="pu-grid"><label>Customer name<input id="puName" autocomplete="name"></label><label>Email<input id="puEmail" type="email" autocomplete="email"></label><label>Phone<input id="puPhone" type="tel"></label><label>Site address<input id="puAddress" autocomplete="off" placeholder="Start typing a NSW address"><span id="puAddressHint" class="pu-note">Select an NSW address from Google suggestions.</span><div id="puAddressSuggestions" class="pu-address-suggestions hidden" role="listbox"></div></label><label>Quote reference<input id="puRef" placeholder="Assigned on save" readonly></label><label>Valid until<input id="puValid" type="date"></label></div>
<label>Notes / inclusions<textarea id="puNotes" rows="3"></textarea></label></div>
<div class="pu-panel" id="puCataloguePanel" hidden><h3>Product catalogue · Admin</h3><div class="pu-grid"><label>Item name<input id="puCatalogName" placeholder="e.g. 10 kWh battery"></label><label>GST-exclusive price<input id="puCatalogPrice" type="number" min="0" step="0.01"></label></div><div class="pu-actions"><button id="puCatalogSave" type="button">Add catalogue item</button></div><div id="puCatalogList"></div></div><div class="pu-panel"><h3>Quote items</h3><div id="puLines"></div><div class="pu-actions"><button type="button" id="puAdd">+ Add item</button><select id="puPreset" aria-label="Quick item"><option value="">Select a quick item…</option><option>Solar panels</option><option>Hybrid inverter</option><option>Battery storage</option><option>Installation labour</option><option>Switchboard upgrade</option></select></div><p class="pu-note">Enter GST-exclusive unit prices. Product catalogue and controlled pricing will be connected later.</p><div class="pu-total" id="puTotal"></div></div>
<div class="pu-actions"><button type="button" id="puPreviewBtn" class="primary">Preview quote</button><button type="button" id="puPrint" disabled>Print / Save PDF</button><button type="button" id="puSave">Save quote</button><button type="button" id="puConvert" disabled>Convert accepted quote to job</button><button type="button" id="puSendEmail">Send quotation email</button><button type="button" id="puArchiveCurrent" hidden>Archive quotation</button><button type="button" id="puDeleteCurrent" hidden>Delete quotation</button></div><p id="puMessage" class="pu-status" role="status"></p><dialog id="puPreviewDialog" class="pu-preview-dialog" aria-label="Quotation preview"><div class="pu-preview-toolbar"><strong>Quotation Preview</strong><button type="button" id="puClosePreview" aria-label="Close preview">×</button></div><div id="puQuotePreview" class="pu-preview"></div><div class="pu-preview-footer"><button type="button" id="puModalClose">Close</button><button type="button" id="puModalPrint" class="primary">Print / Save PDF</button></div></dialog></div><div class="pu-tab-panel" data-pu-panel="catalogue" hidden><div class="pu-panel"><h3>Product catalogue</h3><p class="pu-note">Manage your reusable products and prices here.</p><div id="puCatalogueMount"></div></div></div>`;
const cataloguePanel=$('puCataloguePanel');$('puCatalogueMount').appendChild(cataloguePanel);
const switchQuoteTab = name => {
 root.querySelectorAll('[data-pu-panel]').forEach(panel=>{panel.hidden=panel.dataset.puPanel!==name;});
 root.querySelectorAll('[data-pu-tab]').forEach(tab=>{const active=tab.dataset.puTab===name;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
 root.scrollTop=0;
};
root.querySelectorAll('[data-pu-tab]').forEach(tab=>tab.addEventListener('click',()=>switchQuoteTab(tab.dataset.puTab)));
$('puListNew').onclick=()=>{$('puNew').click();switchQuoteTab('editor');};
switchQuoteTab('list');
const previewDialog=$('puPreviewDialog');document.body.appendChild(previewDialog);const showPreview=()=>{previewDialog.setAttribute('open','');previewDialog.classList.add('pu-preview-visible');document.body.classList.add('pu-preview-open');};const hidePreview=()=>{previewDialog.removeAttribute('open');previewDialog.classList.remove('pu-preview-visible');document.body.classList.remove('pu-preview-open');$('puPrint').disabled=true;};
const printSheet=document.createElement('div');printSheet.id='puPrintSheet';document.body.appendChild(printSheet);
function printQuotation(){
 const preview=$('puQuotePreview');
 if(!preview.innerHTML.trim()){$('puMessage').textContent='Generate a preview before printing.';return;}
 const page=window.open('','_blank');
 if(!page){$('puMessage').textContent='Please allow pop-ups to open the printable quotation.';return;}
 const styles=`
 *{box-sizing:border-box}
 html{font-size:16px;-webkit-text-size-adjust:100%}
 body{margin:0;background:#edf0f4;color:#17202b;font:14px/1.5 Arial,Helvetica,sans-serif}
 .print-tools{position:sticky;top:0;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:12px;background:#20242d;color:white;z-index:5}
 .print-tools button{appearance:none;background:#ed008d;color:white;border:0;border-radius:8px;font:600 15px Arial,sans-serif;padding:12px 18px;min-height:44px}
 .print-tools button.close{background:#424b5a}
 .pu-preview{width:min(100% - 24px,794px);margin:18px auto;padding:clamp(16px,4vw,38px);background:white;box-shadow:0 3px 22px #0002;border-radius:5px;overflow-wrap:anywhere}
 .pu-preview .pu-quote-logo{display:block!important;width:auto!important;height:auto!important;max-width:min(100%,340px)!important;max-height:125px!important;object-fit:contain!important;object-position:left center!important;margin:0 0 18px!important}
 .pu-preview table{width:100%;border-collapse:collapse;table-layout:auto;font-size:clamp(11px,2.8vw,14px)}
 .pu-preview th,.pu-preview td{padding:7px 5px;border-bottom:1px solid #ddd;text-align:left;overflow-wrap:anywhere}
 .pu-preview h1{font-size:24px}.pu-preview h2{font-size:19px}
 @page{size:A4;margin:15mm}
 @media print{html,body{background:white!important;margin:0!important;padding:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .print-tools{display:none!important}
 .pu-preview{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;font-size:12pt!important}
 .pu-preview .pu-quote-logo{max-width:85mm!important;max-height:32mm!important}
 .pu-preview table{font-size:10pt!important}
 .pu-preview tr{break-inside:avoid}}
 `;
 page.document.open();
 page.document.write('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Power Up quotation</title><style>'+styles+'</style></head><body><nav class="print-tools"><button type="button" onclick="window.print()">Print / Save PDF</button><button class="close" type="button" onclick="window.close()">Close</button></nav><main class="pu-preview">'+preview.innerHTML+'</main></body></html>');
 page.document.close();
}
$('puClosePreview').onclick=hidePreview;$('puModalClose').onclick=hidePreview;$('puModalPrint').onclick=printQuotation;
const renderLines = () => {$('puLines').innerHTML=state.lines.map(lineRow).join('');const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total: '+money(total);if(typeof renderWizard==='function')renderWizard();};
$('puLines').addEventListener('input',e=>{const i=Number(e.target.dataset.line),field=e.target.dataset.field;if(!field)return;state.lines[i][field]=field==='description'?e.target.value:(e.target.value===''?'':Number(e.target.value));e.target.setAttribute('aria-invalid','false');e.target.closest('.pu-line')?.classList.remove('pu-line-invalid');const amount=e.target.closest('.pu-line')?.querySelector('.pu-line-amount strong');if(amount)amount.textContent=money(Number(state.lines[i].quantity||0)*Number(state.lines[i].unit_price||0));const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Subtotal: '+money(total);$('puPrint').disabled=true;$('puQuotePreview').classList.remove('hidden');});
$('puLines').addEventListener('click',e=>{if(e.target.dataset.remove===undefined)return;state.lines.splice(Number(e.target.dataset.remove),1);renderLines();});
function incompleteItemIndex(){return state.lines.findIndex(l=>invalidLine(l));}
$('puAdd').onclick=()=>{
 const existing=incompleteItemIndex();
 if(existing!==-1){$('puMessage').textContent='Finish this item before adding another, or choose a quick item to fill it.';const row=root.querySelector(`[data-row="${existing}"]`);row?.classList.add('pu-line-invalid');row?.querySelector('[data-field="description"]')?.focus();return;}
 state.lines.push({description:'',quantity:1,unit_price:0});renderLines();
 $('puMessage').textContent='';$('puLines').querySelector('.pu-line:last-child [data-field="description"]')?.focus();
};
$('puPreset').onchange=e=>{
 const value=e.target.value;if(!value)return;
 const item=catalogue.find(x=>x.id===value);
 const chosen={description:item?[item.name,item.description].filter(Boolean).join(' — '):value,quantity:1,unit_price:item?Number(item.unit_price):0};
 const existing=state.lines.findIndex(l=>!String(l.description||'').trim());
 if(existing!==-1){state.lines[existing]={...state.lines[existing],...chosen};}
 else {const incomplete=incompleteItemIndex();if(incomplete!==-1){$('puMessage').textContent='Complete the highlighted item before adding another.';markInvalidLines();e.target.value='';return;}state.lines.push(chosen);}
 e.target.value='';renderLines();$('puMessage').textContent='';
};
$('puBack').onclick=()=>{const jobs=document.querySelector('.sp-nav-btn[data-sp-view="jobs"]');if(jobs)jobs.click();else document.querySelector('[data-view="jobs"]')?.click();};
$('puPreviewBtn').onclick=()=>{
const name=$('puName').value.trim(),email=$('puEmail').value.trim();
if(!name){$('puMessage').textContent='Enter a customer name first.';return;}
if(email&&!$('puEmail').checkValidity()){$('puMessage').textContent='Check the customer email address.';return;}
if(!requireCompleteLines())return;
const subtotal=state.lines.reduce((a,l)=>a+Number(l.quantity)*Number(l.unit_price),0);const gst= gstEnabled?Math.round(subtotal*10)/100:0;const total=subtotal+gst;
const businessLogo='https://appsbysam.github.io/SchedulePlus/powerup/assets/powerup-quote-logo-blk.png';const logoMarkup=businessLogo?'<img class="pu-quote-logo" src="'+safe(new URL(businessLogo,document.baseURI).href)+'" alt="Power Up Solar logo">':'<h1>POWER UP SOLAR</h1>';
$('puQuotePreview').innerHTML=`${logoMarkup}<p>Quotation ${safe($('puRef').value||'Draft')} · ${safe(new Date().toLocaleDateString('en-AU'))}</p><hr><p><strong>Prepared for:</strong> ${safe(name)}<br>${safe(email)}<br>${safe($('puPhone').value)}<br>${safe($('puAddress').value)}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${state.lines.map(l=>`<tr><td>${safe(l.description)}</td><td>${safe(l.quantity)}</td><td>${money(l.unit_price)}</td><td>${money(l.quantity*l.unit_price)}</td></tr>`).join('')}</tbody></table><p style="text-align:right">Subtotal: ${money(subtotal)}</p><p style="text-align:right">GST 10%: ${money(gst)}</p><h2 style="text-align:right">Total: ${money(total)}</h2><p><strong>Valid until:</strong> ${safe($('puValid').value||'To be confirmed')}</p><p style="white-space:pre-wrap">${safe($('puNotes').value)}</p><hr><p>Power Up Solar · sales@powerup.sydney · powerup.sydney</p>`;
$('puPrint').disabled=false;$('puMessage').textContent='Preview ready. Review the quotation before printing or saving as PDF.';$('puQuotePreview').classList.remove('hidden');showPreview();
};
$('puPrint').onclick=showPreview;

const PU_BUSINESS_SLUG='powerup-group';
let catalogue=[];let gstEnabled=true;
const basePresets=['Solar panels','Hybrid inverter','Battery storage','Installation labour','Switchboard upgrade'];
let currentQuoteId=null;let currentQuoteJobId=null;let allQuotes=[];let lastSavedSnapshot=null;let archivedQuotesView=false;let currentQuoteArchived=false;let currentQuoteReadonly=false;let canDeleteQuotes=false;
async function getBusiness(){
 const {data:{user},error:userError}=await supabaseClient.auth.getUser();
 if(userError||!user)throw new Error('Please sign in first.');
 const {data:business,error:businessError}=await supabaseClient.from('businesses').select('id').eq('slug',PU_BUSINESS_SLUG).single();
 if(businessError||!business)throw new Error('Power Up business is not available.');
 const {data:membership,error:membershipError}=await supabaseClient.from('business_users').select('business_id,role').eq('business_id',business.id).eq('user_id',user.id).eq('is_active',true).maybeSingle();
 if(membershipError||!membership)throw new Error('Your account is not authorised for Power Up quotes.');
 return {business_id:business.id,user_id:user.id,role:membership.role};
}
async function refreshCatalogue(){
 try{
  const {business_id}=await getBusiness();
  const {data,error}=await supabaseClient.from('powerup_quote_items_catalog').select('id,name,description,unit_price').eq('business_id',business_id).eq('active',true).order('name');
  if(error)throw error;
  catalogue=data||[];
  const {role}=await getBusiness();$('puCataloguePanel').hidden=!['owner','admin'].includes(role);
  $('puCatalogList').innerHTML=catalogue.map(x=>'<div class="pu-catalog-item"><span>'+safe(x.name)+' · '+money(x.unit_price)+'</span> <button type="button" data-deactivate="'+safe(x.id)+'">Deactivate</button></div>').join('');
  const sel=$('puPreset');
  sel.innerHTML='<option value="">Select a quick item…</option>'+catalogue.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+' · '+money(x.unit_price)+'</option>').join('')+basePresets.map(x=>'<option value="'+safe(x)+'">'+safe(x)+' (custom price)</option>').join('');
 }catch(e){$('puMessage').textContent='Catalogue unavailable: '+e.message;}
}
$('puCatalogSave').onclick=async()=>{try{const {business_id,role}=await getBusiness();if(!['owner','admin'].includes(role))throw Error('Admin access required');const name=$('puCatalogName').value.trim(),price=Number($('puCatalogPrice').value);if(!name||!Number.isFinite(price)||price<0)throw Error('Enter a valid name and price');const {error}=await supabaseClient.from('powerup_quote_items_catalog').insert({business_id,name,unit_price:price});if(error)throw error;$('puCatalogName').value='';$('puCatalogPrice').value='';await refreshCatalogue();$('puMessage').textContent='Catalogue item added.';}catch(e){$('puMessage').textContent=e.message;}};
$('puCatalogList').onclick=async e=>{const id=e.target.dataset.deactivate;if(!id)return;if(!confirm('Deactivate this catalogue item?'))return;const {error}=await supabaseClient.from('powerup_quote_items_catalog').update({active:false}).eq('id',id);$('puMessage').textContent=error?error.message:'Item deactivated';if(!error)await refreshCatalogue();};
async function prepareQuoteDefaults(){const date=new Date();date.setDate(date.getDate()+14);$('puValid').value=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');$('puRef').value='Loading next number…';try{const {data,error}=await supabaseClient.rpc('powerup_next_quote_reference');if(error)throw error;$('puRef').value=data||'Assigned on save';}catch(e){$('puRef').value='Assigned on save';$('puMessage').textContent='Quote number will be assigned when saved.';}}
$('puDuplicate').onclick=()=>{if(!currentQuoteId){$('puMessage').textContent='Open a saved quote before duplicating.';return;}currentQuoteId=null;currentQuoteJobId=null;lastSavedSnapshot=null;$('puRef').readOnly=false;$('puRef').value='';prepareQuoteDefaults();$('puStatus').value='draft';$('puConvert').disabled=true;hidePreview();$('puMessage').textContent='Duplicate ready. Save to create a new quote.';};
$('puNew').onclick=()=>{
 gstEnabled=true;currentQuoteId=null;currentQuoteJobId=null;currentQuoteArchived=false;currentQuoteReadonly=false;applyQuoteAccess();$('puRef').readOnly=false;$('puConvert').disabled=true;state.lines=[{description:'',quantity:1,unit_price:0}];
 ['puName','puEmail','puPhone','puAddress','puRef','puValid','puNotes'].forEach(id=>$(id).value='');
 $('puStatus').value='draft';$('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=true;
 renderLines();prepareQuoteDefaults().then(()=>renderWizard());$('puMessage').textContent='New quote ready.';wizardPage('main');
};
function quoteIsArchived(q){return !!(q.job_id||q.archived_at);}
function applyQuoteAccess(){
 const locked=currentQuoteReadonly;
 ['puName','puEmail','puPhone','puAddress','puValid','puNotes','puStatus','puAdd','puPreset','puSave','puConvert','puSendEmail'].forEach(id=>{const el=$(id);if(el)el.disabled=locked;});
 $('puRef').readOnly=true;
 $('puLines').querySelectorAll('input,button').forEach(el=>el.disabled=locked);
 $('puArchiveCurrent').hidden=!currentQuoteId||!!currentQuoteJobId;
 $('puArchiveCurrent').textContent=currentQuoteArchived?'Restore quotation':'Archive quotation';
 $('puDeleteCurrent').hidden=!currentQuoteId||!!currentQuoteJobId||!canDeleteQuotes;
 if(!locked)$('puConvert').disabled=$('puStatus').value!=='accepted'||!!currentQuoteJobId;
}
function showQuotes(){
 const q=$('puQuoteSearch').value.toLowerCase().trim(),status=$('puQuoteFilter').value;
 const rows=allQuotes.filter(x=>quoteIsArchived(x)===archivedQuotesView&&(!status||x.status===status)&&(!q||(x.customer_name+' '+x.quote_number).toLowerCase().includes(q)));
 $('puActiveQuotes').classList.toggle('primary',!archivedQuotesView);
 $('puArchivedQuotes').classList.toggle('primary',archivedQuotesView);
 $('puSavedQuotes').innerHTML='<h3>'+(archivedQuotesView?'Archived':'Active')+' quotes ('+rows.length+')</h3>'+(rows.length?rows.map(x=>'<button type="button" class="pu-saved" data-quote-id="'+safe(x.id)+'">'+safe(x.quote_number)+' · '+safe(x.customer_name)+' · '+safe(x.job_id?'Converted to Job':x.status)+(quoteIsArchived(x)?' · Archived':'')+'</button>').join(''):'<p>No matching quotes.</p>');
}
$('puActiveQuotes').onclick=()=>{archivedQuotesView=false;showQuotes();};
$('puArchivedQuotes').onclick=()=>{archivedQuotesView=true;showQuotes();};
$('puQuoteSearch').oninput=showQuotes;$('puQuoteFilter').onchange=showQuotes;
async function refreshQuotes(){
 const list=$('puSavedQuotes');if(!list)return;
 try{
  const {business_id,role}=await getBusiness();
  canDeleteQuotes=['owner','admin'].includes(role);
  const {data,error}=await supabaseClient.from('powerup_quotes').select('id,quote_number,customer_name,status,job_id,archived_at,created_at').eq('business_id',business_id).order('created_at',{ascending:false}).limit(200);
  if(error)throw error;
  allQuotes=data||[];showQuotes();applyQuoteAccess();
 }catch(e){list.textContent='Saved quotes unavailable: '+e.message;}
}
$('puArchiveCurrent').onclick=async()=>{
 if(!currentQuoteId||currentQuoteJobId)return;
 const action=currentQuoteArchived?'restore':'archive';
 if(!confirm((action==='archive'?'Archive':'Restore')+' quotation '+$('puRef').value+'?'))return;
 const {error}=await supabaseClient.from('powerup_quotes').update({archived_at:currentQuoteArchived?null:new Date().toISOString()}).eq('id',currentQuoteId).is('job_id',null);
 if(error){$('puMessage').textContent='Unable to '+action+': '+error.message;return;}
 currentQuoteArchived=!currentQuoteArchived;currentQuoteReadonly=currentQuoteArchived;
 applyQuoteAccess();await refreshQuotes();$('puMessage').textContent='Quotation '+(currentQuoteArchived?'archived.':'restored.');
};
$('puDeleteCurrent').onclick=async()=>{
 if(!currentQuoteId||currentQuoteJobId||!canDeleteQuotes)return;
 const ref=$('puRef').value;
 if(!confirm('Permanently delete quotation '+ref+'? This cannot be undone.'))return;
 const {error,count}=await supabaseClient.from('powerup_quotes').delete({count:'exact'}).eq('id',currentQuoteId).is('job_id',null);
 if(error||count!==1){$('puMessage').textContent='Delete failed: '+(error?.message||'Quotation was not deleted.');return;}
 $('puNew').click();switchQuoteTab('list');await refreshQuotes();
};

$('puSavedQuotes').addEventListener('click',async e=>{
 const id=e.target.dataset.quoteId;if(!id)return;
 try{
  const {data:q,error}=await supabaseClient.from('powerup_quotes').select('*').eq('id',id).single();if(error)throw error;
  const {data:lines,error:lineError}=await supabaseClient.from('powerup_quote_lines').select('description,quantity,unit_price').eq('quote_id',id).order('sort_order');
  if(lineError)throw lineError;
  $('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=true;
  gstEnabled=q.gst_included!==false;currentQuoteId=q.id;currentQuoteJobId=q.job_id||null;currentQuoteArchived=!!q.archived_at;currentQuoteReadonly=!!(q.job_id||q.archived_at);lastSavedSnapshot=JSON.stringify({gst:gstEnabled,name:q.customer_name,email:q.customer_email||'',phone:q.customer_phone||'',address:q.site_address||'',ref:q.quote_number,valid:q.valid_until||'',notes:q.notes||'',status:q.status,lines:(lines||[]).map(l=>({description:l.description,quantity:Number(l.quantity),unit_price:Number(l.unit_price)}))});$('puRef').readOnly=true;$('puConvert').disabled=q.status!=='accepted'||!!q.job_id;
  $('puName').value=q.customer_name||'';$('puEmail').value=q.customer_email||'';$('puPhone').value=q.customer_phone||'';$('puAddress').value=q.site_address||'';$('puRef').value=q.quote_number||'';$('puValid').value=q.valid_until||'';$('puNotes').value=q.notes||'';$('puStatus').value=q.status||'draft';
  state.lines=(lines||[]).map(l=>({description:l.description,quantity:Number(l.quantity),unit_price:Number(l.unit_price)}));renderLines();applyQuoteAccess();
  $('puMessage').textContent='Loaded '+q.quote_number;switchQuoteTab('editor');wizardPage('main');
 }catch(e){$('puMessage').textContent='Unable to open quote: '+e.message;}
});
$('puSave').onclick=async()=>{
 if(currentQuoteReadonly){$('puMessage').textContent='Archived and converted quotations are read-only.';return false;}const button=$('puSave');button.disabled=true;
 try{
  const {business_id}=await getBusiness();
  if(!$('puName').value.trim())throw new Error('Customer name is required.');
  if($('puEmail').value&&!$('puEmail').checkValidity())throw new Error('Enter a valid email.');
  if(!requireCompleteLines())throw new Error('Complete highlighted quote items.');
  const id=currentQuoteId||crypto.randomUUID();
  const ref=$('puRef').value.trim()||('PU-'+id.slice(0,8).toUpperCase());
  const payload={id,business_id,quote_number:ref,status:$('puStatus').value,customer_name:$('puName').value.trim(),customer_email:$('puEmail').value.trim()||null,customer_phone:$('puPhone').value.trim()||null,site_address:$('puAddress').value.trim()||null,notes:$('puNotes').value.trim(),valid_until:$('puValid').value||null,gst_included:gstEnabled};
  const {data:savedId,error:saveError}=await supabaseClient.rpc('powerup_save_quote',{p_quote:payload,p_lines:state.lines.map(l=>({description:l.description.trim(),quantity:Number(l.quantity),unit_price:Number(l.unit_price)}))});
  if(saveError)throw saveError;
  const {data:savedQuote,error:refError}=await supabaseClient.from('powerup_quotes').select('quote_number').eq('id',savedId).single();if(refError)throw refError;
  currentQuoteId=savedId;$('puRef').value=savedQuote.quote_number;lastSavedSnapshot=JSON.stringify({gst:gstEnabled,name:$('puName').value.trim(),email:$('puEmail').value.trim(),phone:$('puPhone').value.trim(),address:$('puAddress').value.trim(),ref:savedQuote.quote_number,valid:$('puValid').value,notes:$('puNotes').value.trim(),status:$('puStatus').value,lines:state.lines.map(l=>({...l}))});$('puRef').readOnly=true;$('puConvert').disabled=$('puStatus').value!=='accepted'||!!currentQuoteJobId;
  $('puMessage').textContent='Quote '+savedQuote.quote_number+' saved successfully.';$('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=true;await refreshQuotes();
 return true;}catch(e){$('puMessage').textContent='Save failed: '+e.message;return false;}finally{button.disabled=false;}
};
$('puConvert').onclick=async()=>{if($('puStatus').value!=='accepted'||currentQuoteJobId)return;if(!confirm('Save this accepted quote and create a Schedule+ job?'))return;const btn=$('puConvert');btn.disabled=true;try{if(!currentQuoteId||!lastSavedSnapshot||currentSnapshot()!==lastSavedSnapshot){const saved=await $('puSave').onclick();if(!saved)throw Error('Quote could not be saved. Correct the highlighted fields and try again.');}if(!currentQuoteId)throw Error('Save the quotation before converting.');const {data,error}=await supabaseClient.rpc('powerup_convert_quote_to_job',{p_quote_id:currentQuoteId});if(error)throw error;currentQuoteJobId=data;currentQuoteReadonly=true;currentQuoteArchived=true;btn.disabled=true;await refreshQuotes();$('puMessage').textContent='Job created successfully. Opening job details…';document.dispatchEvent(new CustomEvent('powerup:open-converted-job',{detail:{jobId:data}}));}catch(e){$('puMessage').textContent='Conversion stopped: '+e.message;btn.disabled=!!currentQuoteJobId;} };
$('puStatus').onchange=()=>{$('puConvert').disabled=$('puStatus').value!=='accepted'||!!currentQuoteJobId;};

function currentSnapshot(){return JSON.stringify({gst:gstEnabled,name:$('puName').value.trim(),email:$('puEmail').value.trim(),phone:$('puPhone').value.trim(),address:$('puAddress').value.trim(),ref:$('puRef').value.trim(),valid:$('puValid').value,notes:$('puNotes').value.trim(),status:$('puStatus').value,lines:state.lines.map(l=>({...l}))});}
$('puSendEmail').onclick=async()=>{
 const btn=$('puSendEmail'),message=$('puMessage');
 let started=false,success=false;
 try{
  const {role}=await getBusiness();
  if(!['owner','admin'].includes(role))throw new Error('Only a Power Up administrator can email quotations.');
  if(!currentQuoteId)throw new Error('Save the quote before emailing it.');
  if(!lastSavedSnapshot||currentSnapshot()!==lastSavedSnapshot)throw new Error('You have unsaved changes. Save the quote before sending.');
  const email=$('puEmail').value.trim();
  if(!email||!$('puEmail').checkValidity())throw new Error('Enter a valid customer email and save the quote.');
  if(!confirm('Send quotation '+$('puRef').value+' as a PDF to '+email+' from sales@powerup.sydney?'))return;
  started=true;btn.disabled=true;btn.classList.remove('pu-email-sent');
  btn.classList.add('pu-email-sending');btn.innerHTML='<span class="pu-email-spinner" aria-hidden="true"></span> Sending…';
  message.textContent='';message.classList.remove('pu-success');
  const {data,error}=await supabaseClient.functions.invoke('powerup-send-quote',{body:{quote_id:currentQuoteId}});
  if(error){let detail=error.message;if(error.context?.json){try{const body=await error.context.json();detail=body.error||detail;}catch{}}throw new Error(detail);}
  if(!data?.ok)throw new Error(data?.error||'Microsoft did not confirm the send.');
  $('puStatus').value='sent';lastSavedSnapshot=currentSnapshot();
  success=true;btn.classList.add('pu-email-sent');btn.textContent='Email submitted ✓';
  message.textContent='Quotation email successfully submitted for sending.';message.classList.add('pu-success');
  await refreshQuotes();
 }catch(e){message.classList.remove('pu-success');message.textContent='Email not sent: '+e.message;}
 finally{
  if(started){btn.disabled=false;btn.classList.remove('pu-email-sending');if(!success){btn.classList.remove('pu-email-sent');btn.textContent='Send quotation email';}
   else setTimeout(()=>{btn.classList.remove('pu-email-sent');btn.textContent='Send quotation email';},4000);
  }
 }
};

/* Google Places (New) NSW-only autocomplete, scoped to the quote address. */
(()=>{
 const input=$('puAddress'),list=$('puAddressSuggestions'),hint=$('puAddressHint');
 const bounds={west:140.999,south:-37.6,east:153.7,north:-28.1};
 let library=null,token=null,timer=null,seq=0,predictions=[];
 const hide=()=>{list.classList.add('hidden');list.innerHTML='';};
 async function places(){
  if(!window.google?.maps?.importLibrary){
   if(typeof GOOGLE_MAPS_API_KEY==='undefined'||!GOOGLE_MAPS_API_KEY)throw Error('Google Maps is not configured');
   await new Promise((resolve,reject)=>{const cb='puPlacesReady'+Date.now();window[cb]=()=>{delete window[cb];resolve();};const s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(GOOGLE_MAPS_API_KEY)+'&v=weekly&callback='+cb;s.onerror=()=>reject(Error('Google Maps failed to load'));document.head.appendChild(s);});
  }
  if(!library){library=await google.maps.importLibrary('places');token=new library.AutocompleteSessionToken();}
  return library;
 }
 const component=(place,type)=>place.addressComponents?.find(x=>x.types?.includes(type))?.shortText||'';
 async function choose(i){
  const prediction=predictions[i];if(!prediction)return;
  try{
   const place=prediction.toPlace();await place.fetchFields({fields:['formattedAddress','addressComponents']});
   if(component(place,'country')!=='AU'||component(place,'administrative_area_level_1')!=='NSW')throw Error('Please select an address in New South Wales.');
   input.value=(place.formattedAddress||prediction.text?.toString()||'').replace(/,?\s*Australia\s*$/i,'').trim();
   input.dataset.nswSelected='true';hint.textContent='NSW address selected.';hide();token=new library.AutocompleteSessionToken();
  }catch(e){hint.textContent=e.message;}
 }
 input.addEventListener('input',()=>{delete input.dataset.nswSelected;clearTimeout(timer);timer=setTimeout(async()=>{
  const text=input.value.trim(),request=++seq;if(text.length<3){hide();hint.textContent='Start typing a NSW address.';return;}
  try{const p=await places();const {suggestions=[]}=await p.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:text,includedRegionCodes:['au'],locationRestriction:bounds,sessionToken:token});if(request!==seq)return;
   predictions=suggestions.map(x=>x.placePrediction).filter(Boolean);list.innerHTML=predictions.length?predictions.map((x,i)=>'<button type="button" data-pu-place="'+i+'">'+safe(x.text?.toString()||'')+'</button>').join(''):'<div class="pu-note">No matching NSW addresses.</div>';list.classList.remove('hidden');hint.textContent='Select an NSW address.';
  }catch(e){if(request===seq){hide();hint.textContent='Google address lookup unavailable: '+e.message;}}
 },250);});
 list.addEventListener('click',e=>{const btn=e.target.closest('[data-pu-place]');if(btn)choose(Number(btn.dataset.puPlace));});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#puAddressSuggestions')&&e.target!==input)hide();});
})();


/* Mobile-first quote workflow; existing save, email, PDF and conversion handlers remain authoritative. */
const wizard=document.createElement('section');wizard.id='puWizard';wizard.className='pu-wizard';
root.querySelector('[data-pu-panel="editor"]').prepend(wizard);
let wizardStep='main',editingItem=-1;
const originalAddressParent=$('puAddress').parentElement;
function restoreAddress(){if($('puAddress').parentElement!==originalAddressParent)originalAddressParent.prepend($('puAddress'));if($('puAddressSuggestions').parentElement!==originalAddressParent)originalAddressParent.appendChild($('puAddressSuggestions'));if($('puAddressHint').parentElement!==originalAddressParent)originalAddressParent.appendChild($('puAddressHint'));}
function splitItemDescription(value){
 const parts=String(value||'').split(' — ');return {name:parts.shift()||'',details:parts.join(' — ')};
}
function wizardTotals(){const subtotal=state.lines.reduce((sum,l)=>sum+Number(l.quantity||0)*Number(l.unit_price||0),0);const gst=gstEnabled?Math.round(subtotal*10)/100:0;return {subtotal,total:subtotal+gst,gst};}
function renderWizard(){
 if(!wizard.isConnected)return;
 restoreAddress();
 const {subtotal,total,gst}=wizardTotals();
 const reference=$('puRef').value||'New quote';
 const summary=state.lines.filter(l=>String(l.description||'').trim());
 const client=$('puName').value.trim();
 const readonly=currentQuoteReadonly;
 const title=wizardStep==='main'?'Quote '+safe(reference):wizardStep==='client'?'Add client':'Add item';
 const top='<div class="pu-wizard-head"><button type="button" data-wiz="back" aria-label="Back">←</button><strong>'+title+'</strong><button type="button" data-wiz="savequote" '+(readonly?'disabled':'')+'>Save</button></div>';
 if(wizardStep==='main'){
 wizard.innerHTML=top+'<div class="pu-wiz-main"><p class="pu-wiz-date">'+new Date().toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})+'</p><h2>Quote '+safe(reference)+'</h2><div class="pu-wiz-label">BILL TO</div><button class="pu-wiz-tile" type="button" data-wiz="client">◉ &nbsp; '+(client?safe(client):'Add client')+' <span>›</span></button><div class="pu-wiz-label">ITEMS</div><button class="pu-wiz-tile" type="button" data-wiz="add">⊕ &nbsp; Add items <span>›</span></button><div class="pu-wiz-cards">'+summary.map((l,i)=>{const part=splitItemDescription(l.description);return '<button type="button" class="pu-wiz-item-card" data-wiz-item="'+i+'"><strong>'+safe(part.name)+'</strong><small>'+safe(part.details)+'</small><span>'+safe(l.quantity)+' × '+money(l.unit_price)+' &nbsp; <b>'+money(Number(l.quantity)*Number(l.unit_price))+'</b></span></button>';}).join('')+'</div><div class="pu-wiz-gst"><span><strong>GST 10%</strong><small>Applies to the entire quote</small></span><button type="button" role="switch" aria-checked="'+gstEnabled+'" class="pu-wiz-switch '+(gstEnabled?'is-on':'')+'" data-wiz="gst" '+(readonly?'disabled':'')+'><span></span></button></div><div class="pu-wiz-money"><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div><div><span>GST</span><strong>'+money(gst)+'</strong></div><div class="pu-wiz-grand"><span>Total</span><strong>'+money(total)+'</strong></div></div><div class="pu-wiz-form"><label>Quote status<select id="wizStatus" '+(readonly?'disabled':'')+'>'+['draft','sent','accepted','declined','expired'].map(st=>'<option value="'+st+'" '+($('puStatus').value===st?'selected':'')+'>'+st.charAt(0).toUpperCase()+st.slice(1)+'</option>').join('')+'</select></label></div><div class="pu-wiz-footer"><button type="button" data-wiz="client">Client details</button><button type="button" data-wiz="add" '+(readonly?'disabled':'')+'>+ Add item</button></div><div class="pu-wiz-tools"><button type="button" data-wiz="preview">Preview / PDF</button><button type="button" data-wiz="savequote" '+(readonly?'disabled':'')+'>Save quote</button><button type="button" data-wiz="actions">More actions</button></div></div>';
 }else if(wizardStep==='client'){
 wizard.innerHTML=top+'<div class="pu-wiz-form"><label>Customer name<input id="wizName" value="'+safe($('puName').value)+'" '+(readonly?'disabled':'')+'></label><label>Email<input id="wizEmail" type="email" value="'+safe($('puEmail').value)+'" '+(readonly?'disabled':'')+'></label><label>Phone<input id="wizPhone" type="tel" value="'+safe($('puPhone').value)+'" '+(readonly?'disabled':'')+'></label><label id="wizAddressMount">Site address</label><label>Valid until<input id="wizValid" type="date" value="'+safe($('puValid').value)+'" '+(readonly?'disabled':'')+'></label><label>Notes / inclusions<textarea id="wizNotes" rows="3" '+(readonly?'disabled':'')+'>'+safe($('puNotes').value)+'</textarea></label><button class="pu-wiz-next" type="button" data-wiz="clientnext">Next → Add items</button></div>';
 $('wizAddressMount').appendChild($('puAddress'));
 $('wizAddressMount').appendChild($('puAddressSuggestions'));
 $('wizAddressMount').appendChild($('puAddressHint'));
 }else{
 const l=editingItem>=0?state.lines[editingItem]:{description:'',quantity:1,unit_price:0};const part=splitItemDescription(l.description);
 wizard.innerHTML=top+'<div class="pu-wiz-form"><label>Item name<input id="wizItemName" list="wizItemOptions" placeholder="Enter or select an item" value="'+safe(part.name)+'" '+(readonly?'disabled':'')+'><small>Type a new item or select from your catalogue</small></label><datalist id="wizItemOptions">'+catalogue.map(x=>'<option value="'+safe(x.name)+'"></option>').join('')+'</datalist><label>Item description<textarea id="wizItemDetails" rows="4" placeholder="Enter item description" '+(readonly?'disabled':'')+'>'+safe(part.details)+'</textarea></label><label>Rate ($)<input id="wizItemRate" type="number" min="0" step="0.01" value="'+safe(l.unit_price)+'" '+(readonly?'disabled':'')+'></label><label>Quantity<input id="wizItemQty" type="number" min="0.001" step="any" value="'+safe(l.quantity)+'" '+(readonly?'disabled':'')+'></label><button class="pu-wiz-next" type="button" data-wiz="saveitem" '+(readonly?'disabled':'')+'>Save item</button>'+(editingItem>=0&&!readonly?'<button type="button" data-wiz="removeitem">Remove item</button>':'')+'</div>';
 }
}
function wizardPage(step,index=-1){wizardStep=step;editingItem=index;renderWizard();wizard.scrollIntoView({block:'start'});}
function syncWizardClient(){
 const fields={wizName:'puName',wizEmail:'puEmail',wizPhone:'puPhone',wizValid:'puValid',wizNotes:'puNotes'};
 Object.entries(fields).forEach(([source,dest])=>{if($(source))$(dest).value=$(source).value;});
}
wizard.addEventListener('focusin',e=>{
 if(e.target.id==='wizItemRate' && Number(e.target.value)===0){
  e.target.value='';
 }
});
wizard.addEventListener('input',e=>{
 if(wizardStep==='client')syncWizardClient();
 if(e.target.id==='wizStatus'){$('puStatus').value=e.target.value;$('puStatus').dispatchEvent(new Event('change'));}
 if(e.target.id==='wizItemName'){
 const item=catalogue.find(x=>x.name.toLowerCase()===e.target.value.trim().toLowerCase());
 if(item){$('wizItemDetails').value=item.description||'';$('wizItemRate').value=Number(item.unit_price);}
 }
});
wizard.addEventListener('click',async e=>{
 const btn=e.target.closest('[data-wiz],[data-wiz-item]');if(!btn)return;
 if(btn.hasAttribute('data-wiz-item')){wizardPage('item',Number(btn.dataset.wizItem));return;}
 const action=btn.dataset.wiz;
 if(action==='back'){if(wizardStep==='main')switchQuoteTab('list');else wizardPage('main');}
 if(action==='client')wizardPage('client');
 if(action==='add')wizardPage('item');
 if(action==='gst'){gstEnabled=!gstEnabled;renderWizard();$('puPrint').disabled=true;}
 if(action==='clientnext'){syncWizardClient();if(!$('puName').value.trim()){alert('Enter a customer name.');return;}if($('puEmail').value&&!$('puEmail').checkValidity()){alert('Enter a valid email.');return;}wizardPage('item');}
 if(action==='saveitem'){
  const name=$('wizItemName').value.trim(),details=$('wizItemDetails').value.trim(),qty=Number($('wizItemQty').value),rate=Number($('wizItemRate').value);
  if(!name||!Number.isFinite(qty)||qty<=0||!Number.isFinite(rate)||rate<0||$('wizItemRate').value===''){alert('Enter an item name, a valid rate and a quantity greater than zero.');return;}
  const line={description:[name,details].filter(Boolean).join(' — '),quantity:qty,unit_price:rate};
  if(editingItem>=0)state.lines[editingItem]=line;
  else if(state.lines.length===1&&!state.lines[0].description.trim())state.lines[0]=line;
  else state.lines.push(line);
  renderLines();wizardPage('main');
 }
 if(action==='removeitem'){if(confirm('Remove this item?')){state.lines.splice(editingItem,1);if(!state.lines.length)state.lines.push({description:'',quantity:1,unit_price:0});renderLines();wizardPage('main');}}
 if(action==='preview')$('puPreviewBtn').click();
 if(action==='savequote'){if(wizardStep==='client')syncWizardClient();$('puSave').click();}
 if(action==='duplicate'){$('puDuplicate').click();currentQuoteArchived=false;currentQuoteReadonly=false;applyQuoteAccess();wizardPage('main');$('puLegacyActions').hidden=true;}
 if(action==='actions'){$('puLegacyActions').hidden=!$('puLegacyActions').hidden;}
});
$('puRef').addEventListener('change',renderWizard);
const legacyEditor=root.querySelector('[data-pu-panel="editor"]');
const actions=$('puPreviewBtn').closest('.pu-actions');actions.id='puLegacyActions';actions.hidden=true;
const duplicateAction=document.createElement('button');duplicateAction.type='button';duplicateAction.textContent='Duplicate quote';duplicateAction.onclick=()=>{ $('puDuplicate').click();currentQuoteArchived=false;currentQuoteReadonly=false;applyQuoteAccess();wizardPage('main');actions.hidden=true; };actions.appendChild(duplicateAction);
['puPreviewBtn','puPrint','puSave'].forEach(id=>$(id).classList.add('pu-wiz-secondary-hidden'));
const legacyPanels=[...legacyEditor.children].filter(el=>el!==wizard&&el!==actions&&el.id!=='puMessage');
legacyPanels.forEach(el=>el.classList.add('pu-wiz-legacy'));
const legacyMessage=$('puMessage');wizard.after(legacyMessage);
const legacyActionsButton=$('puLegacyActions');
const originalNew=$('puNew').onclick;$('puNew').onclick=()=>{originalNew();legacyActionsButton.hidden=true;wizardPage('main');};
renderWizard();

document.getElementById("puQuotesNav")?.addEventListener("click",()=>{refreshQuotes();refreshCatalogue();});
document.addEventListener("powerup:quotes-open",()=>{switchQuoteTab('list');refreshQuotes();refreshCatalogue();});
refreshQuotes();
refreshCatalogue();

renderLines();
})();
