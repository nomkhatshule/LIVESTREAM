'use server';

import { revalidatePath } from 'next/cache';

// This server action is now only responsible for revalidating the cache.
// The database operation is moved to the client.
export async function revalidateProfilePaths() {
  revalidatePath('/profile');
  revalidatePath('/');
}
