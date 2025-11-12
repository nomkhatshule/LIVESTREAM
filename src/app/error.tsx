
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full">
               <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          <CardTitle className="mt-4">Something Went Wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. You can try to reload the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="bg-muted/50 p-3 rounded-md text-xs text-left text-muted-foreground overflow-x-auto">
                <p><strong>Error:</strong> {error.message}</p>
                {error.digest && <p className="mt-2"><strong>Digest:</strong> {error.digest}</p>}
            </div>
          <Button
            onClick={() => reset()}
            className="mt-6 w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
