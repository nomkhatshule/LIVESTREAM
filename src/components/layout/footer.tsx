
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Only show the footer on the landing page for now
  if (pathname !== '/landing') {
    return null;
  }

  return (
    <footer className="w-full bg-black text-white">
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-logo font-black text-white text-3xl">LIVENET</span>
            </Link>
            <p className="mt-4 text-sm text-stone-300 max-w-md">
              Real people, real moments, real connections.
            </p>
          </div>
          <div className="col-span-1">
            <h4 className="font-semibold font-headline text-lg mb-4">Navigate</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-sm text-stone-300 hover:text-white">Features</Link></li>
              <li><Link href="#demo" className="text-sm text-stone-300 hover:text-white">Demo</Link></li>
              <li><Link href="/login" className="text-sm text-stone-300 hover:text-white">Login</Link></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="font-semibold font-headline text-lg mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy-policy" className="text-sm text-stone-300 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-sm text-stone-300 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-stone-800 pt-8 text-center text-sm text-white">
          <p>&copy; {new Date().getFullYear()} LIVENET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
