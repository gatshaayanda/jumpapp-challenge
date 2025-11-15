// src/utils/firebaseAdmin.ts
import * as admin from 'firebase-admin';

const serviceKey = process.env.FIREBASE_ADMIN_KEY;

if (!serviceKey) {
  throw new Error('FIREBASE_ADMIN_KEY is missing');
}

const serviceAccount = JSON.parse(serviceKey);

const adminApp =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { adminApp };
