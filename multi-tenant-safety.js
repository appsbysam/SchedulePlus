(() => {
  const ACTIVE_BUSINESS_KEY = 'schedule_plus_active_business';

  async function getActiveBusinessId() {
    const direct = window.SchedulePlusBusiness?.business?.id;
    if (direct) return direct;
    if (typeof currentUser === 'undefined' || !currentUser?.id) return null;
    const {data, error} = await supabaseClient.from('business_users').select('business_id,is_active').eq('user_id', currentUser.id).eq('is_active', true);
    if (error) throw error;
    const memberships = data || [];
    if (!memberships.length) return null;
    let id = localStorage.getItem(ACTIVE_BUSINESS_KEY);
    if (!memberships.some(m => m.business_id === id)) id = memberships[0].business_id;
    localStorage.setItem(ACTIVE_BUSINESS_KEY, id);
    return id;
  }

  async function safeLoadJobs() {
    const businessId = await getActiveBusinessId();
    if (!businessId) { jobs = []; if (typeof render === 'function') render(); if (typeof renderCalendar === 'function') renderCalendar(); return; }
    const {data,error} = await supabaseClient.from('jobs').select('*').eq('business_id', businessId).order('scheduled_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
    if (error) { if (typeof jobsList !== 'undefined' && jobsList) jobsList.innerHTML = `<div class="empty">${typeof esc === 'function' ? esc(error.message) : error.message}</div>`; return; }
    jobs = data || [];
    if (typeof render === 'function') render();
    if (typeof renderCalendar === 'function') renderCalendar();
  }

  async function safeDeleteJob(id, ask = true) {
    const businessId = await getActiveBusinessId();
    if (!businessId) return;
    const job = (typeof jobs !== 'undefined' ? jobs : []).find(j => j.id === id);
    if (ask && (!job || !confirm(`Delete ${job.customer_name || 'this job'}?`))) return;
    const {error} = await supabaseClient.from('jobs').delete().eq('id', id).eq('business_id', businessId);
    if (error) { alert(error.message); return; }
    if (typeof dialog !== 'undefined' && dialog?.open) dialog.close();
    await safeLoadJobs();
  }

  function field(id) { return document.getElementById(id); }
  function numberOrNull(v) { const s = String(v ?? '').trim(); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
  function addressParts(value) { return typeof extractAddressParts === 'function' ? extractAddressParts(value) : {suburb:null,postcode:null}; }
  function selectedTimeOfDay(){ return document.querySelector('input[name="timeOfDayChoice"]:checked')?.value || null; }
  function feature(key){ return window.SchedulePlusFeatures?.isEnabled?.(key) !== false; }
  function keep(existing,prop,fallback=null){ return existing ? (existing[prop] ?? fallback) : fallback; }

  async function saveJob(e) {
    if (e.defaultPrevented) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    try {
      const businessId = await getActiveBusinessId();
      if (!businessId) { alert('Create or join a business before saving jobs.'); return; }
      if (typeof currentUser === 'undefined' || !currentUser?.id) { alert('Please sign in again.'); return; }

      const id = field('jobId')?.value || '';
      const existing = id && typeof jobs !== 'undefined' ? jobs.find(j => j.id === id) : null;
      const jobDetailsOn=feature('job_details'), customerOn=feature('customer_details'), schedulingOn=feature('scheduling'), solarOn=feature('solar'), batteryOn=feature('battery'), inverterOn=feature('inverter'), electricalOn=feature('electrical'), workflowOn=feature('workflow');
      const selectedTitle=field('jobTitle')?.value?.trim() || '';
      if(jobDetailsOn && !selectedTitle){ alert('Choose a Job type before saving.'); field('jobTitle')?.focus(); return; }

      const addressInput = field('addressLine');
      const address = customerOn ? (addressInput?.value.trim() || '') : (keep(existing,'address_line','') || '');
      const parsed = addressParts(address);
      const selectedLat = numberOrNull(addressInput?.dataset.mapsLatitude);
      const selectedLng = numberOrNull(addressInput?.dataset.mapsLongitude);
      const addressUnchanged = !!existing && (existing.address_line || '') === address;
      const latitude = customerOn ? (selectedLat ?? (addressUnchanged ? existing?.latitude ?? null : null)) : keep(existing,'latitude');
      const longitude = customerOn ? (selectedLng ?? (addressUnchanged ? existing?.longitude ?? null : null)) : keep(existing,'longitude');
      const suburb = customerOn ? (addressInput?.dataset.mapsSuburb || parsed.suburb) : keep(existing,'suburb');
      const postcode = customerOn ? (addressInput?.dataset.mapsPostcode || parsed.postcode) : keep(existing,'postcode');

      const payload = {
        title: jobDetailsOn ? selectedTitle : (keep(existing,'title','Job') || 'Job'),
        customer_name: customerOn ? (field('customerName')?.value.trim() || null) : keep(existing,'customer_name'),
        customer_phone: customerOn ? (field('customerPhone')?.value.trim() || null) : keep(existing,'customer_phone'),
        customer_email: customerOn ? (field('customerEmail')?.value.trim() || null) : keep(existing,'customer_email'),
        nmi: customerOn ? (field('jobNmi')?.value.trim() || null) : keep(existing,'nmi'),
        address_line: address || null,
        suburb: suburb || null,
        postcode: postcode || null,
        latitude,
        longitude,
        description: jobDetailsOn ? (field('description')?.value.trim() || null) : keep(existing,'description'),
        notes: keep(existing,'notes'),
        panel_brand: solarOn ? (field('panelBrand')?.value.trim() || null) : keep(existing,'panel_brand'),
        panel_type: solarOn ? (field('panelType')?.value.trim() || null) : keep(existing,'panel_type'),
        panel_quantity: solarOn ? numberOrNull(field('panelQuantity')?.value) : keep(existing,'panel_quantity'),
        solar_capacity_kw: solarOn ? numberOrNull(field('solarCapacity')?.value) : keep(existing,'solar_capacity_kw'),
        battery_brand: batteryOn ? (field('batteryBrand')?.value.trim() || null) : keep(existing,'battery_brand'),
        battery_type: batteryOn ? (field('batteryType')?.value.trim() || null) : keep(existing,'battery_type'),
        battery_capacity_kwh: batteryOn ? numberOrNull(field('batteryCapacity')?.value) : keep(existing,'battery_capacity_kwh'),
        phase_type: electricalOn ? (field('phaseType')?.value || null) : keep(existing,'phase_type'),
        inverter_brand: inverterOn ? (field('inverterBrand')?.value.trim() || null) : keep(existing,'inverter_brand'),
        inverter_type: inverterOn ? (field('inverterType')?.value.trim() || null) : keep(existing,'inverter_type'),
        inverter_capacity_kw: inverterOn ? numberOrNull(field('inverterCapacity')?.value) : keep(existing,'inverter_capacity_kw'),
        work_involved: jobDetailsOn ? (field('workInvolved')?.value.trim() || null) : keep(existing,'work_involved'),
        status: workflowOn ? (field('status')?.value || 'new') : (keep(existing,'status','new') || 'new'),
        priority: workflowOn ? (field('priority')?.value || 'normal') : (keep(existing,'priority','normal') || 'normal'),
        scheduled_date: schedulingOn ? (field('scheduledDate')?.value || null) : keep(existing,'scheduled_date'),
        scheduled_start: schedulingOn ? (field('scheduledStart')?.value || null) : keep(existing,'scheduled_start'),
        time_of_day: schedulingOn ? selectedTimeOfDay() : keep(existing,'time_of_day'),
        estimated_minutes: schedulingOn ? numberOrNull(field('estimatedHours')?.value) * 60 || null : keep(existing,'estimated_minutes'),
        completed_at: workflowOn ? ((field('status')?.value === 'completed') ? (existing?.completed_at || new Date().toISOString()) : null) : keep(existing,'completed_at')
      };

      let query;
      if (id) query = supabaseClient.from('jobs').update(payload).eq('id', id).eq('business_id', businessId);
      else query = supabaseClient.from('jobs').insert({...payload, business_id:businessId, user_id:currentUser.id});
      const {error} = await query;
      if (error) { alert(error.message); return; }
      if (typeof dialog !== 'undefined' && dialog) dialog.close();
      await safeLoadJobs();
    } catch (err) {
      console.error('Schedule+ job save failed', err);
      alert(err?.message || 'Could not save job.');
    }
  }

  function install() {
    if (window.__schedulePlusTenantSafetyInstalled) return;
    window.__schedulePlusTenantSafetyInstalled = true;
    if (typeof loadJobs === 'function') loadJobs = safeLoadJobs;
    if (typeof deleteJobFromDashboard === 'function') deleteJobFromDashboard = async function(id) { await safeDeleteJob(id, true); };
    const form = field('jobForm'); if (form) { form.noValidate=true; form.addEventListener('submit', saveJob, true); }
    const deleteBtn = field('deleteJobBtn');
    if (deleteBtn) deleteBtn.onclick = async () => { const id = field('jobId')?.value; if (!id || !confirm('Delete this job?')) return; await safeDeleteJob(id, false); };
    if (typeof currentUser !== 'undefined' && currentUser?.id) safeLoadJobs().catch(console.error);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();