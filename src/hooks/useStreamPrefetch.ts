
'use client';

import { useState, useEffect, useRef } from 'react';
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
  const isConnecting = useRef(false);

  useEffect(() => {
    // If the user scrolls away, the `user` prop becomes null. This is our signal to clean up.
    if (!user && prefetchedClient) {
        // Disconnect and reset state.
        prefetchedClient.disconnectUser().catch(err => console.error("Prefetch cleanup: Failed to disconnect user", err));
        setPrefetchedClient(null);
        setPrefetchedToken(null);
        isConnecting.current = false;
        return;
    }

    // Don't start a new connection if one is already in progress, or if we don't have a user.
    if (isConnecting.current || !user || !broadcast || prefetchedClient) {
      return;
    }
    
    isConnecting.current = true;
    let client: StreamVideoClient;
    let isCancelled = false;

    const prefetch = async (attempt = 1) => {
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

        // Set the state once the client is successfully created
        if (!isCancelled) {
            setPrefetchedToken(token);
            setPrefetchedClient(client);
            isConnecting.current = false;
        } else {
             // If cancelled during creation, make sure to clean up.
             client.disconnectUser();
        }

      } catch (error) {
        console.error(`Stream pre-fetching failed on attempt ${attempt}:`, error);
        isConnecting.current = false; // Allow for a retry on the next render
        
        // Retry logic with exponential backoff
        const maxRetries = 3;
        if (attempt < maxRetries && !isCancelled) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`Retrying prefetch in ${delay / 1000}s...`);
            setTimeout(() => prefetch(attempt + 1), delay);
        }
      }
    };

    prefetch();

    // Cleanup function
    return () => {
      isCancelled = true;
      // The main cleanup is now handled when the `user` prop becomes null,
      // which is a more reliable signal that the component is no longer active.
    };
  }, [user, broadcast, prefetchedClient]);

  return { prefetchedClient, prefetchedToken };
};
