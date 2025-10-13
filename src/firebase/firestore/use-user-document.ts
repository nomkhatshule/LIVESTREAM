
'use client';
import { useUser } from '../provider';
import { doc } from 'firebase/firestore';
import { useFirestore } from '..';
import { useDoc } from './use-doc';
import { useMemo } from 'react';
import type { User } from '@/lib/data'; // We can reuse this type

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

  const { data, isLoading, error } = useDoc<User>(userDocRef);

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

    const { data, isLoading, error } = useDoc<User>(userDocRef);

    return {
        userDocument: data,
        isDocLoading: isLoading,
        docError: error,
    };
}
