const $ = s => document.querySelector(s);
let jobs = [], currentUser = null, quickFilter = 'all', typeFilter = 'all', pinUnlocked = false, canDeleteJobs = false;
let calendarCursor = new Date();
calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1, 12);

const AUTH_REDIRECT_URL = 'https://appsbysam.github.io/SchedulePlus/';
const APP_SW_VERSION = '0.6.1';

const authView = $('#authView');
const pinView = $('#pinView');
const appView = $('#appView');
const jobsList = $('#jobsList');
const dialog = $('#jobDialog');
const pinDialog = $('#pinDialog');
const dayJobsDialog = $('#dayJobsDialog');

const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const labelStatus = s => window.SchedulePlusStatusLabels?.label(s) || ({new:'New',to_schedule:'To schedule',scheduled:'Scheduled',in_progress:'In progress',waiting:'Follow-Up',completed:'Completed'}[s] || s);
const pinKey = id => `schedule_plus_pin_${id}`;
const legacyPinKey = id => `powerup_pin_${id}`;
const getStoredPinHash = id => localStorage.getItem(pinKey(id)) || localStorage.getItem(legacyPinKey(id));

async function pinHash(pin, id) {
  const data = new TextEncoder().encode(`SchedulePlus:${id}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function legacyPinHash(pin, id) {
  const data = new TextEncoder().encode(`PowerUp:${id}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function localDate(d = new Date()) {
  const x = new Date(d), o = x.getTimezoneOffset();
  return new Date(x - o * 60000).toISOString().slice(0, 10);
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatLongDate(d) {
  return new Intl.DateTimeFormat('en-AU', {weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${d}T12:00:00`));
}
function extractAddressParts(address = '') {
  const a = address.trim();
  if (!a) return {suburb:null, postcode:null};
  const m = a.match(/(?:^|,\s*)([^,]+?)\s+(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\s+(\d{4})\s*$/i);
  if (m) return {suburb:m[1].trim(), postcode:m[3]};
  const parts = a.split(',').map(x => x.trim()).filter(Boolean);
  return {suburb:parts.length >= 2 ? parts[parts.length - 1] : null, postcode:(a.match(/\b\d{4}\b/) || [])[0] || null};
}
function suburbFromAddress(address = '') {
  return extractAddressParts(address).suburb || '';
}
function parseNumberOrNull(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function displayNumber(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '';
  return `${Number(value)}${suffix}`;
}

async function init() {
  const {data:{session}} = await supabaseClient.auth.getSession();
  await setSession(session, true);
  supabaseClient.auth.onAuthStateChange((_e, s) => setSession(s, false));
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register(`./sw.js?v=${APP_SW_VERSION}`, {updateViaCache:'none'});
      await reg.update();
    } catch (err) {
      console.warn(err);
    }
  }
}

async function setSession(session, initial = false) {
  currentUser = session?.user || null;
  if (!currentUser) {
    pinUnlocked = false;
    pinView.classList.add('hidden');
    appView.classList.add('hidden');
    authView.classList.remove('hidden');
    return;
  }
  const hasPin = !!getStoredPinHash(currentUser.id);
  if (initial && hasPin && !pinUnlocked) {
    authView.classList.add('hidden');
    appView.classList.add('hidden');
    pinView.classList.remove('hidden');
    return;
  }
  pinUnlocked = true;
  authView.classList.add('hidden');
  pinView.classList.add('hidden');
  appView.classList.remove('hidden');
  await loadJobs();
}

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('#authMessage').textContent = '';
  const {error} = await supabaseClient.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});
  if (error) $('#authMessage').textContent = error.message;
});

$('#signUpBtn').onclick = async () => {
  const email = $('#email').value.trim(), password = $('#password').value;
  if (!email || password.length < 6) {
    $('#authMessage').textContent = 'Enter an email and password (minimum 6 characters).';
    return;
  }
  const {error} = await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:AUTH_REDIRECT_URL}});
  $('#authMessage').textContent = error ? error.message : 'Account created. Check your email to confirm it.';
};

$('#resendBtn').onclick = async () => {
  const email = $('#email').value.trim();
  if (!email) {
    $('#authMessage').textContent = 'Enter your email address first.';
    return;
  }
  const {error} = await supabaseClient.auth.resend({type:'signup',email,options:{emailRedirectTo:AUTH_REDIRECT_URL}});
  $('#authMessage').textContent = error ? error.message : 'Confirmation email sent. Check your inbox and junk folder.';
};

$('#signOutBtn').onclick = async () => {
  pinUnlocked = false;
  await supabaseClient.auth.signOut();
};

$('#pinUnlockForm').onsubmit = async e => {
  e.preventDefault();
  const pin = $('#pinUnlock').value, stored = getStoredPinHash(currentUser.id);
  const modern = await pinHash(pin, currentUser.id);
  const legacy = await legacyPinHash(pin, currentUser.id);
  if (!stored || (modern !== stored && legacy !== stored)) {
    $('#pinMessage').textContent = 'Incorrect PIN.';
    $('#pinUnlock').value = '';
    return;
  }
  if (legacy === stored && !localStorage.getItem(pinKey(currentUser.id))) localStorage.setItem(pinKey(currentUser.id), modern);
  pinUnlocked = true;
  $('#pinMessage').textContent = '';
  $('#pinUnlock').value = '';
  pinView.classList.add('hidden');
  appView.classList.remove('hidden');
  await loadJobs();
};

$('#usePasswordBtn').onclick = async () => {
  pinUnlocked = false;
  await supabaseClient.auth.signOut();
  pinView.classList.add('hidden');
  authView.classList.remove('hidden');
};

$('#pinSettingsBtn').onclick = () => {
  if (!currentUser) return;
  $('#newPin').value = '';
  $('#confirmPin').value = '';
  $('#pinSetupMessage').textContent = '';
  $('#removePinBtn').classList.toggle('hidden', !getStoredPinHash(currentUser.id));
  pinDialog.showModal();
};
$('#closePinBtn').onclick = () => pinDialog.close();
$('#pinSetupForm').onsubmit = async e => {
  e.preventDefault();
  const a = $('#newPin').value, b = $('#confirmPin').value;
  if (!/^\d{4}$/.test(a)) {
    $('#pinSetupMessage').textContent = 'PIN must be exactly 4 digits.';
    return;
  }
  if (a !== b) {
    $('#pinSetupMessage').textContent = 'PINs do not match.';
    return;
  }
  localStorage.setItem(pinKey(currentUser.id), await pinHash(a, currentUser.id));
  localStorage.removeItem(legacyPinKey(currentUser.id));
  pinDialog.close();
  alert('PIN access is now enabled on this device.');
};
$('#removePinBtn').onclick = () => {
  if (!currentUser) return;
  localStorage.removeItem(pinKey(currentUser.id));
  localStorage.removeItem(legacyPinKey(currentUser.id));
  pinDialog.close();
  alert('PIN access removed from this device.');
};

function openMenu() { sideMenu.classList.add('open'); drawerBackdrop.classList.remove('hidden'); }
function closeMenu() { sideMenu.classList.remove('open'); drawerBackdrop.classList.add('hidden'); }
const sideMenu = $('#sideMenu'), drawerBackdrop = $('#drawerBackdrop');
$('#menuBtn').onclick = openMenu;
$('#closeMenuBtn').onclick = closeMenu;
drawerBackdrop.onclick = closeMenu;

document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => {
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  const cal = b.dataset.view === 'calendar';
  $('#dashboardView').classList.toggle('hidden', cal);
  $('#calendarView').classList.toggle('hidden', !cal);
  if (cal) renderCalendar();
  closeMenu();
});

async function loadJobs() {
  const businessId=await (async()=>{
    const route=location.pathname.match(/\/SchedulePlus\/(jayco|powerup)(?:\/|$)/i)?.[1]?.toLowerCase();
    const customId=new URLSearchParams(location.search).get('business');
    const validCustom=/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(customId||'')?customId:null;
    const ids={jayco:'9359127c-6929-4b2c-b25e-b9bd835d567c',powerup:'5b170395-a2e2-4458-8765-472a6409391d'};
    if((!route&&!validCustom)||!currentUser?.id)return null;
    const id=route?ids[route]:validCustom;
    const {data,error}=await supabaseClient.from('business_users').select('business_id').eq('user_id',currentUser.id).eq('business_id',id).eq('is_active',true).maybeSingle();
    if(error)throw error;
    return data?.business_id===id?id:null;
  })();
  if(!businessId){jobs=[];canDeleteJobs=false;render();renderCalendar();return}
  const {data:membership,error:membershipError}=await supabaseClient.from('business_users').select('role').eq('business_id',businessId).eq('user_id',currentUser.id).eq('is_active',true).maybeSingle();
  canDeleteJobs=!membershipError&&['owner','admin'].includes(membership?.role);
  const {data,error} = await supabaseClient.from('jobs').select('*').eq('business_id',businessId).order('scheduled_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
  if (error) {
    jobsList.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
    return;
  }
  jobs = data || [];
  render();
  renderCalendar();
}

function filtered() {
  const q = $('#searchInput').value.toLowerCase().trim(), status = $('#statusFilter').value;
  return jobs.filter(j => {
    if (status && j.status !== status) return false;
    if (typeFilter !== 'all' && j.title !== typeFilter) return false;
    if (quickFilter === 'scheduled' && (!j.scheduled_date || j.status === 'waiting')) return false;
    if (quickFilter === 'unscheduled' && j.scheduled_date) return false;
    if (quickFilter === 'followup' && j.status !== 'waiting') return false;
    const searchText = `${j.title} ${j.customer_name} ${j.customer_phone || ''} ${j.suburb || ''} ${j.address_line || ''} ${j.description || ''} ${j.panel_brand || ''} ${j.panel_type || ''} ${j.battery_brand || ''} ${j.battery_type || ''} ${j.inverter_brand || ''} ${j.inverter_type || ''} ${j.work_involved || ''}`.toLowerCase();
    if (q && !searchText.includes(q)) return false;
    return true;
  });
}

function durationLabel(minutes) {
  if (!minutes) return '';
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h.toFixed(1) : h} hr${h === 1 ? '' : 's'}`;
}

function systemDetailsHtml(j) {
  const details = [];
  const panels = [j.panel_quantity ? `${j.panel_quantity} ×` : '', j.panel_brand, j.panel_type].filter(Boolean).join(' ');
  if (panels) details.push(['Panels', panels]);
  if (j.solar_capacity_kw != null) details.push(['Solar size', displayNumber(j.solar_capacity_kw, ' kW')]);
  const battery = [j.battery_brand, j.battery_type, j.battery_capacity_kwh != null ? displayNumber(j.battery_capacity_kwh, ' kWh') : ''].filter(Boolean).join(' · ');
  if (battery) details.push(['Battery', battery]);
  if (j.phase_type) details.push(['Phase', j.phase_type]);
  const inverter = [j.inverter_brand, j.inverter_type, j.inverter_capacity_kw != null ? displayNumber(j.inverter_capacity_kw, ' kW') : ''].filter(Boolean).join(' · ');
  if (inverter) details.push(['Inverter', inverter]);
  if (j.work_involved) details.push(['Work involved', j.work_involved]);
  if (!details.length) return '';
  return `<div class="system-details">${details.map(([label,value]) => `<div class="system-detail"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;
}

function jobCardHtml(j) {
  const address = j.address_line || [j.suburb, j.postcode].filter(Boolean).join(' ') || 'Address not set';
  const phone = j.customer_phone ? `<a class="job-phone" href="tel:${esc(j.customer_phone.replace(/\s+/g,''))}">${esc(j.customer_phone)}</a>` : '<span class="job-phone missing">No phone</span>';
  return `<div class="swipe-row" data-id="${j.id}">
    <button class="swipe-delete swipe-delete-left" type="button" aria-label="Delete ${esc(j.customer_name || 'job')}">Delete</button>
    <article class="job-card" data-id="${j.id}">
      <div class="job-customer-row">
        <div class="job-customer"><strong>${esc(j.customer_name || 'No customer')}</strong>${phone}</div>
        <span class="chip status-chip">${esc(labelStatus(j.status))}</span>
      </div>
      <div class="job-address">${esc(address)}</div>
      <div class="job-type-line"><span class="job-type-chip">${esc(j.title)}</span></div>
      <div class="job-description">${esc(j.description || 'No job description')}</div>
      ${systemDetailsHtml(j)}
      <div class="chips">${j.scheduled_date ? `<span class="chip">📅 ${esc(j.scheduled_date)}${j.scheduled_start ? ` ${esc(j.scheduled_start.slice(0,5))}` : ''}</span>` : '<span class="chip">Unscheduled</span>'}${j.priority !== 'normal' ? `<span class="chip">${esc(j.priority)}</span>` : ''}${j.estimated_minutes ? `<span class="chip">⏱ ${durationLabel(j.estimated_minutes)}</span>` : ''}</div>
    </article>
    <button class="swipe-delete swipe-delete-right" type="button" aria-label="Delete ${esc(j.customer_name || 'job')}">Delete</button>
  </div>`;
}

function render() {
  const scheduled = jobs.filter(j => j.scheduled_date && j.status !== 'waiting' && j.status !== 'completed').length;
  const unscheduled = jobs.filter(j => !j.scheduled_date && j.status !== 'completed').length;
  const followup = jobs.filter(j => j.status === 'waiting').length;
  $('#countAll').textContent = jobs.length;
  $('#countScheduled').textContent = scheduled;
  $('#countUnscheduled').textContent = unscheduled;
  $('#countFollowup').textContent = followup;
  const rows = filtered();
  jobsList.innerHTML = rows.length ? rows.map(jobCardHtml).join('') : '<div class="empty">No jobs here yet.</div>';
  bindSwipeRows();
  if(!canDeleteJobs)jobsList.querySelectorAll('.swipe-delete').forEach(btn=>btn.remove());
}

function closeAllSwipes(except = null) {
  document.querySelectorAll('.swipe-row.swipe-open').forEach(row => {
    if (row !== except) resetSwipe(row);
  });
}
function resetSwipe(row) {
  row.classList.remove('swipe-open','reveal-left','reveal-right');
  const card = row.querySelector('.job-card');
  if (card) card.style.transform = '';
}
function setSwipe(row, side) {
  closeAllSwipes(row);
  row.classList.add('swipe-open', side === 'left' ? 'reveal-left' : 'reveal-right');
  row.classList.remove(side === 'left' ? 'reveal-right' : 'reveal-left');
  const card = row.querySelector('.job-card');
  if (card) card.style.transform = `translateX(${side === 'left' ? 86 : -86}px)`;
}
async function deleteJobFromDashboard(id) {
  const job = jobs.find(j => j.id === id);
  if (!canDeleteJobs || !job || !confirm(`Permanently delete ${job.customer_name || 'this job'}? This cannot be undone.`)) return;
  const {error} = await supabaseClient.from('jobs').delete().eq('id', id);
  if (error) {
    alert(error.message);
    return;
  }
  await loadJobs();
}
function bindSwipeRows() {
  document.querySelectorAll('.swipe-row').forEach(row => {
    const card = row.querySelector('.job-card');
    const id = row.dataset.id;
    row.querySelectorAll('.swipe-delete').forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      deleteJobFromDashboard(id);
    });
    card.querySelectorAll('a,button').forEach(el => el.addEventListener('click', e => e.stopPropagation()));

    let startX = 0, startY = 0, dx = 0, dragging = false, moved = false;
    card.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      moved = false;
      dragging = true;
      card.classList.add('dragging');
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
    });
    card.addEventListener('pointermove', e => {
      if (!dragging) return;
      const x = e.clientX - startX, y = e.clientY - startY;
      if (Math.abs(y) > Math.abs(x) && Math.abs(y) > 10) {
        dragging = false;
        card.classList.remove('dragging');
        resetSwipe(row);
        return;
      }
      if (Math.abs(x) > 6) moved = true;
      dx = Math.max(-96, Math.min(96, x));
      card.style.transform = `translateX(${dx}px)`;
    });
    card.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      if (Math.abs(dx) >= 42) {
        setSwipe(row, dx > 0 ? 'left' : 'right');
        return;
      }
      const wasOpen = row.classList.contains('swipe-open');
      resetSwipe(row);
      if (!moved && !wasOpen) openJob(jobs.find(j => j.id === id));
    });
    card.addEventListener('pointercancel', () => {
      dragging = false;
      card.classList.remove('dragging');
      resetSwipe(row);
    });
  });
}

