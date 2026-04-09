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
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="relative w-full max-w-xl bg-surface border border-grid shadow-massive overflow-hidden"
          >
            {/* Header Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-copper via-copper/30 to-transparent" />

            <div className="p-10 md:p-14">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 bg-copper rounded-full animate-pulse" />
                   <span className="text-[10px] font-sans text-muted uppercase tracking-[0.4em] block">Administrative Directive</span>
                </div>
                <h2 className="text-5xl font-display text-cream uppercase leading-none tracking-tight">Assign <span className="text-copper italic">Duty</span></h2>
              </div>

              <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-8 border-y border-grid/60">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-sans text-muted uppercase tracking-[0.3em]">Current Selection</label>
                    <div className="font-display text-3xl uppercase text-cream tracking-tight group cursor-default">
                       {teacher.name}
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <label className="text-[9px] font-sans text-muted uppercase tracking-[0.3em]">Temporal Slot</label>
                    <div className="font-display text-xl uppercase text-copper flex items-center gap-3">
                       <span>{day}</span>
                       <span className="w-1.5 h-1.5 bg-grid/40 rounded-full" />
                       <span className="text-cream italic">{slot}</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <label className="text-[9px] font-sans text-muted uppercase tracking-[0.4em] block mb-6 px-1">Best-Fit Alternatives (AI Suggestions)</label>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                        {recommendations.map(rec => {
                           const status = getLoadStatus(rec.id);
                           return (
                             <button
                               key={rec.id}
                               onClick={() => onTeacherChange?.(rec)}
                               className="flex-shrink-0 w-40 p-5 bg-ink/30 border border-grid hover:border-copper transition-all text-left group"
                             >
                               <div className="text-xs font-display text-cream uppercase mb-2 group-hover:text-copper transition-colors truncate">{rec.name}</div>
                               <div className={`text-[8px] font-sans uppercase tracking-[0.1em] ${status.color}`}>
                                 {status.label}
                               </div>
                             </button>
                           )
                        })}
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <label className="text-[9px] font-sans text-muted uppercase tracking-[0.4em] block mb-4">Reason for Assignment</label>
                  <input
                    type="text"
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                    className="w-full bg-ink/30 border-b border-grid py-5 text-2xl font-display text-cream focus:outline-none focus:border-copper transition-all placeholder:text-muted/20 pr-12 group-hover:bg-ink/50"
                    placeholder="Enter reason..."
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={handleConfirm}
                    className="flex-[2] bg-copper hover:bg-copper/80 transition-all text-ink uppercase tracking-[0.3em] font-sans font-black text-[11px] py-6 shadow-xl hover:shadow-copper/20"
                  >
                    Confirm Duty
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 border border-grid hover:border-muted transition-all text-muted hover:text-cream uppercase tracking-[0.3em] font-sans text-[11px] py-6"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>

            {/* Background Aesthetic */}
            <div className="absolute -bottom-10 -right-10 pointer-events-none opacity-[0.03] select-none">
              <span className="text-[14rem] font-display uppercase italic leading-none">Task</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
