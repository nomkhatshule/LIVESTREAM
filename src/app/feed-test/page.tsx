
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useUser, useFirestore, useMemoFirebase, useStorage } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Broadcast } from '@/lib/data';
import { Clapperboard, Loader2, MoreVertical, Share2, User as UserIcon, Upload, Film, FileVideo, X, UploadCloud, Search, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BroadcastPlayer from '@/components/broadcast/broadcast-player';
import { useStreamStore } from '@/lib/stream-store';
import { BroadcastPreview } from '@/components/broadcast/broadcast-preview';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { UserSearch } from '@/components/search/user-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function UploadHighlightForm({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setTitle('');
        setVideoFile(null);
        setIsUploading(false);
        setUploadProgress(0);
    }

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
        if (!videoFile || !title.trim() || !user || !storage || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please provide a video, title, and be logged in.',
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        
        const storageRef = ref(storage, `highlights/${user.uid}/${Date.now()}-${videoFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, videoFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: 'There was a problem uploading your video. Please try again.',
                });
                setIsUploading(false);
            },
            async () => {
                // Upload completed successfully, now get the download URL
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Now, save the highlight info to Firestore
                    const highlightsCollectionRef = collection(firestore, `users/${user.uid}/highlights`);
                    await addDoc(highlightsCollectionRef, {
                        title: title,
                        videoUrl: downloadURL,
                        createdAt: serverTimestamp(),
                        userId: user.uid,
                    });

                    toast({
                        title: 'Upload Successful!',
                        description: 'Your highlight is now available on your profile.',
                    });

                    setOpen(false); // Close dialog on success
                    resetForm();

                } catch (error) {
                     console.error("Error saving highlight to Firestore:", error);
                     toast({
                        variant: 'destructive',
                        title: 'Save Failed',
                        description: 'Your video was uploaded but we could not save it to your profile.',
                    });
                     setIsUploading(false);
                }
            }
        );
    };

    return (
        <div className="grid gap-6 py-4">
            <div 
                className={cn(
                    "flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-colors",
                    !videoFile && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => !videoFile && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {videoFile ? (
                     <div className="space-y-4 text-center">
                        <FileVideo className="w-12 h-12 text-primary mx-auto" />
                        <h4 className="font-semibold">{videoFile.name}</h4>
                        <p className="text-sm text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <Button variant="outline" size="sm" onClick={() => setVideoFile(null)} disabled={isUploading}>
                            <X className="mr-2 h-4 w-4" />
                            Choose a different file
                        </Button>
                    </div>
                ) : (
                    <>
                        <UploadCloud className="w-12 h-12 text-muted-foreground" />
                        <p className="mt-2 text-sm font-semibold">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">MP4, WebM, or Ogg</p>
                    </>
                )}
                 <input 
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={!!videoFile}
                />
            </div>
            
            {videoFile && (
                <div className="space-y-4">
                     <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="title">Highlight Title</Label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="e.g., My most epic moment!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isUploading}
                        />
                    </div>
                    {isUploading && <Progress value={uploadProgress} className="w-full" />}
                </div>
            )}

            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isUploading}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpload} disabled={!videoFile || !title || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload'}
                </Button>
            </DialogFooter>
        </div>
    );
}

function InboxPanel() {
    // Mock data for notifications. In a real app, this would come from Firestore or a backend.
    const notifications = [
        { id: 1, type: 'follow', user: { name: 'StreamFan_1', avatar: 'https://picsum.photos/seed/notif1/40' }, time: '5m ago' },
        { id: 2, type: 'like', user: { name: 'GamerGirl_99', avatar: 'https://picsum.photos/seed/notif2/40' }, stream: 'Epic Playthrough Part 5', time: '1h ago' },
        { id: 3, type: 'comment', user: { name: 'ChefMaster', avatar: 'https://picsum.photos/seed/notif3/40' }, comment: 'That recipe looks amazing! 🔥', time: '3h ago' },
    ];
    const messages = [
        { id: 1, user: { name: 'GamerGirl_99', avatar: 'https://picsum.photos/seed/notif2/40' }, message: 'Hey, loved your last stream!', time: '1h ago', unread: true },
    ];

    return (
         <Tabs defaultValue="all" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="flex-1 overflow-y-auto mt-4 space-y-4">
                {notifications.map(n => (
                    <div key={n.id} className="flex items-center gap-3 p-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={n.user.avatar} />
                            <AvatarFallback>{n.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm flex-1">
                            <p>
                                <span className="font-semibold">{n.user.name}</span>
                                {n.type === 'follow' && ' started following you.'}
                                {n.type === 'like' && ` liked your stream "${n.stream}".`}
                                {n.type === 'comment' && ` commented: "${n.comment}"`}
                            </p>
                            <p className="text-xs text-muted-foreground">{n.time}</p>
                        </div>
                    </div>
                ))}
            </TabsContent>
            <TabsContent value="messages" className="flex-1 overflow-y-auto mt-4 space-y-2">
                {messages.map(m => (
                    <Link key={m.id} href={`/messages?with=${m.user.name}`} passHref>
                        <div className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={m.user.avatar} />
                                <AvatarFallback>{m.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold">{m.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{m.time}</p>
                                </div>
                                <p className={cn("truncate", m.unread && "font-bold text-primary")}>{m.message}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </TabsContent>
        </Tabs>
    )
}

function FeedPageContent() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const setActiveBroadcastId = useStreamStore((state) => state.setActiveBroadcastId);
    const disconnect = useStreamStore((state) => state.disconnect);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(4); // Mock unread count

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
             <Sheet>
                <div className="h-[calc(100vh-4rem)] relative bg-black">
                    {/* The single, centralized player */}
                    <BroadcastPlayer user={user} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-40 text-white transition-transform hover:bg-transparent hover:scale-110 pointer-events-auto focus-visible:ring-0">
                                <MoreVertical className="h-8 w-8" />
                                 {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 p-0" align="end">
                            <UserSearch>
                                <DropdownMenuSeparator />
                                <SheetTrigger asChild>
                                    <DropdownMenuItem>
                                        <Bell className="mr-2 h-4 w-4" />
                                        <span>Inbox</span>
                                        {unreadCount > 0 && <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
                                    </DropdownMenuItem>
                                </SheetTrigger>
                                <DropdownMenuItem asChild>
                                    <Link href="/broadcast/create">
                                        <Clapperboard className="mr-2 h-4 w-4" />
                                        <span>Go Stream</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem>
                                        <Film className="mr-2 h-4 w-4" />
                                        <span>Upload Highlight</span>
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                 <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={`/profile/${user.uid}`}>
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>My Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                            </UserSearch>
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
                 <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Inbox</SheetTitle>
                        <SheetDescription>
                            Recent notifications and direct messages.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="h-[calc(100%-4rem)] py-4">
                        <InboxPanel />
                    </div>
                </SheetContent>
            </Sheet>
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

    