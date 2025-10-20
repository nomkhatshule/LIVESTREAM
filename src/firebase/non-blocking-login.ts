'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking) and create user document. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, username: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      // Set the display name in Firebase Auth
      return updateProfile(user, { displayName: username })
        .then(() => {
          // Now create the document in Firestore
          const db = getFirestore(authInstance.app);
          const userDocRef = doc(db, 'users', user.uid);
          return setDoc(userDocRef, {
            id: user.uid,
            username: username,
            email: user.email,
            createdAt: serverTimestamp(),
            profilePicture: '', // Initialize with empty string
            bio: '', // Initialize with empty string
          });
        });
    })
    .catch(error => {
      // We can add more robust error handling here later if needed
      console.error("Error during sign up and profile creation:", error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}
