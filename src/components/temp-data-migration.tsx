'use client';

import { useFirestore } from '@/firebase';
import { Button } from './ui/button';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState }from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';

const usersToCreate = [
    { 
        uid: 'pDOa2Wd87RV6kCz0fbBdN095PIh1', 
        email: 'nkosivumilecenge@gmail.com',
        username: 'nkosivumilecenge' // Derived from email
    },
    { 
        uid: 'Zuock7KG6GbJDam7cL2hwvhL0A33', // Assuming the full UID from your screenshot
        email: 'nomkhatshulenathi@gmail.com',
        username: 'nomkhatshulenathi' // Derived from email
    }
];


export function TempDataMigration() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleCreateUsers = async () => {
        if (!firestore) return;
        setIsLoading(true);

        const batch = writeBatch(firestore);

        usersToCreate.forEach(user => {
            const userDocRef = doc(firestore, 'users', user.uid);
            batch.set(userDocRef, {
                id: user.uid,
                email: user.email,
                username: user.username,
                createdAt: serverTimestamp(),
                profilePicture: '',
                bio: '',
            });
        });

        try {
            await batch.commit();
            toast({
                title: 'Success!',
                description: 'The missing user profiles have been created in Firestore.',
            });
            setIsDone(true);
        } catch (error: any) {
            console.error('Data migration failed:', error);
            toast({
                variant: 'destructive',
                title: 'Migration Failed',
                description: error.message || 'Could not create user documents.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isDone) {
        return (
             <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-700">
              <CheckCircle className="h-4 w-4 !text-green-500" />
              <AlertTitle className="text-green-800 dark:text-green-300">Migration Complete</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                The user profiles have been created. You can now remove the {'<TempDataMigration />'} component from `src/app/page.tsx`.
              </AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert>
          <AlertTitle>Action Required: Create Missing User Profiles</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <p>Click the button to create Firestore documents for the 2 users that were created before the sign-up process was updated.</p>
            <Button onClick={handleCreateUsers} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Profiles
            </Button>
          </AlertDescription>
        </Alert>
    )
}
