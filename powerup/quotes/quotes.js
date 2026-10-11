/* Power Up-only quote editor. Cloud saving requires authenticated business membership. */
(() => {
const $ = id => document.getElementById(id);
const safe = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
const state = {lines:[{description:'Solar system supply and installation',quantity:1,unit_price:0}],quote:null};
const root = $('puQuotesView');if(!root)return;
const lineRow = (l,i) => `<div class="pu-line"><input data-line="${i}" data-field="description" aria-label="Item description" value="${safe(l.description)}" placeholder="Product or service"><input data-line="${i}" data-field="quantity" type="number" min="0.001" step="any" aria-label="Quantity" value="${l.quantity}"><input data-line="${i}" data-field="unit_price" type="number" min="0" step="0.01" aria-label="Unit price" value="${l.unit_price}"><button type="button" data-remove="${i}" aria-label="Remove item">×</button></div>`;
root.innerHTML = `<section class="hero-row"><div><p class="eyebrow">POWER UP SOLAR</p><h1>Quotes</h1></div><button type="button" id="puBack">← Jobs</button></section>
<div class="pu-panel"><strong>Quote editor</strong><div class="pu-actions"><button type="button" id="puNew">+ New quote</button><label>Quote status<select id="puStatus"><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></label></div><div id="puSavedQuotes" class="pu-note">Loading saved quotes…</div><div class="pu-actions"><label>Search saved quotes<input id="puQuoteSearch" type="search" placeholder="Customer or quote number"></label><label>Status filter<select id="puQuoteFilter"><option value="">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="expired">Expired</option></select></label></div><p class="pu-note">First-stage editor: create and print a proposal. Saved drafts are available to authorised Power Up users. Outlook sending is not enabled yet.</p>
<div class="pu-grid"><label>Customer name<input id="puName" autocomplete="name"></label><label>Email<input id="puEmail" type="email" autocomplete="email"></label><label>Phone<input id="puPhone" type="tel"></label><label>Site address<input id="puAddress"></label><label>Quote reference<input id="puRef" placeholder="e.g. PU-1001"></label><label>Valid until<input id="puValid" type="date"></label></div>
<label>Notes / inclusions<textarea id="puNotes" rows="3"></textarea></label></div>
<div class="pu-panel" id="puCataloguePanel" hidden><h3>Product catalogue · Admin</h3><div class="pu-grid"><label>Item name<input id="puCatalogName" placeholder="e.g. 10 kWh battery"></label><label>GST-inclusive price<input id="puCatalogPrice" type="number" min="0" step="0.01"></label></div><div class="pu-actions"><button id="puCatalogSave" type="button">Add catalogue item</button></div><div id="puCatalogList"></div></div><div class="pu-panel"><h3>Quote items</h3><div id="puLines"></div><div class="pu-actions"><button type="button" id="puAdd">+ Add item</button><select id="puPreset" aria-label="Quick item"><option value="">Select a quick item…</option><option>Solar panels</option><option>Hybrid inverter</option><option>Battery storage</option><option>Installation labour</option><option>Switchboard upgrade</option></select></div><p class="pu-note">Enter GST-inclusive unit prices. Product catalogue and controlled pricing will be connected later.</p><div class="pu-total" id="puTotal"></div></div>
<div class="pu-actions"><button type="button" id="puPreviewBtn" class="primary">Preview quote</button><button type="button" id="puPrint" disabled>Print / Save PDF</button><button type="button" id="puSave">Save quote</button><button type="button" id="puConvert" disabled>Convert accepted quote to job</button><button type="button" disabled title="Requires Microsoft 365 integration">Send email (coming soon)</button></div><p id="puMessage" class="pu-status" role="status"></p><div id="puQuotePreview" class="pu-preview hidden"></div>`;
const renderLines = () => {$('puLines').innerHTML=state.lines.map(lineRow).join('');const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total incl. GST: '+money(total);};
$('puLines').addEventListener('input',e=>{const i=Number(e.target.dataset.line),field=e.target.dataset.field;if(!field)return;state.lines[i][field]=field==='description'?e.target.value:Number(e.target.value);const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total incl. GST: '+money(total);$('puPrint').disabled=true;$('puQuotePreview').classList.add('hidden');});
$('puLines').addEventListener('click',e=>{if(e.target.dataset.remove===undefined)return;state.lines.splice(Number(e.target.dataset.remove),1);renderLines();});
$('puAdd').onclick=()=>{state.lines.push({description:'',quantity:1,unit_price:0});renderLines();};
$('puPreset').onchange=e=>{if(e.target.value){const item=catalogue.find(x=>x.id===e.target.value);state.lines.push({description:item?item.name:e.target.value,quantity:1,unit_price:item?Number(item.unit_price):0});}e.target.value='';renderLines();};
$('puBack').onclick=()=>{$('puQuotesView').classList.add('hidden');$('dashboardView').classList.remove('hidden');};
$('puPreviewBtn').onclick=()=>{
const name=$('puName').value.trim(),email=$('puEmail').value.trim();
if(!name){$('puMessage').textContent='Enter a customer name first.';return;}
if(email&&!$('puEmail').checkValidity()){$('puMessage').textContent='Check the customer email address.';return;}
if(!state.lines.length||state.lines.some(l=>!l.description.trim()||!Number.isFinite(Number(l.quantity))||Number(l.quantity)<=0||!Number.isFinite(Number(l.unit_price))||Number(l.unit_price)<0)){$('puMessage').textContent='Check item descriptions, quantities and prices.';return;}
const total=state.lines.reduce((a,l)=>a+Number(l.quantity)*Number(l.unit_price),0);
$('puQuotePreview').innerHTML=`<h1>POWER UP SOLAR</h1><p>Quotation ${safe($('puRef').value||'Draft')} · ${safe(new Date().toLocaleDateString('en-AU'))}</p><hr><p><strong>Prepared for:</strong> ${safe(name)}<br>${safe(email)}<br>${safe($('puPhone').value)}<br>${safe($('puAddress').value)}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${state.lines.map(l=>`<tr><td>${safe(l.description)}</td><td>${safe(l.quantity)}</td><td>${money(l.unit_price)}</td><td>${money(l.quantity*l.unit_price)}</td></tr>`).join('')}</tbody></table><h2 style="text-align:right">Total (incl. GST): ${money(total)}</h2><p>GST component: ${money(total/11)}</p><p><strong>Valid until:</strong> ${safe($('puValid').value||'To be confirmed')}</p><p style="white-space:pre-wrap">${safe($('puNotes').value)}</p><hr><p>Power Up Solar · sales@powerup.sydney · powerup.sydney</p>`;
$('puQuotePreview').classList.remove('hidden');$('puPrint').disabled=false;$('puMessage').textContent='Preview ready. Check all details before saving a PDF.';
};
$('puPrint').onclick=()=>window.print();

const PU_BUSINESS_SLUG='powerup-group';
let catalogue=[];
const basePresets=['Solar panels','Hybrid inverter','Battery storage','Installation labour','Switchboard upgrade'];
let currentQuoteId=null;let currentQuoteJobId=null;let allQuotes=[];
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
$('puNew').onclick=()=>{
 currentQuoteId=null;currentQuoteJobId=null;$('puConvert').disabled=true;state.lines=[{description:'',quantity:1,unit_price:0}];
 ['puName','puEmail','puPhone','puAddress','puRef','puValid','puNotes'].forEach(id=>$(id).value='');
 $('puStatus').value='draft';$('puQuotePreview').classList.add('hidden');$('puPrint').disabled=true;
 renderLines();$('puMessage').textContent='New quote ready.';
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
  currentQuoteId=q.id;currentQuoteJobId=q.job_id||null;$('puConvert').disabled=q.status!=='accepted'||!!q.job_id;
  $('puName').value=q.customer_name||'';$('puEmail').value=q.customer_email||'';$('puPhone').value=q.customer_phone||'';$('puAddress').value=q.site_address||'';$('puRef').value=q.quote_number||'';$('puValid').value=q.valid_until||'';$('puNotes').value=q.notes||'';$('puStatus').value=q.status||'draft';
  state.lines=(lines||[]).map(l=>({description:l.description,quantity:Number(l.quantity),unit_price:Number(l.unit_price)}));renderLines();
  $('puMessage').textContent='Loaded '+q.quote_number;
 }catch(e){$('puMessage').textContent='Unable to open quote: '+e.message;}
});
$('puSave').onclick=async()=>{
 const button=$('puSave');button.disabled=true;
 try{
  const {business_id}=await getBusiness();
  if(!$('puName').value.trim())throw new Error('Customer name is required.');
  if($('puEmail').value&&!$('puEmail').checkValidity())throw new Error('Enter a valid email.');
  if(!state.lines.length||state.lines.some(l=>!l.description.trim()||!(Number(l.quantity)>0)||!(Number(l.unit_price)>=0)))throw new Error('Check quote items and prices.');
  const id=currentQuoteId||crypto.randomUUID();
  const ref=$('puRef').value.trim()||('PU-'+id.slice(0,8).toUpperCase());
  const payload={id,business_id,quote_number:ref,status:$('puStatus').value,customer_name:$('puName').value.trim(),customer_email:$('puEmail').value.trim()||null,customer_phone:$('puPhone').value.trim()||null,site_address:$('puAddress').value.trim()||null,notes:$('puNotes').value.trim(),valid_until:$('puValid').value||null,gst_included:true};
  const {data:savedId,error:saveError}=await supabaseClient.rpc('powerup_save_quote',{p_quote:payload,p_lines:state.lines.map(l=>({description:l.description.trim(),quantity:Number(l.quantity),unit_price:Number(l.unit_price)}))});
  if(saveError)throw saveError;
  currentQuoteId=savedId;$('puRef').value=ref;$('puConvert').disabled=$('puStatus').value!=='accepted'||!!currentQuoteJobId;
  $('puMessage').textContent='Quote '+ref+' saved successfully.';await refreshQuotes();
 }catch(e){$('puMessage').textContent='Save failed: '+e.message;}finally{button.disabled=false;}
};
$('puConvert').onclick=async()=>{if(!currentQuoteId||$('puStatus').value!=='accepted')return;if(!confirm('Create a Schedule Plus job from this accepted quote?'))return;try{const {data,error}=await supabaseClient.rpc('powerup_convert_quote_to_job',{p_quote_id:currentQuoteId});if(error)throw error;currentQuoteJobId=data;$('puConvert').disabled=true;$('puMessage').textContent='Job created. Open Jobs to schedule it.';}catch(e){$('puMessage').textContent='Job conversion failed: '+e.message;}};
$('puStatus').onchange=()=>{$('puConvert').disabled=!currentQuoteId||$('puStatus').value!=='accepted'||!!currentQuoteJobId;};
document.getElementById("puQuotesNav")?.addEventListener("click",()=>{refreshQuotes();refreshCatalogue();});
refreshQuotes();
refreshCatalogue();

renderLines();
})();
