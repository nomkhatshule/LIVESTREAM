import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  avatarHint: string;
  bio: string;
  interests: string[];
  watchHistory: string[];
};

export type Broadcast = {
  id: string;
  title: string;
  user: User;
  thumbnailUrl: string;
  thumbnailHint: string;
  viewers: number;
  category: string;
  isLive: boolean;
  tags: string[];
};

export type Category = {
  name: string;
};

export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  message: string;
  timestamp: Timestamp | string | null;
  replyingTo?: string;
};

export const categories = [
    { name: 'Gaming' },
    { name: 'Music' },
    { name: 'Cooking' },
    { name: 'Art' },
    { name: 'Coding' },
    { name: 'Travel' },
    { name: 'Talk Show' },
    { name: 'Fitness' },
];
