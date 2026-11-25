// Trust Net — frontend vanilla JS
const API = '';
const I18N = {
  fr: { tagline:'Abonnements digitaux premium — IA, streaming, logiciels, VPN, recharge mobile & diamants Free Fire.', shop:'Découvrir les produits', cats:'Catégories', featured:'Produits à la une', offers:'Offres spéciales', catalog:'Catalogue complet', searchPh:'Rechercher un produit…', all:'Toutes catégories', add:'Ajouter', details:'Détails', retail:'Détail', wholesale:'Gros', per:'mois', stock:'en stock', cart:'Panier', checkout:'Commander', empty:'Votre panier est vide.', total:'Total', name:'Nom complet', phone:'Téléphone', email:'Email', payMethod:'Méthode de paiement', payRef:'Référence de paiement (n° transaction)', confirm:'Confirmer la commande', login:'Connexion', register:'Créer un compte', logout:'Déconnexion', myOrders:'Mes commandes', admin:'Admin', orders:'Commandes', products:'Produits', stats:'Statistiques', revenue:'Revenu', pending:'En attente', duration:'Durée', save:'Enregistrer', cancel:'Annuler', delete:'Supprimer', edit:'Modifier', status:'Statut', customer:'Client', date:'Date', actions:'Actions', newProduct:'Nouveau produit', price:'Prix détail (TND)', wsPrice:'Prix gros (TND)', category:'Catégorie', desc:'Description', icon:'Icône (emoji)', badge:'Badge', featuredCb:'Produit à la une', support:'Support WhatsApp', recharge:'Recharge Mobile', rechargeTitle:'Recharge Mobile — Tunisie', operator:'Opérateur', rechargePhone:'Numéro à recharger (tunisien)', amount:'Montant (TND)', playerId:'Player ID Free Fire', rechargeNow:'Recharger maintenant', gaming:'Gaming', orderOk:'Commande créée ! Nous vous contacterons pour confirmation.', loginOk:'Connecté !', needLogin:'Connectez-vous pour voir vos commandes.' },
  ar: { tagline:'اشتراكات رقمية مميزة — ذكاء اصطناعي، بث، برامج، VPN، تعبئة الهاتف وجواهر فري فاير.', shop:'اكتشف المنتجات', cats:'الفئات', featured:'منتجات مميزة', offers:'عروض خاصة', catalog:'الكتالوج الكامل', searchPh:'ابحث عن منتج…', all:'كل الفئات', add:'أضف', details:'التفاصيل', retail:'تجزئة', wholesale:'جملة', per:'شهر', stock:'في المخزون', cart:'السلة', checkout:'اطلب الآن', empty:'سلتك فارغة.', total:'المجموع', name:'الاسم الكامل', phone:'الهاتف', email:'البريد الإلكتروني', payMethod:'طريقة الدفع', payRef:'مرجع الدفع (رقم المعاملة)', confirm:'تأكيد الطلب', login:'تسجيل الدخول', register:'إنشاء حساب', logout:'تسجيل الخروج', myOrders:'طلباتي', admin:'الإدارة', orders:'الطلبات', products:'المنتجات', stats:'إحصائيات', revenue:'الإيرادات', pending:'قيد الانتظار', duration:'المدة', save:'حفظ', cancel:'إلغاء', delete:'حذف', edit:'تعديل', status:'الحالة', customer:'العميل', date:'التاريخ', actions:'إجراءات', newProduct:'منتج جديد', price:'سعر التجزئة (د.ت)', wsPrice:'سعر الجملة (د.ت)', category:'الفئة', desc:'الوصف', icon:'أيقونة', badge:'شارة', featuredCb:'منتج مميز', support:'دعم واتساب', recharge:'تعبئة الهاتف', rechargeTitle:'تعبئة الهاتف — تونس', operator:'المشغّل', rechargePhone:'الرقم المراد تعبئته (تونسي)', amount:'المبلغ (د.ت)', playerId:'Player ID فري فاير', rechargeNow:'عبّئ الآن', gaming:'الألعاب', orderOk:'تم إنشاء الطلب! سنتصل بك للتأكيد.', loginOk:'تم تسجيل الدخول!', needLogin:'سجّل الدخول لعرض طلباتك.' }
};
let lang = localStorage.getItem('tn-lang') || 'fr';
let products = [], cart = JSON.parse(localStorage.getItem('tn-cart') || '[]');
let user = JSON.parse(localStorage.getItem('tn-user') || 'null');
let token = localStorage.getItem('tn-token') || '';
let waNumber = '216XXXXXXXX';
const t = k => (I18N[lang] && I18N[lang][k]) || I18N.fr[k] || k;
const fmt = n => `${Number(n).toFixed(2)} TND`;
const CAT = { ai:['🤖','Outils IA','أدوات الذكاء الاصطناعي'], streaming:['🎬','Streaming','البث'], software:['💻','Logiciels','البرامج'], vpn:['🛡️','VPN','VPN'], recharge:['📱','Recharge Mobile','تعبئة الهاتف'], gaming:['💎','Gaming','الألعاب'] };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function api(path, opts={}) {
  const r = await fetch(API + path, { headers: { 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer '+token } : {}) }, ...opts });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(d.error || ('Erreur ' + r.status));
  return d;
}
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.style.display='block'; setTimeout(()=>el.style.display='none',3000); }

const prodImg = p => p.image ? `<img class="prod-img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">` : `<span class="ic">${esc(p.icon||'📦')}</span>`;
const validity = p => p.validity ? esc(p.validity) : `${p.duration_months} ${t('per')}`;
function card(p, priceType='retail'){
  const price = priceType==='wholesale' ? p.price_wholesale : p.price_retail;
  const desc = lang==='ar' ? (p.description_ar || p.description_fr) : p.description_fr;
  return `<article class="card">${prodImg(p)}${p.badge?`<span class="badge ${p.badge==='Promo'?'promo':''}">${esc(p.badge)}</span>`:''}
  <h3>${esc(p.name)}</h3><p>${esc(desc||'')}</p>
  <div class="meta">${esc(CAT[p.category]?.[lang==='ar'?2:1]||p.category)} • ${validity(p)} • ${p.stock} ${t('stock')}</div>
  <div class="price">${fmt(price)} <small>/ ${p.duration_months} ${t('per')}</small></div>
  <div class="ws">${t('wholesale')}: ${fmt(p.price_wholesale)}</div>
  <div class="card-actions"><button class="btn" onclick="addToCart(${p.id})">${t('add')}</button><button class="btn ghost" onclick="showDetail(${p.id})">${t('details')}</button></div></article>`;
}
function render(){
  document.documentElement.lang = lang; document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  const q = $('#search').value.toLowerCase();
  const cat = $('#catFilter').value, max = $('#maxPrice').value;
  const list = products.filter(p => (!cat||p.category===cat) && (!q||p.name.toLowerCase().includes(q)||(p.description_fr||'').toLowerCase().includes(q)) && (!max||p.price_retail<=+max));
  $('#featuredGrid').innerHTML = products.filter(p=>p.featured).slice(0,8).map(p=>card(p)).join('') || '<p>Aucun produit.</p>';
  $('#catalogGrid').innerHTML = list.map(p=>card(p)).join('') || '<p>Aucun produit trouvé.</p>';
  $('#cartCount').textContent = cart.reduce((a,c)=>a+c.qty,0);
  $('#langBtn').textContent = lang==='fr' ? 'العربية' : 'Français';
  $('#authBtn').textContent = user ? user.name : t('login');
  const hasGaming = cart.some(c => (products.find(x=>x.id===c.product_id)||{}).category==='gaming');
  const pf = $('#playerField'); if (pf) pf.classList.toggle('hidden', !hasGaming);
  $('#ordersLink').classList.toggle('hidden', !user);
  renderCart();
}
async function load(){
  try { const c = await api('/api/config'); waNumber = c.whatsapp_number || waNumber; } catch {}
  products = await api('/api/products');
  render();
}
function addToCart(id){ const ex=cart.find(c=>c.product_id===id); if(ex) ex.qty++; else cart.push({product_id:id,qty:1,price_type:'retail'}); saveCart(); toast('✓ '+t('add')); }
function saveCart(){ localStorage.setItem('tn-cart', JSON.stringify(cart)); render(); }
function setQty(id,d){ const it=cart.find(c=>c.product_id===id); if(!it) return; it.qty+=d; if(it.qty<=0) cart=cart.filter(c=>c.product_id!==id); saveCart(); }
function setType(id,v){ const it=cart.find(c=>c.product_id===id); if(it) it.price_type=v; saveCart(); }
function renderCart(){
  const box=$('#cartItems'); if(!box) return;
  if(!cart.length){ box.innerHTML=`<p>${t('empty')}</p>`; $('#cartTotal').textContent=fmt(0); return; }
  let total=0;
  box.innerHTML=cart.map(c=>{ const p=products.find(x=>x.id===c.product_id); if(!p) return ''; const unit=c.price_type==='wholesale'?p.price_wholesale:p.price_retail; total+=unit*c.qty;
    return `<div class="cart-item"><div>${p.image?`<img class="thumb" src="${esc(p.image)}" alt="">`:esc(p.icon)} <b>${esc(p.name)}</b><br><select onchange="setType(${p.id},this.value)" style="width:auto;padding:4px;margin-top:4px"><option value="retail" ${c.price_type==='retail'?'selected':''}>${t('retail')} — ${fmt(p.price_retail)}</option><option value="wholesale" ${c.price_type==='wholesale'?'selected':''}>${t('wholesale')} — ${fmt(p.price_wholesale)}</option></select></div>
    <div><button onclick="setQty(${p.id},-1)">−</button> ${c.qty} <button onclick="setQty(${p.id},1)">+</button><br><b>${fmt(unit*c.qty)}</b></div></div>`; }).join('');
  $('#cartTotal').textContent=fmt(total);
}
function showDetail(id){ const p=products.find(x=>x.id===id); if(!p) return; const desc=lang==='ar'?(p.description_ar||p.description_fr):p.description_fr;
  $('#detailBox').innerHTML=`${prodImg(p)}<h3>${esc(p.name)}</h3><p style="color:var(--muted)">${esc(desc||'')}</p>
  <p class="meta">${esc(CAT[p.category]?.[lang==='ar'?2:1]||'')} • ${validity(p)} • ${p.stock} ${t('stock')}</p>
  <p class="price">${fmt(p.price_retail)}</p><p class="ws">${t('wholesale')}: ${fmt(p.price_wholesale)}</p>
  <button class="btn" onclick="addToCart(${p.id});closeModal('detailModal')">${t('add')}</button>`;
  openModal('detailModal'); }
function openModal(id){ $('#'+id).classList.add('open'); }
function closeModal(id){ $('#'+id).classList.remove('open'); }
function openCart(){ $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('show'); }
function closeCart(){ $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('show'); }
function payInfo(){
  const m=$('#payMethod').value;
  const box=$('#payInfo');
  const map={ D17:'D17 : envoyez le montant au numéro D17 de Trust Net, puis collez la référence ci-dessous.', Flouci:'Flouci : payez via l’app Flouci au numéro Trust Net, puis collez la référence ci-dessous.', 'Paiement manuel':'Paiement manuel : contactez-nous sur WhatsApp pour les coordonnées, puis collez votre référence.' };
  box.textContent = map[m] || ''; box.style.display = m ? 'block':'none';
}
async function submitOrder(e){
  e.preventDefault();
  if(!cart.length) return toast(t('empty'));
  const body={ customer_name:$('#coName').value.trim(), phone:$('#coPhone').value.trim(), email:$('#coEmail').value.trim(), payment_method:$('#payMethod').value, payment_ref:$('#payRef').value.trim(), player_id:($('#coPlayerId')?.value||'').trim(), items:cart };
  try{ const o=await api('/api/orders',{method:'POST',body:JSON.stringify(body)});
    cart=[]; saveCart(); closeCart(); closeModal('checkoutModal');
    $('#orderResult').innerHTML=`<h3>✅ ${t('orderOk')}</h3><p>Commande #${o.id} — ${fmt(o.total)} — ${esc(o.payment_method)}</p><p><a class="btn" target="_blank" href="${o.whatsapp}">📱 ${t('support')} — confirmer sur WhatsApp</a></p>`;
    openModal('orderModal'); toast(t('orderOk'));
  }catch(err){ toast(err.message); }
}
// Recharge mobile
let rechargeOperator='Tunisie Télécom', rechargeAmount=10;
function setRechargeOperator(op, btn){ rechargeOperator=op; document.querySelectorAll('#opRow .op-btn').forEach(b=>b.classList.remove('active')); if(btn) btn.classList.add('active'); }
function setRechargeAmount(a, btn){ rechargeAmount=a; document.querySelectorAll('#amtRow .amt-btn').forEach(b=>b.classList.remove('active')); if(btn) btn.classList.add('active'); }
async function submitRecharge(e){
  e.preventDefault();
  const phone=$('#rPhone').value.trim().replace(/[\s-]/g,'');
  if(!/^\+?216\d{8}$/.test(phone) && !/^[2579]\d{7}$/.test(phone)) return toast('Numéro tunisien invalide (ex : 20123456)');
  const prod=products.find(x=>x.category==='recharge' && x.name===`Recharge ${rechargeOperator} — ${rechargeAmount} DT`);
  if(!prod) return toast('Recharge indisponible pour ce montant');
  const body={ customer_name:$('#rName').value.trim(), phone, email:'', payment_method:$('#rPayMethod').value, payment_ref:$('#rPayRef').value.trim(), operator:rechargeOperator, recharge_phone:phone, order_type:'recharge', items:[{product_id:prod.id,qty:1,price_type:'retail'}] };
  try{ const o=await api('/api/orders',{method:'POST',body:JSON.stringify(body)});
    $('#orderResult').innerHTML=`<h3>✅ ${t('orderOk')}</h3><p>Recharge ${esc(rechargeOperator)} ${rechargeAmount} DT — N° ${esc(phone)}</p><p>Commande #${o.id} — ${fmt(o.total)} — ${esc(o.payment_method)}</p><p><a class="btn" target="_blank" href="${o.whatsapp}">📱 ${t('support')} — confirmer sur WhatsApp</a></p>`;
    openModal('orderModal'); toast(t('orderOk'));
  }catch(err){ toast(err.message); }
}
// Auth
function openAuth(){ if(user){ if(confirm(t('logout')+' ?')){ user=null; token=''; localStorage.removeItem('tn-user'); localStorage.removeItem('tn-token'); render(); } return; } openModal('authModal'); }
async function doLogin(e){ e.preventDefault(); try{ const d=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('#aEmail').value,password:$('#aPass').value})}); setSession(d); toast(t('loginOk')); }catch(err){ toast(err.message); } }
async function doRegister(e){ e.preventDefault(); try{ const d=await api('/api/auth/register',{method:'POST',body:JSON.stringify({name:$('#aName').value,email:$('#aEmail').value,password:$('#aPass').value,phone:$('#aPhone').value})}); setSession(d); toast(t('loginOk')); }catch(err){ toast(err.message); } }
function setSession(d){ user=d.user; token=d.token; localStorage.setItem('tn-user',JSON.stringify(user)); localStorage.setItem('tn-token',token); closeModal('authModal'); render(); }
// Orders history
async function showOrders(){
  if(!user) return toast(t('needLogin'));
  try{ const rows=await api('/api/orders/my');
    $('#ordersBox').innerHTML = rows.length ? `<table><tr><th>#</th><th>${t('date')}</th><th>${t('total')}</th><th>${t('status')}</th></tr>${rows.map(o=>`<tr><td>${o.id}</td><td>${esc(o.created_at||'')}</td><td>${fmt(o.total)}</td><td><span class="status ${o.status}">${o.status}</span></td></tr>`).join('')}</table>` : '<p>Aucune commande.</p>';
    openModal('ordersModal');
  }catch(err){ toast(err.message); }
}
function switchLang(){ lang = lang==='fr' ? 'ar' : 'fr'; localStorage.setItem('tn-lang', lang); render(); }
function waSupport(){ const msg=encodeURIComponent('Bonjour Trust Net, j’ai besoin d’aide.'); window.open(`https://wa.me/${waNumber}?text=${msg}`,'_blank'); }
document.addEventListener('DOMContentLoaded', ()=>{
  $('#search').addEventListener('input', render); $('#catFilter').addEventListener('change', render); $('#maxPrice').addEventListener('input', render);
  document.querySelectorAll('.cat').forEach(b=>b.addEventListener('click',()=>{ $('#catFilter').value=b.dataset.cat; render(); document.getElementById('catalog').scrollIntoView({behavior:'smooth'}); }));
  load();
});
