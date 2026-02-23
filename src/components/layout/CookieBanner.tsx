
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('livenet-cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('livenet-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('livenet-cookie-consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-0 right-0 z-[60] px-4 pointer-events-none"
                >
                    <div className="max-w-4xl mx-auto bg-black/80 backdrop-blur-2xl border border-white/10 p-4 md:p-6 rounded-2xl shadow-2xl pointer-events-auto flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 shrink-0">
                            <Cookie className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-white font-bold font-headline text-lg mb-1 tracking-tight">We value your privacy</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                We use cookies to enhance your experience, analyze our traffic, and provide you with personalized content. By clicking "Accept All", you consent to our use of cookies. Read our <Link href="/cookie-policy" className="text-white underline hover:text-stone-200 transition-colors">Cookie Policy</Link>.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleDecline}
                                className="flex-1 md:flex-none text-stone-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-full"
                            >
                                Decline
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleAccept}
                                className="flex-1 md:flex-none bg-white text-black hover:bg-stone-200 font-bold uppercase tracking-widest text-[10px] h-10 px-8 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                            >
                                Accept All
                            </Button>
                        </div>

                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 p-1 text-stone-500 hover:text-white transition-colors md:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
