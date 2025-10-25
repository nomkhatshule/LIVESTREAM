
'use client';

import { useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Highlight,
  useInstantSearch,
  Snippet,
} from 'react-instantsearch-hooks-web';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '../ui/button';
import { DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

const searchClient = algoliasearch(appId, apiKey);

function Hit({ hit }: { hit: any }) {
  return (
    <Link href={`/profile/${hit.objectID}`} className="block w-full">
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted w-full">
            <Avatar className="h-8 w-8">
                <AvatarImage src={hit.profilePicture} />
                <AvatarFallback>{hit.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <h4 className="font-semibold text-sm">
                    <Highlight attribute="username" hit={hit} />
                </h4>
                 <p className="text-xs text-muted-foreground truncate">
                    <Snippet attribute="bio" hit={hit} />
                </p>
            </div>
        </div>
    </Link>
  );
}

function SearchResults({ children }: { children: React.ReactNode }) {
    const { use, status, results } = useInstantSearch();
    const hasQuery = results.query.length > 0;

    if (status === 'stalled') {
        return <p className="p-4 text-center text-sm text-muted-foreground">Loading...</p>;
    }
    
    if (!hasQuery) {
        return <>{children}</>;
    }

    return (
        <div>
            {results.nbHits > 0 ? (
                <Hits hitComponent={Hit} classNames={{
                    root: "max-h-[50vh] overflow-y-auto",
                    list: 'space-y-1 p-1',
                    item: 'w-full'
                }} />
            ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
            )}
        </div>
    );
}

export function UserSearch({ children }: { children: React.ReactNode }) {
  if (!appId || !apiKey) {
    return <>{children}</>; // Silently fail if Algolia is not configured
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="users">
      <div className="relative p-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <SearchBox
            placeholder="Search for users..."
            className="mb-1"
            classNames={{
                root: 'relative w-full',
                input: 'w-full h-9 pl-8 pr-4 rounded-md border bg-background/50 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                submitIcon: 'hidden',
                resetIcon: 'hidden',
                loadingIndicator: 'absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin',
            }}
        />
      </div>
      <DropdownMenuSeparator />
       <SearchResults>
         {children}
       </SearchResults>
    </InstantSearch>
  );
}
