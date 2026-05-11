# 🔐 Configuration des Règles Firestore

## ❌ Erreur Actuelle
```
FirebaseError: Missing or insufficient permissions.
```

Cette erreur signifie que les **règles de sécurité Firestore** bloquent l'accès aux données.

---

## ✅ Solution - Configurer les Règles Firestore

### **Étape 1: Allez à Firestore**

1. Ouvrez: https://console.firebase.google.com/
2. Sélectionnez le projet `diamanosn-ea0a1`
3. Allez à: **Build** → **Firestore Database**

### **Étape 2: Accédez aux Règles de Sécurité**

1. Cliquez l'onglet: **Rules** (à côté de "Data")
2. Vous verrez l'éditeur de règles

### **Étape 3: Remplacez les Règles**

Remplacez **tout le contenu** par:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // 📦 COMMANDES (Orders)
    // ==========================================
    match /orders/{document=**} {
      // Lecture: utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Écriture: utilisateurs authentifiés
      allow write: if request.auth != null;
    }
    
    // ==========================================
    // 👥 UTILISATEURS (Users)
    // ==========================================
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // ==========================================
    // 📦 PRODUITS (Products)
    // ==========================================
    match /products/{document=**} {
      // Lecture: tout le monde (public)
      allow read: if true;
      
      // Écriture: utilisateurs authentifiés
      allow write: if request.auth != null;
    }
    
    // ==========================================
    // 💳 PAIEMENTS (Payments)
    // ==========================================
    match /payments/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // ==========================================
    // Par défaut: Bloquer tout
    // ==========================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### **Étape 4: Publiez les Règles**

1. Cliquez le bouton bleu: **Publish**
2. Une fenêtre de confirmation apparaît
3. Cliquez: **Publish**
4. Attendez 1-2 minutes que les règles soient appliquées

### **Étape 5: Testez**

Retournez à:
```
http://localhost:3000/admin-orders.html
```

Rafraîchissez: `Ctrl+Shift+R`

**Les commandes doivent s'afficher maintenant!** ✅

---

## 📊 Explication des Règles

| Collection | Lecture | Écriture | Qui? |
|-----------|---------|----------|------|
| `orders` | ✅ | ✅ | Utilisateurs authentifiés |
| `users` | ✅ | ✅ | Utilisateurs authentifiés |
| `products` | ✅ | ✅ | Utilisateurs authentifiés |
| `payments` | ✅ | ✅ | Utilisateurs authentifiés |
| Autre | ❌ | ❌ | Personne |

---

## 🔒 Règles pour Production (Optionnel)

Pour plus tard, quand vous aurez des rôles admin:

```javascript
// Vérifier si l'utilisateur est admin
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

match /orders/{document=**} {
  // Lecture: tout le monde pour les siens, admin pour tous
  allow read: if request.auth != null && (
    request.auth.uid == resource.data.userId || 
    isAdmin()
  );
  
  // Écriture: admin seulement
  allow write: if isAdmin();
}
```

Mais pour maintenant, utilisez les règles simples ci-dessus.

---

## ✨ Prochaines Étapes

1. ✅ Configurez les règles Firestore
2. Testez admin-orders.html
3. Testez track-order.html
4. Testez les notifications par email

---

**Une fois les règles publiées, dites-moi si les commandes s'affichent!** 🚀