document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.swipe-row')) closeAllSwipes();
});

function jobsForDate(date) {
  return jobs.filter(j => j.scheduled_date === date).sort((a,b) => (a.scheduled_start || '99:99').localeCompare(b.scheduled_start || '99:99'));
}

function renderCalendar() {
  const root = $('#monthCalendar');
  if (!root) return;
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const first = new Date(year, month, 1, 12);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const today = localDate();
  $('#calendarMonthLabel').textContent = new Intl.DateTimeFormat('en-AU', {month:'long',year:'numeric'}).format(first);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push('<div class="month-day blank" aria-hidden="true"></div>');
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day, 12);
    const key = dateKey(d);
    const dayJobs = jobsForDate(key);
    const hasJobs = dayJobs.length > 0;
    cells.push(`<button class="month-day${hasJobs ? ' has-jobs' : ''}${key === today ? ' today' : ''}" type="button" data-date="${key}" aria-label="${esc(formatLongDate(key))}${hasJobs ? `, ${dayJobs.length} job${dayJobs.length === 1 ? '' : 's'}` : ', no jobs'}"><span class="month-day-number">${day}</span>${hasJobs ? `<span class="month-job-count">${dayJobs.length}</span><span class="month-job-label">${dayJobs.length === 1 ? 'job' : 'jobs'}</span>` : ''}</button>`);
  }
  const remainder = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < remainder; i++) cells.push('<div class="month-day blank" aria-hidden="true"></div>');
  root.innerHTML = cells.join('');
  root.querySelectorAll('.month-day[data-date]').forEach(b => b.onclick = () => openCalendarDay(b.dataset.date));
}

