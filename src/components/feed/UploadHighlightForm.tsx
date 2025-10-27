
'use client';

import { useRef, useState } from 'react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UploadCloud, FileVideo, X, Loader2, Upload } from 'lucide-react';

export default function UploadHighlightForm({ setOpen }: { setOpen: (open: boolean) => void }) {
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
