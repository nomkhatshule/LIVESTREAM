'use client';

import { useFirestore } from '@/firebase';
import { Button } from './ui/button';
import { doc, writeBatch, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState }from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, Loader2, Wrench } from 'lucide-react';

export function TempDataMigration() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleFixTimestamps = async () => {
        if (!firestore) return;
        setIsLoading(true);

        try {
            const usersCollectionRef = collection(firestore, 'users');
            const querySnapshot = await getDocs(usersCollectionRef);
            
            if (querySnapshot.empty) {
                toast({ title: "No users found."});
                setIsDone(true);
                return;
            }

            const batch = writeBatch(firestore);

            querySnapshot.forEach(document => {
                const data = document.data();
                const userRef = doc(firestore, 'users', document.id);

                // Check if createdAt is a Timestamp object
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    // Convert timestamp to milliseconds
                    const numericTimestamp = data.createdAt.toDate().getTime();
                    batch.update(userRef, { createdAt: numericTimestamp });
                }
            });

            await batch.commit();
            toast({
                title: 'Success!',
                description: 'User timestamps have been converted. Algolia should now be able to index correctly.',
            });
            setIsDone(true);
        } catch (error: any) {
            console.error('Data migration failed:', error);
            toast({
                variant: 'destructive',
                title: 'Migration Failed',
                description: error.message || 'Could not update user documents.',
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
                The timestamps have been fixed. You can now remove the {'<TempDataMigration />'} component from `src/app/page.tsx`. Please check your Algolia dashboard to see if indexing is succeeding.
              </AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert>
          <Wrench className="h-4 w-4" />
          <AlertTitle>Action Recommended: Fix Data for Search</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <p>Click the button to convert user data to a search-compatible format. This should resolve the Algolia indexing error.</p>
            <Button onClick={handleFixTimestamps} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fix Timestamps
            </Button>
          </AlertDescription>
        </Alert>
    )
}