function openCalendarDay(date) {
  const dayJobs = jobsForDate(date);
  $('#dayJobsDialogTitle').textContent = formatLongDate(date);
  $('#dayJobsDialogSub').textContent = dayJobs.length ? `${dayJobs.length} job${dayJobs.length === 1 ? '' : 's'} scheduled` : 'No jobs scheduled';
  $('#dayJobsList').innerHTML = dayJobs.length ? dayJobs.map(j => `<button class="day-job-card" type="button" data-id="${j.id}"><span><strong>${esc(j.customer_name || j.title)}</strong><small>${esc(j.title)}${j.suburb ? ` · ${esc(j.suburb)}` : ''}</small></span><span class="day-job-meta">${j.scheduled_start ? esc(j.scheduled_start.slice(0,5)) : 'Any time'}<small>${esc(labelStatus(j.status))}</small></span></button>`).join('') : '<div class="empty compact-empty">No jobs on this day.</div>';
  $('#dayAddJobBtn').dataset.date = date;
  dayJobsDialog.showModal();
  $('#dayJobsList').querySelectorAll('.day-job-card').forEach(b => b.onclick = () => {
    const job = jobs.find(j => j.id === b.dataset.id);
    dayJobsDialog.close();
    openJob(job);
  });
}

$('#calendarPrevBtn').onclick = () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1, 12);
  renderCalendar();
};
$('#calendarNextBtn').onclick = () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1, 12);
  renderCalendar();
};
$('#calendarTodayBtn').onclick = () => {
  const d = new Date();
  calendarCursor = new Date(d.getFullYear(), d.getMonth(), 1, 12);
  renderCalendar();
};
$('#closeDayJobsBtn').onclick = () => dayJobsDialog.close();
$('#dayAddJobBtn').onclick = e => {
  const date = e.currentTarget.dataset.date;
  dayJobsDialog.close();
  openJob(null, date);
};

