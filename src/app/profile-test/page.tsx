'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfileTestPage() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>
      <p className="text-muted-foreground mb-8">This is a non-functional avatar component for design testing.</p>

      <div className="relative w-32 h-32">
        <Avatar className="w-32 h-32 text-4xl">
          <AvatarImage src="https://picsum.photos/seed/test-avatar/200" alt="User Avatar" data-ai-hint="person portrait" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
