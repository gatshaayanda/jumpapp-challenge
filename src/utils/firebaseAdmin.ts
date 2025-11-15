// src/utils/firebaseAdmin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App;

// Only initialize once in dev/watch mode
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY!);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminApp = app;
