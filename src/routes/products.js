const express = require('express');
const { getDb } = require('../db');
const { adminRequired } = require('../auth');
const router = express.Router();

function row(p) { return p; }

// Public: list with search / category / price filters
router.get('/', (req, res) => {
  const { search = '', category = '', minPrice = '', maxPrice = '' } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1', args = [];
  if (category) { sql += ' AND category=?'; args.push(category); }
  if (search) { sql += ' AND (name LIKE ? OR description_fr LIKE ?)'; args.push(`%${search}%`, `%${search}%`); }
  if (minPrice !== '') { sql += ' AND price_retail>=?'; args.push(Number(minPrice)); }
  if (maxPrice !== '') { sql += ' AND price_retail<=?'; args.push(Number(maxPrice)); }
  sql += ' ORDER BY featured DESC, name ASC';
  res.json(getDb().prepare(sql).all(...args).map(row));
});
router.get('/:id', (req, res) => {
  const p = getDb().prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(p);
});
// Admin CRUD
router.post('/', adminRequired, (req, res) => {
  const { name, category, description_fr, description_ar, price_retail, price_wholesale, duration_months, stock, badge, icon, featured, image, validity } = req.body || {};
  if (!name || !category || price_retail == null) return res.status(400).json({ error: 'Nom, catégorie et prix requis' });
  const r = getDb().prepare(`INSERT INTO products (name,category,description_fr,description_ar,price_retail,price_wholesale,duration_months,stock,badge,icon,featured,image,validity) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(name, category, description_fr || '', description_ar || '', price_retail, price_wholesale ?? price_retail, duration_months || 1, stock ?? 0, badge || '', icon || '📦', featured ? 1 : 0, image || '', validity || '');
  res.status(201).json(getDb().prepare('SELECT * FROM products WHERE id=?').get(r.lastInsertRowid));
});
router.put('/:id', adminRequired, (req, res) => {
  const db = getDb();
  const cur = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Produit introuvable' });
  const b = req.body || {};
  const v = { ...cur, ...b, featured: b.featured !== undefined ? (b.featured ? 1 : 0) : cur.featured };
  db.prepare(`UPDATE products SET name=?,category=?,description_fr=?,description_ar=?,price_retail=?,price_wholesale=?,duration_months=?,stock=?,badge=?,icon=?,featured=?,image=?,validity=? WHERE id=?`)
    .run(v.name, v.category, v.description_fr, v.description_ar, v.price_retail, v.price_wholesale, v.duration_months, v.stock, v.badge, v.icon, v.featured, v.image || '', v.validity || '', req.params.id);
  res.json(db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id));
});
router.delete('/:id', adminRequired, (req, res) => {
  const r = getDb().prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Produit introuvable' });
  res.json({ ok: true });
});
module.exports = router;
