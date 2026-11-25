// Trust Net — Espace Admin (page séparée /admin)
const I18N = {
  fr: { dashboard:'Tableau de bord', orders:'Commandes', products:'Produits', customers:'Clients', settings:'Paramètres', backToStore:'← Retour à la boutique', logout:'Déconnexion', adminLogin:'Connexion Admin', adminLoginSub:"Accès réservé à l'administrateur de Trust Net.", password:'Mot de passe', login:'Connexion', adminTitle:'Tableau de bord Admin', revenue:'Revenu', pending:'En attente', recentOrders:'Commandes récentes', allStatuses:'Tous les statuts', allCats:'Toutes catégories', newProduct:'Nouveau produit', category:'Catégorie', desc:'Description', price:'Prix détail (TND)', wsPrice:'Prix gros (TND)', duration:'Durée (mois)', badge:'Badge', icon:'Icône (emoji)', featuredCb:'Produit à la une', save:'Enregistrer', cancel:'Annuler', delete:'Supprimer', edit:'Modifier', status:'Statut', customer:'Client', date:'Date', actions:'Actions', total:'Total', payMethod:'Méthode de paiement', waHelp:'Numéro utilisé pour le support et les liens de confirmation de commande (format international, sans + ni espaces).', waNumber:'Numéro WhatsApp', changePassword:'Changer le mot de passe admin', currentPassword:'Mot de passe actuel', newPassword:'Nouveau mot de passe', newPassword2:'Confirmer le nouveau mot de passe', loginOk:'Connecté !', adminRequired:'Accès admin requis — connectez-vous avec un compte administrateur.', saved:'✓ Enregistré', pwChanged:'✓ Mot de passe changé', pwMismatch:'Les deux nouveaux mots de passe ne correspondent pas.', noOrders:'Aucune commande.', noProducts:'Aucun produit trouvé.', noCustomers:'Aucun client.', confirmDelete:'Supprimer ce produit ?', notifyClient:'Notifier le client (WhatsApp)', stock:'en stock' },
  ar: { dashboard:'لوحة التحكم', orders:'الطلبات', products:'المنتجات', customers:'العملاء', settings:'الإعدادات', backToStore:'← العودة إلى المتجر', logout:'تسجيل الخروج', adminLogin:'تسجيل دخول الإدارة', adminLoginSub:'الدخول مخصص لإدارة Trust Net فقط.', password:'كلمة المرور', login:'تسجيل الدخول', adminTitle:'لوحة تحكم الإدارة', revenue:'الإيرادات', pending:'قيد الانتظار', recentOrders:'أحدث الطلبات', allStatuses:'كل الحالات', allCats:'كل الفئات', newProduct:'منتج جديد', category:'الفئة', desc:'الوصف', price:'سعر التجزئة (د.ت)', wsPrice:'سعر الجملة (د.ت)', duration:'المدة (أشهر)', badge:'شارة', icon:'أيقونة', featuredCb:'منتج مميز', save:'حفظ', cancel:'إلغاء', delete:'حذف', edit:'تعديل', status:'الحالة', customer:'العميل', date:'التاريخ', actions:'إجراءات', total:'المجموع', payMethod:'طريقة الدفع', waHelp:'الرقم المستخدم للدعم وروابط تأكيد الطلبات (الصيغة الدولية، بدون + أو مسافات).', waNumber:'رقم واتساب', changePassword:'تغيير كلمة مرور الإدارة', currentPassword:'كلمة المرور الحالية', newPassword:'كلمة المرور الجديدة', newPassword2:'تأكيد كلمة المرور الجديدة', loginOk:'تم تسجيل الدخول!', adminRequired:'الدخول للإدارة فقط — سجّل الدخول بحساب إداري.', saved:'✓ تم الحفظ', pwChanged:'✓ تم تغيير كلمة المرور', pwMismatch:'كلمتا المرور الجديدتان غير متطابقتين.', noOrders:'لا توجد طلبات.', noProducts:'لم يتم العثور على منتجات.', noCustomers:'لا يوجد عملاء.', confirmDelete:'حذف هذا المنتج؟', notifyClient:'إشعار العميل (واتساب)', stock:'في المخزون' }
};
let lang = localStorage.getItem('tn-lang') || 'fr';
let token = localStorage.getItem('tn-token') || '';
let user = JSON.parse(localStorage.getItem('tn-user') || 'null');
let orders = [], products = [], customers = [];
const t = k => (I18N[lang] && I18N[lang][k]) || I18N.fr[k] || k;
const fmt = n => `${Number(n).toFixed(2)} TND`;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAT = { ai:'Outils IA', streaming:'Streaming', software:'Logiciels', vpn:'VPN', recharge:'Recharge Mobile', gaming:'Gaming' };