$('#searchInput').oninput = render;
$('#statusFilter').onchange = render;
document.querySelectorAll('.stat').forEach(b => b.onclick = () => {
  document.querySelectorAll('.stat').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  quickFilter = b.dataset.filter;
  render();
});
document.querySelectorAll('.type-filter').forEach(b => b.onclick = () => {
  document.querySelectorAll('.type-filter').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  typeFilter = b.dataset.type;
  render();
});

function openJob(j = null, defaultDate = null) {
  dialog.dataset.convertedQuoteJob='false';
  $('#jobForm').reset();
  $('#jobId').value = j?.id || '';
  $('#jobDialogTitle').textContent = j ? 'Edit job' : 'New job';
  $('#deleteJobBtn').classList.toggle('hidden', !j||!canDeleteJobs);
  if (j) {
    $('#jobTitle').value = ['Battery','Solar','Battery + Solar'].includes(j.title) ? j.title : '';
    $('#customerName').value = j.customer_name || '';
    $('#customerPhone').value = j.customer_phone || '';
    $('#addressLine').value = j.address_line || '';
    $('#description').value = j.description || '';
    $('#panelBrand').value = j.panel_brand || '';
    $('#panelType').value = j.panel_type || '';
    $('#panelQuantity').value = j.panel_quantity ?? '';
    $('#solarCapacity').value = j.solar_capacity_kw ?? '';
    $('#batteryBrand').value = j.battery_brand || '';
    $('#batteryType').value = j.battery_type || '';
    $('#batteryCapacity').value = j.battery_capacity_kwh ?? '';
    $('#phaseType').value = j.phase_type || '';
    $('#inverterBrand').value = j.inverter_brand || '';
    $('#inverterType').value = j.inverter_type || '';
    $('#inverterCapacity').value = j.inverter_capacity_kw ?? '';
    $('#workInvolved').value = j.work_involved || '';
    $('#status').value = j.status || 'new';
    $('#priority').value = j.priority || 'normal';
    $('#scheduledDate').value = j.scheduled_date || '';
    $('#scheduledStart').value = j.scheduled_start || '';
    $('#estimatedHours').value = j.estimated_minutes ? String(j.estimated_minutes / 60) : '';
  } else {
    $('#status').value = defaultDate ? 'scheduled' : 'new';
    $('#priority').value = 'normal';
    if (defaultDate) $('#scheduledDate').value = defaultDate;
  }
  dialog.showModal();
}

