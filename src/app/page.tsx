import { categories } from '@/lib/data';
import HomePageClient from './home-page-client';
import { TempDataMigration } from '@/components/temp-data-migration';

export default function Home() {
  return (
    <>
      {/* This is a temporary component to fix missing user profiles. It can be removed after use. */}
      <div className="container mx-auto px-4 pt-4">
        <TempDataMigration />
      </div>
      <HomePageClient
        categories={categories}
      />
    </>
  );
}
