require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');

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
// 📧 CONFIGURATION EMAIL (BREVO - API REST)
// ==========================================
const ADMIN_EMAIL = 'ousmoneebah12@gmail.com';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Configuration Gmail comme fallback
let emailTransporter;

if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    // Configuration GMAIL (fallback)
    emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD
        }
    });
    console.log('✅ Email sender (Gmail) initialized');
} else {
    console.warn('⚠️  Gmail non configuré: ajoutez GMAIL_USER/GMAIL_PASSWORD dans .env');
}

// Fonction pour envoyer des emails via Brevo API (préférence) ou Gmail SMTP
async function sendEmail(to, subject, htmlContent) {
    try {
        // PRÉFÉRENCE 1: Brevo REST API (plus fiable sur cloud servers)
        if (BREVO_API_KEY) {
            console.log('📧 Envoi via Brevo API REST à:', to);
            const response = await axios.post(BREVO_API_URL, {
                sender: { email: ADMIN_EMAIL, name: 'DiamanoSN' },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            }, {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            console.log('✅ Email envoyé via Brevo API:', response.data.messageId);
            return { success: true, messageId: response.data.messageId, service: 'brevo-api' };
        }
        
        // FALLBACK 2: Gmail SMTP
        if (!emailTransporter) {
            console.error('❌ Aucun service email configuré (ni Brevo API ni Gmail)');
            return { success: false, error: 'Aucun service email configuré' };
        }

        const mailOptions = {
            from: ADMIN_EMAIL,
            to: to,
            subject: subject,
            html: htmlContent
        };
        
        console.log('📧 Envoi via Gmail SMTP à:', to);
        const info = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email envoyé via Gmail:', info.response);
        return { success: true, messageId: info.messageId, service: 'gmail-smtp' };
    } catch (error) {
        console.error('❌ Erreur envoi email:');
        console.error('  Service: Brevo/Gmail');
        console.error('  Message:', error.message);
        console.error('  Code:', error.code);
        console.error('  Status:', error.response?.status);
        return { 
            success: false, 
            error: error.message,
            details: {
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText
            }
        };
    }
}

// ==========================================
// 📧 FONCTION NEWSLETTER (BREVO API REST)
// ==========================================
async function subscribeToNewsletter(email, firstName = '', lastName = '') {
    try {
        if (!BREVO_API_KEY) {
            console.warn('⚠️  BREVO_API_KEY non configuré - newsletter désactivée');
            return false;
        }

        console.log('📬 Abonnement newsletter:', email);

        const brevoAPI = axios.create({
            baseURL: 'https://api.brevo.com/v3',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        // Ajouter/mettre à jour le contact dans Brevo
        const response = await brevoAPI.post('/contacts', {
            email: email,
            attributes: {
                FIRSTNAME: firstName || 'Abonné',
                LASTNAME: lastName || 'DiamanoSN',
                SOURCE: 'Website Newsletter'
            },
            listIds: [2], // ID liste Brevo DiamanoSN
            updateEnabled: true
        });

        console.log('✅ Contact ajouté à la newsletter Brevo:', email, 'ID:', response.data.id);
        return true;
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            console.log('ℹ️  Email déjà abonné Brevo:', email);
            return true; // Pas d'erreur si déjà existant
        }
        console.error('❌ Erreur ajout newsletter Brevo:');
        console.error('  Status:', error.response?.status);
        console.error('  Message:', error.response?.data?.message || error.message);
        console.error('  Details:', error.response?.data);
        return false;
    }
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
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1',
    'http://localhost',
    'https://diamanosn.netlify.app',
    'https://www.diamanosn.netlify.app'
]);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        console.log('❌ CORS BLOCKED - Origin rejected:', origin);
        console.log('✓ Allowed origins:', Array.from(allowedOrigins));
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
// � CONFIG ROUTES
// ==========================================

/**
 * GET /api/config/firebase
 * Retourner la configuration Firebase publique pour le frontend
 */
app.get('/api/config/firebase', (req, res) => {
    res.json({
        apiKey: "AIzaSyBbFsuwlSpWjGKYK77HP3M065KdN2PN32Y",
        authDomain: "diamanosn-ea0a1.firebaseapp.com",
        projectId: "diamanosn-ea0a1",
        storageBucket: "diamanosn-ea0a1.firebasestorage.app",
        messagingSenderId: "480059418031",
        appId: "1:480059418031:web:bb071481468f52202e3b5a"
    });
});

/**
 * GET /api/test-email
 * Tester l'envoi d'emails (diagnostique)
 */
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('🧪 TEST EMAIL - Configuration:');
        console.log('  BREVO_API_KEY:', BREVO_API_KEY ? '✅ SET (length: ' + BREVO_API_KEY.length + ')' : '❌ NOT SET');
        console.log('  GMAIL_USER:', process.env.GMAIL_USER ? '✅ SET' : '❌ NOT SET');
        console.log('  emailTransporter (Gmail):', emailTransporter ? '✅ READY' : '❌ NOT READY');

        const testEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #0d9488; border-radius: 8px; padding: 20px; background: #f0fdf4;">
                <h2 style="color: #0d9488; text-align: center;">✅ Test Email DiamanoSN</h2>
                <p>Cet email est un test pour vérifier que le système d'email fonctionne correctement en production.</p>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Configuration Email Status:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li>${BREVO_API_KEY ? '✅' : '❌'} Brevo API: ${BREVO_API_KEY ? 'Configuré' : 'Non configuré'}</li>
                        <li>${process.env.GMAIL_USER ? '✅' : '❌'} Gmail: ${process.env.GMAIL_USER || 'Non configuré'}</li>
                    </ul>
                </div>

                <div style="background: #dbeafe; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0;"><strong>🕐 Timestamp:</strong> ${new Date().toISOString()}</p>
                </div>

                <p style="color: #666; text-align: center; margin-top: 20px; font-size: 12px;">
                    Cet email confirme que le système d'email fonctionne correctement.
                </p>
            </div>
        `;

        const result = await sendEmail(
            req.query.email || ADMIN_EMAIL,
            '🧪 Test Email DiamanoSN',
            testEmail
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Email test envoyé avec succès!',
                messageId: result.messageId,
                service: result.service,
                emailConfig: {
                    brevoApi: !!BREVO_API_KEY,
                    gmail: !!process.env.GMAIL_USER,
                    adminEmail: ADMIN_EMAIL
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi du test email',
                error: result.error,
                errorDetails: result.details,
                emailConfig: {
                    brevoApi: !!BREVO_API_KEY,
                    gmail: !!process.env.GMAIL_USER,
                    adminEmail: ADMIN_EMAIL
                }
            });
        }
    } catch (error) {
        console.error('🧪 TEST EMAIL EXCEPTION:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==========================================
// �💳 PAIEMENTS - SENEPAY ROUTES
// ==========================================

/**
 * POST /api/payments/create
 * Créer une transaction de paiement avec Senepay
 */
app.get('/api/test-newsletter', async (req, res) => {
    try {
        console.log('🧪 TEST NEWSLETTER - Configuration:');
        console.log('  BREVO_API_KEY:', BREVO_API_KEY ? '✅ SET' : '❌ NOT SET');
        console.log('  ADMIN_EMAIL:', ADMIN_EMAIL);

        const testEmail = req.query.email || 'test.newsletter@diamanosn.test';
        const testFirstName = 'Test';
        const testLastName = 'Newsletter';

        // Étape 1: Ajouter à Brevo
        console.log('📬 TEST 1: Ajouter contact Brevo...');
        const brevoResult = await subscribeToNewsletter(testEmail, testFirstName, testLastName);
        if (!brevoResult) {
            return res.status(500).json({
                success: false,
                step: 'brevo-subscription',
                message: 'Erreur lors de l\'abonnement Brevo'
            });
        }

        // Étape 2: Envoyer email confirmation au subscriber
        console.log('📬 TEST 2: Envoyer email confirmation...');
        const confirmEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">✅ Test: Email de Confirmation Newsletter</h2>
                <p>Bienvenue ${testFirstName}!</p>
                <p>Cet email teste le système de confirmation pour les abonnés newsletter.</p>
                <p><strong>Email:</strong> ${testEmail}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
        `;
        const confirmResult = await sendEmail(testEmail, '✅ Test: Bienvenue à la Newsletter DiamanoSN!', confirmEmail);
        console.log('Confirmation email result:', confirmResult);

        // Étape 3: Envoyer email admin
        console.log('📬 TEST 3: Envoyer email admin...');
        const adminEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">📬 Test: Nouveau Subscriber Newsletter</h2>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 6px;">
                    <p><strong>Email:</strong> ${testEmail}</p>
                    <p><strong>Nom:</strong> ${testFirstName} ${testLastName}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                </div>
            </div>
        `;
        const adminResult = await sendEmail(ADMIN_EMAIL, `📬 Test: Nouveau Subscriber Newsletter: ${testEmail}`, adminEmail);
        console.log('Admin email result:', adminResult);

        res.json({
            success: true,
            message: 'Test newsletter complété',
            results: {
                brevoSubscription: { success: brevoResult },
                confirmationEmail: { 
                    success: confirmResult.success, 
                    messageId: confirmResult.messageId,
                    service: confirmResult.service,
                    error: confirmResult.error
                },
                adminEmail: { 
                    success: adminResult.success, 
                    messageId: adminResult.messageId,
                    service: adminResult.service,
                    error: adminResult.error
                }
            },
            emails: {
                confirmationSentTo: testEmail,
                adminNotificationSentTo: ADMIN_EMAIL
            }
        });
    } catch (error) {
        console.error('🧪 TEST NEWSLETTER EXCEPTION:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

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

    if (!amount || amount <= 0 || !orderId) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }

    try {
        const paymentData = {
            amount: Math.round(amount),
            currency: 'XOF',
            description: description || `Paiement commande ${orderId}`,
            orderReference: orderId,
            metadata: { userId, phone },
            successUrl: `${process.env.FRONTEND_URL}/payment-success`,
            cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel`,
            webhookUrl: SENEPAY_CONFIG.webhookUrl
        };

        console.log('🚀 Envoi à SenePay:', SENEPAY_CONFIG.baseUrl + '/checkout/sessions');

        const response = await axios.post(
            `${SENEPAY_CONFIG.baseUrl}/checkout/sessions`,
            paymentData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': SENEPAY_CONFIG.apiKey,
                    'X-Api-Secret': SENEPAY_CONFIG.apiSecret
                },
                timeout: 15000
            }
        );

        console.log('🔍 Réponse brute SenePay:', JSON.stringify(response.data, null, 2));

        let data = response.data?.data || response.data || {};
        if (typeof data === 'string') {
            const trimmed = data.trim();
            if (trimmed.startsWith('http')) {
                data = { checkoutUrl: trimmed };
            } else {
                data = {};
            }
        }

        const sessionToken = data.sessionToken || data.session_token || data.token || null;
        const checkoutUrl  = data.checkoutUrl  || data.checkout_url  || data.checkout || data.url || null;

        const docId = sessionToken || db.collection('payments').doc().id;
        await db.collection('payments').doc(docId).set({
            userId: userId,
            orderId: orderId,
            amount: amount,
            status: 'pending',
            sessionToken: sessionToken,
            checkoutUrl: checkoutUrl,
            createdAt: new Date().toISOString(),
            senepayResponse: response.data
        });

        res.json({
            success: true,
            sessionToken: sessionToken,
            checkoutUrl: checkoutUrl,
            redirectUrl: checkoutUrl  // ✅ Alias pour le client
        });
    } catch (error) {
        console.error('Senepay error:', error.response?.status, error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de la création du paiement',
            details: error.response?.data?.message || error.message
        });
    }
});

