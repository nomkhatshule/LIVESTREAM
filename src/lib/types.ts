
import { Timestamp } from 'firebase/firestore';

// Type Definitions from agora-test/page.tsx
export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  message: string;
  timestamp: any;
  replyingTo?: string;
  attachment?: {
    type: 'giphy' | 'image';
    title?: string;
    imageUrl: string;
    thumbUrl?: string;
  }
}

export interface Reaction {
  id: number;
  emoji: React.ReactNode;
  x: number;
}

export interface BroadcastData {
    title: string;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    isLive: boolean;
    streamStartedAt?: Timestamp;
    streamDetails?: {
      isScreenSharing: boolean;
    },
    user?: {
        id: string;
        name: string;
        avatarUrl: string;
    },
    viewerCount?: number;
}

export interface GiphyResult {
    id: string;
    images: {
        fixed_width: { url: string; };
        original: { url: string; };
    };
    title: string;
}

    

    
