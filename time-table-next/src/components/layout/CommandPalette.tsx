"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TEACHERS } from "@/lib/data";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setQuery("");
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredTeachers = Object.values(TEACHERS).filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.id.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (teacherId: string) => {
    setIsOpen(false);
    // Note: We might want to pass state via query params to the faculty page if it doesn't handle direct selection well
    router.push(`/faculty/${teacherId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 sm:px-6 md:px-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-ink/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl bg-surface border border-grid shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-grid flex items-center gap-4">
              <span className="text-copper">/</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search faculty, schedule, or metrics..."
                className="flex-1 bg-transparent border-none outline-none text-cream font-display text-xl placeholder:text-muted/30"
              />
              <span className="text-[10px] font-sans text-muted uppercase tracking-widest border border-grid px-2 py-1">
                ESC
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {filteredTeachers.length > 0 ? (
                <div className="p-2">
                  <div className="px-4 py-2 text-[10px] font-sans text-muted uppercase tracking-widest">
                    Faculty ({filteredTeachers.length})
                  </div>
                  {filteredTeachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t.id)}
                      className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface2 transition-colors border-b border-grid/5 last:border-0 group text-left"
                    >
                      <div>
                        <div className="font-display text-lg text-cream group-hover:text-copper transition-colors uppercase">
                          {t.name}
                        </div>
                        <div className="text-[10px] font-sans text-muted uppercase tracking-widest">
                          {t.department}
                        </div>
                      </div>
                      <div className="text-[10px] font-sans text-muted group-hover:text-cream transition-colors uppercase tracking-widest border border-grid px-2 py-1 opacity-0 group-hover:opacity-100 italic transition-opacity">
                        View Matrix →
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-massive font-display text-muted/10 leading-none mb-4">?</div>
                  <p className="text-muted font-sans text-xs uppercase tracking-widest">No results found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-grid bg-ink/30 flex justify-between items-center text-[10px] font-sans text-muted uppercase tracking-widest">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="border border-grid px-1 rounded">↑↓</span> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="border border-grid px-1 rounded">Enter</span> Select
                </span>
              </div>
              <span className="italic">Nova Search Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
