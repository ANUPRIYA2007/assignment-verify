import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function SplashScreen({ onComplete }) {
    const screenRef = useRef(null);
    const paperRef = useRef(null);
    const tickRef = useRef(null);
    const textRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to(screenRef.current, {
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.inOut',
                    onComplete: onComplete
                });
            }
        });

        // Initial state
        gsap.set([paperRef.current, tickRef.current, textRef.current], { opacity: 0, scale: 0.5 });

        tl.to(paperRef.current, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'back.out(1.7)'
        })
            .to(paperRef.current, {
                rotationY: 180,
                duration: 0.5,
                delay: 0.2,
                ease: 'power2.inOut'
            })
            .to(tickRef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: 'back.out(2)'
            }, '-=0.2')
            .to(textRef.current, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.6,
                ease: 'expo.out'
            }, '+=0.1')
            .to(containerRef.current, {
                y: -20,
                opacity: 0,
                duration: 0.5,
                delay: 0.8,
                ease: 'power4.in'
            });

        return () => tl.kill();
    }, [onComplete]);

    return (
        <div ref={screenRef} style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#0A0A1B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>
            <div ref={containerRef} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px' }}>
                    {/* Paper Icon */}
                    <svg ref={paperRef} width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7B2FBE', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>

                    {/* Tick Icon */}
                    <svg ref={tickRef} width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00D4AA', position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 0 8px rgba(0,212,170,0.5))' }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>

                <h1 ref={textRef} style={{
                    fontFamily: 'Outfit',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #7B2FBE 0%, #3B82F6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    opacity: 0,
                    transform: 'translateY(20px)'
                }}>
                    Evalyn
                </h1>
            </div>
        </div>
    );
}
