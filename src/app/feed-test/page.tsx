
import { redirect } from 'next/navigation';

export default function OldFeedPage() {
  // This page is deprecated in favor of the new root page that now contains the feed.
  redirect('/');
}
