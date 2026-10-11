(()=>{
const $=id=>document.getElementById(id);
const root=/\/SchedulePlus\/?$/.test(location.pathname);
if(!root)return;
function start(){
 const view=$('authView'),card=view?.querySelector('.auth-card'),form=$('authForm');
 if(!card||!form||$('spWelcomeActions'))return;
 const intro=card.querySelector('h1');if(intro)intro.textContent='Welcome to Schedule+';
 const desc=intro?.nextElementSibling;if(desc)desc.textContent='Your business. Your jobs. Your team.';
 const actions=document.createElement('div');actions.id='spWelcomeActions';actions.style.cssText='display:grid;gap:12px;margin:24px 0';
 for(const [id,label] of [['spRegister','Register a New Business'],['spFind','Find My Business Link']]){const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;b.className=id==='spRegister'?'primary':'secondary';actions.appendChild(b)}
 const header=document.createElement('h2');header.id='spAuthHeading';header.style.fontSize='19px';
 const business=document.createElement('label');business.id='spBusinessLabel';business.textContent='Business name';const name=document.createElement('input');name.id='spBusinessName';name.maxLength=100;name.autocomplete='organization';business.appendChild(name);form.prepend(business);
 const find=document.createElement('button');find.id='spFindSubmit';find.type='button';find.className='primary';find.textContent='Send Secure Access Email';
 const back=document.createElement('button');back.id='spBack';back.type='button';back.className='link-button';back.textContent='Back to options';
 card.insertBefore(actions,form);card.insertBefore(header,form);form.after(find,back);
 const existing=$('centralExistingAccount'),signup=$('signUpBtn'),resend=$('resendBtn'),submit=$('centralSignIn'),pass=$('password');
 signup.textContent='Register';
 const suppressLegacy=()=>{for(const id of ['centralExistingAccount','resendBtn','centralSignIn']){const el=$(id);if(el)el.style.setProperty('display','none','important')}for(const el of card.querySelectorAll('button')){if(/new user\? create a schedule\+ account|^sign in$/i.test(el.textContent.trim())&&!['spFind','spRegister'].includes(el.id))el.style.setProperty('display','none','important')}};
 suppressLegacy();
 if(existing)existing.style.display='none';
 const extras=form.querySelector('.auth-extra-row');if(extras)extras.style.display='none';const old=card.querySelector('p[style*="font-weight:700"]');if(old)old.style.display='none';
 const foot=card.querySelector('p[style*="font-size:13px"]');if(foot)foot.style.display='none';
 function mode(which){
  actions.style.display=which?'none':'grid';header.style.display=which?'block':'none';form.style.display=which?'block':'none';back.style.display=which?'block':'none';
  business.style.display=which==='register'?'block':'none';name.required=which==='register';
  pass.closest('label').style.display=which==='find'?'none':'block';pass.required=which!=='find';
  signup.style.display=which==='register'?'block':'none';submit.style.display='none';find.style.display=which==='find'?'block':'none';resend.style.display='none';
  header.textContent=which==='register'?'Register a New Business':'Find My Business Link';
  form.dataset.spMode=which||'';const extra=form.querySelector('.auth-extra-row');if(extra)extra.style.setProperty('display','none','important');suppressLegacy();$('authMessage').textContent='';
 }
 $('spRegister').onclick=()=>mode('register');$('spFind').onclick=()=>mode('find');back.onclick=()=>mode(null);
 signup.onclick=async()=>{
  if(!name.value.trim()||name.value.trim().length<2){$('authMessage').textContent='Enter your business name.';return}
  if(!form.reportValidity())return;
  const email=$('email').value.trim(),password=pass.value;
  if(password.length<6){$('authMessage').textContent='Password must be at least six characters.';return}
  signup.disabled=true;
  try{
   const {error}=await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:'https://appsbysam.github.io/SchedulePlus/',data:{pending_business_name:name.value.trim()}}});
   $('authMessage').textContent=error?error.message:'Check your email to verify your account. Once verified, sign in to finish creating your business.';
  }catch(e){$('authMessage').textContent='Registration unavailable. Please try again.'}
  finally{signup.disabled=false}
 };
 find.onclick=async()=>{
  const email=$('email').value.trim();if(!email||!$('email').checkValidity()){$('authMessage').textContent='Enter a valid email address.';return}
  find.disabled=true;
  try{await supabaseClient.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:'https://appsbysam.github.io/SchedulePlus/'}});$('authMessage').textContent='If this address is registered, a secure access email will arrive shortly. Check your inbox and junk folder.'}
  catch(e){$('authMessage').textContent='Unable to process your request. Please try again.'}
  finally{find.disabled=false}
 };
 form.addEventListener('submit',e=>{if(form.dataset.spMode!=='login'){e.preventDefault();e.stopImmediatePropagation();if(form.dataset.spMode==='find')find.click();else signup.click()}},true);
 mode(null);
 new MutationObserver(suppressLegacy).observe(card,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();