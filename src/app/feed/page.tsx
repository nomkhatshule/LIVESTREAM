import { redirect } from 'next/navigation';

export default function FeedPage() {
  // This page is deprecated in favor of feed-test, which uses the live Stream SDK.
  // Redirect users to the new, functional feed.
  redirect('/feed-test');
}
