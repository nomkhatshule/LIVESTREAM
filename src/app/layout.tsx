
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ChatProvider } from '@/components/chat/ChatProvider';
import Footer from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'AgoraLive',
  description: 'The future of live broadcasting.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/try0cjy.css" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <FirebaseClientProvider>
          <ChatProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ChatProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
