
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Sword, Shield, BrainCircuit } from 'lucide-react';

interface ChallengeCardProps {
  text: string;
  type: 'truth' | 'dare' | 'challenge';
  onClose: () => void;
}

export default function ChallengeCard({ text, type, onClose }: ChallengeCardProps) {
  const getBadgeInfo = () => {
    switch (type) {
      case 'truth':
        return {
          text: 'TRUTH',
          variant: 'default',
          Icon: BrainCircuit,
          className: 'bg-primary text-primary-foreground',
        };
      case 'dare':
        return {
          text: 'DARE',
          variant: 'destructive',
          Icon: Shield,
          className: 'bg-destructive text-destructive-foreground',
        };
      case 'challenge':
      default:
        return {
          text: 'CHALLENGE',
          variant: 'secondary',
          Icon: Sword,
          className: 'bg-secondary text-secondary-foreground',
        };
    }
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 pointer-events-auto">
      <div className="relative w-full max-w-md h-[400px] bg-card rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center transform scale-90 -rotate-3">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground z-10"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        
        <Badge
          className={cn(
            'mb-6 text-lg tracking-widest font-bold',
            badgeInfo.className
          )}
        >
          <badgeInfo.Icon className="h-4 w-4 mr-2" />
          {badgeInfo.text}
        </Badge>
        
        <div className="flex-grow flex items-center justify-center">
          <p className="text-2xl font-semibold text-card-foreground font-headline">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
