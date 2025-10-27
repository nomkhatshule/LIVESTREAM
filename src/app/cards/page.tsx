
'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { truthQuestions, dareChallenges } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Loader2, Play, Video, X } from 'lucide-react';
import { generateGamePrompts } from '@/ai/flows/generate-game-prompts';
import Link from 'next/link';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';

export default function CardsPage() {
  // --- State for Truth or Dare game ---
  const [gameState, setGameState] = useState<'choice' | 'reveal'>('choice');
  const [promptType, setPromptType] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  // --- State for Challenges game ---
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsFlipped(true);
  };

  const handleNextRound = () => {
    setGameState('choice');
    setIsFlipped(false);
    // We delay clearing the prompt to prevent it from disappearing during the flip back animation
    setTimeout(() => {
        setPrompt('');
        setPromptType(null);
    }, 300); // This duration should match the transition duration
  };

  const handleGenerateChallenge = async () => {
    setIsLoadingChallenge(true);
    setError(null);
    setIsGameStarted(true); // Ensure the card view is active
    try {
      const result = await generateGamePrompts({
        gameType: 'challenge',
        category: 'Live Stream Fun',
        count: 1,
      });
      if (result.prompts && result.prompts.length > 0) {
        setChallenge(result.prompts[0]);
      } else {
        setError('No challenges were generated. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate a challenge. Please check the connection and try again.');
    } finally {
      setIsLoadingChallenge(false);
    }
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

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
         <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-lg text-white rounded-xl p-1">
            <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Challenges</TabsTrigger>
            <TabsTrigger value="truth-or-dare" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg">Truth or Dare</TabsTrigger>
          </TabsList>
          
          <TabsContent value="challenges">
             {!isGameStarted ? (
                 <div className="relative h-[550px] w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                    <h2 className="text-3xl font-bold text-black font-headline mb-8">Ready for a Challenge?</h2>
                    <Button size="lg" className="w-full" onClick={handleGenerateChallenge}>
                      Start
                    </Button>
                </div>
              ) : (
                <ChallengeDisplayCard
                    text={isLoadingChallenge ? '' : error ? error : challenge}
                    type="challenge"
                    onClose={() => {
                        setIsGameStarted(false);
                        setChallenge('');
                      }}
                >
                    {isLoadingChallenge && <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />}
                    {!isLoadingChallenge && (
                        <>
                            <Button
                            className="w-full"
                            onClick={handleGenerateChallenge}
                            disabled={isLoadingChallenge}
                            variant="outline"
                            >
                            Next
                            </Button>
                            <Button asChild size="lg" className="w-full" disabled={!challenge || !!error}>
                            <Link href={`/broadcast/create?challenge=${encodeURIComponent(challenge)}&type=challenge`}>
                                <Video className="mr-2 h-5 w-5" />
                                Go Live!
                            </Link>
                            </Button>
                        </>
                    )}
                </ChallengeDisplayCard>
            )}
          </TabsContent>
          <TabsContent value="truth-or-dare">
             <div className="relative h-[550px] perspective-1000">
              {/* Card Inner container for 3D rotation */}
              <div
                className={cn(
                  'relative w-full h-full transform-style-3d transition-transform duration-500',
                  isFlipped && 'rotate-y-180'
                )}
              >
                {/* Front of the Card */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                  <h2 className="text-3xl font-bold text-black font-headline mb-8">Truth or Dare?</h2>
                  <div className="w-full space-y-4">
                    <Button size="lg" className="w-full" onClick={() => handleChoice('truth')}>
                      Truth
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full" onClick={() => handleChoice('dare')}>
                      Dare
                    </Button>
                  </div>
                </div>

                {/* Back of the Card */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                  {gameState === 'reveal' && promptType && (
                     <ChallengeDisplayCard text={prompt} type={promptType}>
                        <Button size="lg" variant="outline" className="w-full" onClick={handleNextRound}>
                          Next
                        </Button>
                        <Button asChild size="lg" className="w-full" disabled={!prompt}>
                           <Link href={`/broadcast/create?challenge=${encodeURIComponent(prompt)}&type=${promptType}`}>
                             <Video className="mr-2 h-5 w-5" />
                             Go Live!
                           </Link>
                        </Button>
                    </ChallengeDisplayCard>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
