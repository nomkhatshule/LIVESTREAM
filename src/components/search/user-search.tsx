'use client';

import React from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  useSearchBox,
  Hits,
  useInstantSearch,
} from 'react-instantsearch-hooks-web';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
);

function CustomSearchBox() {
    const { query, refine } = useSearchBox();

    return (
        <div className="px-2 py-2 border-b">
            <input
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => refine(e.target.value)}
                placeholder="Search users..."
                className="w-full px-2 py-1 text-sm bg-transparent border-none rounded-md focus:outline-none"
            />
        </div>
    );
}

function Hit({ hit }: { hit: any }) {
  return (
    <DropdownMenuItem asChild>
      <Link href={`/profile/${hit.objectID}`}>
        <Avatar className="h-6 w-6 mr-2">
          <AvatarImage src={hit.profilePicture} alt={hit.username} />
          <AvatarFallback>{hit.username?.charAt(0)}</AvatarFallback>
        </Avatar>
        <span>{hit.username}</span>
      </Link>
    </DropdownMenuItem>
  );
}

function SearchContent({ children }: { children: React.ReactNode }) {
    const { results } = useInstantSearch();
    
    // If there is a query, show hits. Otherwise, show the default children.
    if (results && results.query) {
        if (results.nbHits === 0) {
            return (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found for &quot;{results.query}&quot;.
                </div>
            )
        }
        return (
            <div className="max-h-60 overflow-y-auto">
                <Hits hitComponent={Hit} />
            </div>
        )
    }

    return <>{children}</>;
}


export function UserSearch({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY) {
      console.warn("Algolia search keys are not configured. The search bar will be disabled.");
      // Render children without search functionality if Algolia is not configured.
      return <>{children}</>;
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="users">
      <CustomSearchBox />
      <SearchContent>
        {children}
      </SearchContent>
    </InstantSearch>
  );
}
