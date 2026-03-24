import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function FloatingBackground() {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const blobs = containerRef.current.querySelectorAll('.bg-blob');

        blobs.forEach((blob, i) => {
            gsap.to(blob, {
                x: 'random(-100, 100)%',
                y: 'random(-100, 100)%',
                duration: 'random(15, 25)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: i * 2
            });

            gsap.to(blob, {
                scale: 'random(0.8, 1.5)',
                duration: 'random(10, 20)',
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        });
    }, []);

    return (
        <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#02020f]">
            {/* Gradient Blobs */}
            <div className="bg-blob absolute top-[-10%] left-[-5%] w-[500px] height-[500px] bg-primary/20 rounded-full blur-[120px]"
                style={{ backgroundColor: 'rgba(123, 47, 190, 0.15)', width: '50vw', height: '50vw' }}></div>
            <div className="bg-blob absolute bottom-[-10%] right-[-5%] w-[450px] height-[450px] bg-blue-500/10 rounded-full blur-[110px]"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', width: '45vw', height: '45vw' }}></div>
            <div className="bg-blob absolute top-[20%] right-[10%] w-[350px] height-[350px] bg-emerald-500/10 rounded-full blur-[100px]"
                style={{ backgroundColor: 'rgba(0, 212, 170, 0.08)', width: '35vw', height: '35vw' }}></div>

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
    );
}
