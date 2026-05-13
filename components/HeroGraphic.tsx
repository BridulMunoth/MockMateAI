"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Mic } from "lucide-react";

export default function HeroGraphic() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setBarHeights([1, 2, 3, 4, 5].map(() => Math.random() * 100));

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { innerWidth, innerHeight } = window;
      // Calculate cursor position as a percentage from the center (-1 to 1)
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;

      // Max rotation: 60 degrees on Y axis (left/right), 60 degrees on X axis (up/down)
      // The ease-out transition will smooth this out
      setRotateY(x * 60);
      setRotateX(y * -60);
    };

    const handleMouseLeave = () => {
      // Reset position when mouse leaves the window
      setRotateX(0);
      setRotateY(0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      className="flex-1 relative flex justify-center z-10 perspective-[1500px] cursor-crosshair group"
      ref={containerRef}
    >
      {/* 
        This wrapper holds the 3D transforms. 
        duration-300 and ease-out gives a beautiful smooth trailing effect to the mouse.
      */}
      <div 
        className="relative w-full max-w-lg aspect-square transition-transform duration-300 ease-out"
        style={{ 
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d"
        }}
      >
        {/* Back glow */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 rounded-full blur-[80px]"
          style={{ transform: "translateZ(-100px)" }}
        />

        {/* Orbital rings - pushed back in Z-space */}
        <div className="absolute inset-0" style={{ transform: "translateZ(-50px) rotateX(60deg)", transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_20s_linear_infinite]" />
        </div>
        <div className="absolute inset-0" style={{ transform: "translateZ(-80px) rotateX(60deg) rotateY(30deg)", transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 border border-fuchsia-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        </div>
        
        {/* Volumetric 3D Robot Stack - Creates actual 3D thickness using multiple image layers */}
        <div className="absolute inset-0 z-20" style={{ transformStyle: "preserve-3d" }}>
          {/* Back shadow layer */}
          <div 
            className="absolute inset-0 w-full h-full bg-black/40 blur-xl rounded-full"
            style={{ transform: "translateZ(10px) translateY(40px) scale(0.8)" }}
          />
          
          {/* Extrusion layers (creates the 3D edge thickness) */}
          {[...Array(8)].map((_, i) => (
            <Image
              key={`extrusion-${i}`}
              src="/robot.png"
              alt=""
              width={500}
              height={500}
              className="absolute inset-0 w-full h-full object-contain brightness-0 opacity-40 mix-blend-multiply"
              style={{ transform: `translateZ(${20 + i * 2}px)` }}
            />
          ))}
          
          {/* Front illuminated face */}
          <Image
            src="/robot.png"
            alt="AI Interviewer"
            width={500}
            height={500}
            priority
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(139,92,246,0.5)] group-hover:drop-shadow-[0_0_80px_rgba(217,70,239,0.6)] transition-all duration-700"
            style={{ transform: `translateZ(36px)` }}
          />
        </div>
        
        {/* Floating UI Element 1 - pushed way forward for extreme parallax */}
        <div 
          className="absolute top-[20%] -right-12 glass-strong p-4 rounded-2xl border border-white/10 shadow-2xl z-30 group-hover:border-emerald-500/30 transition-colors duration-500" 
          style={{ transform: "translateZ(120px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Great answer!</p>
              <p className="text-xs text-emerald-400 font-medium tracking-wide">+15 confidence score</p>
            </div>
          </div>
        </div>
        
        {/* Floating UI Element 2 - pushed way forward */}
        <div 
          className="absolute bottom-[20%] -left-12 glass-strong p-4 rounded-2xl border border-white/10 shadow-2xl z-30 group-hover:border-violet-500/30 transition-colors duration-500" 
          style={{ transform: "translateZ(150px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 h-4 mb-1">
                {[1, 2, 3, 4, 5].map((i, idx) => (
                  <div 
                    key={i} 
                    className="w-1 bg-violet-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" 
                    style={{ 
                      height: mounted ? `${barHeights[idx]}%` : "50%", 
                      animationDelay: `${idx * 0.15}s` 
                    }} 
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Listening...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
