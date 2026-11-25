const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, getSetting, setSetting } = require('../db');
const { adminRequired } = require('../auth');
const router = express.Router();
const STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled'];

// Paramètres de la boutique (numéro WhatsApp)
router.get('/settings', adminRequired, (req, res) => {
  res.json({ whatsapp_number: getSetting('whatsapp_number') || process.env.WHATSAPP_NUMBER || '216XXXXXXXX' });
});
router.put('/settings', adminRequired, (req, res) => {
  const { whatsapp_number } = req.body || {};
  const num = String(whatsapp_number || '').replace(/[\s+]/g, '');
  if (!/^\d{8,15}$/.test(num)) return res.status(400).json({ error: 'Numéro WhatsApp invalide (8 à 15 chiffres, ex : 21620123456)' });
  setSetting('whatsapp_number', num);
  res.json({ whatsapp_number: num });
});
// Changement du mot de passe admin
router.put('/password', adminRequired, (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Nouveau mot de passe : 6 caractères minimum' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ ok: true });
});

router.get('/stats', adminRequired, (req, res) => {
  const db = getDb();
  const revenue = db.prepare(`SELECT COALESCE(SUM(total),0) s FROM orders WHERE status!='Cancelled'`).get().s;
  const orders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const products = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  const pending = db.prepare(`SELECT COUNT(*) c FROM orders WHERE status='Pending'`).get().c;
  res.json({ revenue, orders, products, pending });
});
router.get('/orders', adminRequired, (req, res) => {
  const rows = getDb().prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items_json) })));
});
router.put('/orders/:id/status', adminRequired, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Statut invalide : ' + STATUSES.join(', ') });
  const db = getDb();
  const r = db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id));
});
router.get('/users', adminRequired, (req, res) => {
  res.json(getDb().prepare('SELECT id,name,email,phone,role,created_at FROM users ORDER BY id DESC').all());
});
module.exports = router;
