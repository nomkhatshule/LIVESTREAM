
'use client';
import { useUser } from '../provider';
import { doc } from 'firebase/firestore';
import { useFirestore } from '..';
import { useDoc } from './use-doc';
import { useMemo } from 'react';

// Define a more flexible User profile type
export interface UserProfile {
  username?: string;
  bio?: string;
  profilePicture?: string;
  // any other fields that might be on the user document
}

/**
 * A hook to fetch the Firestore document for the currently authenticated user.
 * Returns the user document data, loading state, and error.
 */
export function useUserDocument() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (isUserLoading || !user) return undefined;
    return doc(firestore, `users/${user.uid}`);
  }, [user, isUserLoading, firestore]);

  const { data, isLoading, error } = useDoc<UserProfile>(userDocRef);

  return {
    userDocument: data,
    isDocLoading: isLoading,
    docError: error,
  };
}


/**
 * A hook to fetch the Firestore document for a specific user by their ID.
 * Returns the user document data, loading state, and error.
 */
export function useUserDocumentById(userId: string | undefined) {
    const firestore = useFirestore();

    const userDocRef = useMemo(() => {
        if (!userId) return undefined;
        return doc(firestore, `users/${userId}`);
    }, [userId, firestore]);

    const { data, isLoading, error } = useDoc<UserProfile>(userDocRef);

    return {
        userDocument: data,
        isDocLoading: isLoading,
        docError: error,
    };
}
