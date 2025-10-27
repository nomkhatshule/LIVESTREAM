
'use client';

import { generateGamePrompts } from "@/ai/flows/generate-game-prompts";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { dareChallenges, truthQuestions } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface InStreamGamesPanelProps {
    onSelectChallenge: (challenge: string, type: 'truth' | 'dare' | 'challenge', duration: number) => void,
    open: boolean,
    onOpenChange: (open: boolean) => void
}

const generateNextChallengeLogic = async (type: 'truth' | 'dare' | 'ai' | 'challenge') => {
    let prompt = '';
    let duration = 60;
    
    if (type === 'truth') {
        prompt = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
        duration = 60; // Standard duration for truth
    } else if (type === 'dare') {
        const selectedDare = dareChallenges[Math.floor(Math.random() * dareChallenges.length)];
        prompt = selectedDare.text;
        duration = selectedDare.duration;
    } else {
         const result = await generateGamePrompts({
            gameType: 'challenge',
            category: 'Live Stream Audience',
            count: 1,
        });
        if (result.prompts && result.prompts.length > 0) {
            prompt = result.prompts[0];
            duration = result.durationsInSeconds[0] || 120;
        } else {
            throw new Error('AI could not generate a challenge. Try again!');
        }
    }
    return { prompt, duration };
}

export default function InStreamGamesPanel({ onSelectChallenge, open, onOpenChange }: InStreamGamesPanelProps) {
    const [gameType, setGameType] = useState<'truth' | 'dare' | 'ai'>('ai');
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState(60); // Default duration
    const [isLoading, setIsLoading] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);


    const handleGenerate = async (type: 'truth' | 'dare' | 'ai') => {
        setIsLoading(true);
        setPrompt('');
        setGameType(type);

        try {
            const { prompt: newPrompt, duration: newDuration } = await generateNextChallengeLogic(type);
            setPrompt(newPrompt);
            setDuration(newDuration);
        } catch (error) {
            console.error("Error generating game prompt:", error);
            setPrompt("There was an error generating the prompt.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartChallenge = () => {
        let challengeType: 'truth' | 'dare' | 'challenge';
        if (gameType === 'ai') {
            challengeType = 'challenge';
        } else {
            challengeType = gameType;
        }
        onSelectChallenge(prompt, challengeType, duration);
        onOpenChange(false);
        setIsGameStarted(false); // Reset for next time
    };

    const handleStartClick = () => {
        setIsGameStarted(true);
        handleGenerate('ai'); // Generate an initial AI challenge
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>In-Stream Games</SheetTitle>
                </SheetHeader>

                {!isGameStarted ? (
                     <div className="relative h-full flex flex-col items-center justify-center text-center">
                        <h2 className="text-3xl font-bold text-foreground font-headline mb-8">Ready for a Challenge?</h2>
                        <Button size="lg" className="w-full" onClick={handleStartClick}>
                          Start
                        </Button>
                    </div>
                ) : (
                    <div className="py-6 space-y-6">
                        <div className="text-center p-6 bg-muted rounded-lg min-h-[120px] flex items-center justify-center">
                            {isLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : (
                                <p className="text-lg font-semibold">{prompt || "Generate a new challenge below."}</p>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <Button onClick={() => handleGenerate('truth')} disabled={isLoading}>Truth</Button>
                            <Button onClick={() => handleGenerate('dare')} disabled={isLoading}>Dare</Button>
                            <Button onClick={() => handleGenerate('ai')} disabled={isLoading}>AI Challenge</Button>
                        </div>

                        <Button 
                            size="lg" 
                            className="w-full" 
                            disabled={!prompt || isLoading} 
                            onClick={handleStartChallenge}
                        >
                            Start This Challenge
                        </Button>
                    </div>
                )}

            </SheetContent>
        </Sheet>
    )
}

// Attach the logic to the component for 're-use' in the parent. A bit of a hack.
(InStreamGamesPanel as any).generateNextChallengeLogic = generateNextChallengeLogic;
