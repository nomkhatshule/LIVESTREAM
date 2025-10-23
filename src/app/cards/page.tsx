
'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { truthQuestions, dareChallenges } from '@/lib/data';

export default function CardsPage() {
  // --- State for Truth or Dare game ---
  const [gameState, setGameState] = useState<'choice' | 'reveal'>('choice');
  const [promptType, setPromptType] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleChoice = (type: 'truth' | 'dare') => {
    if (type === 'truth') {
      const randomIndex = Math.floor(Math.random() * truthQuestions.length);
      setPrompt(truthQuestions[randomIndex]);
    } else {
      const randomIndex = Math.floor(Math.random() * dareChallenges.length);
      setPrompt(dareChallenges[randomIndex]);
    }
    setPromptType(type);
    setGameState('reveal');
  };

  const handleNextRound = () => {
    setGameState('choice');
    setPrompt('');
    setPromptType(null);
  };


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
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-lg text-white rounded-xl p-1">
            <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Challenges</TabsTrigger>
            <TabsTrigger value="truth-or-dare" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Truth or Dare</TabsTrigger>
          </TabsList>
          
          <TabsContent value="challenges">
            <div className="relative h-[550px]">
              {/* Background Card 2 */}
              <div className="absolute top-0 left-0 w-full h-full bg-white/80 rounded-3xl p-4 shadow-2xl transform -rotate-6 scale-95" />
              {/* Background Card 1 */}
              <div className="absolute top-0 left-0 w-full h-full bg-white/90 rounded-3xl p-4 shadow-2xl transform rotate-3 scale-95" />
              {/* Main Card */}
              <div className="absolute top-0 left-0 w-full h-full bg-white rounded-3xl p-4 shadow-2xl flex flex-col">
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
                 <div className="mt-auto pt-4 flex gap-x-3">
                    <Button variant="secondary" className="w-full">Skip</Button>
                    <Button className="w-full">Accept</Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="truth-or-dare">
             <div className="relative h-[550px]">
              {/* Static Background Cards for consistent look */}
              <div className="absolute top-0 left-0 w-full h-full bg-white/80 rounded-3xl p-4 shadow-2xl transform -rotate-6 scale-95" />
              <div className="absolute top-0 left-0 w-full h-full bg-white/90 rounded-3xl p-4 shadow-2xl transform rotate-3 scale-95" />
              
              {/* Main Interactive Card */}
              <div className="absolute top-0 left-0 w-full h-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                {gameState === 'choice' && (
                  <>
                    <h2 className="text-3xl font-bold text-black font-headline mb-8">Truth or Dare?</h2>
                    <div className="w-full space-y-4">
                        <Button size="lg" className="w-full" onClick={() => handleChoice('truth')}>
                            Truth
                        </Button>
                        <Button size="lg" variant="secondary" className="w-full" onClick={() => handleChoice('dare')}>
                            Dare
                        </Button>
                    </div>
                  </>
                )}
                {gameState === 'reveal' && (
                    <>
                        <Badge className="mb-4 text-lg" variant={promptType === 'truth' ? 'default' : 'destructive'}>{promptType?.toUpperCase()}</Badge>
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-2xl font-semibold text-black font-headline">{prompt}</p>
                        </div>
                        <div className="mt-auto pt-4 w-full">
                            <Button size="lg" className="w-full" onClick={handleNextRound}>
                                Next Round
                            </Button>
                        </div>
                    </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
