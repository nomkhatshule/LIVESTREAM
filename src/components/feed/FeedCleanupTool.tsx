'use client';

import { useState } from 'react';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Wrench, Loader2 } from 'lucide-react';

export default function FeedCleanupTool() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      // 1. Find all documents in the 'broadcasts' collection where isLive is true
      const q = query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({ title: 'No active streams found', description: 'Your feed is already clean!' });
        setIsCleaning(false);
        return;
      }

      // 2. Create a batch write to update all of them at once
      const batch = writeBatch(firestore);
      let count = 0;
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { isLive: false });
        count++;
      });

      // 3. Commit the batch
      await batch.commit();

      toast({
        title: 'Feed Cleaned Up!',
        description: `Successfully marked ${count} ghost stream(s) as offline.`,
      });

    } catch (error) {
      console.error('Error cleaning up feed:', error);
      toast({
        variant: 'destructive',
        title: 'Cleanup Failed',
        description: 'Could not clean up the feed. Please check the console for errors.',
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="p-4">
        <Alert className="bg-background/80 backdrop-blur-lg border-white/20 text-white">
             <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <div className="flex items-center justify-between">
                         <AccordionTrigger className="w-full text-left hover:no-underline">
                             <div className="flex items-center">
                                <Wrench className="h-5 w-5 mr-3" />
                                <div>
                                    <AlertTitle className="text-white font-bold">Feed Cleanup Tool</AlertTitle>
                                    <AlertDescription className="text-white/80">
                                        Some old broadcasts might still appear in the feed.
                                    </AlertDescription>
                                </div>
                            </div>
                         </AccordionTrigger>
                        <Button onClick={handleCleanup} disabled={isCleaning} size="sm" className="bg-white/10 hover:bg-white/20 text-white">
                            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fix Old Streams'}
                        </Button>
                    </div>
                    <AccordionContent>
                        <p className="text-xs text-muted-foreground pt-2">
                           This tool finds all broadcasts in the database that are marked as "live" and sets them to "offline". This is useful for clearing out "ghost" streams that may occur if a host disconnects improperly.
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Alert>
    </div>
  );
}
