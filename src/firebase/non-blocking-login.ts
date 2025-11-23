'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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
            profilePicture: user.photoURL || '', // Initialize with photoURL from provider if available
            bio: '', // Initialize with empty string
            coverUrl: '',
            coverType: 'image'
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

/** Initiate Google Sign-In and create user document if new. */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<boolean> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    // If it's a new user, create their document in Firestore
    if (additionalInfo?.isNewUser) {
      const db = getFirestore(authInstance.app);
      const userDocRef = doc(db, 'users', user.uid);
      
      // Check if doc already exists just in case (e.g. from a failed previous attempt)
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
         await setDoc(userDocRef, {
          id: user.uid,
          username: user.displayName, // Google provides a display name
          email: user.email,
          createdAt: serverTimestamp(),
          profilePicture: user.photoURL || '', // Google provides a photo URL
          bio: '',
          coverUrl: '',
          coverType: 'image',
        });
      }
    }
    return true; // Indicate success
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    return false; // Indicate failure
  }
}
