
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Users, Heart } from 'lucide-react';

const ValueItem = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="flex flex-col items-center p-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl"
    >
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <Icon className="w-6 h-6 text-white" />
        </div>
        <h4 className="text-white font-bold font-headline text-lg mb-3 tracking-tight uppercase tracking-widest">{title}</h4>
        <p className="text-stone-400 text-sm leading-relaxed font-light">
            {description}
        </p>
    </motion.div>
);

export default function RealityValues() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto px-4">
            <ValueItem 
                icon={Compass}
                title="Movement First"
                description="We don't do 'desk' streams. Leave the chair behind. Go outside, explore a city, climb a mountain, or cook a new recipe. The world is your studio—keep it moving."
                delay={0.2}
            />
            <ValueItem 
                icon={Users}
                title="Zero Influencers"
                description="Built for the ordinary citizen. No big setups, no professional streamers, no faked lives. Just you, your phone, and a raw adventure. Real life doesn't need a filter."
                delay={0.4}
            />
            <ValueItem 
                icon={Heart}
                title="Pure Passion"
                description="We're not here for the check. Chase your dreams, fulfill your bucket list, and inspire others just 'for the fucks of it.' Self-fulfillment is the ultimate incentive."
                delay={0.6}
            />
        </div>
    );
}
