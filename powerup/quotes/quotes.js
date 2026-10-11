/* Power Up-only quote editor. Cloud saving requires authenticated business membership. */
(() => {
const $ = id => document.getElementById(id);
const safe = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
const state = {lines:[{description:'Solar system supply and installation',quantity:1,unit_price:0}],quote:null};
const root = $('puQuotesView');if(!root)return;
const lineRow = (l,i) => `<div class="pu-line" data-row="${i}"><label class="pu-line-desc">Description<input data-line="${i}" data-field="description" aria-label="Item description" value="${safe(l.description)}" placeholder="Product or service"></label><label class="pu-line-qty">Qty<input data-line="${i}" data-field="quantity" type="number" min="0.001" step="any" aria-label="Quantity" value="${l.quantity}"></label><label class="pu-line-price">Unit price (incl. GST)<input data-line="${i}" data-field="unit_price" type="number" min="0" step="0.01" aria-label="Unit price" value="${l.unit_price}"></label><div class="pu-line-amount"><small>Amount</small><strong>${money(Number(l.quantity||0)*Number(l.unit_price||0))}</strong></div><button type="button" data-remove="${i}" aria-label="Remove item">×</button></div>`;
const invalidLine = l => !l.description.trim()||!(Number(l.quantity)>0)||!Number.isFinite(Number(l.quantity))||l.unit_price===''||l.unit_price===null||!Number.isFinite(Number(l.unit_price))||Number(l.unit_price)<0;
function markInvalidLines(){let first=null;state.lines.forEach((l,i)=>{const row=root.querySelector(`[data-row="${i}"]`);if(!row)return;const bad=invalidLine(l);row.classList.toggle('pu-line-invalid',bad);for(const field of ['description','quantity','unit_price']){const el=row.querySelector(`[data-field="${field}"]`);if(!el)continue;const invalid=field==='description'?!l.description.trim():field==='quantity'?!(Number(l.quantity)>0):l.unit_price===''||!Number.isFinite(Number(l.unit_price))||Number(l.unit_price)<0;el.setAttribute('aria-invalid',String(invalid));if(invalid&&!first)first=el;}});if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.focus({preventScroll:true});}return !!first;}
function requireCompleteLines(){if(!state.lines.length||state.lines.some(invalidLine)){markInvalidLines();$('puMessage').textContent='Complete the highlighted quote item before continuing.';return false;}return true;}
root.innerHTML = `<section class="hero-row"><div><p class="eyebrow">POWER UP SOLAR</p><h1>Quotes</h1></div><button type="button" id="puBack">← Jobs</button></section>
<div class="pu-tabs" role="tablist" aria-label="Quotation sections"><button type="button" class="pu-tab active" data-pu-tab="list">My Quotes</button><button type="button" class="pu-tab" data-pu-tab="editor">Create / Edit</button><button type="button" class="pu-tab" data-pu-tab="catalogue">Catalogue</button></div><div class="pu-tab-panel" data-pu-panel="list"><div class="pu-panel"><div class="pu-panel-heading"><strong>Saved quotations</strong><button type="button" id="puListNew" class="primary">+ New quote</button></div><div id="puSavedQuotes" class="pu-note">Loading saved quotes…</div><div class="pu-actions"><label>Search saved quotes<input id="puQuoteSearch" type="search" placeholder="Customer or quote number"></label><label>Status filter<select id="puQuoteFilter"><option value="">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></label></div></div></div><div class="pu-tab-panel" data-pu-panel="editor" hidden><div class="pu-panel"><div class="pu-panel-heading"><strong>Quote editor</strong><button type="button" id="puNew">+ New quote</button></div><div class="pu-actions"><button type="button" id="puDuplicate">Duplicate quote</button><label>Quote status<select id="puStatus"><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></label></div><p class="pu-note">Preview and print without saving. Save before emailing or converting a quote. Use Send quotation email to deliver a saved quote as a PDF from sales@powerup.sydney. Only Power Up administrators can send.</p>
<div class="pu-grid"><label>Customer name<input id="puName" autocomplete="name"></label><label>Email<input id="puEmail" type="email" autocomplete="email"></label><label>Phone<input id="puPhone" type="tel"></label><label>Site address<input id="puAddress" autocomplete="off" placeholder="Start typing a NSW address"><span id="puAddressHint" class="pu-note">Select an NSW address from Google suggestions.</span><div id="puAddressSuggestions" class="pu-address-suggestions hidden" role="listbox"></div></label><label>Quote reference<input id="puRef" placeholder="Assigned on save" readonly></label><label>Valid until<input id="puValid" type="date"></label></div>
<label>Notes / inclusions<textarea id="puNotes" rows="3"></textarea></label></div>
<div class="pu-panel" id="puCataloguePanel" hidden><h3>Product catalogue · Admin</h3><div class="pu-grid"><label>Item name<input id="puCatalogName" placeholder="e.g. 10 kWh battery"></label><label>GST-inclusive price<input id="puCatalogPrice" type="number" min="0" step="0.01"></label></div><div class="pu-actions"><button id="puCatalogSave" type="button">Add catalogue item</button></div><div id="puCatalogList"></div></div><div class="pu-panel"><h3>Quote items</h3><div id="puLines"></div><div class="pu-actions"><button type="button" id="puAdd">+ Add item</button><select id="puPreset" aria-label="Quick item"><option value="">Select a quick item…</option><option>Solar panels</option><option>Hybrid inverter</option><option>Battery storage</option><option>Installation labour</option><option>Switchboard upgrade</option></select></div><p class="pu-note">Enter GST-inclusive unit prices. Product catalogue and controlled pricing will be connected later.</p><div class="pu-total" id="puTotal"></div></div>
<div class="pu-actions"><button type="button" id="puPreviewBtn" class="primary">Preview quote</button><button type="button" id="puPrint" disabled>Print / Save PDF</button><button type="button" id="puSave">Save quote</button><button type="button" id="puConvert" disabled>Convert accepted quote to job</button><button type="button" id="puSendEmail">Send quotation email</button></div><p id="puMessage" class="pu-status" role="status"></p><dialog id="puPreviewDialog" class="pu-preview-dialog" aria-label="Quotation preview"><div class="pu-preview-toolbar"><strong>Quotation Preview</strong><button type="button" id="puClosePreview" aria-label="Close preview">×</button></div><div id="puQuotePreview" class="pu-preview"></div><div class="pu-preview-footer"><button type="button" id="puModalClose">Close</button><button type="button" id="puModalPrint" class="primary">Print / Save PDF</button></div></dialog></div><div class="pu-tab-panel" data-pu-panel="catalogue" hidden><div class="pu-panel"><h3>Product catalogue</h3><p class="pu-note">Manage your reusable products and prices here.</p><div id="puCatalogueMount"></div></div></div>`;
const cataloguePanel=$('puCataloguePanel');$('puCatalogueMount').appendChild(cataloguePanel);
const switchQuoteTab = name => {
 root.querySelectorAll('[data-pu-panel]').forEach(panel=>{panel.hidden=panel.dataset.puPanel!==name;});
 root.querySelectorAll('[data-pu-tab]').forEach(tab=>{const active=tab.dataset.puTab===name;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
 root.scrollTop=0;
};
root.querySelectorAll('[data-pu-tab]').forEach(tab=>tab.addEventListener('click',()=>switchQuoteTab(tab.dataset.puTab)));
$('puListNew').onclick=()=>{$('puNew').click();switchQuoteTab('editor');};
switchQuoteTab('list');
const previewDialog=$('puPreviewDialog');const hidePreview=()=>{if(previewDialog.open)previewDialog.close();$('puPrint').disabled=true;};
const printSheet=document.createElement('div');printSheet.id='puPrintSheet';document.body.appendChild(printSheet);
function printQuotation(){const preview=$('puQuotePreview');if(!preview.innerHTML.trim()){ $('puMessage').textContent='Generate a preview before printing.';return;}printSheet.innerHTML=preview.innerHTML;window.print();}
$('puClosePreview').onclick=hidePreview;$('puModalClose').onclick=hidePreview;$('puModalPrint').onclick=printQuotation;
const renderLines = () => {$('puLines').innerHTML=state.lines.map(lineRow).join('');const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total incl. GST: '+money(total);};
$('puLines').addEventListener('input',e=>{const i=Number(e.target.dataset.line),field=e.target.dataset.field;if(!field)return;state.lines[i][field]=field==='description'?e.target.value:(e.target.value===''?'':Number(e.target.value));e.target.setAttribute('aria-invalid','false');e.target.closest('.pu-line')?.classList.remove('pu-line-invalid');const amount=e.target.closest('.pu-line')?.querySelector('.pu-line-amount strong');if(amount)amount.textContent=money(Number(state.lines[i].quantity||0)*Number(state.lines[i].unit_price||0));const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total incl. GST: '+money(total);$('puPrint').disabled=true;$('puQuotePreview').classList.remove('hidden');});
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
 const chosen={description:item?item.name:value,quantity:1,unit_price:item?Number(item.unit_price):0};
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
const total=state.lines.reduce((a,l)=>a+Number(l.quantity)*Number(l.unit_price),0);
$('puQuotePreview').innerHTML=`<h1>POWER UP SOLAR</h1><p>Quotation ${safe($('puRef').value||'Draft')} · ${safe(new Date().toLocaleDateString('en-AU'))}</p><hr><p><strong>Prepared for:</strong> ${safe(name)}<br>${safe(email)}<br>${safe($('puPhone').value)}<br>${safe($('puAddress').value)}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${state.lines.map(l=>`<tr><td>${safe(l.description)}</td><td>${safe(l.quantity)}</td><td>${money(l.unit_price)}</td><td>${money(l.quantity*l.unit_price)}</td></tr>`).join('')}</tbody></table><h2 style="text-align:right">Total (incl. GST): ${money(total)}</h2><p>GST component: ${money(total/11)}</p><p><strong>Valid until:</strong> ${safe($('puValid').value||'To be confirmed')}</p><p style="white-space:pre-wrap">${safe($('puNotes').value)}</p><hr><p>Power Up Solar · sales@powerup.sydney · powerup.sydney</p>`;
$('puPrint').disabled=false;$('puMessage').textContent='Preview ready. Review the quotation before printing or saving as PDF.';$('puQuotePreview').classList.remove('hidden');if(!previewDialog.open)previewDialog.showModal();
};
$('puPrint').onclick=()=>{if(!previewDialog.open)previewDialog.showModal();};

const PU_BUSINESS_SLUG='powerup-group';
let catalogue=[];
const basePresets=['Solar panels','Hybrid inverter','Battery storage','Installation labour','Switchboard upgrade'];
let currentQuoteId=null;let currentQuoteJobId=null;let allQuotes=[];let lastSavedSnapshot=null;
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
  const {data,error}=await supabaseClient.from('powerup_quote_items_catalog').select('id,name,unit_price').eq('business_id',business_id).eq('active',true).order('name');
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
 currentQuoteId=null;currentQuoteJobId=null;$('puRef').readOnly=false;$('puConvert').disabled=true;state.lines=[{description:'',quantity:1,unit_price:0}];
 ['puName','puEmail','puPhone','puAddress','puRef','puValid','puNotes'].forEach(id=>$(id).value='');
 $('puStatus').value='draft';$('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=true;
 renderLines();prepareQuoteDefaults();$('puMessage').textContent='New quote ready.';
};
function showQuotes(){const q=$('puQuoteSearch').value.toLowerCase().trim(),status=$('puQuoteFilter').value;const rows=allQuotes.filter(x=>(!status||x.status===status)&&(!q||(x.customer_name+' '+x.quote_number).toLowerCase().includes(q)));$('puSavedQuotes').innerHTML='<h3>Saved quotes ('+rows.length+')</h3>'+(rows.length?rows.map(x=>'<button type="button" class="pu-saved" data-quote-id="'+safe(x.id)+'">'+safe(x.quote_number)+' · '+safe(x.customer_name)+' · '+safe(x.status)+'</button>').join(''):'<p>No matching quotes.</p>');}
$('puQuoteSearch').oninput=showQuotes;$('puQuoteFilter').onchange=showQuotes;
async function refreshQuotes(){
 const list=$('puSavedQuotes');if(!list)return;
 try{
  const {business_id}=await getBusiness();
  const {data,error}=await supabaseClient.from('powerup_quotes').select('id,quote_number,customer_name,status,created_at').eq('business_id',business_id).order('created_at',{ascending:false}).limit(30);
  if(error)throw error;
  allQuotes=data||[];showQuotes();
 }catch(e){list.textContent='Saved quotes unavailable: '+e.message;}
}
$('puSavedQuotes').addEventListener('click',async e=>{
 const id=e.target.dataset.quoteId;if(!id)return;
 try{
  const {data:q,error}=await supabaseClient.from('powerup_quotes').select('*').eq('id',id).single();if(error)throw error;
  const {data:lines,error:lineError}=await supabaseClient.from('powerup_quote_lines').select('description,quantity,unit_price').eq('quote_id',id).order('sort_order');
  if(lineError)throw lineError;
  $('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=true;
  currentQuoteId=q.id;currentQuoteJobId=q.job_id||null;lastSavedSnapshot=JSON.stringify({name:q.customer_name,email:q.customer_email||'',phone:q.customer_phone||'',address:q.site_address||'',ref:q.quote_number,valid:q.valid_until||'',notes:q.notes||'',status:q.status,lines:(lines||[]).map(l=>({description:l.description,quantity:Number(l.quantity),unit_price:Number(l.unit_price)}))});$('puRef').readOnly=true;$('puConvert').disabled=q.status!=='accepted'||!!q.job_id;
  $('puName').value=q.customer_name||'';$('puEmail').value=q.customer_email||'';$('puPhone').value=q.customer_phone||'';$('puAddress').value=q.site_address||'';$('puRef').value=q.quote_number||'';$('puValid').value=q.valid_until||'';$('puNotes').value=q.notes||'';$('puStatus').value=q.status||'draft';
  state.lines=(lines||[]).map(l=>({description:l.description,quantity:Number(l.quantity),unit_price:Number(l.unit_price)}));renderLines();
  $('puMessage').textContent='Loaded '+q.quote_number;switchQuoteTab('editor');
 }catch(e){$('puMessage').textContent='Unable to open quote: '+e.message;}
});
$('puSave').onclick=async()=>{
 const button=$('puSave');button.disabled=true;
 try{
  const {business_id}=await getBusiness();
  if(!$('puName').value.trim())throw new Error('Customer name is required.');
  if($('puEmail').value&&!$('puEmail').checkValidity())throw new Error('Enter a valid email.');
  if(!requireCompleteLines())throw new Error('Complete highlighted quote items.');
  const id=currentQuoteId||crypto.randomUUID();
  const ref=$('puRef').value.trim()||('PU-'+id.slice(0,8).toUpperCase());
  const payload={id,business_id,quote_number:ref,status:$('puStatus').value,customer_name:$('puName').value.trim(),customer_email:$('puEmail').value.trim()||null,customer_phone:$('puPhone').value.trim()||null,site_address:$('puAddress').value.trim()||null,notes:$('puNotes').value.trim(),valid_until:$('puValid').value||null,gst_included:true};
  const {data:savedId,error:saveError}=await supabaseClient.rpc('powerup_save_quote',{p_quote:payload,p_lines:state.lines.map(l=>({description:l.description.trim(),quantity:Number(l.quantity),unit_price:Number(l.unit_price)}))});
  if(saveError)throw saveError;
  const {data:savedQuote,error:refError}=await supabaseClient.from('powerup_quotes').select('quote_number').eq('id',savedId).single();if(refError)throw refError;
  currentQuoteId=savedId;$('puRef').value=savedQuote.quote_number;lastSavedSnapshot=JSON.stringify({name:$('puName').value.trim(),email:$('puEmail').value.trim(),phone:$('puPhone').value.trim(),address:$('puAddress').value.trim(),ref:savedQuote.quote_number,valid:$('puValid').value,notes:$('puNotes').value.trim(),status:$('puStatus').value,lines:state.lines.map(l=>({...l}))});$('puRef').readOnly=true;$('puConvert').disabled=$('puStatus').value!=='accepted'||!!currentQuoteJobId;
  $('puMessage').textContent='Quote '+savedQuote.quote_number+' saved successfully.';$('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=true;await refreshQuotes();
 return true;}catch(e){$('puMessage').textContent='Save failed: '+e.message;return false;}finally{button.disabled=false;}
};
$('puConvert').onclick=async()=>{if($('puStatus').value!=='accepted'||currentQuoteJobId)return;if(!confirm('Save this accepted quote and create a Schedule+ job?'))return;const btn=$('puConvert');btn.disabled=true;try{if(!currentQuoteId||!lastSavedSnapshot||currentSnapshot()!==lastSavedSnapshot){const saved=await $('puSave').onclick();if(!saved)throw Error('Quote could not be saved. Correct the highlighted fields and try again.');}if(!currentQuoteId)throw Error('Save the quotation before converting.');const {data,error}=await supabaseClient.rpc('powerup_convert_quote_to_job',{p_quote_id:currentQuoteId});if(error)throw error;currentQuoteJobId=data;btn.disabled=true;$('puMessage').textContent='Job created successfully. Open Jobs to schedule it.';}catch(e){$('puMessage').textContent='Conversion stopped: '+e.message;btn.disabled=!!currentQuoteJobId;} };
$('puStatus').onchange=()=>{$('puConvert').disabled=$('puStatus').value!=='accepted'||!!currentQuoteJobId;};

function currentSnapshot(){return JSON.stringify({name:$('puName').value.trim(),email:$('puEmail').value.trim(),phone:$('puPhone').value.trim(),address:$('puAddress').value.trim(),ref:$('puRef').value.trim(),valid:$('puValid').value,notes:$('puNotes').value.trim(),status:$('puStatus').value,lines:state.lines.map(l=>({...l}))});}
$('puSendEmail').onclick=async()=>{
 const btn=$('puSendEmail');
 try{
  const {role}=await getBusiness();
  if(!['owner','admin'].includes(role))throw new Error('Only a Power Up administrator can email quotations.');
  if(!currentQuoteId)throw new Error('Save the quote before emailing it.');
  if(!lastSavedSnapshot||currentSnapshot()!==lastSavedSnapshot)throw new Error('You have unsaved changes. Save the quote before sending.');
  const email=$('puEmail').value.trim();
  if(!email||!$('puEmail').checkValidity())throw new Error('Enter a valid customer email and save the quote.');
  if(!confirm('Send quotation '+$('puRef').value+' as a PDF to '+email+' from sales@powerup.sydney?'))return;
  btn.disabled=true;$('puMessage').textContent='Submitting quotation to Microsoft 365…';
  const {data,error}=await supabaseClient.functions.invoke('powerup-send-quote',{body:{quote_id:currentQuoteId}});
  if(error){let message=error.message;if(error.context?.json){try{const detail=await error.context.json();message=detail.error||message;}catch{}}throw new Error(message);}
  if(!data?.ok)throw new Error(data?.error||'Microsoft did not confirm the send.');
  $('puStatus').value='sent';
  lastSavedSnapshot=currentSnapshot();
  $('puMessage').textContent='Quotation emailed successfully.';$('puMessage').classList.add('pu-success');setTimeout(()=>{$('puMessage').classList.remove('pu-success');if($('puMessage').textContent==='Quotation emailed successfully.')$('puMessage').textContent='';},5000);
  await refreshQuotes();
 }catch(e){$('puMessage').textContent='Email not sent: '+e.message;}
 finally{btn.disabled=false;}
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

document.getElementById("puQuotesNav")?.addEventListener("click",()=>{refreshQuotes();refreshCatalogue();});
document.addEventListener("powerup:quotes-open",()=>{switchQuoteTab('list');refreshQuotes();refreshCatalogue();});
refreshQuotes();
refreshCatalogue();

renderLines();
})();
