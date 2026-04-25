require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

// Firebase Admin SDK
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 🔐 FIREBASE INITIALIZATION
// ==========================================
const firebaseConfig = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('✅ Firebase Admin initialized');
} catch (e) {
    console.error('❌ Firebase initialization error:', e.message);
    console.log('ℹ️  Make sure FIREBASE_* environment variables are set in .env');
}

const db = admin.firestore();
const auth = admin.auth();

// ==========================================
// ⚙️ CONFIGURATION SENE-PAY (PAIEMENTS)
// ==========================================
const SENEPAY_CONFIG = {
    apiKey: process.env.SENEPAY_API_KEY,
    apiSecret: process.env.SENEPAY_API_SECRET,
    baseUrl: process.env.SENEPAY_BASE_URL || 'https://api.sene-pay.com/api/v1',
    webhookUrl: process.env.SENEPAY_WEBHOOK_URL || ''
};

function hasSenePayCredentials() {
    return Boolean(SENEPAY_CONFIG.apiKey && SENEPAY_CONFIG.apiSecret);
}

if (!hasSenePayCredentials()) {
    console.warn('⚠️  SenePay non configuré: ajoutez SENEPAY_API_KEY et SENEPAY_API_SECRET dans .env');
}

// ==========================================
// CORS & MIDDLEWARE
// ==========================================
const rawAllowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS
]
    .filter(Boolean)
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
    ...rawAllowedOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
]);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin non autorisée par CORS'));
    }
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 🔐 FIREBASE AUTH MIDDLEWARE
// ==========================================
const verifyFirebaseToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

// ==========================================
// 💳 PAIEMENTS - SENEPAY ROUTES
// ==========================================

/**
 * POST /api/payments/create
 * Créer une transaction de paiement avec Senepay
 */
