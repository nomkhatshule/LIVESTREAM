
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
  variant?: 'stacked' | 'simple';
  children?: React.ReactNode; // For action buttons
  onClose?: () => void;
  timer?: React.ReactNode;
}

export default function ChallengeDisplayCard({ text, type, size = 'large', variant = 'stacked', children, onClose, timer }: ChallengeDisplayCardProps) {
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
         "w-full max-w-xs"
    )}>
      {/* Main Card */}
      <div className="bg-[#fefabc] rounded-lg shadow-2xl flex flex-col items-center text-black p-4 md:p-6 space-y-2">
        {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-8 w-8 text-gray-500 rounded-full hover:bg-black/10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
        )}
        
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <Badge className={cn("text-xs md:text-sm", badgeInfo.className)}>
                {badgeInfo.text}
            </Badge>
        </div>

        <div className="relative mt-4 w-full h-8 flex justify-center">
            {timer}
        </div>
        
        <div className="w-full flex flex-col items-center justify-center text-center px-2 md:px-4 py-2 my-2 md:my-4">
            <h2 className={cn(
                "font-bold font-headline",
                size === 'large' ? 'text-lg md:text-xl' : 'text-base md:text-lg'
            )}>{text}</h2>
        </div>
        
        {children && (
            <div className="w-full flex flex-row justify-between items-center gap-x-2 pt-2">
                {children}
            </div>
        )}
      </div>
    </div>
  );
}
