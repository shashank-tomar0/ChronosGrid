"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full px-6 py-4 flex justify-between items-start z-50 mix-blend-difference border-b border-grid text-cream">
        <div className="flex-1 flex items-start gap-2">
          <Link href="/" className="flex items-start gap-2 flex-1">
            <div className="w-4 h-4 bg-cream rotate-45 mt-1" />
            <span className="font-sans font-bold tracking-tighter text-xl">chronos—grid</span>
          </Link>
        </div>
        
        <div className="flex-1 hidden md:block text-center text-xs font-sans max-w-sm leading-tight text-muted">
          ChronosGrid Timetable System is a digital utility that blends scheduling, tracking, and technology to craft meaningful faculty experiences.
        </div>
        
        <div className="flex-1 hidden md:block text-center text-xs font-sans text-muted leading-tight">
          timetable@abes.ac.in<br/>
          Ghaziabad, EST 2000©
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-8 text-[11px] font-sans uppercase tracking-[0.2em] text-muted">
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="hover:text-copper transition-colors">Availability</Link>
            <Link href="/dashboard" className="hover:text-copper transition-colors">Dashboard</Link>
            <Link href="/faculty" className="hover:text-copper transition-colors">Faculty</Link>
          </div>
          <div className="w-[1px] h-4 bg-grid hidden lg:block" />
          <button 
            onClick={() => setMenuOpen(true)}
            className="group flex items-center gap-3 text-cream hover:text-copper transition-colors cursor-pointer"
          >
            <span className="hidden sm:block">Explore</span>
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
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] bg-ink text-cream p-6 border-b border-grid flex flex-col"
          >
            {/* Overlay Header */}
            <div className="flex justify-between items-start w-full">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-copper rotate-45 mt-1" />
                <span className="font-sans font-bold tracking-tighter text-xl">chronos—grid</span>
              </div>
              <button 
                onClick={() => setMenuOpen(false)}
                className="text-sm font-sans uppercase tracking-widest text-copper hover:text-white transition-colors"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 flex flex-col justify-center items-center gap-12">
              <Link onClick={() => setMenuOpen(false)} href="/" className="text-huge font-display hover:text-copper transition-colors tracking-tighter leading-none hover:italic uppercase">
                Availability
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="/dashboard" className="text-huge font-display hover:text-copper transition-colors tracking-tighter leading-none hover:italic uppercase">
                Dashboard
              </Link>
              <Link onClick={() => setMenuOpen(false)} href="/faculty" className="text-huge font-display hover:text-copper transition-colors tracking-tighter leading-none hover:italic uppercase">
                Faculty Matrix
              </Link>
            </div>

            {/* Footer info in overlay */}
            <div className="w-full flex justify-between text-xs text-muted font-sans uppercase tracking-widest border-t border-grid pt-6">
              <span>Nova Digital Edition</span>
              <span>v2.0.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
