# Trust Net — Boutique e-commerce de produits digitaux, recharge mobile & Free Fire (Tunisie)

Boutique complète et fonctionnelle (73 produits) : catalogue, panier, commande,
comptes clients, tableau de bord admin, prix détail / gros, paiement D17 / Flouci /
manuel, support WhatsApp. Recharge mobile (Tunisie Télécom, Ooredoo, Orange :
forfaits internet + crédit 5/10/20/50 DT), diamants Free Fire (Player ID requis,
jamais de mot de passe) et image pour chaque produit. Français (principal) +
arabe, prix en TND, design sombre premium noir / argent / vert néon.

## Stack
- **Node.js 24 + Express** (backend, API REST)
- **SQLite** (`node:sqlite`, natif — aucun service externe, fichier `z-mind.db`)
- **Vanilla JS** (frontend servi depuis `/public`, aucune build step)
- **JWT + bcryptjs** (authentification)
- Aucun service payant requis pour faire tourner la boutique.

## Démarrage local
```bash
cd z-mind
cp .env.example .env   # puis éditez WHATSAPP_NUMBER, JWT_SECRET, ADMIN_PASSWORD
npm install
npm start              # http://localhost:3000
```
Compte admin initial (à changer immédiatement) :
- Email : `admin@trustnet.tn` — Mot de passe : `admin123`
- Changez-le via `ADMIN_EMAIL` / `ADMIN_PASSWORD` dans `.env` **avant** le premier
  démarrage (supprimez `z-mind.db` si la base existe déjà), ou créez un nouvel admin
  en base et supprimez l'ancien.

## Fonctionnalités vérifiées
- Accueil : catégories, produits à la une, offres
- Catalogue : recherche, filtre catégorie, filtre prix max, fiche détail
- Panier (localStorage) avec choix prix détail / gros par ligne
- Commande : nom, téléphone, email, paiement D17 / Flouci / manuel + référence
- Recharge mobile : page dédiée (opérateur, numéro tunisien validé, montant 5/10/20/50/100 DT) — l'opérateur et le numéro sont enregistrés dans la commande
- Gaming : Player ID Free Fire obligatoire au checkout pour les diamants / Membership / Booyah Pass
- Images : chaque produit a une image (`/public/images/*.svg` par marque : Netflix, Spotify, ChatGPT, TT, Ooredoo, Orange, Free Fire…) affichée dans le catalogue, la fiche détail et le panier
- Statuts : `Pending` → `Processing` → `Completed` / `Cancelled`
- Comptes clients : inscription / connexion, historique des commandes
- Admin : page séparée `/admin` (lien discret « Espace Admin » dans le pied de page
  de la boutique) avec écran de connexion propre — statistiques (revenu, commandes,
  produits, en attente), ajout / édition / suppression de produits, prix et stock,
  changement de statut des commandes, liste des clients, paramètres (numéro
  WhatsApp, changement du mot de passe admin). Sans token admin, `/admin` affiche
  l'écran de connexion et les API `/api/admin/*` répondent 401/403.
- WhatsApp : bouton flottant + lien `wa.me` pré-rempli avec le détail de la commande
  (numéro configurable via `WHATSAPP_NUMBER`)

## API (résumé)
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/products?search=&category=&maxPrice=` | public |
| GET | `/api/products/:id` | public |
| POST/PUT/DELETE | `/api/products` | admin |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | connecté |
| POST | `/api/orders` | public (lié au compte si token) — accepte `operator`, `recharge_phone`, `player_id`, `order_type` |
| GET | `/api/orders/my` | connecté |
| GET | `/api/admin/stats`, `/api/admin/orders` | admin |
| PUT | `/api/admin/orders/:id/status` | admin |
| GET | `/api/admin/users` | admin |
| GET/PUT | `/api/admin/settings` (numéro WhatsApp) | admin |
| PUT | `/api/admin/password` (changer le mot de passe admin) | admin |

## Déploiement

### Render (recommandé, gratuit)
1. Poussez ce dossier sur GitHub.
2. Render → New Web Service → dépôt → Build `npm install`, Start `npm start`.
3. Variables d'environnement : `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WHATSAPP_NUMBER`.
4. ⚠️ Le disque Render gratuit est éphémère : ajoutez un **Persistent Disk**
   (ou passez à PostgreSQL) pour ne pas perdre `z-mind.db` à chaque redéploiement.

### Vercel
Vercel est serverless : le serveur Express + SQLite local ne convient pas tel quel
(fonctions éphémères, pas de disque persistant). Pour Vercel, hébergez l'API
ailleurs (Render/Railway) et déployez uniquement `/public` en site statique, ou
migrez la base vers Turso/Postgres. **Render / VPS est le choix simple.**

### VPS Hostinger (contrôle total)
```bash
# Sur le VPS (Ubuntu)
sudo apt update && sudo apt install -y nodejs npm nginx
git clone <votre-repo> && cd z-mind && npm install --production
cp .env.example .env && nano .env
# Lancer avec PM2
npm i -g pm2 && pm2 start server.js --name z-mind && pm2 save
# Nginx en reverse-proxy vers http://localhost:3000 + certificat Let's Encrypt
```

## Paiements réels — ce qu'il faut
La boutique fonctionne **sans** ces identifiants : le client choisit D17 / Flouci /
manuel, saisit sa référence, et vous confirmez la commande dans l'admin
(statut `Pending` → `Completed`). C'est le flux standard en Tunisie.

Pour une confirmation **automatique**, il faut :
- **D17** : compte marchand D17 (via votre banque / D17) → identifiants API
  marchands + URL de callback. Intégration à ajouter dans `src/routes/orders.js`
  (création de transaction + webhook de confirmation).
- **Flouci** : compte Flouci Business → `FLOUCI_APP_TOKEN` + `FLOUCI_APP_SECRET`
  (developers.flouci.com) → créer un paiement via leur API, vérifier le statut
  par webhook.
- **WhatsApp Business API** (notifications automatiques) : compte Meta Business +
  numéro WhatsApp Business + token d'accès (`WHATSAPP_BUSINESS_API_TOKEN`).
  Sans cela, la boutique utilise déjà un lien `wa.me` (gratuit, manuel) qui
  pré-remplit le message de commande — suffisant pour démarrer.
- **Ne mettez jamais de secrets dans le code** : uniquement dans `.env` / variables
  d'environnement de l'hébergeur.

## Structure
```
z-mind/
├── server.js            # Entrée Express, fichiers statiques, routes API
├── src/db.js            # SQLite + seed (73 produits, admin)
├── src/auth.js          # JWT, middlewares authRequired / adminRequired
├── src/routes/auth.js   # register / login / me
├── src/routes/products.js  # catalogue public + CRUD admin
├── src/routes/orders.js    # création commande, historique client
├── src/routes/admin.js     # stats, commandes, statuts, utilisateurs, paramètres, mot de passe
├── public/index.html    # Boutique + page Recharge Mobile (lien « Espace Admin » en pied de page)
├── public/admin.html    # Page admin séparée, servie sur GET /admin
├── public/admin.js      # Tableau de bord admin : stats, commandes, produits, clients, paramètres, FR/AR
├── public/images/       # Images SVG par marque (une image par produit)
├── public/styles.css    # Thème noir / argent / vert néon, mobile-first (+ styles admin)
├── public/app.js        # Catalogue, panier, checkout, auth, FR/AR (sans admin)
├── .env.example
└── README.md
```
