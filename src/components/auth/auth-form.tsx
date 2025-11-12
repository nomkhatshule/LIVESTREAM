'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
  initiateGoogleSignIn,
} from '@/firebase/non-blocking-login';
import { Suspense } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const signupSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

function AuthFormComponent() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const authType = searchParams.get('type') === 'signup' ? 'signup' : 'login';

  const formSchema = authType === 'signup' ? signupSchema : loginSchema;
  type FormSchema = z.infer<typeof formSchema>;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues:
      authType === 'signup'
        ? { username: '', email: '', password: '' }
        : { email: '', password: '' },
  });

  const onSubmit: SubmitHandler<FormSchema> = data => {
    if (authType === 'signup') {
      const { email, password, username } = data as z.infer<typeof signupSchema>;
      // Pass username to the signup function
      initiateEmailSignUp(auth, email, password, username);
    } else {
      const { email, password } = data as z.infer<typeof loginSchema>;
      initiateEmailSignIn(auth, email, password);
    }
    router.push('/feed');
  };

  const handleGoogleSignIn = async () => {
    const success = await initiateGoogleSignIn(auth);
    if (success) {
      router.push('/feed');
    } else {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {authType === 'signup' && (
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="StreamKing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid gap-2">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-2">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {authType === 'signup' ? 'Create an account' : 'Login'}
        </Button>
        <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn}>
          {authType === 'signup' ? 'Sign up with Google' : 'Login with Google'}
        </Button>
      </form>
    </Form>
  );
}

// Wrap the component in Suspense because it uses useSearchParams
export default function AuthForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthFormComponent />
        </Suspense>
    )
}
