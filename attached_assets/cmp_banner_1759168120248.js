// Path: public/cmp/cmp_banner.js
// Minimal self-hosted CMP toggle (placeholder). Replace with certified CMP for production.
(function(){
  const KEY="cmp:consent";
  if(localStorage.getItem(KEY)) return;
  const bar=document.createElement('div');
  bar.setAttribute('role','dialog');
  bar.style.cssText='position:fixed;inset:auto 0 0 0;background:#111;color:#fff;padding:12px;z-index:9999;display:flex;gap:8px;align-items:center;justify-content:center;';
  bar.innerHTML='<span>Ce site utilise des cookies pour mesurer l’audience et améliorer l’expérience.</span>';
  const accept=document.createElement('button'); accept.textContent='Accepter'; accept.onclick=()=>{localStorage.setItem(KEY,JSON.stringify({ads:false,analytics:true}));bar.remove();};
  const deny=document.createElement('button'); deny.textContent='Refuser'; deny.onclick=()=>{localStorage.setItem(KEY,JSON.stringify({ads:false,analytics:false}));bar.remove();};
  [accept,deny].forEach(b=>{b.style.cssText='background:#f0f;padding:6px 10px;border-radius:6px;border:1px solid #fff;color:#000;'});
  bar.appendChild(accept); bar.appendChild(deny);
  document.body.appendChild(bar);
})();
