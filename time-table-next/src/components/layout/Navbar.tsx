"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full px-6 py-4 flex justify-between items-start z-50 bg-ink/70 backdrop-blur-xl border-b border-grid text-cream shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex-1 flex items-start gap-2">
          <Link href="/" className="flex items-center gap-2 flex-1 group">
            <div className="w-3 h-3 bg-copper rounded-sm group-hover:shadow-[0_0_10px_rgba(50,95,232,0.8)] transition-all" />
            <span className="font-display font-bold tracking-tighter text-xl uppercase">ABES<span className="text-copper"> GO</span></span>
          </Link>
        </div>
        
        <div className="flex-1 hidden md:block text-center text-sm font-sans max-w-sm leading-tight text-muted">
          Efficient faculty scheduling and availability tracking assistant.
        </div>
        
        <div className="flex-1 right-nav hidden md:block text-center text-xs font-sans text-muted leading-tight uppercase tracking-widest">
          v2.0.0 — Ready<br/>
          ABES.AC.IN
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-8 text-xs font-sans uppercase tracking-widest text-muted">
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="hover:text-copper hover:shadow-[0_0_10px_rgba(50,95,232,0.4)] transition-all">Availability</Link>
            <Link href="/dashboard" className="hover:text-copper hover:shadow-[0_0_10px_rgba(50,95,232,0.4)] transition-all">Dashboard</Link>
            <Link href="/faculty" className="hover:text-copper hover:shadow-[0_0_10px_rgba(50,95,232,0.4)] transition-all">Faculty</Link>
          </div>
          <div className="w-[1px] h-4 bg-grid hidden lg:block" />
          
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-md hover:bg-surface2 transition-colors text-muted hover:text-copper disabled:opacity-50"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <div className="w-[1px] h-4 bg-grid hidden md:block" />

          <button 
            onClick={() => setMenuOpen(true)}
            className="group flex items-center gap-3 text-cream hover:text-copper transition-colors cursor-pointer"
          >
            <span className="hidden sm:block">Menu</span>
            <div className="flex flex-col gap-1">
              <div className="w-4 h-[1px] bg-current" />
              <div className="w-2 h-[1px] bg-current self-end" />
            </div>
          </button>
        </div>
      </nav>

      {/* Full Screen Overlay Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] as any }}
            className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-3xl text-cream p-6 border-b border-grid flex flex-col"
          >
            {/* Overlay Header */}
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-copper rounded-sm shadow-[0_0_10px_rgba(50,95,232,0.8)]" />
                <span className="font-display font-bold tracking-tighter text-xl uppercase">ABES<span className="text-copper"> GO</span></span>
              </div>
              <button 
                onClick={() => setMenuOpen(false)}
                className="text-sm font-sans uppercase tracking-widest text-copper hover:text-white hover:shadow-[0_0_10px_rgba(50,95,232,0.4)] transition-all"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 flex flex-col justify-center items-center gap-12">
              <Link onClick={() => setMenuOpen(false)} href="/" className="text-huge font-display font-black text-transparent bg-clip-text bg-gradient-to-r hover:from-copper hover:to-magenta from-cream to-cream transition-all tracking-tighter uppercase relative group">
                <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-copper to-magenta transition-all duration-300 group-hover:w-full"></span>
                Availability
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="/dashboard" className="text-huge font-display font-black text-transparent bg-clip-text bg-gradient-to-r hover:from-copper hover:to-magenta from-cream to-cream transition-all tracking-tighter uppercase relative group">
                <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-copper to-magenta transition-all duration-300 group-hover:w-full"></span>
                Dashboard
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="/faculty" className="text-huge font-display font-black text-transparent bg-clip-text bg-gradient-to-r hover:from-copper hover:to-magenta from-cream to-cream transition-all tracking-tighter uppercase relative group">
                <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-copper to-magenta transition-all duration-300 group-hover:w-full"></span>
                Faculty Schedule
              </Link>
            </div>

            {/* Footer info in overlay */}
            <div className="w-full flex justify-between text-xs text-muted font-sans uppercase tracking-widest border-t border-grid pt-6">
              <span>Wiz Aesthetic Template</span>
              <span>v2.0.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
