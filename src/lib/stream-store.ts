'use client';

import { create } from 'zustand';
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import type { User } from 'firebase/auth';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

interface StreamState {
  client: StreamVideoClient | null;
  call: Call | null;
  status: ConnectionStatus;
  activeBroadcastId: string | null;
  connect: (user: User, broadcastId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setActiveBroadcastId: (broadcastId: string | null) => void;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  client: null,
  call: null,
  status: 'idle',
  activeBroadcastId: null,
  setActiveBroadcastId: (broadcastId) => {
    const currentId = get().activeBroadcastId;
    if (currentId !== broadcastId) {
      set({ activeBroadcastId: broadcastId });
    }
  },
  connect: async (user, broadcastId) => {
    if (get().status === 'connected' && get().call?.id === broadcastId) {
      return; // Already connected to this call
    }
    
    // Disconnect from any existing call before joining a new one
    await get().disconnect();

    set({ status: 'connecting' });

    try {
      // --- Get User Token ---
      const response = await fetch('/api/stream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!response.ok) throw new Error('Failed to fetch stream token');
      const { token } = await response.json();

      // --- Initialize Client ---
      const client = new StreamVideoClient({
        apiKey,
        user: {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          image: user.photoURL || undefined,
        },
        token,
      });

      // --- Join Call ---
      const call = client.call('livestream', broadcastId);
      await call.join();

      set({ client, call, status: 'connected', activeBroadcastId: broadcastId });

    } catch (error) {
      console.error('Stream connection failed:', error);
      set({ status: 'error' });
      // Cleanup on failure
      await get().disconnect();
    }
  },

  disconnect: async () => {
    const { call, client } = get();
    if (call) {
      await call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
    }
    if (client) {
      await client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
    }
    set({ client: null, call: null, status: 'disconnected' });
  },
}));
