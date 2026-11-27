import 'server-only';
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Server-side Firebase Admin SDK. On Firebase App Hosting the credentials are
// provided automatically. Locally, run `gcloud auth application-default login`
// or set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file.
//
// The Admin SDK bypasses Firestore security rules, so it must only ever run
// on the server (the `server-only` import above enforces that at build time).

function adminApp(): App {
  return getApps().length ? getApp() : initializeApp();
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
