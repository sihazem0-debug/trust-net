const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { signToken, authRequired } = require('../auth');
const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum' });
  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase())) return res.status(409).json({ error: 'Email déjà utilisé' });
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare('INSERT INTO users (name,email,password_hash,phone,role) VALUES (?,?,?,?,?)').run(name, email.toLowerCase(), hash, phone || '', 'customer');
  const user = db.prepare('SELECT id,name,email,phone,role FROM users WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json({ user, token: signToken(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  const safe = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
  res.json({ user: safe, token: signToken(safe) });
});

router.get('/me', authRequired, (req, res) => {
  const user = getDb().prepare('SELECT id,name,email,phone,role,created_at FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user });
});
module.exports = router;
