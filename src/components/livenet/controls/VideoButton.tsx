'use client';

import { Button } from "@/components/ui/button";

interface VideoButtonProps {
    isVideoEnabled: boolean;
    onClick: () => void;
}

export default function VideoButton({ isVideoEnabled, onClick }: VideoButtonProps) {
    return (
        <div className="flex flex-col items-center gap-1.5 text-center">
            <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 text-white hover:bg-white/20" onClick={onClick}>
                {isVideoEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l20.25 20.25a.75.75 0 1 0 1.06-1.06L3.28 2.22Z" clipRule="evenodd" />
                        <path d="M14.625 4.5-.02.002a3.002 3.002 0 0 1 1.042 3.65 27.835 27.835 0 0 0 4.127 2.115c.343.14.678.272 1.006.394v-2.074a3 3 0 0 0-3-3H15.75a3 3 0 0 0-1.125.201ZM19.78 10.82a27.915 27.915 0 0 0-4.127-2.115 3.002 3.002 0 0 1-1.042-3.65l.02-.002H15.75a3 3 0 0 1 3 3v2.074c-.328-.122-.663-.254-1.006-.394Zm-2.3 8.355c.783-.298 1.532-.67 2.247-1.11v4.209a3 3 0 0 1-3 3h-8.25a3 3 0 0 1-3-3V9.375a27.52 27.52 0 0 1 1.656-4.219l-.001.002c.594.195 1.2.373 1.815.534a3.002 3.002 0 0 0 2.938 2.938c.615.161 1.221.338 1.815.533l-.002-.001.002.001c.642.208 1.29.404 1.944.585Z" />
                        <path fillRule="evenodd" d="M5.625 4.5a3 3 0 0 0-3 3v.348c.194.043.392.09.593.143 1.493.385 2.822.957 4.015 1.674v-1.165A3.002 3.002 0 0 0 5.625 4.5ZM4.125 9.375v5.25c0 .344.02.682.057 1.013a28.01 28.01 0 0 1 1.656 4.22c.594.195 1.2.373 1.815.534a3.002 3.002 0 0 1-2.938-2.938c-.16-.615-.338-1.221-.533-1.815l-.002.001v-7.165A27.818 27.818 0 0 0 4.125 9.375Z" clipRule="evenodd" />
                    </svg>
                )}
            </Button>
            <span className="text-xs font-semibold text-white">VIDEO</span>
        </div>
    );
}
