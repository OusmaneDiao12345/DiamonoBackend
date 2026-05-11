# 🚀 CRÉER UN NOUVEAU PROJET FIREBASE (5 MINUTES)

## Étape 1: Créer le Projet Firebase

1. **Allez à:** https://console.firebase.google.com/
2. **Connectez-vous** avec votre compte Google
3. **Cliquez:** `+ Ajouter un projet`
4. **Nom du projet:** `diamanosn` ou `diamanosn-2026`
5. **Désélectionnez:** "Enable Google Analytics" (optionnel)
6. **Cliquez:** `Créer un projet`
7. **Attendez** 1-2 minutes le créer...

---

## Étape 2: Créer une Application Web

Une fois le projet créé:

1. **Cliquez:** `+ Ajouter une application`
2. **Sélectionnez:** l'icône `</> Web`
3. **Nom de l'app:** `DiamanoSN Web`
4. **Cliquez:** `S'inscrire`
5. **Vous verrez une configuration Firebase:**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // 👈 COPIER CETTE CLE
  authDomain: "xxxxx.firebaseapp.com",
  projectId: "xxxxx",
  storageBucket: "xxxxx.appspot.com",
  messagingSenderId: "xxxxx",
  appId: "1:xxxxx:web:xxxxx"
};
```

**⚠️ IMPORTANT:** Copiez exactement cette configuration!

---

## Étape 3: Activer l'Authentification Email

1. **Dans votre projet Firebase, cliquez:** `Build` (dans le menu de gauche)
2. **Sélectionnez:** `Authentication`
3. **Cliquez:** `Commencer` ou `Get Started`
4. **Sélectionnez:** `Email/Password`
5. **Cliquez le bouton `Enable`**
6. **Cochez:** `Enable email/password sign-in`
7. **Cliquez:** `Enregistrer`

---

## Étape 4: Créer un Utilisateur Admin

1. **Dans Authentication, cliquez:** l'onglet `Users`
2. **Cliquez:** `Add user` ou `Ajouter un utilisateur`
3. **Entrez:**
   - **Email:** `admin@diamanosn.sn`
   - **Password:** `Admin@123456`
4. **Cliquez:** `Add user`

✅ Utilisateur créé!

---

## Étape 5: Autoriser localhost:3000

1. **Dans le projet Firebase, cliquez:** `Settings` (⚙️)
2. **Sélectionnez:** `Project Settings`
3. **Onglet:** `Authentication` ou `Authorization domains`
4. **Cliquez:** `+ Ajouter un domaine`
5. **Entrez:**
   - `localhost:3000`
   - `127.0.0.1:3000`
6. **Cliquez:** `Add`

---

## Étape 6: Créer Firestore (Optionnel mais recommandé)

1. **Dans Build, cliquez:** `Firestore Database`
2. **Cliquez:** `Create database`
3. **Sélectionnez:** `nam5` (North America - Montréal)
4. **Mode:** `Start in test mode`
5. **Cliquez:** `Enable`

---

## 📋 Checklist - Avant de Continuer

- ✅ Nouveau projet Firebase créé
- ✅ Application Web créée
- ✅ Configuration Firebase copiée
- ✅ Email/Password activé dans Authentication
- ✅ Utilisateur `admin@diamanosn.sn` créé
- ✅ `localhost:3000` ajouté aux domaines autorisés
- ✅ Firestore créé (optionnel)

---

## 🔄 Mettre à Jour la Configuration

Une fois votre nouvelle config Firebase obtenue, **remplacez-la** dans ces 5 fichiers:

### 1. `admin-login.html` (ligne ~370)
```javascript
const firebaseConfig = {
    apiKey: "VOTRE_NOUVELLE_CLE_API",
    authDomain: "VOTRE_PROJECT.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_ID",
    appId: "1:VOTRE_ID:web:VOTRE_WEB_ID"
};
```

### 2. `admin-dashboard.html` (ligne ~745)
### 3. `admin-orders.html` (ligne ~120)
### 4. `track-order.html` (ligne ~68)
### 5. `server.js` (ligne ~150)

**Même configuration partout!**

---

## 🧪 Tester la Nouvelle Configuration

1. **Rafraîchissez la page:** `http://localhost:3000/firebase-test.html` (Ctrl+Shift+R)
2. **Cliquez:** `🔥 Tester Firebase SDK`
3. **Entrez:** 
   - Email: `admin@diamanosn.sn`
   - Password: `Admin@123456`
4. **Cliquez:** `🔐 Essayer Connexion`

**Si vous voyez ✅ Connexion réussie**, c'est bon! 🎉

---

## 🆘 Si vous n'avez pas accès à Google/Firebase

Demandez à quelqu'un qui a un compte Google de:
1. Créer le projet Firebase
2. Vous partager l'accès

Ou utilisez une adresse Gmail: https://accounts.google.com/SignUp

---

## 📞 Besoin d'aide?

- **Firebase Console:** https://console.firebase.google.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **Vérifier API Key:** https://console.cloud.google.com/

---

**IMPORTANT:** Signalez-moi une fois que vous avez créé le nouveau projet et obtenu la configuration!
