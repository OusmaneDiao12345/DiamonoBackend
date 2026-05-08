# 📝 Configuration à Copier dans Render Dashboard

## 🔗 Aller sur Render
https://dashboard.render.com → Select **diamonobackend** → **Environment**

---

## 📋 Variables à Configurer dans Render

### 1️⃣ **FRONTEND & CORS**
```
FRONTEND_URL=https://diamanosn.netlify.app
CORS_ORIGINS=https://diamanosn.netlify.app
```

### 2️⃣ **FIREBASE** (Copier exactement du fichier .env local)
```
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=diamanosn-ea0a1
FIREBASE_PRIVATE_KEY_ID=e79c37dad4324aaff957cdd246c417ece1b847c8
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwRyipC4m8z2vs\n9ypVbNcnQcpUtRslOW/S6bpM2WuaKsoIUSR6UGfVUrGqs/vyzxNeK33jHkubC6fA\nPNWu6EmM3x6zUoAWb0dx55B0MCCU3y6nrEY14RiRoWg1SyYx6aV93AJ/akGlJHyJ\nXdcUY53QtH2OEIwRe+UwIbJ3OpwP4acrnXh9oXi8Ltjyq6NuYnena4wX9FykLQTG\njtxyHJPFjhnnLjgm16FU1QfReXmM9t6t2A4W3UHT9fl7ljTqs3ev3DYR3sK5aFTB\n1X6BvqnVLg9OqGVRT36OxajyOeXmCmZBiFDDEIWIKTQbkI6GZxHx7/5AtIkG5psq\nT4wwM41pAgMBAAECggEACj94y6sSDNn6KkKMQX8cWvnmK1qEA3v9VkOkQwd4y/Ok\n3yrodfvqrWorTgM8qHcFZzocDXIbbx4UWIaw3YQ/kmL+Q+qN67/4ZVTS/w41NrJq\n4fCP/F3jscOybTa7N7efmVuLAaFJw7IFU28TK+pGqHV1vyaTHgkX3951o5zSqdGZ\n0/CQJqGSf35eNith5r8IVn2CMMasG5vXjwxZaLXddEiBUFO6gDhF/UShl1ITWvae\n1t6b1/GxYFSoW91XTg4DmwvVK/NwnhfWBS1bm0lAGravXbhBek7Zz3lbM9L1ccGv\nZVwmQIoQyeoi4CV0s7ZAcxPM0POxpyyYCqYExsDvAQKBgQDYuiszOOctzue3Nd4I\neHlcfxjytwHraZ88x5YJosfdSqQ1+mXKXsI7UYEI88hpsFzQn0Q7ipkn+jUCK/Er\nwLLEtpaFH5syexENKvNsdytPK0ga7xGdAibxaPKOJ6iXeEhuUN/EJTxzRtR0eC0n\nfhoQM7tb9suWf6pQWVlpVQC/mQKBgQDQOJN1B1VLhvQ8tmFJpm1mlBu5nI4iDuH2\nB5QjxZHYmn8VMAnzw92di0g/GrlZKkbijRGxDKIUm6qcs6VcQOTFLbgryYE1B1kE\n3gN6rrv6lQQNEpziNRDkVzMCQRUvePhQ90YSjN/xMsFpWGFUaLlPDvQAtaan4yMU\ntfJHFnseUQKBgBH06ttlnZHoEL7XUbw17yhAx5pkm14b9Due9cl6mUC2jICEbKal\nz0YG7MAHItXO7QHEEG02gJYVXwr9BRBw+N7fmf0Rr1QxaipDIsQb45S9q02//R+b\nLArYfTBWDNvv9WBehwvDYgzTE4tK4cLh6drpzl5CRoADt+LMZGIbzuIRAoGAeMn5\nMJB6eH/nOzkJovH60ODmXHxnL3a2ukSXOVEpVB/7zMy7WT+sVfIwjPrxvrn5uP7g\n3nZXp+DNzm2gZa33iDMHfc89Nwf2Kg6osgifX7QGT5cWj1r9W5kCLDKZGZrxYfaw\nHZ6/YmpxLK1qeM7vgN9JyQeXkBkBhsgtrfNqpKECgYEAyCETzWd3Fuz4j7QgDOxI\nz/UVD4tEB9v9tfLQnMQyy9jRtwrep9WetPcBDaZ+ssq1bppOP7beiVrxuaddSGt6\nZ3ghdhQJbjvRFFdU2cF3iFf6JTqcz90CxYZWp1btSG1bqgEXD3StrMJR4K0qdekS\nuVvUmyW1wPBjSREKTujuza0=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@diamanosn-ea0a1.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=104015846341111283274
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40diamanosn-ea0a1.iam.gserviceaccount.com
```

### 3️⃣ **SENEPAY** (⭐ CORRECT - Testé avec PowerShell)
```
SENEPAY_BASE_URL=https://api.sene-pay.com/api/v1
SENEPAY_API_KEY=pk_live_XXXX...XXXX (VOTRE CLÉ PRODUCTION)
SENEPAY_API_SECRET=sk_live_XXXX...XXXX (VOTRE SECRET PRODUCTION)
SENEPAY_WEBHOOK_URL=https://diamonobackend.onrender.com/api/webhooks/senepay
```

### 4️⃣ **ADMIN**
```
ADMIN_SECRET=diamano_admin_init_2024
```

---

## ✅ Après Configuration

1. **Save** dans Render → Variables enregistrées
2. **Redéployer** → Aller à **Deployments** → **Deploy latest** ou **Manual Deploy**
3. **Attendre** 3-5 minutes pour le déploiement
4. **Tester** : https://diamanosn.netlify.app → Ajouter produit → SenePay

---

## 🧪 Vérifier

Une fois déployé :
```bash
curl https://diamonobackend.onrender.com/api/health
```

Doit répondre avec succès.

