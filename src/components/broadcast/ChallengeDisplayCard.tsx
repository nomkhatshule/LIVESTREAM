
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
  children?: React.ReactNode; // For action buttons
  onClose?: () => void;
  timer?: React.ReactNode;
}

export default function ChallengeDisplayCard({ text, type, size = 'large', children, onClose, timer }: ChallengeDisplayCardProps) {
  const getBadgeInfo = () => {
    switch (type) {
      case 'truth':
        return { text: 'TRUTH', className: 'bg-pink-500 text-white' };
      case 'dare':
        return { text: 'DARE', className: 'bg-purple-600 text-white' };
      case 'challenge':
      default:
        return { text: 'CHALLENGE', className: 'bg-black text-white' };
    }
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className={cn(
        "relative transform -rotate-3 transition-transform hover:rotate-0 hover:scale-105",
        "w-full max-w-[280px] sm:max-w-xs" // Smaller max-width on mobile
    )}>
      {/* Main Card */}
      <div className="bg-[#fefabc] rounded-lg shadow-2xl flex flex-col items-center text-black p-3 sm:p-4 md:p-6 space-y-1 sm:space-y-2 h-full">
        {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7 sm:h-8 sm:w-8 text-gray-500 rounded-full hover:bg-black/10"
              onClick={onClose}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
        )}
        
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
             <Badge className={cn("text-[10px] sm:text-xs md:text-sm px-2 sm:px-2.5", badgeInfo.className)}>
                {badgeInfo.text}
            </Badge>
        </div>

        <div className="relative mt-4 w-full h-8 flex justify-center">
            {timer}
        </div>
        
        <div className="w-full flex-grow flex flex-col items-center justify-center text-center px-1 sm:px-2 md:px-4 py-1 sm:py-2 my-1 sm:my-2">
            <h2 className={cn(
                "font-bold font-headline",
                size === 'large' ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg'
            )}>{text}</h2>
        </div>
        
        {children && (
            <div className="w-full flex flex-row justify-between items-center gap-x-2 pt-1 sm:pt-2">
                {children}
            </div>
        )}
      </div>
    </div>
  );
}
