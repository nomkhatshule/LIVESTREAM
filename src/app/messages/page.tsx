
'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InboxPage from '@/app/inbox-page/page';


export default function MessagesPage() {
    return (
        <Suspense fallback={
             <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <InboxPage />
        </Suspense>
    )
}
