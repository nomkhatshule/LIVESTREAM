
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any other query params
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', 'signup');
    router.replace(`/login?${params.toString()}`);
  }, [router, searchParams]);

  return null; // Render nothing while redirecting
}

// This page just redirects to the main login page with a parameter
// to show the signup form.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
        <SignupRedirector />
    </Suspense>
  );
}
