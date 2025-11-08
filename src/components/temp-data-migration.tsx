
'use client';

import { useFirestore } from '@/firebase';
import { Button } from './ui/button';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, Loader2, Wrench } from 'lucide-react';

export function TempDataMigration() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [updatedCount, setUpdatedCount] = useState(0);

    const handleFixOldStreams = async () => {
        if (!firestore) return;
        setIsLoading(true);

        try {
            const broadcastsRef = collection(firestore, 'broadcasts');
            const querySnapshot = await getDocs(broadcastsRef);
            
            if (querySnapshot.empty) {
                toast({ title: "No broadcasts found to update."});
                setIsDone(true);
                return;
            }

            const batch = writeBatch(firestore);
            let count = 0;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.isLive === true) {
                    batch.update(doc.ref, { isLive: false });
                    count++;
                }
            });
            
            setUpdatedCount(count);

            if (count > 0) {
                await batch.commit();
                toast({
                    title: 'Success!',
                    description: `${count} old broadcasts have been marked as offline.`,
                });
            } else {
                 toast({
                    title: 'All Good!',
                    description: 'No old live broadcasts were found.',
                });
            }
            
            setIsDone(true);
        } catch (error: any) {
            console.error('Data migration failed:', error);
            toast({
                variant: 'destructive',
                title: 'Migration Failed',
                description: error.message || 'Could not update broadcast documents.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isDone) {
        return (
             <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-700">
              <CheckCircle className="h-4 w-4 !text-green-500" />
              <AlertTitle className="text-green-800 dark:text-green-300">Cleanup Complete</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                {updatedCount > 0 ? `${updatedCount} old broadcasts were fixed.` : `No old broadcasts needed fixing.`} You can now remove the {'<TempDataMigration />'} component from `src/app/feed/page.tsx`.
              </AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert>
          <Wrench className="h-4 w-4" />
          <AlertTitle>Feed Cleanup Tool</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <p>Some old broadcasts might still appear in the feed. Click here to clean them up.</p>
            <Button onClick={handleFixOldStreams} disabled={isLoading} variant="secondary" size="sm">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fix Old Streams
            </Button>
          </AlertDescription>
        </Alert>
    )
}
