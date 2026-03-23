const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Initialize from service account JSON stored in GitHub Secret
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'xqboost.firebasestorage.app',
});

const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { db, storage, FieldValue };