/**
 * POST /api/payment/initiate
 * Créer une transaction de paiement (interface client frontend)
 * ✅ Cette route est appelée directement par le client HTML
 */
app.post('/api/payment/initiate', async (req, res) => {
    if (!hasSenePayCredentials()) {
        return res.status(503).json({ 
            success: false,
            message: 'Senepay non configuré sur le serveur',
            error: 'Senepay non disponible'
        });
    }

    const { amount, orderReference, customerName, customerPhone, returnUrl } = req.body;

    // Validations
    if (!amount || amount <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Montant invalide' 
        });
    }

    if (!customerPhone) {
        return res.status(400).json({ 
            success: false, 
            message: 'Numéro de téléphone manquant' 
        });
    }

    try {
        console.log('📱 Initiation paiement SenePay:', {
            amount,
            orderReference,
            customerPhone,
            customerName
        });

        // Préparer les données pour SenePay (conformes à la doc /checkout/sessions)
        const paymentPayload = {
            amount: Math.round(amount),
            currency: 'XOF',
            orderReference: orderReference,
            description: `Commande ${orderReference} - ${customerName}`,
            metadata: { customerName },
            successUrl: returnUrl || `${process.env.FRONTEND_URL}/payment-success`,
            cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel`,
            webhookUrl: SENEPAY_CONFIG.webhookUrl,
            expiresInMinutes: 60
        };

        console.log('🚀 Envoi à SenePay:', SENEPAY_CONFIG.baseUrl + '/checkout/sessions');
        console.log('📦 Payload envoyé:', JSON.stringify(paymentPayload, null, 2));

        // Appel à l'API SenePay
        const response = await axios.post(
            `${SENEPAY_CONFIG.baseUrl}/checkout/sessions`,
            paymentPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': SENEPAY_CONFIG.apiKey,
                    'X-Api-Secret': SENEPAY_CONFIG.apiSecret
                },
                timeout: 15000
            }
        );

        // ✅ CORRECTION PRINCIPALE : Log de la réponse brute complète
        console.log('🔍 Réponse brute SenePay:', JSON.stringify(response.data, null, 2));

        // Normaliser la réponse attendue (/checkout/sessions)
        let data = response.data?.data || response.data || {};
        if (typeof data === 'string') {
            const trimmed = data.trim();
            if (trimmed.startsWith('http')) {
                data = { checkoutUrl: trimmed };
            } else {
                data = {};
            }
        }

        const sessionToken = data.sessionToken || data.session_token || data.session || null;
        const checkoutUrl  = data.checkoutUrl  || data.checkout_url  || data.checkout || data.url || null;

        console.log('✅ Champs extraits:', { sessionToken, checkoutUrl });

        if (!checkoutUrl) {
            console.error('❌ Aucune URL de redirection trouvée dans la réponse SenePay');
            console.error('❌ Clés disponibles dans response.data:', Object.keys(response.data));
            return res.status(502).json({
                success: false,
                message: 'Réponse SenePay invalide : URL de redirection manquante',
                error: 'bad_senepay_response',
                debug: {
                    availableKeys: Object.keys(response.data),
                    rawData: response.data
                }
            });
        }

        // Retourner au client (sessionToken + checkoutUrl attendu)
        res.json({
            success: true,
            sessionToken: sessionToken,
            checkoutUrl: checkoutUrl,
            redirectUrl: checkoutUrl,
            message: 'Paiement initié avec succès'
        });

    } catch (error) {
        // ✅ Log d'erreur détaillé
        console.error('❌ Erreur SenePay complète:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: JSON.stringify(error.response?.data, null, 2),
            message: error.message,
            headers: error.response?.headers
        });

        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message
                  || error.response?.data?.error
                  || error.message
                  || 'Erreur lors de l\'initiation du paiement',
            error: 'payment_initiation_failed',
            details: error.response?.data || null
        });
    }
});

/**
 * GET /api/payment/check/:sessionToken
 * Vérifier le statut d'une session de paiement (public - pas d'auth)
 * ✅ Utilisé par le frontend pour vérifier après checkout
 */
app.get('/api/payment/check/:sessionToken', async (req, res) => {
    if (!hasSenePayCredentials()) {
        return res.status(503).json({ 
            success: false,
            message: 'Senepay non configuré'
        });
    }

    try {
        const { sessionToken } = req.params;
        console.log('🔍 Vérification statut session:', sessionToken);

        const response = await axios.get(
            `${SENEPAY_CONFIG.baseUrl}/checkout/sessions/${sessionToken}`,
            {
                headers: {
                    'X-Api-Key': SENEPAY_CONFIG.apiKey,
                    'X-Api-Secret': SENEPAY_CONFIG.apiSecret
                },
                timeout: 10000
            }
        );

        const data = response.data?.data || response.data;
        const status = data.status || data.sessionStatus || 'unknown';

        console.log('✅ Statut reçu:', { sessionToken, status });

        res.json({
            success: true,
            sessionToken: sessionToken,
            status: status,
            amount: data.amount,
            currency: data.currency,
            orderReference: data.orderReference,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt
        });
    } catch (error) {
        console.error('❌ Erreur vérification statut:', error.response?.status, error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Erreur lors de la vérification du statut',
            details: error.response?.data?.error || error.message
        });
    }
});

/**
 * GET /api/payments/status/:transactionId
 * Vérifier le statut d'une transaction (protégé Firebase)
 */
app.get('/api/payments/status/:transactionId', verifyFirebaseToken, async (req, res) => {
    if (!hasSenePayCredentials()) {
        return res.status(503).json({ error: 'Senepay non configuré' });
    }

    try {
        const { transactionId } = req.params;

        const response = await axios.get(
            `${SENEPAY_CONFIG.baseUrl}/checkout/sessions/${transactionId}`,
            {
                headers: {
                    'X-Api-Key': SENEPAY_CONFIG.apiKey,
                    'X-Api-Secret': SENEPAY_CONFIG.apiSecret
                }
            }
        );

        // ✅ CORRECTION : Extraction flexible du statut
        const data = response.data?.data || response.data;
        const status = data.status || data.transaction_status || data.state || 'unknown';

        // Mettre à jour le statut dans Firestore
        await db.collection('payments').doc(transactionId).update({
            status: status,
            lastChecked: new Date().toISOString()
        });

        res.json({
            transactionId: transactionId,
            status: status,
            amount: data.amount,
            phone: data.phone
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
        console.log('📩 Webhook SenePay reçu:', JSON.stringify(req.body, null, 2));

        const body = req.body?.data || req.body;
        const sessionToken  = body.sessionToken || body.session_token || body.session || null;
        const transactionId = body.transactionId || body.transaction_id || body.id || null;
        const status        = body.status || body.transaction_status || body.state || body.event || null;

        const docId = sessionToken || transactionId;
        if (!docId) {
            return res.status(400).json({ error: 'Transaction ID manquant' });
        }

        // Mettre à jour le paiement
        await db.collection('payments').doc(docId).update({
            status: status,
            webhookReceivedAt: new Date().toISOString(),
            senepayWebhook: body
        });

        // Si paiement réussi → Mettre à jour la commande
        if (status && ['completed','Completed','complete','Complete','successful','success','paid'].includes(String(status))) {
            const paymentDoc = await db.collection('payments').doc(docId).get();
            if (paymentDoc.exists) {
                const { orderId } = paymentDoc.data();
                if (orderId) {
                    await db.collection('orders').doc(orderId).update({
                        paymentStatus: 'paid',
                        status: 'confirmed', // Commande confirmée après paiement
                        paymentDate: new Date().toISOString(),
                        transactionId: transactionId || docId,
                        updatedAt: new Date().toISOString()
                    });
                    console.log('✅ Commande confirmée après paiement SenePay:', orderId);
                }
            }
        }
        // Si paiement échoué
        else if (status && ['failed','Failed','cancelled','Cancelled','error','Error'].includes(String(status))) {
            const paymentDoc = await db.collection('payments').doc(docId).get();
            if (paymentDoc.exists) {
                const { orderId } = paymentDoc.data();
                if (orderId) {
                    await db.collection('orders').doc(orderId).update({
                        paymentStatus: 'failed',
                        status: 'cancelled',
                        updatedAt: new Date().toISOString()
                    });
                    console.log('❌ Commande annulée - Paiement échoué:', orderId);
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
// � AUTHENTICATION ROUTES
// ==========================================

/**
 * POST /api/register
 * Créer un nouvel utilisateur avec Firebase Authentication
 */
app.post('/api/register', async (req, res) => {
    const { name, phone, email, password } = req.body;

    // Validations
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Mot de passe trop court (min. 6 caractères)' });
    }

    try {
        // Créer l'utilisateur dans Firebase Authentication
        const userRecord = await auth.createUser({
            email: email.trim(),
            password: password,
            displayName: name.trim(),
            phoneNumber: phone ? `+221${phone.replace(/^221|\+221/, '')}` : undefined
        });

        // Sauvegarder les infos utilisateur dans Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name: name.trim(),
            phone: phone?.trim() || '',
            email: email.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Créer un token personnalisé pour le client
        const customToken = await auth.createCustomToken(userRecord.uid);

        res.json({
            id: userRecord.uid,
            name: name.trim(),
            phone: phone?.trim() || '',
            email: email.trim(),
            token: customToken
        });

    } catch (error) {
        console.error('Register error:', error.message);
        
        // Messages d'erreur Firebase
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }
        if (error.code === 'auth/invalid-email') {
            return res.status(400).json({ error: 'Email invalide' });
        }
        
        res.status(500).json({ error: 'Erreur lors de l\'inscription: ' + error.message });
    }
});

/**
 * POST /api/login
 * Connecter un utilisateur avec Firebase Authentication
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    try {
        // Chercher l'utilisateur par email
        const userRecord = await auth.getUserByEmail(email.trim());

        // Récupérer les infos supplémentaires depuis Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        const userData = userDoc.data() || {};

        // Créer un token personnalisé
        const customToken = await auth.createCustomToken(userRecord.uid);

        res.json({
            id: userRecord.uid,
            name: userData.name || userRecord.displayName || '',
            phone: userData.phone || '',
            email: userRecord.email,
            token: customToken
        });

    } catch (error) {
        console.error('Login error:', error.message);
        
        if (error.code === 'auth/user-not-found') {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

// ==========================================
// �🗄️ INITIALISER FIRESTORE (Admin only)
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
// 📦 ORDERS MANAGEMENT ROUTES
// ==========================================

/**
 * POST /api/orders/create
 * Créer une nouvelle commande (Frontend)
 */
app.post('/api/orders/create', async (req, res) => {
    try {
        const { userId, items, totalAmount, address, paymentMethod, customerName, customerPhone, customerEmail, orderRef: clientOrderRef } = req.body;

        // Validations
        if (!userId || !items || items.length === 0 || !totalAmount) {
            return res.status(400).json({ error: 'Données de commande invalides' });
        }

        // Utiliser la référence du client ou générer une nouvelle
        const orderRef = clientOrderRef || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Créer le document commande
        const orderData = {
            orderRef: orderRef,
            userId: userId,
            items: items,
            totalAmount: totalAmount,
            address: address || '',
            paymentMethod: paymentMethod || 'senepay', // 'senepay' ou 'delivery'
            status: paymentMethod === 'delivery' ? 'pending_payment' : 'pending_payment',
            paymentStatus: 'pending',
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            customerEmail: customerEmail || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: ''
        };

        const orderId = await db.collection('orders').add(orderData);

        console.log('✅ Commande créée:', orderRef, 'ID:', orderId.id);

        // ===== ENVOI D'EMAILS =====
        // 1. Email à l'ADMIN
        const adminEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0d9488; text-align: center;">🎉 Nouvelle Commande Reçue!</h2>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Référence:</strong> ${orderRef}</p>
                    <p><strong>ID Commande:</strong> ${orderId.id}</p>
                    <p><strong>Client:</strong> ${customerName}</p>
                    <p><strong>Téléphone:</strong> ${customerPhone}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Adresse:</strong> ${address || 'Non spécifiée'}</p>
                    <p><strong>Montant:</strong> ${totalAmount.toLocaleString('fr-SN')} FCFA</p>
                    <p><strong>Méthode Paiement:</strong> ${paymentMethod === 'senepay' ? '💳 SenePay' : '🚚 À la livraison'}</p>
                </div>

                <h3 style="color: #0d9488; margin-top: 20px;">📦 Articles Commandés:</h3>
                <ul style="background: #f0fdf4; padding: 15px; border-radius: 6px;">
                    ${items.map(item => `
                        <li style="margin: 8px 0;">
                            <strong>${item.name}</strong> x${item.qty} = ${(item.price * item.qty).toLocaleString('fr-SN')} FCFA
                        </li>
                    `).join('')}
                </ul>

                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0;"><strong>⚠️ Action requise:</strong> Préparer la commande et attendre le paiement SenePay si applicable.</p>
                </div>

                <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                    DiamanoSN © 2026
                </p>
            </div>
        `;

        // 2. Email au CLIENT
        const clientEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #0d9488; margin: 0;">✅ Commande Confirmée!</h2>
                    <p style="color: #666; margin-top: 5px;">Merci d'avoir choisi DiamanoSN</p>
                </div>

                <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>📦 Votre Commande:</strong> <span style="color: #0d9488; font-weight: bold;">${orderRef}</span></p>
                    <p style="margin: 8px 0;"><strong>👤 Bonjour ${customerName},</strong></p>
                    <p style="margin: 8px 0;"><strong>💰 Total:</strong> ${totalAmount.toLocaleString('fr-SN')} FCFA</p>
                </div>

                <h3 style="color: #0d9488;">📋 Détails de votre Commande:</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #0d9488; color: white;">
                            <th style="padding: 12px; text-align: left;">Produit</th>
                            <th style="padding: 12px; text-align: center;">Qté</th>
                            <th style="padding: 12px; text-align: right;">Prix</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, idx) => `
                            <tr style="border-bottom: 1px solid #eee; ${idx % 2 === 0 ? 'background: #f8fafc;' : ''}">
                                <td style="padding: 12px;">${item.name}</td>
                                <td style="padding: 12px; text-align: center;">${item.qty}</td>
                                <td style="padding: 12px; text-align: right;">${(item.price * item.qty).toLocaleString('fr-SN')} FCFA</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="text-align: center; margin: 25px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://diamanosn.sn'}/track-order.html?ref=${orderRef}" 
                       style="display: inline-block; background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                        📦 Suivre ma Commande
                    </a>
                </div>

                <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;"><strong>💳 Prochaines Étapes:</strong></p>
                    <p style="margin: 8px 0; color: #1e40af;">Vous recevrez bientôt un email avec le lien de paiement sécurisé SenePay.</p>
                    <p style="margin: 8px 0; color: #1e40af;">Une fois le paiement confirmé, votre commande sera traitée rapidement.</p>
                    <p style="margin: 8px 0; color: #1e40af;">Vous recevrez une notification à chaque mise à jour de votre commande.</p>
                </div>

                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0;"><strong>📞 Besoin d'aide?</strong></p>
                    <p style="margin: 8px 0;">Contactez-nous sur WhatsApp: <a href="https://wa.me/221773632458" style="color: #0d9488; text-decoration: none;">+221 77 363 24 58</a></p>
                </div>

                <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                    © 2026 DiamanoSN - Le Grand Bazar du Sénégal
                </p>
            </div>
        `;

        // Envoyer les emails en arrière-plan
        sendEmail(ADMIN_EMAIL, `🎉 Nouvelle Commande: ${orderRef}`, adminEmailContent);
        
        if (customerEmail) {
            sendEmail(customerEmail, `✅ Commande Confirmée - ${orderRef}`, clientEmailContent);
        }

        res.json({
            success: true,
            orderId: orderId.id,
            orderRef: orderRef,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            message: 'Commande créée et emails envoyés'
        });
    } catch (error) {
        console.error('Order creation error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la création de la commande' });
    }
});

