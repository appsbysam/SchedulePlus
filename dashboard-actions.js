(() => {
  let selectedJobId = null;

  function ensureDialog() {
    let dialog = document.getElementById('phoneActionDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'phoneActionDialog';
    dialog.className = 'phone-action-dialog';
    dialog.innerHTML = `<div class="phone-action-card"><div class="phone-action-head"><div><p class="eyebrow">CUSTOMER PHONE</p><h2 id="phoneActionTitle">Contact customer</h2></div><button id="phoneActionClose" class="ghost" type="button" aria-label="Close">✕</button></div><div class="phone-action-buttons"><button id="phoneActionCall" class="primary" type="button">Call customer</button><button id="phoneActionOpenJob" class="secondary phone-action-secondary" type="button">Open job card</button></div></div>`;
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
    if (!job?.customer_phone) return;
    selectedJobId = job.id;
    const dialog = ensureDialog();
    dialog.querySelector('#phoneActionTitle').textContent = `Contact ${job.customer_name || 'this customer'}`;
    dialog.querySelector('#phoneActionCall').textContent = `Call ${job.customer_phone}`;
    if (!dialog.open) dialog.showModal();
  }

  function phoneTarget(e){
    const target=e.target.closest('.compact-phone, .job-phone');
    if(!target||target.classList.contains('missing')||target.disabled)return null;
    const row=target.closest('.swipe-row');
    if(!row?.dataset.id)return null;
    return {target,row};
  }

  // Stop the card/swipe gesture on pointer-down, but do not open the dialog until
  // the completed click. Opening a modal during pointer-down can make the matching
  // pointer-up/click land on the new backdrop and immediately close it on mobile.
  document.addEventListener('pointerdown', e => {
    const hit=phoneTarget(e); if(!hit)return;
    e.stopImmediatePropagation();
  }, true);

  document.addEventListener('click', e => {
    const hit=phoneTarget(e); if(!hit)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openPhoneActions(hit.row.dataset.id);
  }, true);
})();