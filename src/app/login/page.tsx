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
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthPageContent() {
  const searchParams = useSearchParams();
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
      <Card className="mx-auto max-w-sm w-full bg-card/80 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link href="/landing">
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