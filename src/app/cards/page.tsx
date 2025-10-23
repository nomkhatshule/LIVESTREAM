
'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

      <div className="relative z-10 w-full max-w-sm pt-20">
        <Tabs defaultValue="challenges" className="w-full -mt-8">
          <div className="absolute -top-4 left-0 right-0 z-20 flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/10 backdrop-blur-lg text-white rounded-xl p-1">
              <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Challenges</TabsTrigger>
              <TabsTrigger value="truth" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Truth</TabsTrigger>
              <TabsTrigger value="dare" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Dare</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="challenges">
            <div className="bg-white rounded-3xl p-4 shadow-2xl h-[500px] flex flex-col">
              <div className="relative w-full overflow-hidden rounded-xl flex-shrink-0">
                <Image
                  src="https://picsum.photos/seed/khamari/600/400"
                  alt="Head in a Jar"
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                  data-ai-hint="man sitting chair"
                />
              </div>
              <div className="text-left mt-3">
                <h2 className="text-xl font-bold text-black font-headline">The Whisper Challenge</h2>
              </div>
               <div className="flex-grow flex flex-col mt-3 text-gray-800 px-2 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold font-headline text-gray-800">Difficulty</h3>
                    <Badge variant="outline" className="text-black border-gray-300">Medium</Badge>
                </div>
                <Separator className="bg-gray-200" />
                <div>
                  <h3 className="font-bold font-headline text-gray-800 mb-2">Instructions</h3>
                  <ul className="list-decimal list-inside text-sm space-y-1 text-left text-gray-900">
                    <li>One person wears headphones with loud music.</li>
                    <li>Another person whispers a phrase to them.</li>
                    <li>The headphone-wearer must guess the phrase.</li>
                  </ul>
                </div>
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
