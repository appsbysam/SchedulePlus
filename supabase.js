const SUPABASE_URL = 'https://otrzmqyqbyovjggdswzn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tEFdPzwG6nFJmg88Ed7uPg_dNeYsYUc';
// Each installed workspace must have its own auth storage. A shared origin alone
// does not separate Supabase sessions between independently installed PWAs.
const SCHEDULEPLUS_WORKSPACE = location.pathname.match(/\/SchedulePlus\/(jayco|powerup)(?:\/|$)/i)?.[1]?.toLowerCase() || 'central';
const SUPABASE_AUTH_STORAGE_KEY = 'scheduleplus-auth-' + SCHEDULEPLUS_WORKSPACE;
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {storageKey: SUPABASE_AUTH_STORAGE_KEY}
});
