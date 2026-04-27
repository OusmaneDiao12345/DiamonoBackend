# DiamanoSN Backend Server

Backend API serveur pour DiamanoSN - Plateforme e-commerce sénégalaise avec:
- 🔥 Firebase Authentication & Firestore
- 💳 Intégration SenePay (paiements)
- 🚀 Express.js API REST

## 🚀 Déploiement sur Render

### Étape 1: Configurer les variables d'environnement

Allez sur [Render Dashboard](https://dashboard.render.com) et créez un nouveau Web Service:

1. **Connectez votre repo GitHub:** `https://github.com/OusmaneDiao12345/DiamonoBackend`
2. **Configuration de base:**
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Region: `Frankfurt` ou votre région

3. **Définissez les variables d'environnement** (Environment):

```
PORT=3000
FRONTEND_URL=https://diamanosn.netlify.app
CORS_ORIGINS=https://diamanosn.netlify.app,https://www.diamanosn.netlify.app

FIREBASE_PROJECT_ID=diamanosn-ea0a1
FIREBASE_PRIVATE_KEY_ID=<your-private-key-id>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<YOUR-KEY-HERE>\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@diamanosn-ea0a1.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=<your-client-id>
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=<your-cert-url>

SENEPAY_BASE_URL=https://api.sene-pay.com/api/v1
SENEPAY_WEBHOOK_URL=https://<your-render-domain>.onrender.com/api/webhooks/senepay
SENEPAY_API_KEY=pk_live_<your-key>
SENEPAY_API_SECRET=sk_live_<your-secret>
```

### Étape 2: URL de votre serveur

Après déploiement, votre URL sera:
```
https://<service-name>.onrender.com
```

Mettez à jour dans `public/index.html` l'URL de l'API si nécessaire.

## 📚 Endpoints API

### Paiements
- `POST /api/payment/initiate` - Créer une session de paiement SenePay
- `GET /api/payment/check/:sessionToken` - Vérifier le statut du paiement
- `POST /api/webhooks/senepay` - Webhook SenePay (automatique)

### Admin
- `POST /api/init/products` - Initialiser les 24 produits (une fois)

## 🔐 Sécurité

⚠️ **IMPORTANT:** Les clés SenePay ont été exposées. Générez de nouvelles clés au dashboard SenePay:
- Allez à: https://dashboard.sene-pay.com
- Settings → API Keys
- Régénérez les clés
- Mettez à jour dans Render

## 📦 Dépendances

```json
{
  "express": "API REST framework",
  "cors": "Gestion CORS",
  "firebase-admin": "Firebase Admin SDK",
  "axios": "Appels HTTP vers SenePay",
  "dotenv": "Variables d'environnement"
}
```

## 🏃 Local Development

```bash
# Installer les dépendances
npm install

# Lancer le serveur (http://localhost:3000)
npm start
```

## 📝 Notes

- Le serveur est stateless (pas de base de données locale)
- Toutes les données sont dans Firebase Firestore
- Les paiements sont gérés par SenePay
- CORS est configuré pour les domaines autorisés

## 🆘 Troubleshooting

**"Cannot find module 'firebase-admin'":**
```bash
npm install
```

**"Unauthorized Firebase":**
Vérifiez les variables d'environnement FIREBASE_* dans Render

**"CORS error":**
Mettez à jour CORS_ORIGINS si vous changez le frontend

---

**Créé par:** DiamanoSN Team  
**Dernière mise à jour:** Avril 2026
