
import { Timestamp } from 'firebase/firestore';

// Type Definitions from agora-test/page.tsx
export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  message: string;
  timestamp: any;
  attachment?: {
    type: 'giphy';
    title: string;
    imageUrl: string;
    thumbUrl: string;
  }
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
    challengeCardPosition?: { x: number; y: number };
    challengeCardSize?: { width: number, height: number },
    streamDetails?: {
      isScreenSharing: boolean;
    },
    user?: {
        id: string;
        name: string;
        avatarUrl: string;
    }
}

export interface GiphyResult {
    id: string;
    images: {
        fixed_width: { url: string; };
        original: { url: string; };
    };
    title: string;
}
