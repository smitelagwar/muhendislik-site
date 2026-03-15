"use client";

import { useRef, useState, ReactNode } from "react";

interface TiltCardProps {
    children: ReactNode;
    className: string;
    intensity: number; // tilt degree amount
}

export function TiltCard({ children, className = "", intensity = 8 }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("perspective(800px) rotateY(0deg) rotateX(0deg)");
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * intensity * 2;
        const rotateX = (0.5 - y) * intensity * 2;

        setTransform(`perspective(800px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale3d(1.02, 1.02, 1.02)`);
        setGlare({ x: x * 100, y: y * 100, opacity: 0.15 });
    };

    const handleMouseLeave = () => {
        setTransform("perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)");
        setGlare({ x: 50, y: 50, opacity: 0 });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden ${className}`}
            style={{
                transform,
                transition: "transform 0.15s ease-out",
                transformStyle: "preserve-3d",
            }}
        >
            {children}
            {/* Glare overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-10 rounded-[inherit]"
                style={{
                    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 50%)`,
                    transition: "opacity 0.3s ease",
                }}
            />
        </div>
    );
}
