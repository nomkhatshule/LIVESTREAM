
'use client';

import { useState, useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface StreamTimerProps {
  startTime: Timestamp;
  durationSeconds: number;
  onTimerEnd: () => void;
}

export default function StreamTimer({ startTime, durationSeconds, onTimerEnd }: StreamTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const { toast } = useToast();
  const warningShownRef = useRef(false);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date();
      const start = startTime.toDate();
      const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      
      setRemainingSeconds(remaining);

      // Show 1-minute warning
      if (remaining <= 60 && !warningShownRef.current) {
        toast({
          title: '1 Minute Remaining',
          description: 'Your live stream will end in one minute.',
        });
        warningShownRef.current = true;
      }

      // End the stream when timer hits zero
      if (remaining === 0) {
        onTimerEnd();
      }
    };

    calculateRemaining(); // Initial calculation
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationSeconds, onTimerEnd, toast]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  
  const isWarningTime = remainingSeconds > 0 && remainingSeconds <= 60;

  return (
    <div className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white",
        isWarningTime ? "bg-destructive/80 animate-pulse" : "bg-black/50"
    )}>
        <Timer className="h-4 w-4" />
        <span className="font-mono tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    </div>
  );
}
