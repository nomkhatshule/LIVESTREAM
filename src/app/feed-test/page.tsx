
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { Broadcast } from '@/lib/data';
import { Clapperboard, Loader2, MoreVertical, Share2, User as UserIcon, Upload, UploadCloud, FileVideo, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BroadcastPlayer from '@/components/broadcast/broadcast-player';
import { useStreamStore } from '@/lib/stream-store';
import { BroadcastPreview } from '@/components/broadcast/broadcast-preview';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


function UploadHighlightForm({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [videoFile]);

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('video/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please select a video file.',
            });
            return;
        }
        setVideoFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (!videoFile || !title.trim() || !user) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a video and provide a title.',
            });
            return;
        }

        setIsUploading(true);
        // Mock upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 5;
            })
        }, 200);

        // TODO: Replace with actual Firebase Storage upload logic
        setTimeout(() => {
             clearInterval(interval);
             setUploadProgress(100);
             setTimeout(() => {
                setIsUploading(false);
                toast({ title: 'Upload Successful!', description: 'Your highlight is now on your profile.'});
                setOpen(false); // Close dialog on success
             }, 500)
        }, 5000);
    };

    return (
        <div className="grid gap-6 py-4">
            <div 
                className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <UploadCloud className="w-12 h-12 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">MP4, WebM, or Ogg (Max 50MB)</p>
                <input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </div>
            
            {previewUrl && videoFile && (
                <div className="space-y-4">
                    <div className="relative p-2 border rounded-lg">
                        <div className='flex items-start gap-3'>
                            <FileVideo className="w-10 h-10 text-primary flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold">{videoFile.name}</h4>
                                <p className="text-sm text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => setVideoFile(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="title">Highlight Title</Label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="e.g., My most epic moment!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    {isUploading && <Progress value={uploadProgress} className="w-full" />}
                </div>
            )}

            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpload} disabled={!videoFile || !title || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
                </Button>
            </DialogFooter>
        </div>
    );
}

function FeedPageContent() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const setActiveBroadcastId = useStreamStore((state) => state.setActiveBroadcastId);
    const disconnect = useStreamStore((state) => state.disconnect);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

    const liveBroadcastsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
    }, [firestore]);

    const { data: liveBroadcasts, isLoading: areBroadcastsLoading } = useCollection<Broadcast>(liveBroadcastsQuery);

    // This effect ensures we disconnect when the user navigates away from the feed.
    useEffect(() => {
        return () => {
            disconnect();
        }
    }, [disconnect]);

    if (isUserLoading || areBroadcastsLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Feed...</p>
            </div>
        );
    }
    
    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <div className="h-[calc(100vh-4rem)] relative bg-black">
                {/* The single, centralized player */}
                <BroadcastPlayer user={user} />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-40 text-white transition-transform hover:bg-transparent hover:scale-110 pointer-events-auto focus-visible:ring-0">
                            <MoreVertical className="h-8 w-8" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Share</span>
                        </DropdownMenuItem>
                         <DialogTrigger asChild>
                            <DropdownMenuItem>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Upload Highlight</span>
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem asChild>
                            <Link href="/broadcast/create">
                                <Clapperboard className="mr-2 h-4 w-4" />
                                <span>Go Stream</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/profile">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>My Profile</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                {/* The scrollable list of previews */}
                <div className="h-full overflow-y-scroll snap-y snap-mandatory">
                    {liveBroadcasts && liveBroadcasts.map(broadcast => (
                        <BroadcastPreview
                            key={broadcast.id}
                            broadcast={broadcast}
                            onVisible={() => setActiveBroadcastId(broadcast.id)}
                        />
                    ))}
                    {(!liveBroadcasts || liveBroadcasts.length === 0) && (
                        <div className="h-full w-full flex items-center justify-center text-white snap-start">
                            <p>No live broadcasts right now. Check back later!</p>
                        </div>
                    )}
                </div>
            </div>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload a New Highlight</DialogTitle>
                    <DialogDescription>
                        Select a video clip from your device to share with your followers.
                    </DialogDescription>
                </DialogHeader>
                <UploadHighlightForm setOpen={setIsUploadDialogOpen} />
            </DialogContent>
        </Dialog>
    );
}

export default function FeedTestPage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <FeedPageContent />
        </Suspense>
    )
}

    