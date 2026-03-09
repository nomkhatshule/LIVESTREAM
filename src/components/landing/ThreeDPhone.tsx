'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, RoundedBox, Html, useVideoTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquareMore } from 'lucide-react';
import { cn } from '@/lib/utils';

// UI Overlay Component that will be rendered onto the 3D Screen
const PhoneUIOverlay = () => {
    const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setReactions(prev => [
                ...prev,
                { id: Date.now(), emoji: Math.random() > 0.5 ? '❤️' : '👍', x: Math.random() * 80 + 10 }
            ].slice(-10));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-[320px] h-[640px] pointer-events-none relative flex flex-col justify-between p-4 text-white font-sans select-none">
            {/* Top Bar */}
            <div className="flex items-center gap-2 mt-4 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage src="https://picsum.photos/seed/iphone17/200" alt="Host" />
                    <AvatarFallback>H</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-sm">NextGen Streamer</p>
                    <p className="text-[10px] opacity-80">iPhone 17 Pro Max • Live</p>
                </div>
            </div>

            {/* Bottom Content */}
            <div className="flex flex-col justify-end gap-4">
                <div className="space-y-2">
                    <div className="bg-black/40 p-2 rounded-lg backdrop-blur-sm max-w-[80%] border border-white/10">
                        <p className="text-xs font-bold text-primary">TechExplorer</p>
                        <p className="text-[10px]">The display on the 17 is insane! 🤯</p>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg backdrop-blur-sm max-w-[70%] border border-white/10">
                        <p className="text-xs font-bold text-secondary">FutureUser</p>
                        <p className="text-[10px]">Liking the 3D vibes!</p>
                    </div>
                </div>
            </div>

            {/* Side Actions */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center">
                    <div className="bg-white/10 p-2 rounded-full backdrop-blur-md">
                        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                    </div>
                    <span className="text-[10px] font-bold mt-1">4.5k</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="bg-white/10 p-2 rounded-full backdrop-blur-md">
                        <MessageSquareMore className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold mt-1">892</span>
                </div>
            </div>

            {/* Floating Reactions */}
            {reactions.map(r => (
                <div
                    key={r.id}
                    className="absolute bottom-20 animate-float-up opacity-0 text-2xl"
                    style={{ left: `${r.x}%` }}
                >
                    {r.emoji}
                </div>
            ))}
        </div>
    );
};

const PhoneModel = ({ videoUrl }: { videoUrl: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const videoTexture = useVideoTexture(videoUrl);
    
    // Create a glossy material for the back
    const casingMaterial = new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        metalness: 0.9,
        roughness: 0.1,
    });

    // Screen material with video texture
    const screenMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
    });

    return (
        <group scale={[2.5, 2.5, 2.5]}>
            {/* Phone Body */}
            <RoundedBox
                args={[1, 2, 0.08]} // Width, Height, Depth
                radius={0.08} // Corner radius
                smoothness={4}
            >
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </RoundedBox>

            {/* Front Screen */}
            <mesh position={[0, 0, 0.041]}>
                <planeGeometry args={[0.94, 1.94]} />
                <meshBasicMaterial map={videoTexture} />
                
                {/* UI Overlay via Html component */}
                <Html
                    transform
                    distanceFactor={1.16}
                    position={[0, 0, 0.001]}
                    className="iphone-screen-content"
                >
                    <PhoneUIOverlay />
                </Html>
            </mesh>

            {/* Camera Module (Back) */}
            <mesh position={[0.25, 0.7, -0.041]}>
                <RoundedBox args={[0.35, 0.35, 0.02]} radius={0.04} smoothness={4}>
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                </RoundedBox>
                {/* Lenses */}
                <mesh position={[-0.08, 0.08, -0.011]}>
                    <circleGeometry args={[0.06, 32]} />
                    <meshStandardMaterial color="#000" metalness={1} roughness={0} />
                </mesh>
                <mesh position={[0.08, 0.08, -0.011]}>
                    <circleGeometry args={[0.06, 32]} />
                    <meshStandardMaterial color="#000" metalness={1} roughness={0} />
                </mesh>
                <mesh position={[0, -0.08, -0.011]}>
                    <circleGeometry args={[0.06, 32]} />
                    <meshStandardMaterial color="#000" metalness={1} roughness={0} />
                </mesh>
            </mesh>

            {/* Apple Logo (Back) */}
            <mesh position={[0, 0, -0.041]} rotation={[0, Math.PI, 0]}>
                 <circleGeometry args={[0.1, 32]} />
                 <meshStandardMaterial color="#333" metalness={1} roughness={0.1} />
            </mesh>
        </group>
    );
};

export default function ThreeDPhone() {
    return (
        <div className="w-full h-[450px] sm:h-[600px] md:h-[800px] cursor-grab active:cursor-grabbing">
            <Canvas shadow={{ enabled: true }} dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
                    
                    <PhoneModel videoUrl="/video/147560-791705573.mp4" />
                    
                    <OrbitControls 
                        enablePan={false}
                        enableZoom={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                </Suspense>
            </Canvas>
            <div className="text-center mt-4 text-stone-500 text-sm animate-pulse">
                Drag to rotate and flip the iPhone 17
            </div>
        </div>
    );
}
