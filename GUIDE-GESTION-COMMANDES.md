# 📦 SYSTÈME DE GESTION DES COMMANDES - GUIDE COMPLET

## Vue d'ensemble
Vous avez maintenant un **système complet et automatisé** pour:
- ✅ Valider les commandes par **livraison** ou **SenePay**
- 📧 Envoyer des **emails automatiques** à chaque mise à jour
- 📊 Gérer les commandes depuis votre **interface admin**
- 🔍 Permettre aux clients de **suivre** leurs commandes en temps réel

---

## 🎯 FLUX COMPLET DES COMMANDES

### 1️⃣ **Création de Commande** (Frontend Client)
```
Client choisit un mode de paiement:
├─ 💳 SenePay (en ligne)
└─ 🚚 À la livraison (paiement à la livraison)
         ↓
Email envoyé au CLIENT:
├─ Récapitulatif de la commande
├─ Bouton "Suivre ma Commande"
└─ Lien vers page de suivi
         ↓
Email envoyé à L'ADMIN:
├─ Tous les détails complets
├─ Numéro de client
└─ Lien pour modifier le statut
```

### 2️⃣ **Validation dans Admin** (Interface Admin)
```
URL: /admin-orders.html
         ↓
Admin clique sur "✏️ Modifier"
         ↓
Admin choisit le nouveau statut:
├─ ⏳ En attente de paiement
├─ ✅ Confirmée (paiement reçu, en préparation)
├─ 📦 Expédiée (en route vers le client)
├─ ✓ Livrée
└─ ❌ Annulée
         ↓
Admin ajoute des NOTES (optionnel):
├─ Numéro de suivi (ex: DHL-123456789)
├─ Instructions de livraison
└─ Ou tout autre information
         ↓
Admin clique "💾 Enregistrer et Notifier"
         ↓
EMAIL AUTOMATIQUE ENVOYÉ AU CLIENT:
├─ Notification du changement de statut
├─ Détails de la commande mise à jour
├─ Notes de suivi (si présentes)
├─ Lien pour suivre la commande
└─ Contact WhatsApp pour aide
```

### 3️⃣ **Suivi Client** (Page de Suivi)
```
URL: /track-order.html
         ↓
Client cherche sa commande par:
├─ Numéro de commande (ex: ORD-1234567890-ABC)
└─ Email utilisé lors de la commande
         ↓
Affichage en temps réel:
├─ Statut actuel avec emoji
├─ Timeline visuelle des étapes
├─ Détails complets de la commande
├─ Liste des articles
├─ Notes de suivi (si présentes)
└─ Contact WhatsApp pour aide
```

---

## 📊 STATUTS DISPONIBLES

| Statut | Emoji | Description | Email Envoyé |
|--------|-------|-------------|--------------|
| **En attente de paiement** | ⏳ | Commande enregistrée, en attente du paiement SenePay | Oui |
| **Confirmée** | ✅ | Paiement reçu, commande en cours de préparation | Oui |
| **Expédiée** | 📦 | Commande emballée et en route | Oui |
| **Livrée** | ✓ | Commande livrée avec succès | Oui |
| **Annulée** | ❌ | Commande annulée | Oui |

---

## 🔄 CHANGEMENT DE STATUT & EMAILS

### Exemple 1: Validation d'une commande SenePay
```
Admin modifie: ⏳ En attente → ✅ Confirmée

EMAIL ENVOYÉ AU CLIENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Mise à jour: Confirmée - En cours de préparation

Excellentes nouvelles! Votre paiement a été reçu 
et votre commande est en cours de préparation.

Détails:
- Référence: ORD-1234567890-ABC
- Montant: 50,000 FCFA
- Articles: [tableau des articles]
- Notes: [si l'admin a ajouté des notes]

👉 Suivre ma Commande: [lien cliquable]

📞 WhatsApp: +221 77 363 24 58
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Exemple 2: Expédition avec numéro de suivi
```
Admin modifie: ✅ Confirmée → 📦 Expédiée
Admin ajoute note: "DHL - SENEGAL 123456789"

EMAIL ENVOYÉ AU CLIENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Mise à jour: Expédiée - En route vers vous!

Votre commande a été expédiée! Vous pouvez la 
suivre avec le numéro de suivi fourni.

Notes de suivi:
DHL - SENEGAL 123456789

