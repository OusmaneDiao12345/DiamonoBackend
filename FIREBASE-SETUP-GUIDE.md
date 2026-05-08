# 🔥 Firebase Configuration Guide

## ⚠️ IMPORTANT - Clé API Web Firebase

Votre configuration actuelle utilise des **clés temporaires**. Vous devez les remplacer par vos vraies clés Firebase.

---

## 📋 Étape 1: Obtenir la Clé API Firebase Web

### 🎯 Accédez à Firebase Console

1. Allez à: **https://console.firebase.google.com**
2. Connectez-vous avec votre compte Google
3. Sélectionnez le projet **`diamanosn-ea0a1`**

### 🔑 Trouvez Votre Clé Web

1. Cliquez sur **⚙️ Project Settings** (en bas à gauche)
2. Allez à l'onglet **"Your apps"**
3. Cherchez l'app **"Web"** (elle ressemble à `</>`):
   ```
   Nom: Diamanosn Web
   Web SDK setup and configuration: </>
   ```

### 📝 Copiez les Valeurs

Cherchez ce bloc **Firebase Configuration**:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← COPY THIS
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",      // ← COPY THIS
  appId: "..."                   // ← COPY THIS
};
```

---

## 🔧 Étape 2: Mettre à Jour .env

Modifiez le fichier `.env` dans votre dossier diamanosn:

```bash
# Trouvez ces lignes (environ ligne 40-42)
FIREBASE_API_KEY=AIzaSyAKh7xMUjvN0V2X3Q4R5S6T7U8V9W0X1Y2Z
FIREBASE_MESSAGING_SENDER_ID=104015846341111283274
FIREBASE_APP_ID=1:104015846341111283274:web:abc123def456ghi789jkl

# Remplacez par les VRAIES valeurs de Firebase Console:
FIREBASE_API_KEY=AIzaSy... (votre vraie clé)
FIREBASE_MESSAGING_SENDER_ID=... (votre ID)
FIREBASE_APP_ID=... (votre App ID)
```

**⚠️ IMPORTANT**: 
- `.env` ne doit PAS être commité (il est dans `.gitignore`)
- Les clés ne doivent jamais être dans GitHub
- Pour Render: Ajouter les variables dans le dashboard Render

---

## ✅ Étape 3: Vérifier la Configuration

### 1️⃣ Redémarrer le Server

```powershell
# Terminal PowerShell dans le dossier diamanosn
node server.js
```

Vous devriez voir:
```
✅ Firebase Admin SDK initialized successfully
🚀 Server running on http://localhost:3000
```

### 2️⃣ Vérifier l'Endpoint Firebase Config

Ouvrez votre navigateur et allez à:
```
http://localhost:3000/api/config/firebase
```

Vous devriez voir quelque chose comme:
```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "diamanosn-ea0a1.firebaseapp.com",
  "projectId": "diamanosn-ea0a1",
  "storageBucket": "diamanosn-ea0a1.appspot.com",
  "messagingSenderId": "...",
  "appId": "..."
}
```

---

## 👤 Étape 4: Créer un Utilisateur Admin

### Dans Firebase Console

1. Allez à **Authentication** (menu de gauche)
2. Cliquez sur **"Create user"** ou **"Add user"**
3. Remplissez:
   - **Email**: `admin@diamanosn.com`
   - **Password**: `Admin@123`
4. Cliquez sur **"Create user"**

---

## 🔐 Étape 5: Configurer Firestore Security Rules

### 1️⃣ Allez à Firestore Database

1. **Firestore Database** (menu de gauche)
2. Cliquez sur l'onglet **"Rules"**

### 2️⃣ Copiez les Règles de Sécurité

Remplacez le contenu par:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin users can read/write anything
    match /{document=**} {
      allow read, write: if request.auth.uid != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Public read for products
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

3. Cliquez sur **"Publish"**

---

## 🧪 Étape 6: Tester le Admin Login

### 1️⃣ Ouvrez le Login Page

```
http://localhost:3000/admin-login.html
```

### 2️⃣ Connectez-vous

- **Email**: `admin@diamanosn.com`
- **Password**: `Admin@123`
- Cliquez **"Sign in"**

### 3️⃣ Vérifiez le Dashboard

Après connexion, vous devriez voir:
- ✅ Redirection vers `/admin-dashboard.html`
- ✅ Sidebar avec menu (Dashboard, Products, Orders, etc.)
- ✅ Données en temps réel depuis Firestore

---

## 📦 Étape 7: Créer les Collections Firestore

Si vous n'avez pas de produits, créez une collection de test:

### 1️⃣ Firestore Database

1. Cliquez **"Start collection"**
2. Collection ID: `products`

### 2️⃣ Ajoutez un Document

Cliquez **"Add document"** avec ces champs:
```json
{
  "name": "Diamant Test",
  "price": 500,
  "description": "Un magnifique diamant de test",
  "image": "https://...",
  "stock": 10,
  "category": "diamond"
}
```

3. Répétez pour `orders` et `users` (structures vides, remplies automatiquement)

---

## 🚀 Étape 8: Configuration Render (Production)

### Pour le Backend Render:

1. Allez à https://render.com/dashboard
2. Sélectionnez votre service **diamonobackend**
3. Cliquez **"Environment"**
4. Ajoutez les mêmes variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
5. Cliquez **"Save"**
6. Allez à **"Deployments"** → **"Deploy latest commit"**

### Attendez 3-5 minutes pour que Render redéploie

---

## ❌ Dépannage

### "Error: auth/api-key-not-valid"
- ✅ Vérifiez que vous avez copié la VRAIE clé depuis Firebase
- ✅ Redémarrez le serveur après .env update
- ✅ Videz le cache du navigateur (Ctrl+Shift+Del)

### "Error: Cannot log in"
- ✅ Vérifiez que l'utilisateur `admin@diamanosn.com` existe dans Firebase
- ✅ Vérifiez que Firebase Authentication est activée
- ✅ Vérifiez les règles Firestore

### "/api/config/firebase vide ou erreur 500"
- ✅ Redémarrez: `node server.js`
- ✅ Vérifiez que le `.env` a les bonnes variables
- ✅ Vérifiez les logs du serveur

---

## 📚 Ressources Utiles

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Render Environment Variables](https://docs.render.com/environment-variables)

---

**Besoin d'aide? Contactez le support Firebase ou vérifiez les logs du serveur!** 🚀
