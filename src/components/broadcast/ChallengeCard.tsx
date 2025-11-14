

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Sword, Shield, BrainCircuit } from 'lucide-react';
import ChallengeDisplayCard from './ChallengeDisplayCard';

interface ChallengeCardProps {
  text: string;
  type: 'truth' | 'dare' | 'challenge';
  size?: 'large' | 'small';
  variant?: 'stacked' | 'simple';
  onClose: () => void;
}

export default function ChallengeCard({ text, type, size, variant, onClose }: ChallengeCardProps) {

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-start justify-end p-4 pt-16 pr-48 pointer-events-auto">
        <ChallengeDisplayCard 
            text={text}
            type={type}
            size={size}
            variant={variant}
            onClose={onClose}
        />
    </div>
  );
}

    