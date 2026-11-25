const express = require('express');
const { getDb } = require('../db');
const { authRequired } = require('../auth');
const router = express.Router();
const METHODS = ['D17', 'Flouci', 'Paiement manuel'];
const STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled'];

// Create order — public (guest checkout allowed), authenticated if token present
router.post('/', (req, res) => {
  const { customer_name, phone, email, payment_method, payment_ref, items, operator, recharge_phone, player_id, order_type } = req.body || {};
  if (!customer_name || !phone) return res.status(400).json({ error: 'Nom et téléphone requis' });
  if (!payment_method || !METHODS.includes(payment_method)) return res.status(400).json({ error: 'Méthode de paiement invalide (D17, Flouci ou Paiement manuel)' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Panier vide' });
  const OPERATORS = ['Tunisie Télécom', 'Ooredoo', 'Orange'];
  const tnPhone = v => /^\+?216\s?\d{8}$/.test(String(v || '').replace(/[\s-]/g, '')) || /^[2579]\d{7}$/.test(String(v || '').replace(/[\s-]/g, ''));
  if (operator && !OPERATORS.includes(operator)) return res.status(400).json({ error: 'Opérateur invalide (Tunisie Télécom, Ooredoo ou Orange)' });
  if (operator && !tnPhone(recharge_phone || phone)) return res.status(400).json({ error: 'Numéro tunisien invalide (8 chiffres, ex : 20123456 ou +21620123456)' });
  const db = getDb();
  let total = 0; const lines = [];
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(it.product_id);
    if (!p) return res.status(400).json({ error: `Produit ${it.product_id} introuvable` });
    const qty = Math.max(1, Number(it.qty) || 1);
    if (p.stock < qty) return res.status(400).json({ error: `Stock insuffisant pour ${p.name}` });
    const unit = it.price_type === 'wholesale' ? p.price_wholesale : p.price_retail;
    total += unit * qty;
    lines.push({ product_id: p.id, name: p.name, icon: p.icon, image: p.image || '', category: p.category, qty, unit_price: unit, price_type: it.price_type || 'retail' });
  }
  total = Math.round(total * 100) / 100;
  const hasGaming = lines.some(l => l.category === 'gaming');
  if (hasGaming && !String(player_id || '').trim()) return res.status(400).json({ error: 'Player ID Free Fire requis (jamais de mot de passe)' });
  // Optional user link
  let user_id = null;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) { try { user_id = require('jsonwebtoken').verify(h.slice(7), process.env.JWT_SECRET || 'trust-net-dev-secret-change-me').id; } catch {} }
  const r = db.prepare(`INSERT INTO orders (user_id,customer_name,phone,email,payment_method,payment_ref,total,status,items_json,operator,recharge_phone,player_id,order_type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(user_id, customer_name, phone, email || '', payment_method, payment_ref || '', total, 'Pending', JSON.stringify(lines), operator || '', recharge_phone || '', String(player_id || '').trim(), order_type || 'store');
  for (const l of lines) db.prepare('UPDATE products SET stock = stock - ? WHERE id=?').run(l.qty, l.product_id);
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json({ ...order, items: lines, whatsapp: whatsappLink(order, lines) });
});

function whatsappLink(order, lines) {
  const { getSetting } = require('../db');
  const num = getSetting('whatsapp_number') || process.env.WHATSAPP_NUMBER || '216XXXXXXXX';
  const extra = [order.operator ? 'Opérateur: ' + order.operator : '', (order.recharge_phone || order.operator) ? 'N° à recharger: ' + (order.recharge_phone || order.phone) : '', order.player_id ? 'Player ID: ' + order.player_id : ''].filter(Boolean).join(', ');
  const msg = `Bonjour Trust Net ! Nouvelle commande #${order.id} — ${order.customer_name}, Total: ${order.total} TND, Paiement: ${order.payment_method}${order.payment_ref ? ' (Réf: ' + order.payment_ref + ')' : ''}${extra ? '. ' + extra : ''}. Produits: ${lines.map(l => l.name + ' x' + l.qty).join(', ')}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

// Customer order history (auth)
router.get('/my', authRequired, (req, res) => {
  const rows = getDb().prepare('SELECT * FROM orders WHERE user_id=? OR email=? ORDER BY id DESC').all(req.user.id, req.user.email);
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items_json) })));
});
router.get('/:id', (req, res) => {
  const o = getDb().prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Commande introuvable' });
  res.json({ ...o, items: JSON.parse(o.items_json) });
});
module.exports = router;
