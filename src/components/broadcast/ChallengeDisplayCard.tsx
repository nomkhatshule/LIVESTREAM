
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import React from 'react';

interface ChallengeDisplayCardProps {
  text: string;
  type: 'truth' | 'dare' | 'challenge';
  size?: 'large' | 'small';
  variant?: 'stacked' | 'simple'; // New prop
  children?: React.ReactNode; // For action buttons
  onClose?: () => void;
  timer?: React.ReactNode;
}

export default function ChallengeDisplayCard({ text, type, size = 'large', variant = 'stacked', children, onClose, timer }: ChallengeDisplayCardProps) {
  const getBadgeInfo = () => {
    switch (type) {
      case 'truth':
        return { text: 'TRUTH', className: 'bg-primary text-primary-foreground' };
      case 'dare':
        return { text: 'DARE', className: 'bg-destructive text-destructive-foreground' };
      case 'challenge':
      default:
        return { text: 'CHALLENGE', className: 'bg-primary text-primary-foreground' };
    }
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className={cn(
        "relative w-full",
        size === 'large' ? 'max-w-sm h-[550px]' : 'max-w-xs h-[480px]'
    )}>
      {variant === 'stacked' && (
        <>
          <div className="absolute top-0 left-0 w-full h-full bg-white/80 rounded-3xl p-4 shadow-2xl transform -rotate-6 scale-95" />
          <div className="absolute top-0 left-0 w-full h-full bg-white/90 rounded-3xl p-4 shadow-2xl transform rotate-3 scale-95" />
        </>
      )}
      {/* Main Card */}
      <div className="absolute top-0 left-0 w-full h-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center">
        {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
        )}
        <div className="relative mb-4 w-full h-12">
            <div className="absolute inset-x-0 top-0 flex justify-center">
                <Badge className={cn("text-lg", badgeInfo.className)}>
                    {badgeInfo.text}
                </Badge>
            </div>
            {timer && (
                <div className="absolute top-0 left-0">
                    {timer}
                </div>
            )}
        </div>
        <div className="flex-grow w-full flex flex-col items-center justify-center text-center">
            <h2 className={cn(
                "font-bold text-black font-headline",
                size === 'large' ? 'text-2xl' : 'text-2xl'
            )}>{text}</h2>
        </div>
        {children && (
            <div className="mt-auto pt-4 w-full flex flex-row justify-between items-center gap-x-2">
                {children}
            </div>
        )}
      </div>
    </div>
  );
}
