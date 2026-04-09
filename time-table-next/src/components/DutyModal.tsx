"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useDuties } from "@/hooks/useDuties";
import { Day, TimeSlot, Teacher, getRecommendedTeachers, getLoadStatus } from "@/lib/data";

interface DutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  onTeacherChange?: (teacher: Teacher) => void; // Added for AI switching
  teacher: Teacher;
  day: Day;
  slot: TimeSlot;
}

export function DutyModal({ isOpen, onClose, onConfirm, onTeacherChange, teacher, day, slot }: DutyModalProps) {
  const [reason, setReason] = useState("");
  const { duties } = useDuties();

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason(""); // Reset for next time
      onClose();
    }
  };

  const recommendations = getRecommendedTeachers(day, slot, duties).filter(t => t.id !== teacher.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/90 backdrop-blur-2xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className="relative w-full max-w-xl bg-ink/95 backdrop-blur-3xl border border-grid shadow-[0_0_40px_rgba(50,95,232,0.15)] rounded-2xl overflow-hidden"
          >
            {/* Header Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-copper to-magenta" />

            <div className="p-8 md:p-12 relative z-10">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 bg-copper rounded-sm animate-pulse shadow-[0_0_8px_rgba(50,95,232,0.8)]" />
                   <span className="text-[10px] font-sans font-bold text-copper uppercase tracking-[0.2em] block">Resource Allocation Protocol</span>
                </div>
                <h2 className="text-3xl font-display font-black text-cream uppercase leading-none tracking-tighter mt-3">Assign <span className="text-transparent bg-clip-text bg-gradient-to-r from-copper to-magenta">Task</span></h2>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-6 border-y border-grid bg-surface/50 -mx-8 md:-mx-12 px-8 md:px-12">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em]">Target Entity</label>
                    <div className="font-display font-bold text-xl uppercase text-cream tracking-tight cursor-default">
                       {teacher.name}
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-1">
                    <label className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em]">Temporal Slot</label>
                    <div className="font-sans font-bold text-sm uppercase text-copper flex items-center gap-3 bg-copper/10 border border-copper/30 px-4 py-1.5 rounded-sm shadow-[0_0_10px_rgba(50,95,232,0.1)]">
                       <span>{day}</span>
                       <span className="w-1 h-1 bg-copper rounded-sm" />
                       <span className="text-cream">{slot}</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <label className="text-[10px] font-sans font-bold text-copper uppercase tracking-[0.2em] block mb-4 flex items-center gap-2">
                      <span className="w-1 h-1 bg-copper animate-ping rounded-full inline-block"></span> AI Alternatives Detected
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                        {recommendations.map(rec => {
                           const status = getLoadStatus(rec.id);
                           return (
                             <button
                               key={rec.id}
                               onClick={() => onTeacherChange?.(rec)}
                               className="flex-shrink-0 w-36 p-4 bg-surface/40 border border-grid hover:border-copper hover:bg-copper/5 transition-all text-left group rounded-xl shadow-sm relative overflow-hidden"
                             >
                               <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors"></div>
                               <div className="text-sm font-display font-bold text-cream uppercase mb-1 group-hover:text-copper transition-colors truncate pl-2">{rec.name}</div>
                               <div className={`text-[10px] font-sans font-bold uppercase tracking-[0.1em] pl-2 ${status.color}`}>
                                 {status.label}
                               </div>
                             </button>
                           )
                        })}
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <label className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] block mb-3">Task Parameter</label>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                      className="w-full bg-surface/50 border border-grid rounded-xl px-5 py-4 text-lg font-display font-bold text-cream focus:outline-none focus:border-copper focus:bg-copper/5 focus:shadow-[0_0_15px_rgba(50,95,232,0.15)] transition-all placeholder:text-muted/50"
                      placeholder="Initialize description..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-copper rounded-sm animate-pulse"></div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleConfirm}
                    className="flex-[2] bg-copper hover:bg-cream text-white hover:text-surface transition-all uppercase tracking-[0.2em] font-sans font-black text-xs py-4 rounded-xl shadow-[0_0_15px_rgba(50,95,232,0.4)] hover:shadow-none"
                  >
                    Execute
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 border border-grid hover:border-magenta hover:text-magenta transition-all text-muted uppercase tracking-[0.2em] font-sans font-bold text-xs py-4 rounded-xl hover:bg-magenta/5"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </div>

            {/* Background Aesthetic */}
            <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none mix-blend-screen" />
            <div className="absolute -bottom-20 -right-20 pointer-events-none opacity-[0.02] select-none blur-sm">
              <span className="text-[12rem] font-display font-black uppercase leading-none">SYS</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
