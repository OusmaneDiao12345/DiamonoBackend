# 🔐 Admin Dashboard - Guide de Configuration

## 📋 Vue d'ensemble
Le nouveau dashboard admin de DiamanoSN est une interface professionnelle et complète pour gérer :
- 📦 **Produits** - CRUD complet (Créer, Lire, Mettre à jour, Supprimer)
- 📋 **Commandes** - Suivi et gestion des statuts
- 👥 **Utilisateurs** - Gestion des clients
- 📊 **Dashboard** - Statistiques en temps réel
- ⚙️ **Paramètres** - Configuration du magasin

---

## 🚀 Accès au Dashboard

### URL
```
LOCAL: http://localhost:3000/admin-dashboard.html
PRODUCTION: https://diamanosn.netlify.app/admin-dashboard.html
```

### Authentification
Le dashboard utilise **Firebase Authentication**. Seuls les utilisateurs authentifiés peuvent accéder.

#### Page de Connexion
```
LOCAL: http://localhost:3000/admin-login.html
PRODUCTION: https://diamanosn.netlify.app/admin-login.html
```

#### Identifiants de Démo
- **Email** : admin@diamanosn.com
- **Mot de passe** : Admin@123

---

## 🔧 Configuration Firebase

### 1. Créer un Utilisateur Admin dans Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet `diamanosn-ea0a1`
3. Allez dans **Authentication** → **Users**
4. Cliquez sur **Add User**
5. Entrez :
   - Email: `admin@diamanosn.com`
   - Password: `Admin@123` (ou votre mot de passe)
6. Cliquez **Create User**

### 2. Activer la Méthode de Connexion

1. Dans **Authentication** → **Sign-in method**
2. Assurez-vous que **Email/Password** est activé
3. (Optionnel) Activez **Google Sign-In** pour connexion Google

### 3. Configuration Firestore (Base de Données)

Les collections suivantes sont créées automatiquement :

#### `products`
```json
{
  "name": "Bague Diamant",
  "category": "bijoux",
  "price": 150000,
  "stock": 10,
  "image": "https://...",
  "description": "Une belle bague diamant",
  "active": true,
  "createdAt": "2024-05-07T10:00:00Z"
}
```

#### `orders`
```json
{
  "customerId": "user-id",
  "customerEmail": "client@example.com",
  "total": 300000,
  "items": [
    {
      "productId": "prod-id",
      "name": "Bague Diamant",
      "quantity": 2,
      "price": 150000
    }
  ],
  "status": "pending", // pending, completed, cancelled
  "address": "...",
  "createdAt": "2024-05-07T10:00:00Z"
}
```

#### `users`
```json
{
  "email": "client@example.com",
  "name": "Client Name",
  "phone": "+221 77 XXX XXXX",
  "address": "...",
  "orderCount": 0,
  "createdAt": "2024-05-07T10:00:00Z"
}
```

---

## 📱 Fonctionnalités du Dashboard

### 1. Dashboard (Accueil)
- **Statistiques en Direct** :
  - Total de produits actifs
  - Nombre de commandes
  - Chiffre d'affaires total
  - Nombre de clients enregistrés
- **Dernières Commandes** - Affichage des 5 dernières
- **Statuts des Commandes** - Graphique en barres

### 2. Gestion des Produits
**Actions disponibles** :
- ➕ **Ajouter** - Nouveau produit
- ✏️ **Modifier** - Éditer un produit
- ❌ **Supprimer** - Supprimer un produit
- 🔍 **Rechercher** - Chercher par nom

**Champs du produit** :
- Nom (obligatoire)
- Catégorie (bijoux, montres, accessoires)
- Prix en FCFA (obligatoire)
- Stock (obligatoire)
- Image (URL optionnelle)
- Description
- Statut Actif/Inactif

### 3. Gestion des Commandes
**Actions disponibles** :
- 👁️ **Voir détails** - Afficher la commande complète
- 📊 **Changer statut** - Mettre à jour le statut
- 🔍 **Rechercher** - Chercher par ID ou client

**Statuts disponibles** :
- ⏳ **En attente** (pending)
- ✅ **Complétée** (completed)
- ❌ **Annulée** (cancelled)

