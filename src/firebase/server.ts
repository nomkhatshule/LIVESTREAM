
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// In a managed environment like App Hosting, the SDK will automatically
// find the correct service account credentials from the environment.
// We no longer need to manually parse the FIREBASE_SERVICE_ACCOUNT_KEY.

if (getApps().length === 0) {
  // Initialize without arguments, relying on Application Default Credentials.
  // This is the standard for App Hosting and other Google Cloud environments.
  initializeApp();
}

export const db = getFirestore();
