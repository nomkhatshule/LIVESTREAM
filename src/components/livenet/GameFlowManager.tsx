
'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface GameFlowManagerProps {
    showCoverCard: boolean;
    onStart: () => void;
    onCancel: () => void;
}

export default function GameFlowManager({ showCoverCard, onStart, onCancel }: GameFlowManagerProps) {
    if (!showCoverCard) {
        return null;
    }

    return (
        <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-4 pointer-events-auto">
            <div className="relative h-[550px] w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-10 w-10 text-muted-foreground rounded-full hover:bg-black/10"
                    onClick={onCancel}
                >
                    <X className="h-6 w-6" />
                </Button>
                <h2 className="text-3xl font-bold text-black font-headline mb-8">Ready for a Challenge?</h2>
                <Button size="lg" className="w-full" onClick={onStart}>
                    Start
                </Button>
            </div>
        </div>
    );
}
