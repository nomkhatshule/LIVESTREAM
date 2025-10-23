
'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

      <div className="relative z-10 w-full max-w-sm">
        <Tabs defaultValue="challenges" className="w-full">
          <div className="absolute -top-20 left-0 right-0 z-20 flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/10 backdrop-blur-lg text-white rounded-xl p-1">
              <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Challenges</TabsTrigger>
              <TabsTrigger value="truth" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Truth</TabsTrigger>
              <TabsTrigger value="dare" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Dare</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="challenges">
            <div className="bg-white rounded-3xl p-4 shadow-2xl h-[500px] flex flex-col">
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
          </TabsContent>
          <TabsContent value="truth">
            <div className="bg-white rounded-3xl p-4 shadow-2xl h-[500px] flex items-center justify-center">
              <p className="text-black font-headline">Truth content goes here</p>
            </div>
          </TabsContent>
          <TabsContent value="dare">
            <div className="bg-white rounded-3xl p-4 shadow-2xl h-[500px] flex items-center justify-center">
              <p className="text-black font-headline">Dare content goes here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
