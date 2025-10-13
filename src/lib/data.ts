import placeholderData from './placeholder-images.json';

const { placeholderImages } = placeholderData;

const findImage = (id: string) => placeholderImages.find((img) => img.id === id)?.imageUrl || '';
const findImageHint = (id: string) => placeholderImages.find((img) => img.id === id)?.imageHint || '';

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
  icon: any; // Lucide icon component
};

export type ChatMessage = {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    avatarHint: string;
  };
  message: string;
  timestamp: string;
};

export const users: User[] = [
  {
    id: 'user-1',
    name: 'StreamKing',
    avatarUrl: findImage('avatar-1'),
    avatarHint: findImageHint('avatar-1'),
    bio: 'Pro gamer and part-time chef. Streaming daily!',
    interests: ['Gaming', 'Cooking'],
    watchHistory: ['broadcast-2', 'broadcast-3'],
  },
  {
    id: 'user-2',
    name: 'MusicMaestra',
    avatarUrl: findImage('avatar-2'),
    avatarHint: findImageHint('avatar-2'),
    bio: 'Live concerts from my living room. Requests welcome!',
    interests: ['Music', 'Art'],
    watchHistory: ['broadcast-4', 'broadcast-7'],
  },
  {
    id: 'user-3',
    name: 'CodeWizard',
    avatarUrl: findImage('avatar-3'),
    avatarHint: findImageHint('avatar-3'),
    bio: 'Building cool stuff with code. Join me on the journey.',
    interests: ['Coding', 'Tech'],
    watchHistory: ['broadcast-1', 'broadcast-8'],
  },
  {
    id: 'user-4',
    name: 'ArtfulAdventures',
    avatarUrl: findImage('avatar-4'),
    avatarHint: findImageHint('avatar-4'),
    bio: 'Painter, sculptor, and digital artist. Creating live.',
    interests: ['Art', 'Travel'],
    watchHistory: ['broadcast-6', 'broadcast-2'],
  },
  {
    id: 'user-5',
    name: 'GourmetGuru',
    avatarUrl: findImage('avatar-5'),
    avatarHint: findImageHint('avatar-5'),
    bio: 'Exploring cuisines from around the world.',
    interests: ['Cooking', 'Travel'],
    watchHistory: ['broadcast-7', 'broadcast-1'],
  },
];

export const broadcasts: Broadcast[] = [
  {
    id: 'broadcast-1',
    title: 'Final Boss Takedown! Viewer Games Later!',
    user: users[0],
    thumbnailUrl: findImage('broadcast-1'),
    thumbnailHint: findImageHint('broadcast-1'),
    viewers: 12500,
    category: 'Gaming',
    isLive: true,
    tags: ['Action', 'RPG', 'Community'],
  },
  {
    id: 'broadcast-2',
    title: 'Live DJ Set - Deep House & Techno',
    user: users[1],
    thumbnailUrl: findImage('broadcast-2'),
    thumbnailHint: findImageHint('broadcast-2'),
    viewers: 8900,
    category: 'Music',
    isLive: true,
    tags: ['Electronic', 'Live Music', 'Chill'],
  },
  {
    id: 'broadcast-3',
    title: 'Making Ramen from Scratch',
    user: users[4],
    thumbnailUrl: findImage('broadcast-3'),
    thumbnailHint: findImageHint('broadcast-3'),
    viewers: 4200,
    category: 'Cooking',
    isLive: true,
    tags: ['Japanese Food', 'How-To', 'Cooking'],
  },
  {
    id: 'broadcast-4',
    title: 'Watercolor Galaxy Painting Tutorial',
    user: users[3],
    thumbnailUrl: findImage('broadcast-4'),
    thumbnailHint: findImageHint('broadcast-4'),
    viewers: 6100,
    category: 'Art',
    isLive: true,
    tags: ['Painting', 'Creative', 'DIY'],
  },
  {
    id: 'broadcast-5',
    title: 'Building a React Native App - Part 3',
    user: users[2],
    thumbnailUrl: findImage('broadcast-5'),
    thumbnailHint: findImageHint('broadcast-5'),
    viewers: 3500,
    category: 'Coding',
    isLive: false,
    tags: ['Programming', 'React', 'Mobile Dev'],
  },
  {
    id: 'broadcast-6',
    title: 'Virtual Tour of Kyoto, Japan',
    user: users[3],
    thumbnailUrl: findImage('broadcast-6'),
    thumbnailHint: findImageHint('broadcast-6'),
    viewers: 7300,
    category: 'Travel',
    isLive: true,
    tags: ['Japan', 'Travel', 'Culture'],
  },
  {
    id: 'broadcast-7',
    title: 'Weekly Tech News Roundup',
    user: users[2],
    thumbnailUrl: findImage('broadcast-7'),
    thumbnailHint: findImageHint('broadcast-7'),
    viewers: 9500,
    category: 'Talk Show',
    isLive: true,
    tags: ['Tech', 'News', 'Podcast'],
  },
  {
    id: 'broadcast-8',
    title: 'Morning Yoga & Meditation',
    user: users[1],
    thumbnailUrl: findImage('broadcast-8'),
    thumbnailHint: findImageHint('broadcast-8'),
    viewers: 2100,
    category: 'Fitness',
    isLive: false,
    tags: ['Health', 'Wellness', 'Yoga'],
  },
  {
    id: 'broadcast-9',
    title: 'Speedrun Challenge: Retro Platformer',
    user: users[0],
    thumbnailUrl: findImage('broadcast-9'),
    thumbnailHint: findImageHint('broadcast-9'),
    viewers: 15000,
    category: 'Gaming',
    isLive: true,
    tags: ['Speedrun', 'Retro', 'Gaming'],
  },
  {
    id: 'broadcast-10',
    title: 'Acoustic Covers & Chill Vibes',
    user: users[1],
    thumbnailUrl: findImage('broadcast-10'),
    thumbnailHint: findImageHint('broadcast-10'),
    viewers: 5500,
    category: 'Music',
    isLive: true,
    tags: ['Acoustic', 'Covers', 'Live Music'],
  },
];

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


export const chatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    user: { name: 'ChattyCathy', avatarUrl: findImage('avatar-3'), avatarHint: findImageHint('avatar-3') },
    message: 'This is amazing! 🔥',
    timestamp: '2m ago',
  },
  {
    id: 'msg-2',
    user: { name: 'LurkerLuke', avatarUrl: findImage('avatar-4'), avatarHint: findImageHint('avatar-4') },
    message: 'First time here, great stream!',
    timestamp: '2m ago',
  },
  {
    id: 'msg-3',
    user: { name: 'StreamFan101', avatarUrl: findImage('avatar-5'), avatarHint: findImageHint('avatar-5') },
    message: 'Can you play that one song again?',
    timestamp: '1m ago',
  },
  {
    id: 'msg-4',
    user: { name: 'Bob', avatarUrl: findImage('avatar-2'), avatarHint: findImageHint('avatar-2') },
    message: 'LOL that was a close one!',
    timestamp: '30s ago',
  },
    {
    id: 'msg-5',
    user: { name: 'Alice', avatarUrl: findImage('avatar-1'), avatarHint: findImageHint('avatar-1') },
    message: 'The quality is so crisp!',
    timestamp: '10s ago',
  },
];
