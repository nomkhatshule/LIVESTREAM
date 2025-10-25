'use client';

import { useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Highlight,
  Snippet,
} from 'react-instantsearch-hooks-web';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '../ui/button';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

if (!appId || !apiKey) {
  console.warn(
    'Algolia environment variables NEXT_PUBLIC_ALGOLIA_APP_ID and NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY are not set. Search will not work.'
  );
}

const searchClient = algoliasearch(appId, apiKey);

function Hit({ hit }: { hit: any }) {
  return (
    <Link href={`/profile/${hit.objectID}`} className="block">
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted">
            <Avatar>
            <AvatarImage src={hit.profilePicture} />
            <AvatarFallback>{hit.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
            <h4 className="font-semibold">
                <Highlight attribute="username" hit={hit} />
            </h4>
            <p className="text-sm text-muted-foreground">
                <Snippet attribute="bio" hit={hit} />
            </p>
            </div>
            <Button variant="secondary" size="sm">View</Button>
        </div>
    </Link>
  );
}

export function UserSearchDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Search for Users</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <InstantSearch searchClient={searchClient} indexName="users">
            <SearchBox
              placeholder="Search by username or bio..."
              className="mb-4"
              classNames={{
                root: 'relative',
                input: 'w-full h-10 pl-10 pr-4 rounded-md border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                submitIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                resetIcon: 'hidden',
                loadingIndicator: 'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin',
              }}
            />
            <div className="max-h-[50vh] overflow-y-auto">
                <Hits hitComponent={Hit} />
            </div>
          </InstantSearch>
        </div>
      </DialogContent>
    </Dialog>
  );
}
