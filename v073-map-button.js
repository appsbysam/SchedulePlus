(() => {
  function placeButton(){
    const btn=document.getElementById('viewOnMapBtn');
    const hint=document.querySelector('.places-hint');
    if(!btn||!hint)return false;
    let row=document.querySelector('.sp-address-helper-row');
    if(!row){row=document.createElement('div');row.className='sp-address-helper-row';hint.insertAdjacentElement('beforebegin',row);row.appendChild(hint)}
    if(btn.parentElement!==row)row.appendChild(btn);
    btn.innerHTML='<span class="sp-map-pin" aria-hidden="true">⌖</span><span>View</span>';
    btn.setAttribute('aria-label','View address on map');
    return true;
  }
  function boot(){let tries=0;const timer=setInterval(()=>{tries++;if(placeButton()||tries>50)clearInterval(timer)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();