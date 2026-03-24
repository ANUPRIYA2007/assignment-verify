import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(Draggable);
}

export default function AnimatedLogo() {
    const logoIconRef = useRef(null);
    const logoTextRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // Floating animation for the whole container
        gsap.to(containerRef.current, {
            y: 5,
            x: 3,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        // Draggable setup for the text
        Draggable.create(logoTextRef.current, {
            type: 'x,y',
            edgeResistance: 0.65,
            bounds: window,
            onDragStart: () => {
                gsap.to(logoTextRef.current, { scale: 1.05, duration: 0.2 });
            },
            onDragEnd: () => {
                gsap.to(logoTextRef.current, { scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
            }
        });

        // Hover animation for the logo icon
        const logoIcon = logoIconRef.current;
        const spinAnim = gsap.to(logoIcon, {
            rotation: 360,
            duration: 1.5,
            ease: 'none',
            repeat: -1,
            paused: true
        });

        const handleMouseEnter = () => spinAnim.play();
        const handleMouseLeave = () => spinAnim.pause();

        logoIcon.addEventListener('mouseenter', handleMouseEnter);
        logoIcon.addEventListener('mouseleave', handleMouseLeave);

        // Also make logo icon draggable and spin while dragging
        Draggable.create(logoIcon, {
            type: 'x,y',
            onDrag: function () {
                gsap.set(this.target, { rotation: '+=10' });
            },
            onDragEnd: function () {
                gsap.to(this.target, { x: 0, y: 0, rotation: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
            }
        });

        return () => {
            logoIcon.removeEventListener('mouseenter', handleMouseEnter);
            logoIcon.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={containerRef} className="flex items-center gap-3 p-4 cursor-pointer select-none" style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
            {/* Logo Icon */}
            <div ref={logoIconRef} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20 overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 64 64">
                    <defs>
                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#ffffff' }} />
                            <stop offset="100%" style={{ stopColor: '#cbd5e1' }} />
                        </linearGradient>
                    </defs>
                    <rect x="12" y="6" width="34" height="46" rx="6" fill="url(#logoGrad)" />
                    <path d="M36 6 L46 16 L36 16 Z" fill="rgba(0,0,0,0.1)" />
                    <polyline points="20,32 28,40 44,22" fill="none" stroke="#7B2FBE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {/* Logo Name */}
            <h1 ref={logoTextRef} className="text-xl font-bold tracking-tight">
                <span className="gradient-text font-black" style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Evalyn</span>
            </h1>
        </div>
    );
}
