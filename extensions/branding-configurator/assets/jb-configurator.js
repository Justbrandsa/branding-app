(function(){
  const root = document.currentScript.closest('.shopify-section') || document;
  const el = root.querySelector('.jb-configurator'); if(!el) return;
  const APP_URL = window.__JB_APP_URL || '';
  const productGid = el.dataset.productGid;
  const variantGid = el.dataset.variantGid;
  const form = el.querySelector('.jb-config-form');
  form.innerHTML = '<details open><summary><strong>Branding Options</strong></summary>' +
    '<label>Method<select id="jb-method"><option value="embroidery">Embroidery</option><option value="pad_print">Pad Print</option><option value="laser">Laser Engrave</option></select></label>' +
    '<label>Positions<div><label><input type="checkbox" value="left_chest"> Left Chest</label><label><input type="checkbox" value="right_chest"> Right Chest</label><label><input type="checkbox" value="back"> Back</label></div></label>' +
    '<label>Quantity<div style="display:flex;gap:.5rem;align-items:center"><button type="button" id="jb-qm">-</button><input id="jb-qty" type="number" min="1" step="1" value="1" style="width:80px"><button type="button" id="jb-qp">+</button></div></label>' +
    '<label>Artwork Upload (PNG/JPG/SVG/PDF)<input id="jb-files" type="file" multiple accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps"></label>' +
    '<div id="jb-price" style="margin:1rem 0;padding:.75rem;border:1px solid #ddd"><div>Branding (per-unit): —</div><div>Setup (one-time): —</div><hr/><div><strong>Branding Total:</strong> —</div></div>' +
    '<button id="jb-add" disabled>Add to cart</button></details>';
  const $ = sel => el.querySelector(sel);
  const qtyInp = $('#jb-qty');
  $('#jb-qm').addEventListener('click', ()=>{ qtyInp.value = Math.max(1, (parseInt(qtyInp.value)||1)-1); price(); });
  $('#jb-qp').addEventListener('click', ()=>{ qtyInp.value = (parseInt(qtyInp.value)||1)+1; price(); });
  async function sha256(file){ const buf=await file.arrayBuffer(); const hash=await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
  let lastQuote=null;
  async function price(){ const method=$('#jb-method').value; const positions=Array.from(el.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value); const qty=parseInt(qtyInp.value)||1; const files=$('#jb-files').files; const fileHashes=[]; for(const f of files) fileHashes.push(await sha256(f)); const r=await fetch(`${APP_URL}/api/price`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:productGid,variantId:variantGid,qty,method,attributes:{},positions,artworkHashes:fileHashes})}); const j=await r.json(); if(j.error){console.error(j.error);return;} lastQuote=j; $('#jb-price').innerHTML=`<div>Branding (per-unit): R${j.perUnitAmount.toFixed(2)} × ${qty}</div><div>Setup (one-time): R${j.setupFeeAmount.toFixed(2)}</div><hr/><div><strong>Branding Total:</strong> R${(j.perUnitAmount*qty + j.setupFeeAmount).toFixed(2)}</div>`; $('#jb-add').disabled=false; }
  ['change','input'].forEach(evt=>form.addEventListener(evt,price)); price();
  $('#jb-add').addEventListener('click', async (e)=>{ e.preventDefault(); if(!lastQuote) return; const method=$('#jb-method').value; const positions=Array.from(el.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value); const qty=parseInt(qtyInp.value)||1; const properties={ jb_method:method, jb_positions:positions, jb_group_key:lastQuote.groupKey }; const addPayload=await fetch(`${APP_URL}/api/cart/add`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({variantId:variantGid,qty,priceQuote:lastQuote,properties})}).then(r=>r.json()); await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:addPayload.items})}); window.location.href='/cart'; });
})();
