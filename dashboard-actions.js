(() => {
  let selectedJobId = null;

  function ensureDialog() {
    let dialog = document.getElementById('phoneActionDialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'phoneActionDialog';
    dialog.className = 'phone-action-dialog';
    dialog.innerHTML = `
      <div class="phone-action-card">
        <div class="phone-action-head">
          <div>
            <p class="eyebrow">CUSTOMER PHONE</p>
            <h2 id="phoneActionTitle">Contact customer</h2>
          </div>
          <button id="phoneActionClose" class="ghost" type="button" aria-label="Close">✕</button>
        </div>
        <p id="phoneActionNumber" class="phone-action-number"></p>
        <div class="phone-action-buttons">
          <button id="phoneActionCall" class="primary" type="button">Call customer</button>
          <button id="phoneActionOpenJob" class="secondary phone-action-secondary" type="button">Open job card</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('#phoneActionClose').onclick = () => dialog.close();
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

    dialog.querySelector('#phoneActionCall').onclick = () => {
      const job = Array.isArray(jobs) ? jobs.find(j => String(j.id) === String(selectedJobId)) : null;
      if (!job?.customer_phone) return;
      const phone = String(job.customer_phone).replace(/\s+/g, '');
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
    const name = job.customer_name || 'this customer';
    dialog.querySelector('#phoneActionTitle').textContent = `Contact ${name}`;
    dialog.querySelector('#phoneActionNumber').textContent = job.customer_phone;
    dialog.showModal();
  }

  document.addEventListener('click', e => {
    const phone = e.target.closest('.compact-phone');
    if (!phone || phone.classList.contains('missing')) return;
    const row = phone.closest('.swipe-row');
    if (!row?.dataset.id) return;
    e.preventDefault();
    e.stopPropagation();
    openPhoneActions(row.dataset.id);
  }, true);
})();
