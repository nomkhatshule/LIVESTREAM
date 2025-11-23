
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the initial user loading is complete
    if (!isUserLoading) {
      if (user) {
        // If user is logged in, redirect to the feed
        router.replace('/feed');
      } else {
        // If user is not logged in, redirect to the landing page
        router.replace('/landing');
      }
    }
  }, [user, isUserLoading, router]);

  // While we're checking the user's status, show a loading indicator.
  // This prevents the user from seeing a flash of the wrong page.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
