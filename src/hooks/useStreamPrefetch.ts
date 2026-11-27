
'use client';

import { useState, useEffect, useRef } from 'react';
import type { StreamVideoClient } from '@stream-io/video-react-sdk';
import type { User } from 'firebase/auth';
import type { Broadcast } from '@/lib/data';
import { fetchStreamToken } from '@/lib/stream-token';

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
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If a disconnect timer is running for this stream, cancel it because we are active again.
    if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
    }

    // If the user scrolls away, the `user` prop becomes null. This is our signal to clean up.
    if (!user && prefetchedClient) {
        // Instead of disconnecting immediately, set a timeout.
        disconnectTimeoutRef.current = setTimeout(() => {
            // Disconnect and reset state.
            prefetchedClient.disconnectUser().catch(err => console.error("Prefetch cleanup: Failed to disconnect user", err));
            setPrefetchedClient(null);
            setPrefetchedToken(null);
            isConnecting.current = false;
        }, 5000); // 5-second delay before disconnecting
        return; // Exit effect early
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
        const token = await fetchStreamToken(user);

        if (isCancelled) return;
        
        // 2. Initialize the client
        // Load the (large) video SDK only when a stream is actually about to play.
        const { StreamVideoClient } = await import('@stream-io/video-react-sdk');
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
      // If component unmounts for good, clear any pending disconnect timer
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, [user, broadcast, prefetchedClient]);

  return { prefetchedClient, prefetchedToken };
};
