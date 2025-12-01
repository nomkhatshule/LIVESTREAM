
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
  initiateEmailSignUp,
  initiateEmailSignIn,
  initiateGoogleSignIn,
} from '@/firebase/non-blocking-login';
import { Suspense } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

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
  
  const handleAuthRedirect = (isNewUser: boolean) => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe(); // Unsubscribe after we get the user
        if (isNewUser) {
          router.push(`/profile/${user.uid}?new_user=true`);
        } else {
          router.push('/feed');
        }
      }
    });
  }

  const onSubmit: SubmitHandler<FormSchema> = data => {
    if (authType === 'signup') {
      const { email, password, username } = data as z.infer<typeof signupSchema>;
      initiateEmailSignUp(auth, email, password, username);
      handleAuthRedirect(true); // New email signup is always a new user
    } else {
      const { email, password } = data as z.infer<typeof loginSchema>;
      initiateEmailSignIn(auth, email, password);
      handleAuthRedirect(false); // Login is for existing users
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await initiateGoogleSignIn(auth);
    if (result.success) {
      // Use the isNewUser flag from the result to decide the redirect
      handleAuthRedirect(result.isNewUser);
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
        <button
          type="button"
          className="gsi-material-button"
          onClick={handleGoogleSignIn}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{ display: 'block' }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">
              {authType === 'signup' ? 'Sign up with Google' : 'Login with Google'}
            </span>
          </div>
        </button>
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
