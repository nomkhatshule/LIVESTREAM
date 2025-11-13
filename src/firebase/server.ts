
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;
if (getApps().length === 0) {
  app = initializeApp();
} else {
  app = getApp();
}

export const db = getFirestore(app);
