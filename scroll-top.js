(()=>{
  function init(){
    let button=document.getElementById('spScrollTop');
    if(!button){
      button=document.createElement('button');
      button.id='spScrollTop';
      button.type='button';
      button.title='Back to top';
      button.setAttribute('aria-label','Back to top');
      button.textContent='↑';
      document.body.appendChild(button);
    }
    const scrollables=()=>{
      const all=[document.scrollingElement,document.documentElement,document.body,document.querySelector('#appView'),document.querySelector('.app-shell'),document.querySelector('.app-shell main'),...document.querySelectorAll('.sp-view.active, .sp-view.active *')];
      return [...new Set(all.filter(Boolean))].filter(el=>el.scrollHeight>el.clientHeight+20 || el.scrollTop>0);
    };
    const allowed=()=>{
      const activeNav=document.querySelector('#spBottomNav .sp-nav-btn.active')?.dataset.spView;
      if(activeNav)return activeNav==='home'||activeNav==='jobs';
      return !!document.querySelector('.sp-view.active[data-sp-view="home"],.sp-view.active[data-sp-view="jobs"]');
    };
    function position(){
      const page=Math.max(window.scrollY||0,document.documentElement.scrollTop||0,document.body.scrollTop||0);
      return Math.max(page,...scrollables().map(el=>el.scrollTop||0));
    }
    function update(){button.hidden=!allowed()||position()<180}
    button.addEventListener('click',()=>{
      for(const el of scrollables())if(el.scrollTop>0)el.scrollTo({top:0,behavior:'smooth'});
      window.scrollTo({top:0,behavior:'smooth'});
      button.hidden=true;
    });
    document.addEventListener('scroll',update,true);
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    document.addEventListener('click',()=>requestAnimationFrame(update));
    document.addEventListener('touchend',()=>requestAnimationFrame(update),{passive:true});
    const nav=document.getElementById('spBottomNav');
    if(nav)new MutationObserver(update).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();