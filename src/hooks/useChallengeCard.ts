
'use client';

import { useState, useRef, useEffect } from 'react';
import { updateDoc, DocumentReference } from 'firebase/firestore';

export function useChallengeCard(
    broadcastDocRef: DocumentReference | null, 
    initialPosition?: { x: number, y: number },
    initialSize?: { width: number, height: number }
) {
    const [cardPosition, setCardPosition] = useState(initialPosition || { x: 0, y: 0 });
    const [cardSize, setCardSize] = useState<{width: number | string, height: number | string}>(initialSize || { width: 320, height: 460 });
    const [isDragging, setIsDragging] = useState(false);
    const [isPinching, setIsPinching] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const initialPinchDistanceRef = useRef(0);
    const initialCardSizeRef = useRef(initialSize || { width: 320, height: 460 });

    useEffect(() => {
        if(initialPosition) setCardPosition(initialPosition);
        if(initialSize) setCardSize(initialSize);
    }, [initialPosition, initialSize])

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Ignore clicks on resizer handles
        if (target.className.includes && target.className.includes('handle')) return;
        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.clientX - cardPosition.x,
            y: e.clientY - cardPosition.y,
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragOffsetRef.current.x;
            const newY = e.clientY - dragOffsetRef.current.y;
            setCardPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        if (isDragging && broadcastDocRef) {
            updateDoc(broadcastDocRef, { challengeCardPosition: cardPosition });
        }
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, cardPosition]);

    const getDistance = (touches: React.TouchList) => {
        const [touch1, touch2] = [touches[0], touches[1]];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            setIsPinching(true);
            initialPinchDistanceRef.current = getDistance(e.touches);
            if (typeof cardSize.width === 'number' && typeof cardSize.height === 'number') {
                initialCardSizeRef.current = { width: cardSize.width, height: cardSize.height };
            }
        } else if (e.touches.length === 1) {
            setIsDragging(true);
            dragOffsetRef.current = {
                x: e.touches[0].clientX - cardPosition.x,
                y: e.touches[0].clientY - cardPosition.y,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && isPinching) {
            const newDist = getDistance(e.touches);
            const scale = newDist / initialPinchDistanceRef.current;
            const newWidth = Math.max(300, initialCardSizeRef.current.width * scale);
            const aspectRatio = initialCardSizeRef.current.width / initialCardSizeRef.current.height;
            setCardSize({ width: newWidth, height: newWidth / aspectRatio });
        } else if (e.touches.length === 1 && isDragging) {
            const newX = e.touches[0].clientX - dragOffsetRef.current.x;
            const newY = e.touches[0].clientY - dragOffsetRef.current.y;
            setCardPosition({ x: newX, y: newY });
        }
    };

    const handleTouchEnd = () => {
        if (broadcastDocRef) {
            if (isDragging) updateDoc(broadcastDocRef, { challengeCardPosition: cardPosition });
            if (isPinching) updateDoc(broadcastDocRef, { challengeCardSize: cardSize });
        }
        setIsDragging(false);
        setIsPinching(false);
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
        isDragging,
        handleMouseDown,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleResizeStop,
        setCardSize
    };
}

    