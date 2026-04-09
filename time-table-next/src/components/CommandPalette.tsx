"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TEACHERS, Teacher } from "@/lib/data";
import { Search, User, LayoutDashboard, X, Command } from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Teacher[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = Object.values(TEACHERS).filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.department.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleNavigate = (teacherId: string) => {
    router.push(`/faculty/${teacherId}`);
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % (results.length + 2)); // +2 for static actions
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + (results.length + 2)) % (results.length + 2));
    } else if (e.key === "Enter") {
      if (selectedIndex === 0) {
        router.push("/");
        setIsOpen(false);
      } else if (selectedIndex === 1) {
        router.push("/faculty");
        setIsOpen(false);
      } else if (results[selectedIndex - 2]) {
        handleNavigate(results[selectedIndex - 2].id);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] px-4 md:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-ink/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="relative w-full max-w-2xl bg-surface border border-grid shadow-massive overflow-hidden"
          >
            {/* Search Input Area */}
            <div className="flex items-center p-6 border-b border-grid bg-surface">
              <Search className="text-muted mr-4" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search faculty, departments, or actions..."
                className="flex-1 bg-transparent text-cream placeholder:text-muted/40 text-xl font-display uppercase focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-sans text-muted/40 uppercase tracking-widest border border-grid px-2 py-1 rounded-sm">ESC to Close</span>
              </div>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
              {query.length === 0 && (
                <div className="px-4 py-2">
                  <span className="text-[9px] font-sans text-muted/60 uppercase tracking-[0.3em] px-2 mb-2 block">Quick Actions</span>
                  <button
                    onClick={() => { router.push("/"); setIsOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-4 transition-colors ${selectedIndex === 0 ? 'bg-copper text-ink' : 'text-cream hover:bg-surface2/40'}`}
                  >
                    <LayoutDashboard size={18} />
                    <span className="font-display uppercase text-lg">Main Dashboard</span>
                  </button>
                  <button
                    onClick={() => { router.push("/faculty"); setIsOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-4 transition-colors ${selectedIndex === 1 ? 'bg-copper text-ink' : 'text-cream hover:bg-surface2/40'}`}
                  >
                    <User size={18} />
                    <span className="font-display uppercase text-lg">Faculty Directory</span>
                  </button>
                </div>
              )}

              {results.length > 0 && (
                <div className="px-4 py-2 border-t border-grid/20 mt-2">
                  <span className="text-[9px] font-sans text-muted/60 uppercase tracking-[0.3em] px-2 mb-2 block">Search Results</span>
                  {results.map((teacher, index) => (
                    <button
                      key={teacher.id}
                      onClick={() => handleNavigate(teacher.id)}
                      className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${selectedIndex === index + 2 ? 'bg-copper text-ink' : 'text-cream hover:bg-surface2/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-1 rounded-sm ${selectedIndex === index + 2 ? 'bg-ink/20' : 'bg-surface2'}`}>
                          <User size={16} />
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-display uppercase text-lg">{teacher.name}</span>
                            <span className={`text-[10px] font-sans uppercase tracking-widest ${selectedIndex === index + 2 ? 'text-ink/60' : 'text-muted'}`}>
                              {teacher.department}
                            </span>
                        </div>
                      </div>
                      <Command size={14} className="opacity-20" />
                    </button>
                  ))}
                </div>
              )}

              {query.length > 0 && results.length === 0 && (
                <div className="p-20 text-center">
                   <div className="text-muted/20 font-display text-4xl uppercase mb-4 italic">No Direct Matches</div>
                   <p className="text-muted text-[10px] font-sans uppercase tracking-[0.2em]">Try searching by name or department code</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-ink/40 border-t border-grid flex justify-between items-center">
                <div className="flex gap-4 text-[9px] font-sans text-muted uppercase tracking-widest">
                   <span><span className="text-copper">↑↓</span> Navigate</span>
                   <span><span className="text-copper">ENTER</span> Select</span>
                </div>
                <div className="text-[9px] font-sans text-muted/40 uppercase tracking-widest italic">
                  Nova Digital Index Alpha v1.0
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
