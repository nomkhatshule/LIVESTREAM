import { redirect } from 'next/navigation';

export default function LivePage() {
  // This page is deprecated in favor of agora-test, which is the new live studio.
  // Redirecting to the home page as a sensible default. A more specific redirect
  // might be needed depending on context, but this prevents users from landing here.
  redirect('/');
}
