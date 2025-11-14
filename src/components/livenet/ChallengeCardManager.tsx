
'use client';

import { Resizable } from 're-resizable';
import { cn } from '@/lib/utils';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';
import CountdownTimer from '@/components/broadcast/CountdownTimer';
import { Button } from '@/components/ui/button';
import { Undo2, Check } from 'lucide-react';
import type { BroadcastData } from '@/lib/types';
import { DocumentReference, updateDoc } from 'firebase/firestore';

interface ChallengeCardManagerProps {
    isVisible: boolean;
    broadcastData: BroadcastData;
    isTimerFinished: boolean;
    cardPosition: { x: number; y: number };
    cardSize: { width: number | string; height: number | string; };
    isDragging: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onResizeStop: (e: any, direction: any, ref: any, d: any) => void;
    onSetCardSize: (size: { width: number, height: number }) => void;
    onGenerateNextChallenge: (gameType: 'truth' | 'dare' | 'challenge') => void;
    broadcastDocRef: DocumentReference | null;
}

export default function ChallengeCardManager({
    isVisible,
    broadcastData,
    isTimerFinished,
    cardPosition,
    cardSize,
    isDragging,
    onMouseDown,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onResizeStop,
    onSetCardSize,
    onGenerateNextChallenge,
    broadcastDocRef,
}: ChallengeCardManagerProps) {

    if (!isVisible || !broadcastData.activeChallenge || !broadcastData.activeChallengeType) {
        return null;
    }

    const handleCloseChallenge = () => {
        if (broadcastDocRef) {
          updateDoc(broadcastDocRef, {
            activeChallenge: null,
            activeChallengeType: null,
            challengeStartTime: null,
            challengeDurationSeconds: null,
          });
        }
    };
    
    return (
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            style={{
              transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px))`,
            }}
        >
            <Resizable
                size={cardSize}
                onResizeStop={onResizeStop}
                onResize={(e, direction, ref, d) => {
                    if (typeof cardSize.width === 'number' && typeof cardSize.height === 'number') {
                        onSetCardSize({
                            width: cardSize.width + d.width,
                            height: cardSize.height + d.height,
                        });
                    }
                }}
                minWidth={300}
                minHeight={400}
                lockAspectRatio
                className="relative"
            >
                <div 
                  className={cn("pointer-events-auto h-full w-full", isDragging ? 'cursor-grabbing' : 'cursor-grab')}
                  onMouseDown={onMouseDown}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                    <ChallengeDisplayCard 
                        text={broadcastData.activeChallenge}
                        type={broadcastData.activeChallengeType}
                        onClose={handleCloseChallenge}
                        timer={broadcastData.challengeStartTime && broadcastData.challengeDurationSeconds ? (
                            <CountdownTimer 
                                startTime={broadcastData.challengeStartTime} 
                                durationSeconds={broadcastData.challengeDurationSeconds} 
                            />
                        ) : null}
                    >
                        <div className="flex w-full gap-2">
                            {isTimerFinished && (
                               <Button 
                                    size="lg" 
                                    className="w-full"
                                    onClick={() => onGenerateNextChallenge(broadcastData.activeChallengeType!)}
                                >
                                    <Check className="mr-2 h-5 w-5" />
                                    Complete
                                </Button>
                            )}
                        </div>
                    </ChallengeDisplayCard>
                </div>
            </Resizable>
        </div>
    );
}

    
