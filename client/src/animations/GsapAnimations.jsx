import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Staggered reveal animation for a list of child elements.
 * Attach the returned ref to a container element.
 */
export function useStaggerReveal(selector = '.reveal-item', deps = []) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const items = containerRef.current.querySelectorAll(selector);
        if (items.length === 0) return;

        gsap.fromTo(items,
            { y: 40, opacity: 0, scale: 0.95 },
            {
                y: 0, opacity: 1, scale: 1,
                stagger: 0.08,
                duration: 0.6,
                ease: 'power3.out',
                clearProps: 'transform'
            }
        );
    }, deps);

    return containerRef;
}

/**
 * Count-up animation for a number element.
 * Returns a ref to attach to the number display element.
 */
export function useCountUp(targetValue, duration = 1.5, deps = []) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || targetValue === undefined || targetValue === null) return;

        const obj = { val: 0 };
        gsap.to(obj, {
            val: targetValue,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
                if (ref.current) {
                    ref.current.textContent = Math.round(obj.val);
                }
            }
        });
    }, [targetValue, ...deps]);

    return ref;
}

/**
 * Slide-in animation from a direction.
 */
export function useSlideIn(direction = 'left', delay = 0, deps = []) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;

        const directionMap = {
            left: { x: -60, y: 0 },
            right: { x: 60, y: 0 },
            up: { x: 0, y: 60 },
            down: { x: 0, y: -60 }
        };

        const { x, y } = directionMap[direction] || directionMap.left;

        gsap.fromTo(ref.current,
            { x, y, opacity: 0 },
            { x: 0, y: 0, opacity: 1, duration: 0.7, delay, ease: 'power3.out', clearProps: 'transform' }
        );
    }, deps);

    return ref;
}

/**
 * Animated page wrapper — fades in the entire page content with a stagger.
 */
export function usePageEntrance(deps = []) {
    const pageRef = useRef(null);

    useEffect(() => {
        if (!pageRef.current) return;

        gsap.fromTo(pageRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        );

        // Animate child sections
        const sections = pageRef.current.querySelectorAll('.animate-section');
        if (sections.length > 0) {
            gsap.fromTo(sections,
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1,
                    stagger: 0.1,
                    duration: 0.5,
                    delay: 0.2,
                    ease: 'power2.out',
                    clearProps: 'transform'
                }
            );
        }
    }, deps);

    return pageRef;
}

/**
 * Floating animation using GSAP for smooth performance.
 */
export function useFloat(amplitude = 8, duration = 4) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;

        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(ref.current, {
            y: -amplitude,
            duration: duration / 2,
            ease: 'sine.inOut'
        });

        return () => tl.kill();
    }, []);

    return ref;
}

/**
 * Pulse glow animation.
 */
export function usePulseGlow() {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;

        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(ref.current, {
            boxShadow: '0 0 40px rgba(108, 99, 255, 0.5), 0 0 80px rgba(108, 99, 255, 0.2)',
            duration: 1.5,
            ease: 'sine.inOut'
        });

        return () => tl.kill();
    }, []);

    return ref;
}

/**
 * Magnetic button hover effect.
 */
export function useMagneticHover() {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out' });
        };

        const handleLeave = () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        };

        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);

        return () => {
            el.removeEventListener('mousemove', handleMove);
            el.removeEventListener('mouseleave', handleLeave);
        };
    }, []);

    return ref;
}

/**
 * Animated counter component (for dashboard stats).
 */
export function AnimatedCounter({ value, className = '' }) {
    const ref = useCountUp(value);
    return <span ref={ref} className={className}>0</span>;
}
