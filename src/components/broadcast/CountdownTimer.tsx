
'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
  
  return (
    <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center text-white border-4 border-white shadow-lg">
        <h3 className={cn(
            "text-lg font-bold font-mono tracking-tighter",
            remainingSeconds <= 10 && remainingSeconds > 0 && "blinking-text text-red-500",
            remainingSeconds === 0 && "text-destructive"
            )}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </h3>
    </div>
  );
}