/**
 * GET /api/orders/:orderId
 * Récupérer les détails d'une commande
 */
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        res.json({
            id: orderId,
            ...orderDoc.data()
        });
    } catch (error) {
        console.error('Get order error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
    }
});

/**
 * GET /api/orders/user/:userId
 * Récupérer l'historique des commandes d'un utilisateur
 */
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .limit(50)
            .get();

        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Trier par date en mémoire (client-side)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ orders, total: orders.length });
    } catch (error) {
        console.error('Get user orders error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
    }
});

/**
 * GET /api/admin/orders
 * Admin: Récupérer TOUTES les commandes
 */
app.get('/api/admin/orders', verifyFirebaseToken, async (req, res) => {
    try {
        // Vérifier que c'est un admin (optionnel - à améliorer)
        const ordersSnapshot = await db.collection('orders')
            .limit(100)
            .get();

        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Trier par date en mémoire
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ orders, total: orders.length });
    } catch (error) {
        console.error('Get all orders error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
    }
});

/**
 * PATCH /api/admin/orders/:orderId
 * Admin: Mettre à jour le statut d'une commande
 */
app.patch('/api/admin/orders/:orderId', verifyFirebaseToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Statut requis' });
        }

        // Récupérer la commande actuelle pour avoir les infos du client
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const orderData = orderDoc.data();
        const oldStatus = orderData.status;

        const updateData = {
            status: status,
            updatedAt: new Date().toISOString()
        };

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        await db.collection('orders').doc(orderId).update(updateData);

        console.log('✅ Commande mise à jour:', orderId, 'Statut:', oldStatus, '→', status);

        // ===== ENVOYER UN EMAIL AU CLIENT SI LE STATUT CHANGE =====
        if (oldStatus !== status && orderData.customerEmail) {
            const statusLabels = {
                'pending': '⏳ En attente de paiement',
                'pending_payment': '⏳ En attente de paiement',
                'confirmed': '✅ Confirmée - En cours de préparation',
                'shipped': '📦 Expédiée - En route vers vous!',
                'delivered': '✓ Livrée - Merci de votre confiance!',
                'cancelled': '❌ Annulée'
            };

            const statusEmojis = {
                'pending': '⏳',
                'pending_payment': '⏳',
                'confirmed': '✅',
                'shipped': '📦',
                'delivered': '✓',
                'cancelled': '❌'
            };

            const statusMessages = {
                'pending': 'Votre commande est en attente. Nous vous enverrons un lien de paiement bientôt.',
                'pending_payment': 'Votre commande est prête. Veuillez effectuer le paiement pour la valider.',
                'confirmed': 'Excellentes nouvelles! Votre paiement a été reçu et votre commande est en cours de préparation.',
                'shipped': 'Votre commande a été expédiée! Vous pouvez la suivre avec le numéro de suivi fourni.',
                'delivered': 'Votre commande a été livrée! Merci d\'avoir choisi DiamanoSN.',
                'cancelled': 'Votre commande a été annulée. Si vous avez des questions, contactez-nous.'
            };

            const statusColors = {
                'pending': '#fbbf24',
                'pending_payment': '#fbbf24',
                'confirmed': '#10b981',
                'shipped': '#3b82f6',
                'delivered': '#8b5cf6',
                'cancelled': '#ef4444'
            };

            const clientEmailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: ${statusColors[status] || '#0d9488'}; margin: 0; font-size: 28px;">
                            ${statusEmojis[status] || '📦'} Mise à jour de votre Commande
                        </h2>
                        <p style="color: #666; margin-top: 10px;">Référence: <strong>${orderData.orderRef}</strong></p>
                    </div>

                    <div style="background: ${statusColors[status] || '#0d9488'}15; padding: 15px; border-radius: 6px; border-left: 4px solid ${statusColors[status] || '#0d9488'}; margin: 20px 0;">
                        <p style="margin: 0; color: ${statusColors[status] || '#0d9488'}; font-weight: bold; font-size: 18px;">
                            ${statusLabels[status] || status}
                        </p>
                        <p style="margin: 10px 0 0 0; color: #555;">
                            ${statusMessages[status] || 'Votre commande a été mise à jour.'}
                        </p>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 8px 0;"><strong>📦 Votre Commande:</strong> ${orderData.orderRef}</p>
                        <p style="margin: 8px 0;"><strong>💰 Total:</strong> ${orderData.totalAmount.toLocaleString('fr-SN')} FCFA</p>
                        <p style="margin: 8px 0;"><strong>📍 Adresse:</strong> ${orderData.address || 'Non spécifiée'}</p>
                        <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString('fr-SN')}</p>
                        ${orderData.notes ? `<p style="margin: 8px 0;"><strong>📝 Notes:</strong> ${orderData.notes}</p>` : ''}
                    </div>

                    <h3 style="color: #0d9488; margin-top: 20px;">📋 Détails de votre Commande:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: ${statusColors[status] || '#0d9488'}; color: white;">
                                <th style="padding: 12px; text-align: left;">Produit</th>
                                <th style="padding: 12px; text-align: center;">Qté</th>
                                <th style="padding: 12px; text-align: right;">Prix</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderData.items.map((item, idx) => `
                                <tr style="border-bottom: 1px solid #eee; ${idx % 2 === 0 ? 'background: #f8fafc;' : ''}">
                                    <td style="padding: 12px;">${item.name}</td>
                                    <td style="padding: 12px; text-align: center;">${item.qty}</td>
                                    <td style="padding: 12px; text-align: right;">${(item.price * item.qty).toLocaleString('fr-SN')} FCFA</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                        <p style="margin: 0;"><strong>📞 Besoin d'aide?</strong></p>
                        <p style="margin: 8px 0;">Contactez-nous sur WhatsApp: <a href="https://wa.me/221773632458" style="color: #0d9488; text-decoration: none;">+221 77 363 24 58</a></p>
                    </div>

                    <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                        © 2026 DiamanoSN - Le Grand Bazar du Sénégal
                    </p>
                </div>
            `;

            // Envoyer l'email au client en arrière-plan
            sendEmail(orderData.customerEmail, `${statusEmojis[status] || '📦'} Mise à jour: ${statusLabels[status] || status}`, clientEmailContent);

            // Envoyer un email à l'admin aussi
            const adminStatusEmail = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #0d9488;">Commande Mise à Jour</h2>
                    <p><strong>Référence:</strong> ${orderData.orderRef}</p>
                    <p><strong>Client:</strong> ${orderData.customerName}</p>
                    <p><strong>Ancien Statut:</strong> ${statusLabels[oldStatus] || oldStatus}</p>
                    <p><strong>Nouveau Statut:</strong> ${statusLabels[status] || status}</p>
                    <p><strong>Montant:</strong> ${orderData.totalAmount.toLocaleString('fr-SN')} FCFA</p>
                    ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                </div>
            `;
            sendEmail(ADMIN_EMAIL, `Mise à jour commande: ${orderData.orderRef}`, adminStatusEmail);
        }

        res.json({
            success: true,
            message: 'Commande mise à jour et email envoyé au client',
            orderId: orderId,
            status: status
        });
    } catch (error) {
        console.error('Update order error:', error.message);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
    }
});

// ==========================================
// 📧 CONTACT FORM ROUTE
// ==========================================

/**
 * POST /api/contact
 * Enregistrer un message de contact
 */
app.get('/api/test-contact', (req, res) => {
    res.json({ message: 'Contact endpoint is loaded!', timestamp: new Date().toISOString() });
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validations
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nom, email, sujet et message sont requis' 
            });
        }

        if (!email.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email invalide' 
            });
        }

        // Sauvegarder le message dans Firestore
        const contactData = {
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || '',
            subject: subject.trim(),
            message: message.trim(),
            createdAt: new Date().toISOString(),
            status: 'new',
            ip: req.ip || 'unknown'
        };

        const contactRef = await db.collection('contacts').add(contactData);

        console.log('✅ Message de contact reçu:', contactRef.id, 'De:', email);

        // 📧 ENVOYER UN EMAIL À L'ADMIN
        const adminContactEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #d97706; text-align: center;">📬 Nouveau Message de Contact</h2>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Nom:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Téléphone:</strong> ${phone || 'Non fourni'}</p>
                    <p><strong>Sujet:</strong> ${subject}</p>
                </div>

                <h3 style="color: #d97706;">Message:</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #d97706; white-space: pre-wrap;">
                    ${message}
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 6px;">
                    <p style="margin: 0;"><strong>📋 ID Message:</strong> ${contactRef.id}</p>
                    <p style="margin: 8px 0;"><strong>🕐 Date:</strong> ${new Date(contactData.createdAt).toLocaleString('fr-SN')}</p>
                </div>

                <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                    DiamanoSN © 2026 - Message automatique
                </p>
            </div>
        `;

        // Envoyer email admin EN ARRIÈRE-PLAN
        sendEmail(ADMIN_EMAIL, `📬 Nouveau Contact: ${subject}`, adminContactEmail).catch(err => {
            console.error('⚠️  Email admin contact non envoyé:', err.message);
        });

        // 📧 ENVOYER CONFIRMATION AU CLIENT
        const clientConfirmEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0d9488; text-align: center;">✅ Message Reçu!</h2>
                
                <p>Bonjour ${name},</p>
                <p>Merci de nous avoir contacté! Nous avons bien reçu votre message et vous répondrons dès que possible.</p>

                <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Votre Sujet:</strong> ${subject}</p>
                    <p><strong>ID Demande:</strong> ${contactRef.id}</p>
                </div>

                <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0;"><strong>📞 Pour une réponse rapide:</strong></p>
                    <p style="margin: 8px 0;">Contactez-nous sur WhatsApp: <a href="https://wa.me/221773632458" style="color: #0d9488; text-decoration: none;">+221 77 363 24 58</a></p>
                </div>

                <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                    © 2026 DiamanoSN - Le Grand Bazar du Sénégal
                </p>
            </div>
        `;

        sendEmail(email.trim(), `✅ Confirmation: Votre message a été reçu`, clientConfirmEmail).catch(err => {
            console.error('⚠️  Email confirmation client non envoyé:', err.message);
        });

        res.json({
            success: true,
            message: 'Merci pour votre message. Nous vous répondrons bientôt!',
            contactId: contactRef.id,
            receivedAt: contactData.createdAt
        });
    } catch (error) {
        console.error('Contact form error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'envoi du message'
        });
    }
});

// ==========================================
// 📬 NEWSLETTER SUBSCRIPTION
// ==========================================
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email, firstName = '', lastName = '' } = req.body;

        // Validations
        if (!email || !email.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email valide requis'
            });
        }

        // Ajouter le contact à Brevo
        const subscribed = await subscribeToNewsletter(
            email.trim().toLowerCase(),
            firstName.trim() || '',
            lastName.trim() || ''
        );

        if (!subscribed) {
            return res.status(500).json({ 
                success: false, 
                error: 'Erreur lors de l\'abonnement à la newsletter'
            });
        }

        // Sauvegarder aussi dans Firestore pour tracking
        const subscriberData = {
            email: email.trim().toLowerCase(),
            firstName: firstName.trim() || 'Abonné',
            lastName: lastName.trim() || 'DiamanoSN',
            subscribedAt: new Date().toISOString(),
            source: 'website',
            ip: req.ip || 'unknown'
        };

        await db.collection('newsletter_subscribers').doc(email.trim().toLowerCase()).set(subscriberData, { merge: true });

        console.log('✅ Nouveau subscriber newsletter:', email);

        // 📧 ENVOYER CONFIRMATION AU SUBSCRIBER
        const subscriberConfirmEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0d9488; text-align: center;">✅ Bienvenue à la Newsletter!</h2>
                
                <p>Bonjour ${firstName || 'Abonné'},</p>
                <p>Merci de votre abonnement! Vous allez maintenant recevoir nos dernières actualités, offres exclusives et produits en avant-première.</p>

                <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>📬 Vous êtes abonné avec l'email:</strong></p>
                    <p style="margin: 8px 0; color: #0d9488;">${email.trim().toLowerCase()}</p>
                </div>

                <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0;"><strong>🎁 Avantages de l'abonnement:</strong></p>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        <li>Remises exclusives chaque semaine</li>
                        <li>Accès aux ventes privées en avant-première</li>
                        <li>Conseils et astuces mode</li>
                        <li>Codes promotionnels réservés</li>
                    </ul>
                </div>

                <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                    © 2026 DiamanoSN - Le Grand Bazar du Sénégal
                </p>
            </div>
        `;

        // Envoyer confirmation au subscriber
        const confirmResult = await sendEmail(email.trim().toLowerCase(), '✅ Bienvenue à la Newsletter DiamanoSN!', subscriberConfirmEmail);
        if (confirmResult.success) {
            console.log('✅ Email confirmation subscriber envoyé:', email);
        } else {
            console.error('❌ Email confirmation subscriber échoué:', confirmResult.error);
        }

        // 📧 NOTIFIER L'ADMIN D'UN NOUVEAU SUBSCRIBER
        const adminNewsletterEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0d9488; text-align: center;">📬 Nouveau Subscriber Newsletter</h2>
                
                <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${email.trim().toLowerCase()}</p>
                    <p><strong>Nom:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleString('fr-SN')}</p>
                </div>

                <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
                    DiamanoSN © 2026 - Notification automatique
                </p>
            </div>
        `;

        const adminResult = await sendEmail(ADMIN_EMAIL, `📬 Nouveau Subscriber Newsletter: ${email.trim().toLowerCase()}`, adminNewsletterEmail);
        if (adminResult.success) {
            console.log('✅ Email admin newsletter envoyé');
        } else {
            console.error('❌ Email admin newsletter échoué:', adminResult.error);
        }

        res.json({
            success: true,
            message: 'Merci! Vous êtes maintenant abonné à notre newsletter.',
            email: email.trim().toLowerCase()
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'abonnement'
        });
    }
});

// ==========================================
// 🏥 HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.1.0-contact-api',
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

// ==========================================
// 📧 NEWSLETTER - SEND BULK EMAIL
// ==========================================
app.post('/api/newsletter/send-bulk', async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ success: false, error: 'Subject et message requis' });
        }

        // Récupérer tous les abonnés
        const subscribersSnap = await db.collection('newsletter_subscribers').get();
        let sentCount = 0;
        let failedCount = 0;

        for (const doc of subscribersSnap.docs) {
            const subscriber = doc.data();
            try {
                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">${subject}</h2>
                        <div style="line-height: 1.6; color: #333;">
                            ${message}
                        </div>
                        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
                        <p style="font-size: 12px; color: #999;">
                            DiamanoSN - Le Grand Bazar du Sénégal
                        </p>
                    </div>
                `;

                const sent = await sendEmail(subscriber.email, subject, htmlContent);
                if (sent.success) sentCount++;
                else failedCount++;
            } catch (err) {
                console.error('Erreur envoi email:', subscriber.email, err);
                failedCount++;
            }
        }

        console.log(`✅ Newsletter envoyée: ${sentCount} réussis, ${failedCount} échoués`);

        res.json({
            success: true,
            message: `Newsletter envoyée à ${sentCount} abonnés`,
            sent: sentCount,
            failed: failedCount
        });
    } catch (error) {
        console.error('Newsletter bulk send error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi' });
    }
});

module.exports = app;