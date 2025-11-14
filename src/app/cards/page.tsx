

'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Users, Wand2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateGamePrompts } from '@/ai/flows/generate-game-prompts';
import SendChallengeSheet from '@/components/challenges/SendChallengeSheet';


// Mock data for the challenge board
const mockChallenges = [
  { id: 1, text: "Bake a cake that looks like your favorite emoji.", author: "PastryPro", avatar: "https://picsum.photos/seed/baker/100" },
  { id: 2, text: "Learn and perform the first 15 seconds of a viral TikTok dance.", author: "DanceMachine", avatar: "https://picsum.photos/seed/dancer/100" },
  { id: 3, text: "Try to draw a perfect circle freehand.", author: "SteadyHand", avatar: "https://picsum.photos/seed/artist/100" },
  { id: 4, text: "Build a fort in your living room and stream from it.", author: "FortMaster", avatar: "https://picsum.photos/seed/builder/100" },
];


function ChallengeCreator() {
    const { user } = useUser();
    const { toast } = useToast();
    const [challengeText, setChallengeText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendSheetOpen, setIsSendSheetOpen] = useState(false);

    const handleGenerateChallenge = async () => {
        setIsGenerating(true);
        try {
            const result = await generateGamePrompts({
                gameType: 'challenge',
                category: 'Creative & Fun',
                count: 1,
            });
            if (result.prompts.length > 0) {
                setChallengeText(result.prompts[0].prompt);
            }
        } catch (error) {
            console.error("AI challenge generation failed:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate an AI challenge.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSendClick = () => {
        if (!challengeText.trim()) {
            toast({ variant: 'destructive', title: "Challenge is empty", description: 'Please write a challenge before sending.'});
            return;
        }
        setIsSendSheetOpen(true);
    };

    return (
        <>
            <SendChallengeSheet
                open={isSendSheetOpen}
                onOpenChange={setIsSendSheetOpen}
                challengeText={challengeText}
                onSend={() => setChallengeText('')} // Clear text after sending
            />
            <Card className="w-full max-w-md mx-auto bg-white text-black border-black/20">
                <CardHeader className="text-center">
                    <CardTitle className="font-bold font-headline">
                        Create a Challenge
                    </CardTitle>
                    <CardDescription className="text-zinc-600">Create and send a challenge to a friend.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="e.g., 'Try to beat my high score in GeoGuesser'"
                        className="min-h-[120px] bg-white border-stone-200 text-black placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-black/20"
                        value={challengeText}
                        onChange={(e) => setChallengeText(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={handleGenerateChallenge} disabled={isGenerating} variant="outline" className="flex-1 bg-white text-black border-black hover:bg-zinc-100">
                            
                            Game Master
                        </Button>
                        <Button onClick={handleSendClick} className="flex-1 bg-black text-white hover:bg-zinc-800">
                            Send Challenge
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

function ChallengeBoard() {
  return (
    <Card className="w-full max-w-md mx-auto bg-white text-black border-black/20 overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline">Public Challenges</CardTitle>
        <CardDescription className="text-zinc-600">Pick a challenge from the community to complete on your next stream.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
            {mockChallenges.map((challenge, index) => (
            <div key={challenge.id} className="p-4 border-b border-black/20 last:border-b-0">
                <p className="text-sm font-medium text-zinc-800">"{challenge.text}"</p>
                <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                    <AvatarImage src={challenge.avatar} />
                    <AvatarFallback>{challenge.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-zinc-500">@{challenge.author}</span>
                </div>
                <Button size="sm" className="bg-black text-white hover:bg-zinc-800" asChild>
                    <a href={`/broadcast/create?challenge=${encodeURIComponent(challenge.text)}&type=challenge`}>
                        Accept
                    </a>
                </Button>
                </div>
            </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}


function ChallengesPageComponent() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center p-4 bg-black">
      <div className="absolute inset-0 bg-grid-zinc-800/20 [mask-image:linear-gradient(to_bottom,white_5%,transparent_100%)] z-0"></div>
      <div className="relative z-10 w-full">
         <Tabs defaultValue="create" className="w-full max-w-md mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-200 text-black border border-zinc-300">
            <TabsTrigger value="create" className="data-[state=active]:bg-black data-[state=active]:text-white">Create</TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-black data-[state=active]:text-white">Browse</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-4">
            <ChallengeCreator />
          </TabsContent>
          <TabsContent value="browse" className="mt-4">
            <ChallengeBoard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-black" />}>
            <ChallengesPageComponent />
        </Suspense>
    )
}
