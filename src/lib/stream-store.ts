
'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase'; // This is a hook, can't be used here.
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

interface StreamState {
  status: ConnectionStatus;
  activeBroadcastId: string | null;
  playbackId: string | null;
  connect: (user: User, broadcastId: string) => Promise<void>;
  disconnect: () => void;
  setActiveBroadcastId: (broadcastId: string | null) => void;
}

export const useStreamStore = create<StreamState>((set, get) => ({
  status: 'idle',
  activeBroadcastId: null,
  playbackId: null,
  
  setActiveBroadcastId: (broadcastId) => {
    const currentId = get().activeBroadcastId;
    if (currentId !== broadcastId) {
      get().disconnect(); // Disconnect when scrolling to a new stream
      set({ activeBroadcastId: broadcastId });
    }
  },

  connect: async (user, broadcastId) => {
    if (get().status === 'connecting' || get().status === 'connected') {
      return;
    }

    // Explicitly clear playbackId at the start of connection attempt
    set({ status: 'connecting', activeBroadcastId: broadcastId, playbackId: null });

    try {
      // 1. Fetch the broadcast document to get the playbackId
      const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);
      const broadcastDoc = await getDoc(broadcastDocRef);

      if (!broadcastDoc.exists() || !broadcastDoc.data().playbackId) {
        throw new Error('Playback ID not found for this broadcast.');
      }
      
      const playbackId = broadcastDoc.data().playbackId;

      // 2. Set state for Mux Player
      // In a real Mux integration, we don't need to manage a client/call object for viewers.
      // The MuxPlayer handles the connection using just the playbackId.
      set({ status: 'connected', playbackId });

    } catch (error) {
      console.error('Mux connection failed:', error);
      set({ status: 'error' });
      get().disconnect();
    }
  },

  disconnect: () => {
    // With Mux Player, there's no persistent client connection to manage for viewers.
    // We just reset the state.
    set({ status: 'disconnected', playbackId: null });
  },
}));
