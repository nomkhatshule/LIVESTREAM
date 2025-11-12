
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VideoOff } from 'lucide-react';

export default function LivenetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Livenet Studio Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <VideoOff className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Studio Loading Failed</CardTitle>
          <CardDescription>
            There was a problem loading the live studio. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-3 rounded-md text-xs text-left text-muted-foreground overflow-x-auto">
            <p><strong>Error:</strong> {error.message}</p>
          </div>
          <Button
            onClick={() => reset()}
            className="mt-6 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
