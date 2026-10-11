(()=>{
function init(){
 let btn=document.getElementById('spScrollTop');
 if(!btn){btn=document.createElement('button');btn.id='spScrollTop';btn.type='button';btn.setAttribute('aria-label','Back to top');btn.title='Back to top';btn.textContent='↑';document.body.appendChild(btn)}
 const visible=el=>!!el&&!!el.getClientRects().length&&getComputedStyle(el).display!=='none'&&!el.closest('.hidden');
 const onTarget=()=>{const active=document.querySelector('.sp-view.active');return !!active&&visible(active)&&['home','jobs'].includes(active.dataset.spView)};
 const candidates=()=>[document.scrollingElement,document.querySelector('.sp-home-scroll'),document.querySelector('.sp-view.active'),document.querySelector('.app-shell'),document.querySelector('#appView'),document.querySelector('.app-shell main')].filter(Boolean);
 const scrollPosition=()=>Math.max(window.scrollY,document.documentElement.scrollTop,document.body.scrollTop,...candidates().map(el=>el.scrollTop||0));
 const update=()=>{btn.hidden=!(onTarget()&&scrollPosition()>240)};
 btn.onclick=()=>{for(const el of candidates())if(el.scrollTop>0)el.scrollTo({top:0,behavior:'smooth'});window.scrollTo({top:0,behavior:'smooth'})};
 document.addEventListener('scroll',update,true);window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);document.addEventListener('click',()=>requestAnimationFrame(update));
 new MutationObserver(()=>requestAnimationFrame(update)).observe(document.getElementById('appView')||document.body,{subtree:true,attributes:true,attributeFilter:['class','style']});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();