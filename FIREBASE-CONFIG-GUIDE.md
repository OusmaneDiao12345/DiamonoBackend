# 🔧 GUIDE - CONFIGURATION FIREBASE

## ⚠️ Erreur: "auth/api-key-not-valid"

Cette erreur signifie que la **clé API Firebase n'est pas valide** ou le **projet Firebase est inaccessible**.

---

## ✅ Solutions

### 1️⃣ Vérifier que le Projet Firebase Existe

**URL Firebase Console:**
```
https://console.firebase.google.com/
```

**Actions:**
1. Connectez-vous avec votre compte Google
2. Sélectionnez le projet "diamanosn-ea0a1"
3. Allez à **Settings** (⚙️)  → **Project Settings**
4. Vérifiez le **Project ID**: doit être `diamanosn-ea0a1`

### 2️⃣ Vérifier la Clé API

**Dans Firebase Console:**
1. Allez à **Settings** → **Project Settings**
2. Onglet **Web Apps**
3. Cliquez sur votre app (ou créez-en une)
4. Copiez la **API Key**: `AIzaSy...`

**Remplacez dans le code:**
- `admin-login.html` ligne 369
- `admin-dashboard.html` ligne 745
- `admin-orders.html` ligne 120
- `track-order.html` ligne 68

### 3️⃣ Activer l'Authentification Email

**Dans Firebase Console:**
1. Allez à **Build** → **Authentication**
2. Cliquez sur **Set up sign-in method**
3. Sélectionnez **Email/Password**
4. Activez **Email/Password**

### 4️⃣ Créer un Utilisateur Admin de Test

**Dans Firebase Console:**
1. Allez à **Build** → **Authentication**
2. Onglet **Users**
3. Cliquez **Add user**
4. Email: `admin@diamanosn.sn`
5. Password: `Admin123!`

### 5️⃣ Activer Firestore (si nécessaire)

**Dans Firebase Console:**
1. Allez à **Build** → **Firestore Database**
2. Cliquez **Create database**
3. Sélectionnez location: `nam5` (Amérique du Nord)
4. Mode: **Start in test mode** (pour développement)

---

## 🔑 Vérifier la Configuration Actuelle

**Clé API actuelle utilisée:**
```
AIzaSyDl7L_kB_AqUJvG2aQTXJ4RRJjAA9U0TaA
```

**Configuration:**
```json
{
  "apiKey": "AIzaSyDl7L_kB_AqUJvG2aQTXJ4RRJjAA9U0TaA",
  "authDomain": "diamanosn-ea0a1.firebaseapp.com",
  "projectId": "diamanosn-ea0a1",
  "storageBucket": "diamanosn-ea0a1.appspot.com",
  "messagingSenderId": "918076707387",
  "appId": "1:918076707387:web:dac8ce0fbc5d90f80f5c05"
}
```

**Si cette config n'est pas correcte:**
1. Allez à Firebase Console
2. Copie la vrai config
3. Mettez-à-jour les fichiers HTML

---

## 🧪 Test de Connexion

### Étapes:
1. Accédez à `http://localhost:3000/admin-login.html`
2. Email: `admin@diamanosn.sn`
3. Password: `Admin123!`
4. Appuyez sur **Se connecter**

### Si ça fonctionne:
✅ Vous verrez un message **"Connexion réussie!"**  
✅ Redirection vers `/admin-dashboard.html`

### Si ça ne marche pas:
❌ Vérifiez la **Console (F12)** pour l'erreur exacte

---

## 🆘 Troubleshooting

| Erreur | Cause | Solution |
|--------|-------|----------|
| auth/api-key-not-valid | Clé API invalide ou projet supprimé | Vérifier Firebase Console |
| auth/user-not-found | L'utilisateur n'existe pas | Créer l'utilisateur admin |
| auth/wrong-password | Mot de passe incorrect | Vérifier le mot de passe |
| CORS Error | Restriction de domaine | Vérifier auth domains dans Firebase |

---

## 📝 Aide Rapide

**Firebase Console:** https://console.firebase.google.com/

**Commandes Firebase CLI (optionnel):**
```bash
npm install -g firebase-tools
firebase login
firebase list
```

**Documentation:**
- https://firebase.google.com/docs
- https://firebase.google.com/docs/auth

---

## ✨ Une Fois Configuré

Vous pourrez:
1. ✅ Se connecter avec admin@diamanosn.sn
2. ✅ Accéder au dashboard admin
3. ✅ Gérer les commandes
4. ✅ Les clients pourront se créer des comptes

---

**Avez-vous accès à Firebase Console?**
Si oui, suivez les étapes ci-dessus pour vérifier/corriger la configuration.
