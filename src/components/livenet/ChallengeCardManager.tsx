

'use client';

import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { cn } from '@/lib/utils';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';
import CountdownTimer from '@/components/broadcast/CountdownTimer';
import { Button } from '@/components/ui/button';
import { GripVertical, Check } from 'lucide-react';
import type { BroadcastData } from '@/lib/types';
import { DocumentReference, updateDoc } from 'firebase/firestore';

interface ChallengeCardManagerProps {
    isVisible: boolean;
    broadcastData: BroadcastData;
    isTimerFinished: boolean;
    cardPosition: { x: number; y: number };
    cardSize: { width: number | string; height: number | string; };
    onDrag: (e: any, data: any) => void;
    onDragStop: (e: any, data: any) => void;
    onResizeStop: (e: any, direction: any, ref: any, d: any) => void;
    onSetCardSize: (size: { width: number, height: number }) => void;
    onCompleteChallenge: () => void;
    broadcastDocRef: DocumentReference | null;
}

export default function ChallengeCardManager({
    isVisible,
    broadcastData,
    isTimerFinished,
    cardPosition,
    cardSize,
    onDrag,
    onDragStop,
    onResizeStop,
    onSetCardSize,
    onCompleteChallenge,
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
        <Draggable
            axis="both"
            handle=".drag-handle"
            position={cardPosition}
            onDrag={onDrag}
            onStop={onDragStop}
            scale={1}
        >
            <div 
                className="absolute z-20 pointer-events-none"
                style={{
                  width: cardSize.width,
                  height: cardSize.height,
                  top: '50%', 
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
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
                    className="relative pointer-events-auto"
                >
                    <div className={cn("h-full w-full")}>
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 drag-handle cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-8 w-8 text-gray-400" />
                        </div>
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
                               <Button 
                                    size="lg" 
                                    className="w-full bg-black/90 text-white border-2 border-black hover:bg-black"
                                    onClick={onCompleteChallenge}
                                >
                                    <Check className="mr-2 h-5 w-5" />
                                    Complete
                                </Button>
                            </div>
                        </ChallengeDisplayCard>
                    </div>
                </Resizable>
            </div>
        </Draggable>
    );
}
