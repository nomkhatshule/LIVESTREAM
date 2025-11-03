
'use client';

import { Suspense } from 'react';
import { Loader2, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function MessagingPageComponent() {
  // This component is now a placeholder since Stream Chat has been removed.
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
        <MessageSquareText className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Chat Not Available</h1>
        <p className="text-muted-foreground max-w-sm mt-2">
            The chat and messaging functionality is currently disabled as we are upgrading our systems.
        </p>
        <Button asChild variant="outline" className="mt-6">
            <Link href="/">Back to Home</Link>
        </Button>
    </div>
  );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
             <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <MessagingPageComponent />
        </Suspense>
    )
}
