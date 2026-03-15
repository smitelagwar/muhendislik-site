"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
    end: number;
    suffix: string;
    prefix: string;
    duration: number; // ms
    className: string;
}

function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
}

export function AnimatedCounter({
    end,
    suffix = "",
    prefix = "",
    duration = 2000,
    className = "",
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) {
                    setStarted(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;

        const startTime = performance.now();

        const update = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);
            setCount(Math.floor(eased * end));

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                setCount(end);
            }
        };

        requestAnimationFrame(update);
    }, [started, end, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}{count.toLocaleString("tr-TR")}{suffix}
        </span>
    );
}
