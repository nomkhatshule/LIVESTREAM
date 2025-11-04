
'use client';

import { useEffect, useReducer } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import { useToast } from '@/hooks/use-toast';
import type { BroadcastData } from '@/lib/types';
import { useRouter } from 'next/navigation';

// 1. Define all possible states and the data we need at each stage
type State =
  | { status: 'idle' }
  | { status: 'initializing_user' }
  | { status: 'fetching_broadcast'; userId: string }
  | { status: 'initializing_stream'; userId: string; broadcastId: string; broadcastData: BroadcastData }
  | { status: 'ready'; data: { client: StreamVideoClient; call: Call; broadcastData: BroadcastData } }
  | { status: 'error'; error: string };

// 2. Define all possible events that can transition our state
type Action =
  | { type: 'INITIALIZE' }
  | { type: 'USER_SUCCESS'; payload: string } // payload is userId
  | { type: 'BROADCAST_SUCCESS'; payload: BroadcastData } // payload is broadcastData
  | { type: 'STREAM_SUCCESS'; payload: { client: StreamVideoClient; call: Call } }
  | { type: 'FAIL'; payload: string };

// 3. The Reducer: Our "Rule Book" for state transitions
const reducer = (state: State, action: Action): State => {
  switch (state.status) {
    case 'idle':
      if (action.type === 'INITIALIZE') return { status: 'initializing_user' };
      break;
    case 'initializing_user':
      if (action.type === 'USER_SUCCESS') return { status: 'fetching_broadcast', userId: action.payload };
      if (action.type === 'FAIL') return { status: 'error', error: action.payload };
      break;
    case 'fetching_broadcast':
       if (action.type === 'BROADCAST_SUCCESS') return { status: 'initializing_stream', userId: state.userId, broadcastId: action.payload.id, broadcastData: action.payload };
       if (action.type === 'FAIL') return { status: 'error', error: action.payload };
       break;
    case 'initializing_stream':
       if (action.type === 'STREAM_SUCCESS') return { status: 'ready', data: { ...action.payload, broadcastData: state.broadcastData } };
       if (action.type === 'FAIL') return { status: 'error', error: action.payload };
       break;
  }
  return state;
};

// 4. The Hook itself: The "Controller" that runs the machine
export const useStudioInitializer = (broadcastId: string | null) => {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const broadcastDocRef = useMemoFirebase(() => {
    if (!broadcastId) return null;
    return doc(firestore, 'broadcasts', broadcastId);
  }, [broadcastId, firestore]);
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

  // Effect to kick things off
  useEffect(() => {
    if (broadcastId && state.status === 'idle') {
      dispatch({ type: 'INITIALIZE' });
    }
  }, [broadcastId, state.status]);
  
  // Effect for user authentication
  useEffect(() => {
    if (state.status === 'initializing_user' && !isUserLoading) {
      if (user) {
        dispatch({ type: 'USER_SUCCESS', payload: user.uid });
      } else {
        dispatch({ type: 'FAIL', payload: 'User is not authenticated.' });
        router.push('/login');
      }
    }
  }, [state.status, user, isUserLoading, router]);

  // Effect for fetching broadcast data
  useEffect(() => {
    if (state.status === 'fetching_broadcast' && !isBroadcastLoading) {
      if (broadcastData) {
        if (broadcastData.hostId !== state.userId) {
          dispatch({ type: 'FAIL', payload: 'You are not the host of this stream.' });
        } else {
          dispatch({ type: 'BROADCAST_SUCCESS', payload: broadcastData });
        }
      } else if (!isBroadcastLoading) {
         dispatch({ type: 'FAIL', payload: 'Broadcast not found.' });
      }
    }
  }, [state, broadcastData, isBroadcastLoading]);
  
  // Effect for initializing Stream
  useEffect(() => {
    let client: StreamVideoClient | undefined;
    if (state.status !== 'initializing_stream') return;
    
    const initStream = async () => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
             dispatch({ type: 'FAIL', payload: 'Stream API key is missing.' });
             return;
        }

        try {
            const response = await fetch('/api/stream/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: state.userId }) });
            if (!response.ok) throw new Error('Failed to fetch stream token');
            const { token } = await response.json();

            client = new StreamVideoClient({
                apiKey,
                user: { id: state.userId, name: user?.displayName || 'Host' },
                token,
            });

            const call = client.call('livestream', state.broadcastId);
            await call.join();
            
            dispatch({ type: 'STREAM_SUCCESS', payload: { client, call } });

        } catch (error: any) {
            dispatch({ type: 'FAIL', payload: error.message || 'Could not connect to broadcast.' });
        }
    };

    initStream();

    return () => {
      if (client) {
        client.disconnectUser().catch(err => console.error("Initializer cleanup: Failed to disconnect user", err));
      }
    };
  }, [state, user, toast]);

  return state;
};
