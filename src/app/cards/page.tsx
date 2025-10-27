
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

const SimpleTimerDisplay = ({ durationSeconds }: { durationSeconds: number }) => {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return (
        <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center text-white border-2 border-white shadow-lg">
            <h3 className="text-sm font-bold font-mono tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </h3>
        </div>
    );
};

export default function CardsPage() {
  // --- State for Truth or Dare game ---
  const [gameState, setGameState] = useState<'choice' | 'reveal'>('choice');
  const [promptType, setPromptType] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(60);

  // --- State for Challenges game ---
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChoice = (type: 'truth' | 'dare') => {
    if (type === 'truth') {
      const randomIndex = Math.floor(Math.random() * truthQuestions.length);
      setPrompt(truthQuestions[randomIndex]);
      setDuration(60);
    } else {
      const randomIndex = Math.floor(Math.random() * dareChallenges.length);
      setPrompt(dareChallenges[randomIndex]);
      setDuration(90);
    }
    setPromptType(type);
    setGameState('reveal');
  };

  const handleNextRound = () => {
    setGameState('choice');
    setPrompt('');
    setPromptType(null);
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
        setDuration(result.durationsInSeconds[0] || 120);
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
                    variant="stacked"
                    onClose={() => {
                        setIsGameStarted(false);
                        setChallenge('');
                      }}
                    timer={!isLoadingChallenge && !error && challenge && <SimpleTimerDisplay durationSeconds={duration} />}
                >
                    {isLoadingChallenge && <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />}
                    {!isLoadingChallenge && (
                        <>
                            <Button
                            className="flex-1"
                            onClick={handleGenerateChallenge}
                            disabled={isLoadingChallenge}
                            variant="outline"
                            >
                            Next
                            </Button>
                            <Button asChild size="lg" className="flex-1" disabled={!challenge || !!error}>
                            <Link href={`/broadcast/create?challenge=${encodeURIComponent(challenge)}&type=challenge&duration=${duration}`}>
                                Go Live!
                            </Link>
                            </Button>
                        </>
                    )}
                </ChallengeDisplayCard>
            )}
          </TabsContent>
          <TabsContent value="truth-or-dare">
             <div className="relative h-[550px]">
              {gameState === 'choice' ? (
                <div className="absolute w-full h-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
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
              ) : promptType && (
                 <ChallengeDisplayCard 
                    text={prompt} 
                    type={promptType} 
                    variant="stacked"
                    timer={<SimpleTimerDisplay durationSeconds={duration} />}
                 >
                    <Button size="lg" variant="outline" className="flex-1" onClick={handleNextRound}>
                      Next
                    </Button>
                    <Button asChild size="lg" className="flex-1" disabled={!prompt}>
                       <Link href={`/broadcast/create?challenge=${encodeURIComponent(prompt)}&type=${promptType}&duration=${duration}`}>
                         Go Live!
                       </Link>
                    </Button>
                </ChallengeDisplayCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
