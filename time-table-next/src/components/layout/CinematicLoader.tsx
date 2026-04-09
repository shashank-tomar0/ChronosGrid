"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CinematicLoader() {
  const [counter, setCounter] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const duration = 1500; // 1.5 seconds total loading sequence
    const intervalTime = 30; // ms per tick
    const totalTicks = duration / intervalTime;
    let ticks = 0;

    // Lock body scroll while loading
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      ticks++;
      // Non-linear easing for counter using simple ease-out quad curve estimation
      const progress = ticks / totalTicks;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.min(Math.floor(easeOut * 100), 100);
      
      setCounter(currentCount);

      if (ticks >= totalTicks) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoaded(true);
          // Unlock scrolling after loading is done, since the component doesn't unmount
          document.body.style.overflow = "auto";
          document.body.style.overflowX = "hidden";
        }, 200); 
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = "auto";
      document.body.style.overflowX = "hidden";
    };
  }, []);

  return (
    <motion.div
      initial={{ y: "0%" }}
      animate={{ y: isLoaded ? "-100%" : "0%" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[10000] bg-ink flex flex-col justify-end p-8 lg:p-16 pointer-events-none"
    >
      <div className="flex justify-between items-end overflow-hidden pb-4">
        {/* Loading text container */}
        <motion.div 
          animate={{ opacity: isLoaded ? 0 : 1, y: isLoaded ? 50 : 0 }} 
          transition={{ duration: 0.4 }}
          className="font-sans text-xs text-muted tracking-[0.2em] uppercase"
        >
          Initializing Engine
        </motion.div>
        
        {/* The massive ticker */}
        <motion.div 
          animate={{ opacity: isLoaded ? 0 : 1, y: isLoaded ? 100 : 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-[12vw] sm:text-[8rem] text-cream leading-none tracking-tighter"
        >
          {String(counter).padStart(2, "0")}
        </motion.div>
      </div>
    </motion.div>
  );
}
