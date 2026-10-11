/* Power Up-only quote editor. No customer data persisted until secure RLS is deployed. */
(() => {
const $ = id => document.getElementById(id);
const safe = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
const state = {lines:[{description:'Solar system supply and installation',quantity:1,unit_price:0}],quote:null};
const root = $('puQuotesView');if(!root)return;
const lineRow = (l,i) => `<div class="pu-line"><input data-line="${i}" data-field="description" aria-label="Item description" value="${safe(l.description)}" placeholder="Product or service"><input data-line="${i}" data-field="quantity" type="number" min="0.001" step="any" aria-label="Quantity" value="${l.quantity}"><input data-line="${i}" data-field="unit_price" type="number" min="0" step="0.01" aria-label="Unit price" value="${l.unit_price}"><button type="button" data-remove="${i}" aria-label="Remove item">×</button></div>`;
root.innerHTML = `<section class="hero-row"><div><p class="eyebrow">POWER UP SOLAR</p><h1>Quotes</h1></div><button type="button" id="puBack">← Jobs</button></section>
<div class="pu-panel"><strong>New quote</strong><p class="pu-note">First-stage editor: create and print a proposal. Secure cloud saving and Outlook sending are not enabled yet.</p>
<div class="pu-grid"><label>Customer name<input id="puName" autocomplete="name"></label><label>Email<input id="puEmail" type="email" autocomplete="email"></label><label>Phone<input id="puPhone" type="tel"></label><label>Site address<input id="puAddress"></label><label>Quote reference<input id="puRef" placeholder="e.g. PU-1001"></label><label>Valid until<input id="puValid" type="date"></label></div>
<label>Notes / inclusions<textarea id="puNotes" rows="3"></textarea></label></div>
<div class="pu-panel"><h3>Quote items</h3><div id="puLines"></div><div class="pu-actions"><button type="button" id="puAdd">+ Add item</button><select id="puPreset" aria-label="Quick item"><option value="">Select a quick item…</option><option>Solar panels</option><option>Hybrid inverter</option><option>Battery storage</option><option>Installation labour</option><option>Switchboard upgrade</option></select></div><p class="pu-note">Enter GST-inclusive unit prices. Product catalogue and controlled pricing will be connected later.</p><div class="pu-total" id="puTotal"></div></div>
<div class="pu-actions"><button type="button" id="puPreviewBtn" class="primary">Preview quote</button><button type="button" id="puPrint" disabled>Print / Save PDF</button><button type="button" disabled title="Requires secure database setup">Save to cloud (coming soon)</button><button type="button" disabled title="Requires Microsoft 365 integration">Send email (coming soon)</button></div><p id="puMessage" class="pu-status" role="status"></p><div id="puQuotePreview" class="pu-preview hidden"></div>`;
const renderLines = () => {$('puLines').innerHTML=state.lines.map(lineRow).join('');const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total incl. GST: '+money(total);};
$('puLines').addEventListener('input',e=>{const i=Number(e.target.dataset.line),field=e.target.dataset.field;if(!field)return;state.lines[i][field]=field==='description'?e.target.value:Number(e.target.value);const total=state.lines.reduce((a,l)=>a+Number(l.quantity||0)*Number(l.unit_price||0),0);$('puTotal').textContent='Total incl. GST: '+money(total);$('puPrint').disabled=true;$('puQuotePreview').classList.add('hidden');});
$('puLines').addEventListener('click',e=>{if(e.target.dataset.remove===undefined)return;state.lines.splice(Number(e.target.dataset.remove),1);renderLines();});
$('puAdd').onclick=()=>{state.lines.push({description:'',quantity:1,unit_price:0});renderLines();};
$('puPreset').onchange=e=>{if(e.target.value)state.lines.push({description:e.target.value,quantity:1,unit_price:0});e.target.value='';renderLines();};
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
renderLines();
})();
