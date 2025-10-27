
import { Timestamp } from 'firebase/firestore';

// Type Definitions from agora-test/page.tsx
export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  message: string;
  timestamp: any;
}

export interface Reaction {
  id: number;
  emoji: React.ReactNode;
  x: number;
}

export interface StagedChallenge {
    text: string;
    type: 'truth' | 'dare' | 'challenge';
    duration: number;
}

export interface BroadcastData {
    title: string;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    isLive: boolean;
    challenge?: string;
    activeChallenge?: string;
    activeChallengeType?: 'truth' | 'dare' | 'challenge';
    challengeStartTime?: Timestamp;
    challengeDurationSeconds?: number;
    streamDetails?: {
      isScreenSharing: boolean;
    },
    user?: {
        id: string;
        name: string;
        avatarUrl: string;
    }
}
