(() => {
  let selectedJobId = null;

  function ensureDialog() {
    let dialog = document.getElementById('phoneActionDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'phoneActionDialog';
    dialog.className = 'phone-action-dialog';
    dialog.innerHTML = `<div class="phone-action-card"><div class="phone-action-head"><div><p class="eyebrow">CUSTOMER PHONE</p><h2 id="phoneActionTitle">Contact customer</h2></div><button id="phoneActionClose" class="ghost" type="button" aria-label="Close">✕</button></div><p id="phoneActionMessage" class="muted hidden"></p><div class="phone-action-buttons"><button id="phoneActionCall" class="primary" type="button">Call customer</button><button id="phoneActionOpenJob" class="secondary phone-action-secondary" type="button">Open job card</button></div></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#phoneActionClose').onclick = () => dialog.close();
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.querySelector('#phoneActionCall').onclick = async () => {
      const job = Array.isArray(jobs) ? jobs.find(j => String(j.id) === String(selectedJobId)) : null;
      if (!job?.customer_phone) return;
      const phone = String(job.customer_phone).replace(/\s+/g, '');
      try { await navigator.clipboard?.writeText?.(phone); } catch (_) {}
      dialog.close();
      window.location.href = `tel:${phone}`;
    };
    dialog.querySelector('#phoneActionOpenJob').onclick = () => {
      const job = Array.isArray(jobs) ? jobs.find(j => String(j.id) === String(selectedJobId)) : null;
      dialog.close();
      if (job && typeof openJob === 'function') openJob(job);
    };
    return dialog;
  }

  function openPhoneActions(jobId) {
    const job = Array.isArray(jobs) ? jobs.find(j => String(j.id) === String(jobId)) : null;
    if (!job) return;
    selectedJobId = job.id;
    const dialog = ensureDialog();
    const title = dialog.querySelector('#phoneActionTitle');
    const message = dialog.querySelector('#phoneActionMessage');
    const call = dialog.querySelector('#phoneActionCall');
    const openJobBtn = dialog.querySelector('#phoneActionOpenJob');

    if (job.customer_phone) {
      title.textContent = `Contact ${job.customer_name || 'this customer'}`;
      message.textContent = '';
      message.classList.add('hidden');
      call.classList.remove('hidden');
      call.textContent = `Call ${job.customer_phone}`;
      openJobBtn.textContent = 'Open job card';
    } else {
      title.textContent = 'No phone number assigned';
      message.textContent = `${job.customer_name || 'This customer'} does not have a phone number assigned.`;
      message.classList.remove('hidden');
      call.classList.add('hidden');
      openJobBtn.textContent = 'Add phone number';
    }

    if (!dialog.open) dialog.showModal();
  }

  function phoneTarget(e){
    const target=e.target.closest('.compact-phone, .job-phone, .sp-phone');
    if(!target||target.disabled)return null;
    const holder=target.closest('.swipe-row, .sp-home-job');
    if(!holder?.dataset.id)return null;
    return {target,holder};
  }

  document.addEventListener('pointerdown', e => {
    const hit=phoneTarget(e); if(!hit)return;
    e.stopImmediatePropagation();
  }, true);

  document.addEventListener('click', e => {
    const hit=phoneTarget(e); if(!hit)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openPhoneActions(hit.holder.dataset.id);
  }, true);
})();