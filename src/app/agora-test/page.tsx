
import { redirect } from 'next/navigation';

export default function DeprecatedAgoraTestPage() {
  // This page is fully deprecated in favor of /livenet.
  // Any links pointing here are from old logic. Redirecting to home.
  redirect('/');
}

    