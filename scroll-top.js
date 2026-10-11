(()=>{
function init(){
 const btn=document.createElement('button');btn.id='spScrollTop';btn.type='button';btn.hidden=true;btn.setAttribute('aria-label','Back to top');btn.title='Back to top';btn.textContent='↑';document.body.appendChild(btn);
 const targets=()=>[document.scrollingElement,document.querySelector('.sp-home-scroll'),document.querySelector('#jobsView'),document.querySelector('#dashboardView'),document.querySelector('#spHomeView'),document.querySelector('#appView'),document.querySelector('main')].filter(Boolean);
 const visible=el=>{if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&!!el.getClientRects().length&&!el.closest('.hidden')};
 const active=()=>{const jobs=document.querySelector('#jobsView'),home=document.querySelector('#spHomeView'),dash=document.querySelector('#dashboardView');return [jobs,home,dash].some(visible)};
 const scroller=()=>targets().filter(el=>el.scrollHeight>el.clientHeight+30).sort((a,b)=>b.scrollTop-a.scrollTop)[0]||document.scrollingElement;
 function update(){const el=scroller();btn.hidden=!(active()&&el&&el.scrollTop>280)}
 btn.onclick=()=>{const el=scroller();if(el)el.scrollTo({top:0,behavior:'smooth'});window.scrollTo({top:0,behavior:'smooth'});};
 document.addEventListener('scroll',update,true);window.addEventListener('resize',update);document.addEventListener('click',()=>requestAnimationFrame(update));const mo=new MutationObserver(()=>requestAnimationFrame(update));for(const el of [document.querySelector('#jobsView'),document.querySelector('#spHomeView'),document.querySelector('#dashboardView')])if(el)mo.observe(el,{attributes:true,attributeFilter:['class','style']});update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();