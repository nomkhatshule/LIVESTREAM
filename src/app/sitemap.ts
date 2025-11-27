
import { MetadataRoute } from 'next';
import { initializeFirebaseForServer } from '@/firebase/server-init';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Initialize Firebase Admin SDK for server-side data fetching
const { firestore: db } = initializeFirebaseForServer();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // It's best practice to use an environment variable for the base URL.
  // For now, we'll hardcode it, but you can change this later.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://livenetstream.com';

  // 1. Get static routes
  const staticRoutes = [
    '/',
    '/landing',
    '/login',
    '/signup',
    '/feed',
    '/cards',
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  // 2. Get dynamic routes for user profiles
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const userPaths = usersSnapshot.docs.map((doc) => ({
    url: `${baseUrl}/profile/${doc.id}`,
    lastModified: new Date().toISOString(), // In a real app, you might use a 'lastUpdated' field from the doc
  }));

  // 3. Get dynamic routes for live broadcasts
  const broadcastsQuery = query(collection(db, 'broadcasts'), where('isLive', '==', true));
  const broadcastsSnapshot = await getDocs(broadcastsQuery);
  const broadcastPaths = broadcastsSnapshot.docs.map((doc) => ({
    url: `${baseUrl}/broadcast/${doc.id}`,
    lastModified: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  }));

  // 4. Combine all routes
  return [...staticRoutes, ...userPaths, ...broadcastPaths];
}
