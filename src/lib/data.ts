
import { z } from 'zod';
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
  hostId: string;
  hostName: string;
  hostAvatar: string;
  activeChallenge?: string;
  activeChallengeType?: 'truth' | 'dare' | 'challenge';
  challengeStartTime?: Timestamp;
  challengeDurationSeconds?: number;
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
  broadcastTitle?: string;
  broadcastId?: string;
};

export type Notification = {
    id: string;
    userId: string; // The user who receives the notification
    type: 'follow' | 'like' | 'comment';
    actorId: string;
    actorName: string;
    actorAvatar: string;
    entityId?: string; // e.g., broadcastId
    entityInfo?: string; // e.g., broadcast title or comment text
    isRead: boolean;
    timestamp: Timestamp;
};


export type Highlight = {
    id: string;
    title: string;
    videoUrl: string;
    createdAt: Timestamp;
    userId: string;
}

// Schema for Genkit Flow: generateGamePrompts
export const GenerateGamePromptsInputSchema = z.object({
  gameType: z
    .enum(['truth', 'dare', 'challenge'])
    .describe('The type of game prompt to generate.'),
  category: z
    .string()
    .describe('The category or theme for the prompts (e.g., "Icebreaker", "Spicy", "Comedy").'),
  count: z.number().describe('The number of prompts to generate.'),
});
export type GenerateGamePromptsInput = z.infer<
  typeof GenerateGamePromptsInputSchema
>;

export const GenerateGamePromptsOutputSchema = z.object({
  prompts: z.array(z.string()).describe('The list of generated prompts.'),
  durationsInSeconds: z.array(z.number()).describe('The duration in seconds for each corresponding prompt.'),
});
export type GenerateGamePromptsOutput = z.infer<
  typeof GenerateGamePromptsOutputSchema
>;


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

export const truthQuestions = [
    "What's the most embarrassing thing you've ever done on a date?",
    "What's a secret you've never told anyone?",
    "What's your biggest fear?",
    "Who is your secret crush?",
    "What's the most childish thing you still do?",
    "What's the worst lie you've ever told?",
    "What's a weird food combination you love?",
    "What's the silliest thing you've cried about?",
];

export const dareChallenges = [
    { text: "Sing everything you say for the next 5 minutes.", duration: 300 },
    { text: "Do your best impersonation of a celebrity.", duration: 60 },
    { text: "Talk in a funny accent for the next round (3 minutes).", duration: 180 },
    { text: "Let someone else post a silly status on your social media.", duration: 90 },
    { text: "Do 10 push-ups.", duration: 30 },
    { text: "Wear a sock on your hand for the rest of the game.", duration: 120 },
    { text: "Speak only in questions for the next 3 minutes.", duration: 180 },
    { text: "Try to lick your elbow.", duration: 30 },
];