app.post('/api/payments/create', verifyFirebaseToken, async (req, res) => {
    if (!hasSenePayCredentials()) {
        return res.status(503).json({ error: 'Senepay non configuré' });
    }

    const { amount, description, phone, orderId } = req.body;
    const userId = req.user.uid;

    if (!amount || amount <= 0 || !phone || !orderId) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }

    try {
        const paymentData = {
            amount: Math.round(amount),
            currency: 'XOF',
            phone: phone,
            description: description || `Paiement commande ${orderId}`,
            orderId: orderId,
            userId: userId,
            returnUrl: `${process.env.FRONTEND_URL}/payment-success`,
            cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel`
        };

        const response = await axios.post(
            `${SENEPAY_CONFIG.baseUrl}/transactions/create`,
            paymentData,
            {
                headers: {
                    'Authorization': `Bearer ${SENEPAY_CONFIG.apiKey}`,
                    'X-API-Secret': SENEPAY_CONFIG.apiSecret,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Sauvegarder la transaction dans Firestore
        await db.collection('payments').doc(response.data.transactionId).set({
            userId: userId,
            orderId: orderId,
            amount: amount,
            phone: phone,
            status: 'pending',
            transactionId: response.data.transactionId,
            createdAt: new Date().toISOString(),
            senepayResponse: response.data
        });

        res.json({
            success: true,
            transactionId: response.data.transactionId,
            paymentUrl: response.data.paymentUrl
        });
    } catch (error) {
        console.error('Senepay error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de la création du paiement',
            details: error.response?.data?.message || error.message
        });
    }
});

/**
 * GET /api/payments/status/:transactionId
 * Vérifier le statut d'une transaction
 */
app.get('/api/payments/status/:transactionId', verifyFirebaseToken, async (req, res) => {
    if (!hasSenePayCredentials()) {
        return res.status(503).json({ error: 'Senepay non configuré' });
    }

    try {
        const { transactionId } = req.params;

        const response = await axios.get(
            `${SENEPAY_CONFIG.baseUrl}/transactions/${transactionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${SENEPAY_CONFIG.apiKey}`,
                    'X-API-Secret': SENEPAY_CONFIG.apiSecret
                }
            }
        );

        // Mettre à jour le statut dans Firestore
        await db.collection('payments').doc(transactionId).update({
            status: response.data.status,
            lastChecked: new Date().toISOString()
        });

        res.json({
            transactionId: transactionId,
            status: response.data.status,
            amount: response.data.amount,
            phone: response.data.phone
        });
    } catch (error) {
        console.error('Senepay status error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de la vérification du statut',
            details: error.response?.data?.message || error.message
        });
    }
});

/**
 * POST /api/webhooks/senepay
 * Webhook pour les mises à jour Senepay (pas besoin d'auth)
 */
app.post('/api/webhooks/senepay', async (req, res) => {
    try {
        const { transactionId, status, amount, phone } = req.body;

        if (!transactionId) {
            return res.status(400).json({ error: 'Transaction ID manquant' });
        }

        // Mettre à jour Firestore avec le statut
        await db.collection('payments').doc(transactionId).update({
            status: status,
            webhookReceivedAt: new Date().toISOString()
        });

        // Si paiement confirmé, mettre à jour la commande
        if (status === 'completed' || status === 'successful') {
            const paymentDoc = await db.collection('payments').doc(transactionId).get();
            if (paymentDoc.exists) {
                const { orderId } = paymentDoc.data();
                if (orderId) {
                    await db.collection('orders').doc(orderId).update({
                        paymentStatus: 'paid',
                        paymentDate: new Date().toISOString(),
                        transactionId: transactionId
                    });
                }
            }
        }

        res.json({ success: true, message: 'Webhook traité' });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ error: 'Erreur webhook' });
    }
});

/**
 * GET /api/payments/user
 * Récupérer les paiements de l'utilisateur connecté
 */
app.get('/api/payments/user', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const snapshot = await db.collection('payments')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const payments = [];
        snapshot.forEach(doc => {
            payments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
    }
});

// ==========================================
// � INITIALISER FIRESTORE (Admin only)
// ==========================================
const initialProducts = [
    { id: 1, name: 'Samsung Galaxy A54 5G 128Go', cat: 'Électronique', brand: 'Samsung', price: 189000, oldPrice: 239000, rating: 4.5, reviews: 284, image: 'https://i.roamcdn.net/hz/ed/listing-gallery-full-1920w/acd777160bac6c8b22024453025cdef0/-/horizon-files-prod/ed/picture/qxjgj2qz/2ff87a27a8281733562188a0a523ae0604c80efb.jpg', badge: 'hot', desc: 'Écran 6.4" AMOLED 120Hz, 128Go, 5000mAh, Android 14. Garantie 1 an.', tags: 'Smartphone,5G,Samsung' },
    { id: 2, name: 'Tecno Spark 40 Pro 256Go', cat: 'Électronique', brand: 'Tecno', price: 89000, oldPrice: 110000, rating: 4.3, reviews: 412, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/12/900721/1.jpg?7064', badge: 'hot', desc: 'Écran 6.78" FHD+, 256Go stockage, 5000mAh, Android 13.', tags: 'Smartphone,Tecno' },
    { id: 3, name: 'iPhone 14 128Go', cat: 'Électronique', brand: 'Apple', price: 585000, oldPrice: 650000, rating: 4.8, reviews: 156, image: 'https://parisdakarshopping.com/sites/default/files/styles/uc_product_full/public/2022-09/611mRs-imxL._AC_SL1500_.jpg?itok=NRfjdoar', badge: 'top', desc: 'A15 Bionic, double appareil 12MP, iOS 17.', tags: 'Smartphone,Apple,iOS' },
    { id: 4, name: 'TV Samsung 43" 4K Smart', cat: 'Électronique', brand: 'Samsung', price: 249000, oldPrice: 320000, rating: 4.6, reviews: 89, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/22/766121/1.jpg?9195', badge: 'sale', desc: '4K Crystal UHD, HDR, Smart TV Tizen, Wi-Fi. Garantie 2 ans.', tags: 'TV,Samsung,4K' },
    { id: 5, name: 'Itel A70 64Go Dual SIM', cat: 'Électronique', brand: 'Itel', price: 45000, oldPrice: 55000, rating: 4.2, reviews: 634, image: 'https://zoom.com.tn/60414-large_default/smartphone-itel-a70-4go-64-go-double-sim-noir-a665l.jpg', badge: 'new', desc: '6.6" écran, 64Go, Android 13 Go Edition.', tags: 'Smartphone,Itel' },
    { id: 6, name: 'Clé 4G Huawei E3372', cat: 'Électronique', brand: 'Huawei', price: 28000, oldPrice: 35000, rating: 4.4, reviews: 203, image: 'https://m.media-amazon.com/images/I/41o9FGXkvyS.jpg', badge: 'sale', desc: 'Clé 4G LTE 150Mbps, compatible tous opérateurs Sénégal.', tags: '4G,Internet,Huawei' },
    { id: 7, name: 'Boubou Grand Bazin Brodé Homme', cat: 'Mode', brand: 'Atelier Dakar', price: 38000, oldPrice: 50000, rating: 4.9, reviews: 342, image: 'https://afro-elegance.com/cdn/shop/files/hommes-royal-bleu-dashiki-blanc-geometrique-broderie.webp?v=1756117480', badge: 'hot', desc: 'Grand Bazin brodé, qualité supérieure, taille S-XXL.', tags: 'Boubou,Traditionnel,Homme' },
    { id: 8, name: 'Robe Wax Bogolan Femme', cat: 'Mode', brand: 'Mode Africaine SN', price: 18500, oldPrice: 25000, rating: 4.7, reviews: 512, image: 'https://kaysolcouture.fr/cdn/shop/files/IMG_8656.jpg?v=1722855919&width=990', badge: 'sale', desc: 'Tissu wax bogolan authentique, coupe moderne 2024.', tags: 'Wax,Femme,Robe' },
    { id: 9, name: 'Babouches Cuir Artisanal Dakar', cat: 'Mode', brand: 'Maroquinerie Dakar', price: 12000, oldPrice: 16000, rating: 4.6, reviews: 287, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDaPcRAnfy1L1fJ1FnOEEFiKHm3dPjoYMexA&s', badge: 'top', desc: 'Cuir véritable tannerie Dakar, confort & durabilité. Fait main.', tags: 'Chaussures,Cuir,Artisanat' },
    { id: 10, name: 'Adidas Ultraboost 22 Running', cat: 'Mode', brand: 'Adidas', price: 65000, oldPrice: 85000, rating: 4.8, reviews: 145, image: 'https://runners.ae/cdn/shop/products/ADIDAS-ULTRABOOST-22-FOR-MEN-LEGEND-INK-GX6642_5.jpg?v=1662712628', badge: 'sale', desc: 'Chaussures running premium, technologie Boost.', tags: 'Sport,Adidas,Running' },
    { id: 11, name: 'Riz Brisé Extra SAED 50kg', cat: 'Alimentation', brand: 'SAED', price: 22000, oldPrice: 27000, rating: 4.9, reviews: 820, image: 'https://www.senboutique.com/images/products/detail_113_riz_umbrella-25kg.jpg', badge: 'top', desc: 'Riz brisé qualité extra, idéal thiébou dieun. Production locale.', tags: 'Riz,Local,Cuisine' },
    { id: 12, name: "Huile d'Arachide Lesieur 5L", cat: 'Alimentation', brand: 'Lesieur', price: 8500, oldPrice: 10500, rating: 4.8, reviews: 634, image: 'https://sakanal.sn/10488-large_default/huile-lessieur-5l.jpg', badge: 'hot', desc: "Huile pure qualité supérieure, 100% arachide, origine Sénégal.", tags: 'Huile,Cuisine,Local' },
    { id: 13, name: 'Café Touba Premium 500g', cat: 'Alimentation', brand: 'Touba Coffee', price: 4500, oldPrice: 5500, rating: 4.9, reviews: 756, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/86/946321/1.jpg?9642', badge: 'top', desc: 'Café Touba authentique, sélection djar et karité.', tags: 'Café,Touba,Local' },
    { id: 14, name: 'Kit Épices Thiébou Dieun', cat: 'Alimentation', brand: 'Saveurs du Sénégal', price: 7500, oldPrice: 9000, rating: 4.7, reviews: 412, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm5kIJSnVAj8y1kZ7Paevy2XhSXT-g1NHAAEJcild2KIo_pO7O1CcV79__C29_dXxVOhg&usqp=CAU', badge: 'new', desc: 'Kit épices : tomate séchée, céleri, ail, guedj, nététu. 100% naturel.', tags: 'Épices,Cuisine,Local' },
    { id: 15, name: 'Ventilateur sur Pied Tornado 18"', cat: 'Maison & Déco', brand: 'Tornado', price: 22000, oldPrice: 28000, rating: 4.4, reviews: 345, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/93/658121/1.jpg?8780', badge: 'sale', desc: '3 vitesses, oscillation 90°, silencieux, colonne réglable.', tags: 'Ventilateur,Électroménager' },
    { id: 16, name: 'Climatiseur Haier 12000 BTU Split', cat: 'Maison & Déco', brand: 'Haier', price: 245000, oldPrice: 265000, rating: 4.6, reviews: 78, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/83/709621/1.jpg?3359', badge: 'hot', desc: 'Clim split 12000 BTU, Inverter A++, télécommande. Installation comprise à Dakar.', tags: 'Climatiseur,Électroménager' },
    { id: 17, name: 'Matelas Simmons Conjugué 140x190', cat: 'Maison & Déco', brand: 'Simmons', price: 145000, oldPrice: 195000, rating: 4.7, reviews: 112, image: 'https://www.direct-matelas.fr/8059-home_default/pack-140x190-matelas-simmons-sensoft-dos-sensible-sommier-dm-solux-tapissier-lattes-pieds-de-lit-cylindriques.jpg', badge: 'sale', desc: 'Matelas mousse mémoire de forme 20cm, garantie 5 ans.', tags: 'Matelas,Chambre,Premium' },
    { id: 18, name: 'Beurre de Karité Pur 500ml', cat: 'Beauté', brand: 'Karité Sénégal', price: 4800, oldPrice: 6500, rating: 4.9, reviews: 923, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/94/62906/1.jpg?3806', badge: 'top', desc: 'Karité 100% naturel non raffiné bio, hydratant intense.', tags: 'Karité,Naturel,Bio' },
    { id: 19, name: 'Savon Noir Beldi Artisanal', cat: 'Beauté', brand: 'Hammam Dakar', price: 3200, oldPrice: 4500, rating: 4.7, reviews: 456, image: 'https://i.pinimg.com/736x/89/21/03/8921033383b6624ba0fe909373011198.jpg', badge: 'new', desc: 'Savon noir artisanal à huile olive, gommage naturel puissant.', tags: 'Savon,Naturel,Artisanat' },
    { id: 20, name: 'Ballon Football Nike Strike', cat: 'Sport', brand: 'Nike', price: 25000, oldPrice: 35000, rating: 4.6, reviews: 234, image: 'https://thumblr.uniid.it/product/150370/87646ba20337.jpg?width=3840&format=webp&q=75', badge: 'sale', desc: 'Ballon officiel FIFA Quality, taille 5.', tags: 'Football,Ballon,Nike' },
    { id: 21, name: 'Tapis de Yoga 8mm + Sangle', cat: 'Sport', brand: 'Décathlon', price: 15000, oldPrice: 20000, rating: 4.5, reviews: 167, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/05/528221/1.jpg?7614', badge: 'new', desc: 'Tapis yoga 8mm, antidérapant double face, avec sangle.', tags: 'Yoga,Sport,Bien-être' },
    { id: 22, name: 'Batterie Voiture Exide 60Ah', cat: 'Auto & Moto', brand: 'Exide', price: 42000, oldPrice: 55000, rating: 4.5, reviews: 143, image: 'https://m.media-amazon.com/images/I/81VS3NNH3ML._AC_UF1000,1000_QL80_.jpg', badge: 'sale', desc: 'Batterie 60Ah longue durée, garantie 2 ans. Livraison & pose Dakar.', tags: 'Batterie,Auto,Garantie' },
    { id: 23, name: 'Couches Pampers Premium L x60', cat: 'Bébé & Jouets', brand: 'Pampers', price: 12500, oldPrice: 15000, rating: 4.8, reviews: 567, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/18/946721/1.jpg?5135', badge: 'hot', desc: 'Couches ultra-absorbantes, taille L (9-14kg). Peaux sensibles.', tags: 'Couches,Bébé,Pampers' },
    { id: 24, name: 'Poussette Bébé Confort Lara', cat: 'Bébé & Jouets', brand: 'Bébé Confort', price: 78000, oldPrice: 99000, rating: 4.8, reviews: 67, image: 'https://sn.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/25/46489/1.jpg?0898', badge: 'sale', desc: 'Poussette pliable ultraléger, nacelle + siège, naissance à 15kg.', tags: 'Poussette,Bébé' }
];

/**
 * POST /api/init/products
 * Initialiser Firestore avec les 24 produits (Admin secret required)
 */
app.post('/api/init/products', async (req, res) => {
    const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
    
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'diamano_admin_init_2024') {
        return res.status(403).json({ error: 'Clé admin requise' });
    }

    try {
        // Vérifier si products existent déjà
        const existing = await db.collection('products').limit(1).get();
        
        if (!existing.empty) {
            return res.status(409).json({ 
                error: 'Collection "products" existe déjà',
                hint: 'Utilisez ?force=true pour réinitialiser'
            });
        }

        let count = 0;
        for (const product of initialProducts) {
            const docId = `product_${product.id}`;
            await db.collection('products').doc(docId).set({
                ...product,
                tags: product.tags.split(','),
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now()
            });
            count++;
        }

        res.json({
            success: true,
            message: `✅ ${count} produits importés dans Firestore`,
            count: count,
            collection: 'products'
        });
    } catch (error) {
        console.error('Init error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// �🏥 HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        firebase: admin.apps.length > 0 ? 'connected' : 'disconnected',
        senepay: hasSenePayCredentials() ? 'configured' : 'not-configured'
    });
});

// ==========================================
// ERREUR 404
// ==========================================
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// ==========================================
// DÉMARRAGE SERVEUR
// ==========================================
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  🚀 DiamanoSN API Server (Paiements + Firebase)      ║
║  📍 Serveur démarré sur le port ${PORT}               ║
║  🔒 Firebase: ${admin.apps.length > 0 ? '✅ Connecté' : '❌ Erreur'}                      ║
║  💳 Senepay: ${hasSenePayCredentials() ? '✅ Configuré' : '⚠️  Non configuré'}                   ║
╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
