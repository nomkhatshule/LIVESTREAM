import type { MetadataRoute } from 'next';
import { adminDb } from '@/firebase/server';

// Rebuild the sitemap at most once an hour instead of on every request.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://livenetstream.com';
  const now = new Date().toISOString();

  // Public pages that search engines should index.
  const staticRoutes = ['/landing', '/login', '/signup', '/privacy-policy', '/terms-of-service', '/cookie-policy'].map(
    (route) => ({ url: `${baseUrl}${route}`, lastModified: now }),
  );

  // Profiles and live streams. If the database isn't reachable (for example
  // during a local build without credentials) we still return the static pages.
  try {
    const db = adminDb();
    const [users, live] = await Promise.all([
      db.collection('users').select().limit(1000).get(),
      db.collection('broadcasts').where('isLive', '==', true).limit(200).get(),
    ]);
    const userPaths = users.docs.map((d) => ({ url: `${baseUrl}/profile/${d.id}`, lastModified: now }));
    const broadcastPaths = live.docs.map((d) => ({ url: `${baseUrl}/broadcast/${d.id}`, lastModified: now }));
    return [...staticRoutes, ...userPaths, ...broadcastPaths];
  } catch (error) {
    console.warn('sitemap: could not load dynamic routes:', (error as Error).message);
    return staticRoutes;
  }
}
