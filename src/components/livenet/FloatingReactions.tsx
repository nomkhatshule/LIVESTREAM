
'use client';

import { Reaction } from "@/lib/types";

export default function FloatingReactions({ reactions }: { reactions: Reaction[] }) {
    return (
        <div className="absolute bottom-16 left-4 h-96 w-64 z-30 pointer-events-none">
            {reactions.map(reaction => (
                <div
                    key={reaction.id}
                    className="animate-float-up absolute bottom-0 text-3xl opacity-0"
                    style={{ left: `${reaction.x}%` }}
                >
                    {reaction.emoji}
                </div>
            ))}
        </div>
    );
}
