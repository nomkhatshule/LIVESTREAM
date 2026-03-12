
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ChatProvider } from '@/components/chat/ChatProvider';
import Footer from '@/components/layout/footer';
import { ThemeProvider } from '@/components/theme-provider';
import CookieBanner from '@/components/layout/CookieBanner';

export const metadata: Metadata = {
  title: 'LIVENET',
  description: 'The future of live broadcasting.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://use.typekit.net/try0cjy.css" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Recovery script for ChunkLoadErrors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                if (event.message && (event.message.indexOf('ChunkLoadError') !== -1 || event.message.indexOf('Loading chunk') !== -1)) {
                  console.warn('ChunkLoadError detected, reloading page...');
                  window.location.reload();
                }
              }, true);
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (event.reason.name === 'ChunkLoadError' || (event.reason.message && event.reason.message.indexOf('Loading chunk') !== -1))) {
                  console.warn('Unhandled ChunkLoadError detected, reloading page...');
                  window.location.reload();
                }
              });
            `,
          }}
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <ChatProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
              <CookieBanner />
            </ChatProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
