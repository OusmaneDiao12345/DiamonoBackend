# 🔗 GUIDE D'ACCÈS - PAGES CLIENTS & ADMIN

## 📍 ADRESSES DES PAGES

### Pour les CLIENTS (Public)

#### 1️⃣ Page de Suivi de Commande
```
URL: https://votre-site.com/track-order.html

Ou via lien dans les emails:
- Tous les emails contiennent un bouton "📦 Suivre ma Commande"
```

**Fonctionnalités:**
- 🔍 Recherche par numéro de commande ou email
- 📅 Timeline visuelle du statut
- 📦 Détails des articles
- 📞 Contact WhatsApp

#### 2️⃣ Mes Commandes (Authentifié)
```
URL: https://votre-site.com/my-orders.html

Accessible uniquement après connexion Firebase
```

---

### Pour l'ADMIN

#### 1️⃣ Dashboard
```
URL: https://votre-site.com/admin-dashboard.html

Étapes:
1. Connexion Firebase
2. Voir le dashboard
3. Menu: "Gestion Commandes"
```

#### 2️⃣ Gestion des Commandes (NOUVEAU)
```
URL: https://votre-site.com/admin-orders.html

✨ Interface complète pour:
- Voir toutes les commandes
- Filtrer par statut
- Modifier le statut
- Ajouter des notes
- Recevoir confirmations
```

#### 3️⃣ Admin Login
```
URL: https://votre-site.com/admin-login.html

Authentification Firebase pour accès admin
```

---

## 🧭 FLUX NAVIGATION CLIENT

```
📱 CLIENT REÇOIT EMAIL
        ↓
    ┌─ Clic "Suivre ma Commande" → /track-order.html
    │
    └─ Ou tape directement: /track-order.html
        ↓
    📦 SUIVI DE COMMANDE
        ├─ Recherche par numéro
        └─ Recherche par email
        ↓
    ✅ Résultats:
        ├─ Statut actuel
        ├─ Timeline complète
        ├─ Détails complets
        └─ Contact d'aide
```

---

## 🛠️ FLUX NAVIGATION ADMIN

```
🔐 ADMIN LOGIN
    (/admin-login.html)
        ↓
📊 DASHBOARD
    (/admin-dashboard.html)
        ├─ Vue d'ensemble
        ├─ Statistiques
        └─ Menu: "Gestion Commandes" ← NOUVEAU
        ↓
📦 GESTION COMMANDES
    (/admin-orders.html) ✨ INTERFACE COMPLÈTE
        ├─ Liste toutes commandes
        ├─ Filtre par statut
        ├─ Clic "✏️ Modifier"
        ├─ Sélectionne nouveau statut
        ├─ Ajoute notes (optionnel)
        ├─ Clic "💾 Enregistrer et Notifier"
        └─ EMAIL AUTO ENVOYÉ AU CLIENT ✨
```

---

## 📧 EMAIL INCLUT

**Header:**
```
Logo & Entête personnalisée
```

**Corps:**
```
✅ Statut + Emoji coloré
   Nouveau message selon le statut:
   ├─ "En attente paiement"
   ├─ "Paiement reçu, en préparation"
   ├─ "En route vers vous!"
   ├─ "Merci de votre confiance!"
   └─ "Commande annulée"

Tableau détails:
   ├─ Commande: [Numéro]
   ├─ Client: [Nom]
   ├─ Email: [Email]
   ├─ Montant: [Montant]
   ├─ Adresse: [Adresse]
   ├─ Montant: [Montant]
   └─ Méthode paiement

Articles:
   └─ Tableau avec produits, qté, prix

Notes (si présentes):
   └─ [Notes de l'admin]
```

**Bouton CTA:**
```
"📦 Suivre ma Commande" → /track-order.html
```

**Footer:**
```
Contact WhatsApp: +221 77 363 24 58
Copyright: © 2026 DiamanoSN
```

---

## 🚀 POUR AJOUTER LE LIEN DANS LE SITE

### Option 1: Ajouter au Menu Header (Recommandé)
Modifiez `index.html` pour ajouter:
```html
<a href="/track-order.html" class="nav-link">
    📦 Suivre ma Commande
</a>
```

### Option 2: Ajouter au Footer
Modifiez `index.html` footer pour ajouter:
```html
<li><a href="/track-order.html">📦 Suivi Commande</a></li>
```

### Option 3: Ajouter à "Mes Commandes"
Modifiez `my-orders.html` pour ajouter:
```html
<p>Vous pouvez aussi suivre votre commande via:</p>
<a href="/track-order.html" class="btn">Suivi Public</a>
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Serveur Node.js en cours d'exécution
- [ ] Route `/api/config/firebase` fonctionnelle
- [ ] Route `/api/admin/orders/:orderId` (PATCH) fonctionnelle
- [ ] Routes email configurées (Brevo ou Gmail)
- [ ] Firebase Admin SDK initialisé
- [ ] Toutes les pages HTML présentes

### Routes Requises:

```
✅ POST   /api/orders/create
✅ GET    /api/orders/:orderId
✅ GET    /api/admin/orders
✅ PATCH  /api/admin/orders/:orderId    ← EMAIL AUTO INCLUS
✅ GET    /api/config/firebase
✅ POST   /api/payment/initiate
```

### Fichiers Requis:

```
✅ public/admin-dashboard.html
✅ public/admin-orders.html      ← NOUVEAU
✅ public/admin-login.html
✅ public/track-order.html       ← NOUVEAU
✅ public/my-orders.html
✅ public/index.html
✅ server.js (avec routes)
```

---

## 📞 DOCUMENTATION ADDITIONNELLE

Fichiers de référence:
- `GUIDE-GESTION-COMMANDES.md` - Guide complet du système
- `SOLUTION-VALIDATION-COMMANDES.md` - Résumé de la solution

---

## 🎯 RÉSUMÉ

| Page | URL | Type | Accès |
|------|-----|------|-------|
| Dashboard | `/admin-dashboard.html` | Admin | Authentifié |
| Gestion Commandes | `/admin-orders.html` | Admin | Authentifié |
| Admin Login | `/admin-login.html` | Admin | Public |
| Suivi Commande | `/track-order.html` | Client | Public |
| Mes Commandes | `/my-orders.html` | Client | Authentifié |
| Accueil | `/index.html` | Public | Public |

---

**Créé avec ❤️ pour DiamanoSN - Mai 2026**
