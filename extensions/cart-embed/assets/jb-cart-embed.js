(async function(){
  const minOrder = (window.__JB_MIN_ORDER_ZAR || 500) * 100;
  const cart = await fetch('/cart.js').then(r=>r.json());
  const container = document.getElementById('jb-cart-embed');
  if(cart.total_price < minOrder){
    const banner = document.createElement('div');
    banner.style.cssText = 'padding:12px;background:#ffe9e9;border:1px solid #f0bcbc;margin:10px 0;';
    const left = ((minOrder - cart.total_price)/100).toFixed(2);
    banner.innerHTML = `As your wholesale supplier, we have a minimum order of R${(minOrder/100).toFixed(2)}. You are R${left} short. Please add more items to continue.`;
    container.appendChild(banner);
    document.querySelectorAll('form[action^="/cart" ] [name="checkout"], a[href^="/checkout"]').forEach(btn=>{ btn.setAttribute('disabled','disabled'); btn.style.opacity=0.6; });
  }
  const byGroup = {};
  for(const it of cart.items){
    const gk=(it.properties||{}).jb_group_key; if(!gk) continue;
    byGroup[gk]=byGroup[gk]||{mains:[],perUnits:[],setups:[]};
    if(/Branding Setup/i.test(it.title)) byGroup[gk].setups.push(it);
    else if(/Branding/i.test(it.title) && /per item/i.test(it.title)) byGroup[gk].perUnits.push(it);
    else byGroup[gk].mains.push(it);
  }
  const updates = {};
  Object.values(byGroup).forEach(group=>{
    const q = group.mains.reduce((s,it)=>s+it.quantity,0);
    group.perUnits.forEach(pu=>{ if(pu.quantity!==q) updates[pu.key]=q; });
    group.setups.forEach(su=>{ if(su.quantity!==1) updates[su.key]=1; });
  });
  if(Object.keys(updates).length){
    await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ updates })});
    location.reload();
  }
})();