async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...opts });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || ('Erreur ' + r.status));
  return d;
}
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 3000); }
function applyLang(){
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#langBtn').textContent = lang === 'fr' ? 'العربية' : 'Français';
}
function switchLang(){ lang = lang === 'fr' ? 'ar' : 'fr'; localStorage.setItem('tn-lang', lang); applyLang(); renderOrders(); renderProducts(); }

function showLogin(msg){
  $('#loginView').classList.remove('hidden'); $('#adminView').classList.add('hidden');
  $('#logoutBtn').classList.add('hidden'); $('#adminTabs').style.display = 'none';
  const err = $('#loginError');
  if (msg) { err.textContent = msg; err.classList.remove('hidden'); } else err.classList.add('hidden');
}
function showDashboard(){
  $('#loginView').classList.add('hidden'); $('#adminView').classList.remove('hidden');
  $('#logoutBtn').classList.remove('hidden'); $('#adminTabs').style.display = '';
  $('#adminWho').textContent = user ? `${esc(user.name)} — ${esc(user.email)}` : '';
}
function showTab(name){
  document.querySelectorAll('.tab-link').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.admin-tab').forEach(s => s.classList.add('hidden'));
  $('#tab-' + name).classList.remove('hidden');
  if (name === 'orders') renderOrders();
  if (name === 'products') renderProducts();
  if (name === 'customers') renderCustomers();
  if (name === 'settings') loadSettings();
}
function openModal(id){ $('#' + id).classList.add('open'); }
function closeModal(id){ $('#' + id).classList.remove('open'); }
function logout(){ token = ''; user = null; localStorage.removeItem('tn-token'); localStorage.removeItem('tn-user'); showLogin(); }

async function doAdminLogin(e){
  e.preventDefault();
  try {
    const d = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#loginEmail').value.trim(), password: $('#loginPass').value }) });
    if (d.user.role !== 'admin') { token = ''; throw new Error(t('adminRequired')); }
    user = d.user; token = d.token;
    localStorage.setItem('tn-user', JSON.stringify(user)); localStorage.setItem('tn-token', token);
    toast(t('loginOk')); await loadAll(); showDashboard();
  } catch (err) { showLogin(err.message); }
}

