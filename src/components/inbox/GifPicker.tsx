
'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export interface GiphyResult {
    id: string;
    images: {
        fixed_width: { url: string; };
        original: { url: string; };
    };
    title: string;
}

interface GifPickerProps {
    onSendGif: (gif: GiphyResult) => void;
}

export default function GifPicker({ onSendGif }: GifPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<GiphyResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

    useEffect(() => {
        const fetchGifs = async (url: string) => {
            if (!giphyApiKey) {
                console.error("GIPHY API key is missing.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await fetch(url);
                const data = await response.json();
                setResults(data.data || []);
            } catch (error) {
                console.error("Failed to fetch GIFs from GIPHY:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const handleFetch = () => {
            if (searchTerm.trim().length > 2) {
                const searchUrl = `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(searchTerm)}&limit=24&rating=g`;
                fetchGifs(searchUrl);
            } else if (searchTerm.trim().length === 0) {
                const trendingUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${giphyApiKey}&limit=24&rating=g`;
                fetchGifs(trendingUrl);
            }
        };
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(handleFetch, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, giphyApiKey]);

    return (
        <div className="w-full h-full flex flex-col p-2 bg-zinc-900">
            <Input
                placeholder="Search GIPHY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-none text-white focus:ring-primary"
            />
            <ScrollArea className="flex-1 mt-2">
                {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {results.map((gif) => (
                        <button key={gif.id} onClick={() => onSendGif(gif)} className="aspect-square bg-zinc-800 rounded-md overflow-hidden">
                            <img src={gif.images.fixed_width.url} alt={gif.title} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

    