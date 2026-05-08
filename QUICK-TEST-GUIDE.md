# 🧪 Quick Test Guide - Admin Dashboard

## ✅ Checklist Rapide

### 1️⃣ Récupérer les Vraies Clés Firebase
- [ ] Allez à https://console.firebase.google.com
- [ ] Projet: `diamanosn-ea0a1`
- [ ] Project Settings → Your apps → Web
- [ ] Copiez: `apiKey`, `messagingSenderId`, `appId`

### 2️⃣ Mettre à Jour `.env`
```bash
# Dans C:\Users\HP\Desktop\Projet Professionnel\diamanosn\.env
# Trouvez la section (ligne ~40):

FIREBASE_API_KEY=VOTRE_CLÉ_ICI
FIREBASE_MESSAGING_SENDER_ID=VOTRE_ID_ICI
FIREBASE_APP_ID=VOTRE_APP_ID_ICI
```

### 3️⃣ Créer Admin User
- [ ] Firebase Console → Authentication
- [ ] Create user
- [ ] Email: `admin@diamanosn.com`
- [ ] Password: `Admin@123`

### 4️⃣ Redémarrer le Serveur
```powershell
# Arrêter l'ancien (Ctrl+C dans le terminal)
# Redémarrer:
node server.js
```

### 5️⃣ Vérifier l'Endpoint
```bash
# Dans PowerShell:
curl http://localhost:3000/api/config/firebase

# Vous devriez voir votre VRAIE clé
```

### 6️⃣ Tester le Login
- [ ] Ouvrez: http://localhost:3000/admin-login.html
- [ ] Email: `admin@diamanosn.com`
- [ ] Password: `Admin@123`
- [ ] Cliquez "Sign in"

### 7️⃣ Vérifier le Dashboard
- [ ] Vous devriez être redirigé vers `/admin-dashboard.html`
- [ ] Vérifiez les sections:
  - [x] Dashboard (stats)
  - [x] Products (liste)
  - [x] Orders (liste)
  - [x] Users (liste)

---

## 🔍 Dépannage Rapide

### Problème: "api-key-not-valid"
```bash
# Solution:
1. Vérifiez `.env` a la VRAIE clé
2. Redémarrez: node server.js
3. Vide le cache: Ctrl+Shift+Del
```

### Problème: "Cannot log in"
```bash
# Solution:
1. Allez à Firebase Console → Authentication
2. Créez admin@diamanosn.com avec Password: Admin@123
3. Vérifiez que Authentication est activée
```

### Problème: Dashboard vide
```bash
# Solution:
1. Allez à Firestore Database
2. Créez collections: products, orders, users
3. Ajoutez au moins 1 document
```

---

## 📊 Tester les Collectes Firestore

### Créer une Collecte de Test

1. Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `products`
4. Click "Next"
5. Document ID: `test-1`
6. Ajoutez ces champs:

| Field | Type | Value |
|-------|------|-------|
| name | String | Diamant Bleu |
| price | Number | 5000 |
| stock | Number | 5 |
| description | String | Un beau diamant bleu |
| category | String | diamond |

7. Click "Save"

### Vérifier dans le Dashboard
- [ ] Allez à http://localhost:3000/admin-dashboard.html
- [ ] Section "Products" devrait montrer le produit
- [ ] Nombre total de produits: 1

---

## 🚀 Après le Test Local

### Deployer sur Render

1. Allez à https://render.com/dashboard
2. Sélectionnez `diamonobackend`
3. Environment → Ajouter les variables:
   - `FIREBASE_API_KEY=` (votre clé)
   - `FIREBASE_MESSAGING_SENDER_ID=` (votre ID)
   - `FIREBASE_APP_ID=` (votre App ID)
4. Click "Save"
5. Redéployer: Deployments → Deploy latest commit

### Frontend sur Netlify

L'admin pages sont servies via:
- http://localhost:3000/admin-login.html (local)
- https://diamonobackend.onrender.com/admin-login.html (production)

Ou directement:
- https://diamanosn.netlify.app/admin-login.html

---

## ✨ Fonctionnalités du Dashboard

### 📊 Dashboard Tab
- Total Products: Nombre de produits
- Total Orders: Nombre de commandes
- Total Revenue: Revenu total
- Total Customers: Nombre de clients

### 📦 Products Tab
- **Create**: Formulaire pour ajouter produit
- **Search**: Chercher un produit
- **Edit**: Modifier un produit
- **Delete**: Supprimer un produit

### 📋 Orders Tab
- **List**: Toutes les commandes
- **Status**: Changer le statut (pending → completed → cancelled)
- **Details**: Voir les détails

### 👥 Users Tab
- **List**: Tous les clients
- **Order History**: Voir commandes d'un client

### ⚙️ Settings Tab
- **Store Config**: Configurations du magasin

---

## 🎯 Prochaines Étapes

1. ✅ Obtenir vraie clé Firebase
2. ✅ Mettre à jour `.env`
3. ✅ Redémarrer serveur
4. ✅ Créer admin user
5. ✅ Tester login
6. ✅ Tester dashboard
7. ⏭️ Configurer Firestore Security Rules
8. ⏭️ Ajouter plus de produits
9. ⏭️ Tester intégration SenePay

---

Besoin d'aide? Consultez **FIREBASE-SETUP-GUIDE.md** pour les détails complets! 🚀