async function loadAll(){
  const s = await api('/api/admin/stats');
  $('#statRevenue').textContent = fmt(s.revenue); $('#statOrders').textContent = s.orders;
  $('#statProducts').textContent = s.products; $('#statPending').textContent = s.pending;
  orders = await api('/api/admin/orders');
  products = await api('/api/products');
  customers = await api('/api/admin/users');
  renderRecent(); renderOrders(); renderProducts(); renderCustomers(); loadSettings();
}
function orderRow(o){
  const items = (o.items || []).map(i => `${esc(i.name)} x${i.qty}`).join(', ');
  const waPhone = String(o.phone || '').replace(/[\s+]/g, '').replace(/^216/, '');
  const waNum = /^\d{8}$/.test(waPhone) ? '216' + waPhone : waPhone;
  const waMsg = encodeURIComponent(`Bonjour ${o.customer_name}, votre commande Trust Net #${o.id} (${fmt(o.total)}) est : ${o.status}. Merci !`);
  return `<tr><td>${o.id}</td><td>${esc(o.customer_name)}<br><small>${esc(o.phone)}</small>${o.operator ? `<br><small>📱 ${esc(o.operator)} — ${esc(o.recharge_phone || '')}</small>` : ''}${o.player_id ? `<br><small>💎 Player ID: ${esc(o.player_id)}</small>` : ''}<br><small>${esc(items)}</small></td><td>${fmt(o.total)}</td><td>${esc(o.payment_method)}<br><small>${esc(o.payment_ref || '')}</small></td><td><span class="status ${o.status}">${o.status}</span></td><td><select onchange="setStatus(${o.id},this.value)">${['Pending','Processing','Completed','Cancelled'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select><br><a class="btn small ghost" target="_blank" href="https://wa.me/${waNum}?text=${waMsg}" style="margin-top:6px;display:inline-block">💬 ${t('notifyClient')}</a></td></tr>`;
}
function renderRecent(){
  $('#recentOrders').innerHTML = orders.length
    ? `<table><tr><th>#</th><th>${t('customer')}</th><th>${t('total')}</th><th>${t('payMethod')}</th><th>${t('status')}</th><th>${t('actions')}</th></tr>${orders.slice(0, 5).map(orderRow).join('')}</table>`
    : `<p>${t('noOrders')}</p>`;
}
function renderOrders(){
  const f = $('#orderStatusFilter') ? $('#orderStatusFilter').value : '';
  const q = ($('#orderSearch') ? $('#orderSearch').value : '').toLowerCase();
  const list = orders.filter(o => (!f || o.status === f) && (!q || [o.customer_name, o.phone, o.player_id, String(o.id)].join(' ').toLowerCase().includes(q)));
  const box = $('#adminOrders'); if (!box) return;
  box.innerHTML = list.length
    ? `<table><tr><th>#</th><th>${t('customer')}</th><th>${t('total')}</th><th>${t('payMethod')}</th><th>${t('status')}</th><th>${t('actions')}</th></tr>${list.map(orderRow).join('')}</table>`
    : `<p>${t('noOrders')}</p>`;
}
async function setStatus(id, st){
  try { await api(`/api/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: st }) }); toast('✓ ' + st); orders = await api('/api/admin/orders'); const s = await api('/api/admin/stats'); $('#statRevenue').textContent = fmt(s.revenue); $('#statOrders').textContent = s.orders; $('#statProducts').textContent = s.products; $('#statPending').textContent = s.pending; renderRecent(); renderOrders(); }
  catch (err) { toast(err.message); }
}
function renderProducts(){
  const q = ($('#productSearch') ? $('#productSearch').value : '').toLowerCase();
  const cat = $('#productCatFilter') ? $('#productCatFilter').value : '';
  const list = products.filter(p => (!cat || p.category === cat) && (!q || p.name.toLowerCase().includes(q)));
  const box = $('#adminProducts'); if (!box) return;
  box.innerHTML = list.length ? list.map(p => `<div class="cart-item"><div>${p.image ? `<img class="thumb" src="${esc(p.image)}" alt="">` : esc(p.icon || '📦')} <b>${esc(p.name)}</b><br><small>${esc(CAT[p.category] || p.category)} • ${fmt(p.price_retail)} / ${fmt(p.price_wholesale)} — ${t('stock')} ${p.stock}${p.validity ? ' • ' + esc(p.validity) : ''}</small></div><div><button class="btn small ghost" onclick="editProduct(${p.id})">${t('edit')}</button> <button class="btn small danger" onclick="delProduct(${p.id})">${t('delete')}</button></div></div>`).join('') : `<p>${t('noProducts')}</p>`;
}
function editProduct(id){ fillForm(products.find(x => x.id === id)); openModal('productModal'); }
function newProduct(){ fillForm(null); openModal('productModal'); }
function fillForm(p){
  $('#pfId').value = p?.id || ''; $('#pfName').value = p?.name || ''; $('#pfCat').value = p?.category || 'ai';
  $('#pfDesc').value = p?.description_fr || ''; $('#pfPrice').value = p?.price_retail ?? ''; $('#pfWs').value = p?.price_wholesale ?? '';
  $('#pfDur').value = p?.duration_months || 1; $('#pfStock').value = p?.stock ?? 0; $('#pfBadge').value = p?.badge || '';
  $('#pfIcon').value = p?.icon || '📦'; $('#pfImage').value = p?.image || ''; $('#pfValidity').value = p?.validity || '';
  $('#pfFeat').checked = !!p?.featured;
}
async function saveProduct(e){
  e.preventDefault();
  const id = $('#pfId').value;
  const body = { name: $('#pfName').value, category: $('#pfCat').value, description_fr: $('#pfDesc').value, price_retail: +$('#pfPrice').value, price_wholesale: +$('#pfWs').value || +$('#pfPrice').value, duration_months: +$('#pfDur').value, stock: +$('#pfStock').value, badge: $('#pfBadge').value, icon: $('#pfIcon').value || '📦', image: $('#pfImage').value.trim(), validity: $('#pfValidity').value.trim(), featured: $('#pfFeat').checked };
  try {
    if (id) await api('/api/products/' + id, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/products', { method: 'POST', body: JSON.stringify(body) });
    closeModal('productModal'); products = await api('/api/products'); renderProducts(); toast(t('saved'));
  } catch (err) { toast(err.message); }
}
async function delProduct(id){
  if (!confirm(t('confirmDelete'))) return;
  try { await api('/api/products/' + id, { method: 'DELETE' }); products = await api('/api/products'); renderProducts(); toast(t('saved')); }
  catch (err) { toast(err.message); }
}
function renderCustomers(){
  const box = $('#adminCustomers'); if (!box) return;
  box.innerHTML = customers.length
    ? `<table><tr><th>#</th><th>${t('customer')}</th><th>Email</th><th>${t('phone') || 'Téléphone'}</th><th>Rôle</th><th>${t('date')}</th></tr>${customers.map(u => `<tr><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone || '')}</td><td>${esc(u.role)}</td><td>${esc(u.created_at || '')}</td></tr>`).join('')}</table>`
    : `<p>${t('noCustomers')}</p>`;
}
async function loadSettings(){
  try {
    const s = await api('/api/admin/settings');
    const input = $('#setWa');
    // Le placeholder « 216XXXXXXXX » (non configuré) n'est pas un numéro valide :
    // on l'affiche en placeholder plutôt que comme valeur, sinon « Enregistrer »
    // sans modification serait rejeté par l'API (400).
    if (s.whatsapp_number && /X/.test(s.whatsapp_number)) { input.value = ''; input.placeholder = s.whatsapp_number; }
    else input.value = s.whatsapp_number || '';
  } catch (err) { toast(err.message); }
}
async function saveSettings(e){
  e.preventDefault();
  try { await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ whatsapp_number: $('#setWa').value.trim() }) }); toast(t('saved')); }
  catch (err) { toast(err.message); }
}
async function changePassword(e){
  e.preventDefault();
  const cur = $('#pwCurrent').value, nw = $('#pwNew').value, nw2 = $('#pwNew2').value;
  if (nw !== nw2) return toast(t('pwMismatch'));
  try {
    await api('/api/admin/password', { method: 'PUT', body: JSON.stringify({ current_password: cur, new_password: nw }) });
    e.target.reset(); toast(t('pwChanged'));
  } catch (err) { toast(err.message); }
}

// Vérification d'accès au chargement : sans token admin valide -> écran de connexion
document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  if (!token) return showLogin();
  try {
    const me = await api('/api/auth/me');
    if (me.user.role !== 'admin') throw new Error(t('adminRequired'));
    user = me.user; localStorage.setItem('tn-user', JSON.stringify(user));
    await loadAll(); showDashboard();
  } catch (err) { token = ''; localStorage.removeItem('tn-token'); showLogin(err.message); }
});
