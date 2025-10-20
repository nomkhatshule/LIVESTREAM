import { categories } from '@/lib/data';
import HomePageClient from './home-page-client';

export default function Home() {
  return (
    <HomePageClient
      categories={categories}
    />
  );
}
