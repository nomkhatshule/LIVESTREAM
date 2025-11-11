
'use client';

import { useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import type { User } from 'firebase/auth';
import type { Broadcast } from '@/lib/data';

/**
 * A hook to pre-fetch Stream connection resources for a given user and broadcast.
 * It will only fetch if the user is provided (i.e., when the broadcast is active).
 * @param user The current Firebase user. Null if pre-fetching should not occur.
 * @param broadcast The broadcast to pre-fetch for.
 * @returns An object with the prefetched client and token, which may be null.
 */
export const useStreamPrefetch = (user: User | null, broadcast: Broadcast) => {
  const [prefetchedClient, setPrefetchedClient] = useState<StreamVideoClient | null>(null);
  const [prefetchedToken, setPrefetchedToken] = useState<string | null>(null);

  useEffect(() => {
    // Only run if a user is provided and we haven't already prefetched.
    if (!user || !broadcast || prefetchedClient) {
        // If the user becomes null (item is no longer active), clean up.
        if (prefetchedClient) {
            prefetchedClient.disconnectUser();
            setPrefetchedClient(null);
            setPrefetchedToken(null);
        }
        return;
    }

    let client: StreamVideoClient;
    let isCancelled = false;

    const prefetch = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
            console.error("Stream API key missing for prefetch.");
            return;
        }

        // 1. Fetch the token
        const tokenResponse = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
        if (!tokenResponse.ok) throw new Error('Failed to pre-fetch stream token');
        const { token } = await tokenResponse.json();

        if (isCancelled) return;
        
        // 2. Initialize the client
        client = new StreamVideoClient({
            apiKey,
            user: {
                id: user.uid,
                name: user.displayName || 'Viewer',
                image: user.photoURL || undefined,
            },
            token,
        });

        if (isCancelled) {
             client.disconnectUser();
             return;
        }

        // Set the state
        setPrefetchedToken(token);
        setPrefetchedClient(client);

      } catch (error) {
        console.error("Stream pre-fetching failed:", error);
      }
    };

    prefetch();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (client) {
        client.disconnectUser();
      }
    };
  }, [user, broadcast, prefetchedClient]);

  return { prefetchedClient, prefetchedToken };
};

    