### 4. Gestion des Utilisateurs
- 👁️ **Voir profil** - Détails de l'utilisateur
- 📊 **Historique** - Nombre de commandes
- 🔍 **Rechercher** - Chercher par email

### 5. Paramètres
- **Nom du magasin**
- **Email de contact**
- **Téléphone**
- **Informations système** - Version, BD, utilisateur connecté

---

## 🛡️ Sécurité

### Règles Firestore Recommandées

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin only
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
    
    match /orders/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth.token.admin == true;
    }
    
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

### Authentification Admin
Pour ajouter un utilisateur comme admin dans Firebase :

1. **Via Firebase Console** :
   - Authentication → Users
   - Cliquez sur l'utilisateur
   - Sélectionnez **Custom Claims**
   - Ajoutez : `{"admin": true}`

2. **Avec Node.js** :
```javascript
const admin = require('firebase-admin');

admin.auth().setCustomUserClaims('uid', { admin: true })
  .then(() => console.log('Admin claim set'));
```

---

## 🔗 Intégration avec votre Backend (server.js)

Les routes suivantes doivent être disponibles :

### Produits
```
GET  /api/products
POST /api/products (admin only)
PUT  /api/products/:id (admin only)
DELETE /api/products/:id (admin only)
```

### Commandes
```
GET /api/orders (admin only)
PUT /api/orders/:id (admin only)
```

### Utilisateurs
```
GET /api/users (admin only)
```

**Exemple d'implémentation (server.js)** :
```javascript
// Middleware pour vérifier admin
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (decodedToken.admin === true) {
      req.user = decodedToken;
      next();
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Routes admin
app.get('/api/products', (req, res) => {
  // Retourner tous les produits
});

app.post('/api/products', verifyAdmin, (req, res) => {
  // Créer un produit
});
```

---

## 📲 Responsive Design

Le dashboard est entièrement responsive :
- ✅ Desktop (1200px+)
- ✅ Tablette (768px - 1199px)
- ✅ Mobile (< 768px)

Sur mobile, la sidebar se transforme en menu hamburger.

---

## 🎨 Personnalisation

### Couleurs
Modifiez les variables CSS dans `admin-dashboard.html` :

```css
:root {
    --primary: #667eea;      /* Couleur primaire */
    --secondary: #764ba2;    /* Couleur secondaire */
    --danger: #f56565;       /* Couleur danger */
    --success: #48bb78;      /* Couleur succès */
    --warning: #ed8936;      /* Couleur warning */
}
```

### Logo
Remplacez l'icône `<i class="bi bi-gem"></i>` par votre logo.

---

## 🐛 Troubleshooting

### Problème : "Utilisateur non trouvé"
**Solution** : Créez d'abord l'utilisateur dans Firebase Console → Authentication → Users

### Problème : Les produits ne s'affichent pas
**Solutions** :
1. Vérifiez que Firestore est bien initialisé
2. Vérifiez les règles de sécurité Firestore
3. Vérifiez la connexion internet

### Problème : Impossible de modifier les produits
**Solution** : Assurez-vous que l'utilisateur a le custom claim `admin: true`

### Problème : Page blanche après connexion
**Solutions** :
1. Vérifiez la console browser (F12 → Console)
2. Vérifiez que Firebase est bien chargé
3. Assurez-vous que l'ID du projet Firebase est correct

---

## 📞 Support

Pour des problèmes :
1. Vérifiez les logs Firebase Console
2. Vérifiez la console browser (F12)
3. Consultez la documentation Firebase officielle

---

## ✅ Checklist de Déploiement

- [ ] Utilisateur admin créé dans Firebase
- [ ] Custom claim `admin: true` défini
- [ ] Règles Firestore configurées
- [ ] Firebase SDK importé correctement
- [ ] URLs de redirection mises à jour
- [ ] CORS configuré correctement
- [ ] Page de connexion testée
- [ ] Dashboard testé en local
- [ ] Déployé sur Render (backend) et Netlify (frontend)

---

**Bienvenue dans votre nouvel Admin Dashboard DiamanoSN! 🎉**
