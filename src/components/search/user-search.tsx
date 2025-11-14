
'use client';

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
import { DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Search } from 'lucide-react';
import type { Hit as AlgoliaHit } from 'instantsearch.js';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

const searchClient = appId && apiKey ? algoliasearch(appId, apiKey) : null;

// Define a richer type for our Algolia user hit
type UserHit = AlgoliaHit<{
  objectID: string;
  username: string;
  bio: string;
  profilePicture: string;
}>;

interface HitProps {
  hit: UserHit;
  onSelect?: (hit: UserHit) => void;
}

function HitComponent({ hit, onSelect }: HitProps) {
  const content = (
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
  );

  if (onSelect) {
    return (
      <button onClick={() => onSelect(hit)} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={`/profile/${hit.objectID}`} className="block w-full">
      {content}
    </Link>
  );
}

function SearchResults({ children, onSelectUser }: { children?: React.ReactNode, onSelectUser?: (hit: UserHit) => void; }) {
  const { status, results, error } = useInstantSearch();

  if (error) {
    console.warn("Algolia search error:", error.message);
    return <p className="p-4 text-center text-sm text-destructive/80">Search is unavailable.</p>;
  }

  if (status === 'stalled') {
    return <p className="p-4 text-center text-sm text-muted-foreground">Loading...</p>;
  }

  const hasQuery = results.query.length > 0;

  if (!hasQuery && children) {
    return <>{children}</>;
  }

  return (
    <div>
      {results.nbHits > 0 ? (
        <Hits<UserHit>
          hitComponent={(props) => <HitComponent {...props} onSelect={onSelectUser} />}
          classNames={{
            root: "max-h-[50vh] overflow-y-auto",
            list: 'space-y-1 p-1',
            item: 'w-full',
          }}
        />
      ) : (
        <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
      )}
    </div>
  );
}

interface UserSearchProps {
    children?: React.ReactNode;
    onSelectUser?: (hit: UserHit) => void;
    showSeparator?: boolean;
    searchBoxPlaceholder?: string;
}

export function UserSearch({ children, onSelectUser, showSeparator = true, searchBoxPlaceholder = "Search for users..." }: UserSearchProps) {
  if (!searchClient) {
    return (
      <>
        <div className="p-2">
          <p className="text-center text-xs text-muted-foreground">
            Search is not configured.
          </p>
        </div>
        {showSeparator && <DropdownMenuSeparator />}
        {children}
      </>
    );
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="users">
      <div className="relative p-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white z-10" />
        <SearchBox
          placeholder={searchBoxPlaceholder}
          className="mb-1"
          classNames={{
            root: 'relative w-full',
            input: 'w-full h-9 pl-8 pr-4 rounded-md border border-white bg-transparent text-white text-sm ring-offset-background placeholder:text-white/70 focus-visible:outline-none',
            submitIcon: 'hidden',
            resetIcon: 'hidden',
            loadingIndicator: 'absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin',
          }}
        />
      </div>
      {showSeparator && <DropdownMenuSeparator />}
      <SearchResults onSelectUser={onSelectUser}>
        {children}
      </SearchResults>
    </InstantSearch>
  );
}
