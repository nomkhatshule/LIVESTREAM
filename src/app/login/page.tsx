'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AgoraLiveLogo } from '@/components/icons';
import AuthForm from '@/components/auth/auth-form';
import Image from 'next/image';

export default function AuthPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
       <Image
        src="https://cdn.pixabay.com/photo/2021/07/19/10/52/boat-6477856_1280.png"
        alt="Background"
        fill
        className="object-cover -z-10"
        data-ai-hint="futuristic boat"
      />
      <div className="absolute inset-0 bg-black/50 -z-10" />
      <Card className="mx-auto max-w-sm w-full bg-card/80 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AgoraLiveLogo className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome</CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm />
          <div className="mt-4 text-center text-sm">
            Need an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
