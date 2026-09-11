(() => {
  function $(id){return document.getElementById(id)}
  function value(id){return String($(id)?.value ?? '').trim()}
  function displayNumber(v,suffix=''){const n=String(v??'').trim();return n?`${n}${suffix}`:''}
  function businessName(){return window.SchedulePlusBusiness?.business?.business_name || 'Schedule+'}
  function systemDetails(){
    const parts=[];
    const jobType=value('jobTitle');
    const description=value('description');
    const panelBrand=value('panelBrand'),panelType=value('panelType'),panelQty=value('panelQuantity'),solar=value('solarCapacity');
    const batteryBrand=value('batteryBrand'),batteryType=value('batteryType'),battery=value('batteryCapacity');
    const inverterBrand=value('inverterBrand'),inverterType=value('inverterType'),inverter=value('inverterCapacity');
    const phase=value('phaseType'),work=value('workInvolved');
    if(jobType)parts.push(jobType);
    if(description)parts.push(description);
    const panel=[panelQty?`${panelQty} panels`:'',panelBrand,panelType].filter(Boolean).join(' · ');
    if(panel)parts.push(panel);
    if(solar)parts.push(`${displayNumber(solar)} kW solar`);
    const batt=[batteryBrand,batteryType,battery?`${displayNumber(battery)} kWh`:'' ].filter(Boolean).join(' · ');
    if(batt)parts.push(`Battery: ${batt}`);
    const inv=[inverterBrand,inverterType,inverter?`${displayNumber(inverter)} kW`:'' ].filter(Boolean).join(' · ');
    if(inv)parts.push(`Inverter: ${inv}`);
    if(phase)parts.push(phase);
    if(work)parts.push(work);
    return parts.join('; ') || 'Not specified';
  }
  function buildMessage(){
    return `Can you please check your details are correct and provide your NMI (from your electricity bill) and an email address for the installer.\n\nCustomer name: ${value('customerName')}\nAddress: ${value('addressLine')}\nNMI:\nEmail:\nContact no: ${value('customerPhone')}\nSystem details: ${systemDetails()}\n\nThank You\n${businessName()}`;
  }
  function normalisePhone(raw){
    let digits=String(raw||'').replace(/[^\d+]/g,'');
    if(digits.startsWith('+'))digits=digits.slice(1);
    if(digits.startsWith('0061'))digits=digits.slice(2);
    if(digits.startsWith('0'))digits=`61${digits.slice(1)}`;
    return digits;
  }
  async function copyText(text){
    try{await navigator.clipboard.writeText(text);return true}catch(_){
      const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(__){}t.remove();return ok;
    }
  }
  function ensureUi(){
    const phone=$('customerPhone');if(!phone||$('messageCustomerBtn'))return;
    const label=phone.closest('label');if(!label)return;
    const wrap=document.createElement('div');wrap.className='job-phone-message-wrap';
    label.parentNode.insertBefore(wrap,label);wrap.appendChild(label);
    const btn=document.createElement('button');btn.id='messageCustomerBtn';btn.className='secondary message-customer-btn';btn.type='button';btn.textContent='Message customer';btn.onclick=openPreview;wrap.appendChild(btn);

    const dialog=document.createElement('dialog');dialog.id='customerMessageDialog';dialog.className='customer-message-dialog';dialog.innerHTML=`<div class="customer-message-card"><div class="dialog-head"><div><p class="eyebrow">CUSTOMER MESSAGE</p><h2>Preview message</h2></div><button id="customerMessageClose" class="ghost" type="button" aria-label="Close">✕</button></div><p class="customer-message-help">Check or edit the message before opening SMS or WhatsApp.</p><textarea id="customerMessageText" rows="15" spellcheck="true"></textarea><p id="customerMessageStatus" class="customer-message-status"></p><div class="customer-message-actions"><button id="customerMessageCancel" class="secondary" type="button">Cancel</button><button id="customerMessageCopy" class="secondary" type="button">Copy</button><button id="customerMessageSms" class="primary" type="button">SMS</button><button id="customerMessageWhatsApp" class="whatsapp-btn" type="button">WhatsApp</button></div></div>`;
    document.body.appendChild(dialog);
    $('customerMessageClose').onclick=()=>dialog.close();$('customerMessageCancel').onclick=()=>dialog.close();
    $('customerMessageCopy').onclick=async()=>{const ok=await copyText($('customerMessageText').value);const s=$('customerMessageStatus');s.textContent=ok?'Copied to clipboard.':'Could not copy automatically.';s.classList.toggle('ok',ok)};
    $('customerMessageSms').onclick=()=>sendSms();$('customerMessageWhatsApp').onclick=()=>sendWhatsApp();
  }
  function openPreview(){
    const phone=value('customerPhone');
    if(!phone){alert('Add the customer phone number first.');$('customerPhone')?.focus();return}
    const d=$('customerMessageDialog');$('customerMessageText').value=buildMessage();$('customerMessageStatus').textContent='';d.showModal();requestAnimationFrame(()=>{$('customerMessageText')?.focus();$('customerMessageText')?.setSelectionRange(0,0)})
  }
  function sendSms(){
    const raw=value('customerPhone'),text=$('customerMessageText').value;if(!raw)return;
    copyText(text).catch(()=>{});
    const phone=raw.replace(/[^\d+]/g,'');
    window.location.href=`sms:${phone}?body=${encodeURIComponent(text)}`;
  }
  function sendWhatsApp(){
    const phone=normalisePhone(value('customerPhone')),text=$('customerMessageText').value;
    if(!phone){alert('Add a valid customer phone number first.');return}
    copyText(text).catch(()=>{});
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank','noopener');
  }
  function init(){ensureUi()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();