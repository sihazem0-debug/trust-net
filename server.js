// Trust Net — serveur Express
try { require('dotenv').config(); } catch { /* dotenv optionnel */ }
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, getSetting } = require('./src/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
initDb();

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Trust Net', version: '1.0.0' }));
app.get('/api/config', (req, res) => res.json({ whatsapp_number: getSetting('whatsapp_number') || process.env.WHATSAPP_NUMBER || '216XXXXXXXX', currency: 'TND' }));
// Page admin séparée (la protection est vérifiée côté client via /api/auth/me ;
// toutes les API /api/admin/* exigent un token admin, sinon 401/403)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));
// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Trust Net en ligne sur http://localhost:${PORT}`));
module.exports = app;