document.addEventListener('powerup:open-converted-job', async event => {
 const jobId=event.detail?.jobId;
 if(!jobId)return;
 try{
  await loadJobs();
  const job=jobs.find(j=>j.id===jobId);
  if(!job)throw new Error('The converted job is not available in this workspace.');
  const jobsButton=document.querySelector('.sp-nav-btn[data-sp-view="jobs"]')||document.querySelector('[data-view="jobs"]');
  jobsButton?.click();
  $('#searchInput').value='';
  $('#statusFilter').value='';
  quickFilter='all';typeFilter='all';
  document.querySelectorAll('.stat').forEach(el=>el.classList.toggle('active',el.dataset.filter==='all'));
  render();
  openJob(job);
  dialog.dataset.convertedQuoteJob='true';
 }catch(error){
  alert('Job created, but the job card could not open automatically. Open Jobs and refresh to find it. '+(error?.message||''));
 }
});
$('#newJobBtn').onclick = () => openJob();
$('#calendarNewJobBtn').onclick = () => openJob();
$('#closeJobBtn').onclick = async () => {
 if(dialog.dataset.convertedQuoteJob==='true' && !$('#scheduledDate').value){
  const notice=document.createElement('dialog');
  notice.style.cssText='max-width:min(92vw,440px);width:100%;border-radius:16px;padding:24px;border:1px solid #555;background:#20242d;color:white;box-sizing:border-box';
  notice.innerHTML='<h2 style="margin:0 0 12px">Scheduling date not entered</h2><p>Have you received an installation date? If not, you can leave this job as <strong>To Schedule</strong> and enter the date later.</p><div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button type="button" data-choice="date">Enter Date</button><button type="button" data-choice="later" style="background:#3154ef;color:white">Save for Later</button></div>';
  document.body.appendChild(notice);
  const choice=await new Promise(resolve=>{
   notice.addEventListener('click',e=>{const value=e.target.closest('[data-choice]')?.dataset.choice;if(value)resolve(value);});
   notice.addEventListener('cancel',e=>{e.preventDefault();resolve('date');});
   notice.showModal();
  });
  notice.close();notice.remove();
  if(choice==='date'){$('#scheduledDate').focus();return;}
  const id=$('#jobId').value;
  if(id){
   const {error}=await supabaseClient.from('jobs').update({status:'to_schedule',scheduled_date:null}).eq('id',id);
   if(error){alert('Could not mark job To Schedule: '+error.message);return;}
  }
  dialog.dataset.convertedQuoteJob='false';
  dialog.close();await loadJobs();return;
 }
 dialog.close();
};
$('#mapsLookupBtn').onclick = () => {
  const a = $('#addressLine').value.trim();
  if (!a) {
    alert('Enter an address first.');
    return;
  }
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`, '_blank', 'noopener');
};

$('#scheduledDate').addEventListener('input', () => $('#scheduledDate').setCustomValidity(''));
$('#status').addEventListener('change', () => $('#scheduledDate').setCustomValidity(''));
$('#jobForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('#jobId').value;
  if ($('#status').value === 'scheduled' && !$('#scheduledDate').value) {
    const answer = await new Promise(resolve => {
      const notice = document.createElement('dialog');
      notice.setAttribute('aria-label', 'Scheduling date not entered');
      notice.style.cssText = 'max-width:min(92vw,440px);width:100%;border-radius:16px;padding:24px;border:1px solid #555;background:#20242d;color:#fff;box-sizing:border-box';
      notice.innerHTML = '<h2 style="margin:0 0 12px;font-size:21px">Scheduling date not entered</h2><p style="line-height:1.5">Do you have an installation date? If not, you can save this job as <strong>To Schedule</strong> and add the date later.</p><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:20px"><button type="button" data-choice="date" style="padding:12px">Enter Date</button><button type="button" data-choice="later" style="padding:12px;background:#3154ef;color:white">Save for Later</button></div>';
      document.body.appendChild(notice);
      const finish = value => { notice.close();notice.remove();resolve(value); };
      notice.addEventListener('click', ev => {const choice=ev.target.closest('[data-choice]')?.dataset.choice;if(choice)finish(choice);});
      notice.addEventListener('cancel', ev => {ev.preventDefault();finish('date');});
      notice.showModal();
    });
    if(answer==='date'){$('#scheduledDate').focus();return;}
    $('#status').value='to_schedule';
  }
  $('#scheduledDate').setCustomValidity('');
  const hours = Number($('#estimatedHours').value) || 0;
  const address = $('#addressLine').value.trim();
  const addressParts = extractAddressParts(address);
  const payload = {
    user_id: currentUser.id,
    title: $('#jobTitle').value,
    customer_name: $('#customerName').value.trim() || null,
    customer_phone: $('#customerPhone').value.trim() || null,
    address_line: address || null,
    suburb: addressParts.suburb,
    postcode: addressParts.postcode,
    description: $('#description').value.trim() || null,
    notes: null,
    panel_brand: $('#panelBrand').value.trim() || null,
    panel_type: $('#panelType').value.trim() || null,
    panel_quantity: parseNumberOrNull($('#panelQuantity').value),
    solar_capacity_kw: parseNumberOrNull($('#solarCapacity').value),
    battery_brand: $('#batteryBrand').value.trim() || null,
    battery_type: $('#batteryType').value.trim() || null,
    battery_capacity_kwh: parseNumberOrNull($('#batteryCapacity').value),
    phase_type: $('#phaseType').value || null,
    inverter_brand: $('#inverterBrand').value.trim() || null,
    inverter_type: $('#inverterType').value.trim() || null,
    inverter_capacity_kw: parseNumberOrNull($('#inverterCapacity').value),
    work_involved: $('#workInvolved').value.trim() || null,
    status: $('#status').value,
    priority: $('#priority').value,
    scheduled_date: $('#scheduledDate').value || null,
    scheduled_start: $('#scheduledStart').value || null,
    estimated_minutes: hours ? Math.round(hours * 60) : null
  };
  payload.completed_at = payload.status === 'completed' ? new Date().toISOString() : null;
  const q = id ? supabaseClient.from('jobs').update(payload).eq('id', id) : supabaseClient.from('jobs').insert(payload);
  const {error} = await q;
  if (error) {
    alert(error.message);
    return;
  }
  dialog.close();
  await loadJobs();
});

$('#deleteJobBtn').onclick = async () => {
  const id = $('#jobId').value;
  if (!canDeleteJobs || !id || !confirm('Permanently delete this job? This cannot be undone.')) return;
  const {error} = await supabaseClient.from('jobs').delete().eq('id', id);
  if (error) {
    alert(error.message);
    return;
  }
  dialog.close();
  await loadJobs();
};

init();
