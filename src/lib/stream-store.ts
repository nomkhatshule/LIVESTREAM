
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
  playbackId: string | null; // Added playbackId to the store
  connect: (user: User, broadcast: Broadcast) => Promise<void>;
  disconnect: () => void;
  setActiveBroadcast: (broadcast: Broadcast | null) => void;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  status: 'idle',
  activeBroadcast: null,
  playbackId: null, // Initialize as null
  
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

    set({ status: 'connecting', activeBroadcast: broadcast, playbackId: null });

    try {
      if (!broadcast.playbackId) {
        throw new Error('Playback ID not found for this broadcast.');
      }
      
      // Save the playbackId and set status to connected
      set({ playbackId: broadcast.playbackId, status: 'connected' });

    } catch (error) {
      console.error('Mux connection failed:', error);
      set({ status: 'error' });
      get().disconnect();
    }
  },

  disconnect: () => {
    set({ status: 'disconnected', playbackId: null });
  },
}));
