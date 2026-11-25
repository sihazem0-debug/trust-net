# Trust Net — Handover / Guide de mise en ligne

## Ce qui est livré et vérifié

1. **Code exportable renommé Trust Net** — catalogue 73 produits (23 abonnements + 42 recharge mobile + 8 Free Fire), panier, checkout D17 / Flouci / manuel, comptes clients, admin, WhatsApp, FR/AR, TND, image par produit. Tests curl tous réussis (voir README). La boutique live Trust Net est aussi à jour (renommée et nouveau style néon, 2026-11-24).
2. **Code exportable** — `~/workspace/z-mind/` (Node 24 + Express + SQLite, vanilla JS, JWT + bcrypt). Base re-seedée propre, aucun ordre de test.
3. **README.md** — stack, API, déploiement Render / VPS, paiements.

## Premiers pas — à faire avant de vendre

- [ ] Ouvrir la boutique live, se connecter en admin : `admin@trustnet.tn` / `admin123`
- [ ] Changer le mot de passe admin dans Admin → Paramètres (ne pas garder `admin123`)
- [ ] Remplacer le numéro WhatsApp dans Admin → Paramètres par ton vrai numéro
- [ ] Vérifier / ajuster les 73 prix (détail et gros) dans l'admin — ce sont des prix de départ modifiables
- [ ] Tester la page Recharge Mobile : opérateur + numéro tunisien + montant, commande créée avec opérateur et numéro visibles dans l'admin
- [ ] Tester une commande Free Fire 110 diamants avec un Player ID — la commande doit être refusée sans Player ID
- [ ] Tester une commande complète toi-même : panier → checkout D17 → commande reçue → statut `Pending` → `Completed` dans l'admin
- [ ] Vérifier le stock de chaque produit

## Déploiement indépendant (code exportable)

Option recommandée : **Render**
1. Pousser `z-mind/` sur GitHub.
2. Render → New Web Service → Build `npm install`, Start `npm start`.
3. Variables : `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WHATSAPP_NUMBER`.
4. Ajouter un Persistent Disk, sinon `z-mind.db` est perdu à chaque redéploiement.

Option contrôle total : **VPS Hostinger (Ubuntu)**
`sudo apt install nodejs npm nginx`, `npm install --production`, `.env`, PM2 (`pm2 start server.js --name z-mind`), Nginx reverse-proxy vers `localhost:3000`, Let's Encrypt.

Vercel déconseillé tel quel (serverless, pas de disque persistant pour SQLite).

## Paiements — état actuel

Fonctionne sans identifiant : le client choisit D17 / Flouci / manuel, saisit sa référence, tu confirmes dans l'admin (`Pending` → `Completed`).

Pour l'automatique, il faut — et seulement quand tu es prêt :
- **D17** : compte marchand D17 + clés API + URL de callback.
- **Flouci** : compte Flouci Business → `FLOUCI_APP_TOKEN` + `FLOUCI_APP_SECRET` (developers.flouci.com).
- **WhatsApp Business API** : compte Meta Business + token. Sans cela, le lien `wa.me` gratuit suffit.

Ne jamais mettre de secret dans le code — uniquement `.env` / variables d'hébergeur.

## Lancer en local (Windows)

Le dossier `~/workspace/z-mind` est sur le serveur Muse, pas sur ton PC. Télécharge d'abord le zip, extrais-le dans `C:\Users\Alaho\z-mind`, puis :
```
cd C:\Users\Alaho\z-mind
npm install
npm start
```
Ouvrir http://localhost:3000

## Support

- Catalogue, prix, stock, commandes : tout se gère dans l'admin, sans toucher au code.
- Si un produit / prix change, modifie-le dans l'admin — pas besoin de redéployer.
