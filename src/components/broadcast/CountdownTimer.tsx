
'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

interface CountdownTimerProps {
  startTime: Timestamp;
  durationSeconds: number;
}

export default function CountdownTimer({ startTime, durationSeconds }: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  
  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date();
      const start = startTime.toDate();
      const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      setRemainingSeconds(remaining);
    };

    calculateRemaining(); // Initial calculation
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = (remainingSeconds / durationSeconds) * 100;

  return (
    <div className="w-full text-center my-4">
        <h3 className="text-4xl font-bold font-mono tracking-tighter text-black">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </h3>
        <Progress value={progress} className="w-full h-2 mt-3" />
        {remainingSeconds === 0 && (
             <p className="text-destructive font-semibold mt-2 animate-pulse">Time's Up!</p>
        )}
    </div>
  );
}
