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

export const mockHighlights = [
    { id: 1, imageUrl: 'https://picsum.photos/seed/highlight1/300/533', views: 125000 },
    { id: 2, imageUrl: 'https://picsum.photos/seed/highlight2/300/533', views: 89000 },
    { id: 3, imageUrl: 'https://picsum.photos/seed/highlight3/300/533', views: 1200 },
    { id: 4, imageUrl: 'https://picsum.photos/seed/highlight4/300/533', views: 543000 },
    { id: 5, imageUrl: 'https://picsum.photos/seed/highlight5/300/533', views: 2100 },
    { id: 6, imageUrl: 'https://picsum.photos/seed/highlight6/300/533', views: 7600 },
    { id: 7, imageUrl: 'https://picsum.photos/seed/highlight7/300/533', views: 32000 },
    { id: 8, imageUrl: 'https://picsum.photos/seed/highlight8/300/533', views: 1900000 },
    { id: 9, imageUrl: 'https://picsum.photos/seed/highlight9/300/533', views: 4200 },
];

export const mockGifts = [
    {
        id: 1,
        name: 'Cosmic Dragon',
        imageUrl: '/gifts/cosmic-dragon.png',
        rarity: 'Legendary',
        description: 'A mythical beast that soars across the cosmos.',
        topGifter: '@SuperFan123',
        count: 2,
    },
    {
        id: 2,
        name: 'Starship',
        imageUrl: '/gifts/starship.png',
        rarity: 'Epic',
        count: 5,
    },
    {
        id: 3,
        name: 'Golden Crown',
        imageUrl: '/gifts/golden-crown.png',
        rarity: 'Epic',
        count: 12,
    },
    {
        id: 4,
        name: 'Diamond Heart',
        imageUrl: '/gifts/diamond-heart.png',
        rarity: 'Rare',
        count: 58,
    },
    {
        id: 5,
        name: 'Magic Potion',
        imageUrl: '/gifts/magic-potion.png',
        rarity: 'Rare',
        count: 103,
    },
];
    
