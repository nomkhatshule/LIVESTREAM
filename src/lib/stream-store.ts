
'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Broadcast } from './data';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

interface StreamState {
  status: ConnectionStatus;
  activeBroadcast: Broadcast | null;
  connect: (user: User, broadcast: Broadcast) => Promise<void>;
  disconnect: () => void;
  setActiveBroadcast: (broadcast: Broadcast | null) => void;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  status: 'idle',
  activeBroadcast: null,
  
  setActiveBroadcast: (broadcast) => {
    const currentBroadcast = get().activeBroadcast;
    if (currentBroadcast?.id !== broadcast?.id) {
      get().disconnect(); 
      set({ activeBroadcast: broadcast });
    }
  },

  connect: async (user, broadcast) => {
    if (get().status === 'connecting' || get().status === 'connected') {
      return;
    }

    set({ status: 'connecting', activeBroadcast: broadcast });

    try {
      if (!broadcast.playbackId) {
        throw new Error('Playback ID not found for this broadcast.');
      }
      
      // In a real Mux integration, we don't need to manage a client/call object for viewers.
      // The MuxPlayer handles the connection using just the playbackId.
      // We just need to signal that we are "connected" so the UI can render the player.
      set({ status: 'connected' });

    } catch (error) {
      console.error('Mux connection failed:', error);
      set({ status: 'error' });
      get().disconnect();
    }
  },

  disconnect: () => {
    // With Mux Player, there's no persistent client connection to manage for viewers.
    // We just reset the state.
    set({ status: 'disconnected' });
  },
}));
