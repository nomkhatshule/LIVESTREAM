
'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Broadcast } from './data';

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
      set({ activeBroadcast: broadcast, status: 'idle' });
    }
  },

  connect: async (user, broadcast) => {
     if (get().status === 'connecting' || get().status === 'connected') {
      return;
    }
    // This function is now a placeholder as the connection logic is moved
    // into the VideoPlayer component itself for better encapsulation.
    // The store now mainly manages which broadcast is active.
    set({ activeBroadcast: broadcast });
  },

  disconnect: () => {
    set({ status: 'disconnected' });
  },
}));
