
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  // Check if it's our custom permission error
  const isPermissionError = error instanceof FirestorePermissionError;

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-lg w-full text-center">
             <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full">
                   <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="mt-4">
                    {isPermissionError ? 'Permission Denied' : 'Application Error'}
                </CardTitle>
                <CardDescription>
                   {isPermissionError 
                        ? "A security rule prevented your request from completing."
                        : "An unexpected error occurred that affects the whole application."
                   }
                </CardDescription>
            </CardHeader>
             <CardContent>
                 <div className="bg-muted/50 p-3 rounded-md text-xs text-left text-muted-foreground overflow-x-auto">
                    <pre className="whitespace-pre-wrap font-mono"><code>{error.message}</code></pre>
                    {error.digest && <p className="mt-2"><strong>Digest:</strong> {error.digest}</p>}
                </div>
                <Button onClick={() => reset()} className="mt-6 w-full">
                    Reload Application
                </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
