'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AuthForm from '@/components/auth/auth-form';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authType = searchParams.get('type') === 'signup' ? 'signup' : 'login';

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Image
        src="https://cdn.pixabay.com/photo/2025/06/26/04/23/colloseum-9681139_1280.png"
        alt="Background"
        fill
        className="object-cover -z-10"
        data-ai-hint="colosseum italy"
      />
      <div className="absolute inset-0 bg-black/50 -z-10" />
      <Card className="relative mx-auto max-w-sm w-full bg-card/80 backdrop-blur-lg border-white/20">
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 rounded-full border border-white/50 text-white hover:bg-white/20"
            onClick={() => router.push('/landing')}
        >
            <X className="h-5 w-5" />
        </Button>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link href="/landing" className="flex items-center gap-2">
              <Image src="/favicon.ico" alt="LIVENET Logo" width={42} height={42} />
              <span className="font-logo font-black text-white text-4xl">LIVENET</span>
            </Link>
          </div>
          <CardTitle className="text-2xl font-headline">Welcome</CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm />
          <div className="mt-4 text-center text-sm">
            {authType === 'login' ? (
              <>
                Need an account?{' '}
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Log in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  )
}