👉 Suivre ma Commande: [lien cliquable]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Exemple 3: Livraison finalisation
```
Admin modifie: 📦 Expédiée → ✓ Livrée

EMAIL ENVOYÉ AU CLIENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Mise à jour: Livrée - Merci de votre confiance!

Votre commande a été livrée! 
Merci d'avoir choisi DiamanoSN 🙏

Nous espérons que vous êtes satisfait de votre achat.
N'hésitez pas à nous recontacter pour vos prochains besoins.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Backend (Node.js - server.js)
```
Routes API:
├─ POST /api/orders/create
│  └─ Crée une commande
│     └─ Envoie 2 emails (client + admin)
│
├─ GET /api/orders/:orderId
│  └─ Récupère détails d'une commande
│
├─ PATCH /api/admin/orders/:orderId  ⭐ ROUTE CLÉE
│  ├─ Met à jour le statut
│  ├─ Ajoute des notes
│  └─ Envoie EMAIL au client (notification)
│
├─ GET /api/admin/orders
│  └─ Liste toutes les commandes (pour admin)
│
└─ Email Handler
   ├─ Configuration: Brevo SMTP ou Gmail
   └─ Envoie les emails formatés HTML
```

### Frontend (HTML/JS)

**Admin Interface** (`admin-orders.html`):
- Charge les commandes depuis Firestore
- Affiche avec filtrage par statut
- Appelle API `/api/admin/orders/:orderId` via PATCH
- Montre le retour de confirmation

**Page Suivi** (`track-order.html`):
- Recherche par numéro ou email
- Requête directe Firestore (côté client)
- Affiche timeline visuelle
- Rafraîchit les données en temps réel

---

## 📧 CONFIGURATION EMAILS

### Emails Configurés
1. **Email Création**: Client + Admin
2. **Email Mise à Jour Statut**: Client (à chaque changement)
3. **Email Admin**: Notification des changements

### Variables Nécessaires dans `.env`
```
# EMAIL SERVICE
EMAIL_SERVICE=brevo
BREVO_API_KEY=your_brevo_key

# OU Gmail (alternative)
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASSWORD=your_app_password

# FRONTEND URL (pour les liens dans les emails)
FRONTEND_URL=https://diamanosn.sn
# ou en local: http://localhost:3000
```

### Templates Email
- ✅ Confirmation de commande initiale
- ✅ Notification de changement de statut
- ✅ Email admin pour chaque commande

---

## 🎯 UTILISATION QUOTIDIENNE

### Pour VOUS (Admin)
1. Accédez à: `https://votre-domaine.com/admin-orders.html`
2. Connectez-vous avec Firebase Auth
3. Pour chaque commande:
   - Cliquez sur "✏️ Modifier"
   - Sélectionnez le nouveau statut
   - Ajoutez des notes si nécessaire (numéro de suivi, etc.)
   - Cliquez "💾 Enregistrer et Notifier"
   - ✅ Email automatique envoyé au client!

### Pour les CLIENTS
1. Ils reçoivent un email après leur commande
2. Email contient un lien "📦 Suivre ma Commande"
3. Ou ils vont sur: `https://votre-domaine.com/track-order.html`
4. Ils entrent leur numéro de commande ou email
5. Voient la timeline complète et les mises à jour en temps réel

---

## ✨ AVANTAGES DU SYSTÈME

✅ **Automatisé**: Emails envoyés automatiquement  
✅ **Transparent**: Clients voient l'état réel en temps réel  
✅ **Flexible**: Personnalisable via notes  
✅ **Professionnel**: Templates HTML formatés  
✅ **Complet**: Couvre livraison ET SenePay  
✅ **Mobile-friendly**: Responsive design  
✅ **Sans frais**: Utilise Firebase Firestore gratuit  

---

## 🚀 AMÉLIORATIONS FUTURES POSSIBLES

- ❌ SMS de notification (en addition aux emails)
- ❌ Webhook SenePay pour validation automatique
- ❌ Intégration avec APIs de livraison (DHL, SENEX, etc.)
- ❌ Historique complet des modifications
- ❌ Export en PDF ou facture
- ❌ Dashboard avec statistiques
- ❌ Gestion des retours/remboursements
- ❌ Notifications push navigateur

---

## 📞 SUPPORT & AIDE

Pour questions ou modifications:
- Modifiez les templates email dans `server.js`
- Changez les statuts disponibles dans `admin-orders.html`
- Personnalisez les couleurs/design des pages
- Ajoutez plus de champs de suivi

**Créé avec ❤️ pour DiamanoSN**  
*Dernière mise à jour: Mai 2026*
