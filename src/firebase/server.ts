
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (getApps().length === 0) {
  if (serviceAccount) {
    // Initialize with explicit service account credentials
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Initialize without arguments, relying on Application Default Credentials
    // This is the standard for App Hosting and other Google Cloud environments.
    initializeApp();
  }
}

export const db = getFirestore();
