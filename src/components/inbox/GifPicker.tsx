
'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export interface TenorResult {
    id: string;
    media_formats: {
        gif: { url: string };
        tinygif: { url: string; dims: number[] };
    };
    content_description: string;
}

interface GifPickerProps {
    onSendGif: (gif: TenorResult) => void;
}

export default function GifPicker({ onSendGif }: GifPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<TenorResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const tenorApiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY;

    const searchGifs = async (query: string) => {
        if (!tenorApiKey) {
            console.error("Tenor API key is missing.");
            return;
        }
        setIsLoading(true);
        const clientKey = "agorlive-chat";
        const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${tenorApiKey}&client_key=${clientKey}&limit=20`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error("Failed to fetch GIFs from Tenor:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchTerm.trim().length > 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                searchGifs(searchTerm);
            }, 500); // Debounce for 500ms
        } else {
            setResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    return (
        <div className="w-full h-full flex flex-col p-2 bg-zinc-900">
            <Input
                placeholder="Search for GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-none text-white focus:ring-primary"
            />
            <ScrollArea className="flex-1 mt-2">
                {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                <div className="grid grid-cols-2 gap-1">
                    {results.map((gif) => (
                        <button key={gif.id} onClick={() => onSendGif(gif)} className="aspect-square bg-zinc-800 rounded-md overflow-hidden">
                            <img src={gif.media_formats.tinygif.url} alt={gif.content_description} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};