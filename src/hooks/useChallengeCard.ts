
'use client';

import { useState, useEffect } from 'react';
import { updateDoc, DocumentReference } from 'firebase/firestore';

export function useChallengeCard(
    broadcastDocRef: DocumentReference | null, 
    initialPosition?: { x: number, y: number },
    initialSize?: { width: number, height: number }
) {
    const [cardPosition, setCardPosition] = useState(initialPosition || { x: 0, y: 0 });
    const [cardSize, setCardSize] = useState<{width: number | string, height: number | string}>(initialSize || { width: 320, height: 460 });

    useEffect(() => {
        if(initialPosition) setCardPosition(initialPosition);
        if(initialSize) setCardSize(initialSize);
    }, [initialPosition, initialSize])

    const handleDrag = (e: any, data: any) => {
        setCardPosition({ x: data.x, y: data.y });
    };

    const handleDragStop = (e: any, data: any) => {
        const newPosition = { x: data.x, y: data.y };
        setCardPosition(newPosition);
        if (broadcastDocRef) {
            updateDoc(broadcastDocRef, { challengeCardPosition: newPosition });
        }
    };
    
    const handleResizeStop = (e: any, direction: any, ref: any, d: any) => {
        if (typeof cardSize.width === 'number' && typeof cardSize.height === 'number') {
            const newSize = {
                width: cardSize.width + d.width,
                height: cardSize.height + d.height
            };
            setCardSize(newSize);
            if (broadcastDocRef) {
                updateDoc(broadcastDocRef, { challengeCardSize: newSize });
            }
        }
    };

    return {
        cardPosition,
        cardSize,
        handleDrag,
        handleDragStop,
        handleResizeStop,
        setCardSize
    };
}