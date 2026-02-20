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
import placeholderData from '@/lib/placeholder-images.json';

const { placeholderImages } = placeholderData;
const defaultAvatars = placeholderImages.filter(img => img.id.startsWith('default-avatar-'));
const defaultCovers = placeholderImages.filter(img => img.id.startsWith('default-cover-'));

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking) and create user document. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, username: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      
      const randomAvatar = defaultAvatars[0];
      const randomCover = defaultCovers[0];

      // Set the display name and photoURL in Firebase Auth
      return updateProfile(user, { displayName: username, photoURL: randomAvatar.imageUrl })
        .then(() => {
          // Now create the document in Firestore
          const db = getFirestore(authInstance.app);
          const userDocRef = doc(db, 'users', user.uid);
          return setDoc(userDocRef, {
            id: user.uid,
            username: username,
            email: user.email,
            createdAt: serverTimestamp(),
            profilePicture: randomAvatar.imageUrl, // Set default avatar
            bio: '', // Initialize with empty string
            coverUrl: randomCover.imageUrl, // Set default cover
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
export async function initiateGoogleSignIn(authInstance: Auth): Promise<{ success: boolean; isNewUser: boolean; }> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);
    const isNewUser = additionalInfo?.isNewUser || false;

    // If it's a new user, create their document in Firestore
    if (isNewUser) {
      const db = getFirestore(authInstance.app);
      const userDocRef = doc(db, 'users', user.uid);
      
      // Check if doc already exists just in case (e.g. from a failed previous attempt)
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        const randomAvatar = defaultAvatars[0];
        const randomCover = defaultCovers[0];

        await setDoc(userDocRef, {
          id: user.uid,
          username: user.displayName, // Google provides a display name
          email: user.email,
          createdAt: serverTimestamp(),
          profilePicture: user.photoURL || randomAvatar.imageUrl, // Use Google's photo if available, otherwise our default
          bio: '',
          coverUrl: randomCover.imageUrl, // Set default cover
          coverType: 'image',
        });
        
        // Also update the Auth profile if it doesn't have a photoURL from Google
        if (!user.photoURL) {
            await updateProfile(user, { photoURL: randomAvatar.imageUrl });
        }
      }
    }
    return { success: true, isNewUser }; // Indicate success and if the user is new
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    return { success: false, isNewUser: false }; // Indicate failure
  }
}
