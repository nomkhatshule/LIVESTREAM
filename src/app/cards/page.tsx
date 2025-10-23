'use client';

import Image from 'next/image';

export default function CardsPage() {
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/card-bg/1920/1080"
          alt="Blurred background"
          fill
          className="object-cover blur-md"
          data-ai-hint="moody interior"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white rounded-3xl p-4 shadow-2xl">
          <div className="aspect-square relative w-full overflow-hidden rounded-xl">
            <Image
              src="https://picsum.photos/seed/khamari/600/600"
              alt="Head in a Jar"
              fill
              className="object-cover"
              data-ai-hint="man sitting chair"
            />
          </div>
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-black font-headline">Head in a Jar</h2>
            <p className="text-md text-gray-500 mt-1">Khamari</p>
          </div>
        </div>
      </div>
    </div>
  );
}
