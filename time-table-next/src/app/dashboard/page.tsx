"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { TEACHERS, TIME_SLOTS, getFreeTeachers, getTotalClasses, getFreeSlotCountByDay, parseSubject, getWorkloadScore, getLoadStatus, Day, TimeSlot, Teacher } from "@/lib/data";
import { useDuties, getWeekKey } from "@/hooks/useDuties";
import { DutyModal } from "@/components/DutyModal";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { duties, assignDuty } = useDuties();
  
  // Dynamically calculate today's day and date
  const today = new Date();
  const dayIndex = today.getDay();
  const DAYS_MAP: Record<number, Day> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
  };
  const currentDay: Day = DAYS_MAP[dayIndex] || 'MONDAY'; 
  const formattedToday = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const currentWeekKey = getWeekKey(today);

  const currentSlot = TIME_SLOTS[0];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  const [modalSlot, setModalSlot] = useState<TimeSlot>(TIME_SLOTS[0]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const teacherIds = Object.keys(TEACHERS);
  const totalFaculty = teacherIds.length;
  const freeNow = getFreeTeachers(currentDay, currentSlot).length;
  const totalFreeToday = teacherIds.reduce((sum, id) => sum + getFreeSlotCountByDay(id, currentDay), 0);
  const totalDuties = duties.length;

  const getDutyCount = (id: string) => duties.filter((d) => d.teacherId === id).length;
  
  // Scoring Logic for Balance
  const getFairnessRating = (id: string) => {
    const load = getWorkloadScore(id);
    const duties = getDutyCount(id);
    return load + (duties * 2);
  };

  const sortedByBalance = [...teacherIds].sort((a, b) => getFairnessRating(b) - getFairnessRating(a));
  const maxFairness = Math.max(...teacherIds.map(getFairnessRating), 1);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  const isFreeNow = (day: Day, slot: TimeSlot) => getFreeTeachers(day, slot).length;

  return (
    <main className="min-h-screen pt-24 pb-32">
      {activeTeacher && (
        <DutyModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={(reason) => assignDuty(activeTeacher.id, currentDay, modalSlot, reason)}
          onTeacherChange={(t) => setActiveTeacher(t)}
          teacher={activeTeacher}
          day={currentDay}
          slot={modalSlot}
        />
      )}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto px-6"
      >
        <motion.div variants={itemVariants} className="mb-16 border-l-4 border-copper pl-6 bg-gradient-to-r from-copper/10 to-transparent py-4">
          <h1 className="text-4xl md:text-5xl font-display font-black text-cream uppercase leading-none tracking-tighter mb-2">
            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-copper to-magenta">Dashboard</span>
          </h1>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-copper">
            Realtime Administrative Oversight and Metrics Analysis
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative">
          <div className="absolute inset-0 bg-grid opacity-[0.1] mix-blend-screen pointer-events-none" />
          <div className="p-8 border border-grid bg-surface/50 backdrop-blur-xl rounded-xl flex flex-col justify-between group hover:border-copper transition-colors shadow-cyan relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors" />
            <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mb-10 block group-hover:text-copper transition-colors">Total Faculty Network</span>
            <span className="text-[3.5rem] font-display font-black text-cream leading-none tracking-tighter">{String(totalFaculty).padStart(2, '0')}</span>
          </div>
          <div className="p-8 border border-grid bg-surface/50 backdrop-blur-xl rounded-xl flex flex-col justify-between group hover:border-copper transition-colors shadow-cyan relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors" />
            <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mb-10 block group-hover:text-copper transition-colors">Network Capacity</span>
            <span className="text-[3.5rem] font-display font-black text-copper leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(50,95,232,0.4)]">{totalFreeToday}</span>
          </div>
          <div className="p-8 border border-grid bg-surface/50 backdrop-blur-xl rounded-xl flex flex-col justify-between group hover:border-magenta transition-colors shadow-[0_0_15px_rgba(226,31,135,0.1)] hover:shadow-[0_0_20px_rgba(226,31,135,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-magenta transition-colors" />
            <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mb-10 block group-hover:text-magenta transition-colors">Active Deployments</span>
            <span className="text-[3.5rem] font-display font-black text-cream leading-none tracking-tighter">{totalDuties}</span>
          </div>
          <div className="p-8 border border-grid bg-surface/50 backdrop-blur-xl rounded-xl flex flex-col justify-between group hover:border-copper transition-colors shadow-cyan relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors" />
            <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mb-10 block group-hover:text-copper transition-colors">System Stability</span>
            <span className="text-[3.5rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cream to-copper italic leading-none tracking-tighter">{(100 - (totalDuties / Math.max(totalFreeToday, 1) * 100)).toFixed(0)}%</span>
          </div>
        </motion.div>

        {/* Today's Horizontal Matrix Schedule */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex justify-between items-end border-b border-grid pb-2 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-display font-black uppercase tracking-tight text-cream flex items-center gap-3">
                <div className="w-2 h-2 bg-copper shadow-[0_0_10px_rgba(50,95,232,0.8)] animate-pulse rounded-sm" /> 
                Live Matrix — <span className="text-copper">{currentDay}</span>
              </h2>
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] bg-surface2 px-2 py-1 rounded text-muted hidden md:inline-block border border-grid">{formattedToday}</span>
            </div>
            <span className="text-[9px] font-sans font-bold text-copper uppercase tracking-[0.2em] border border-copper/30 bg-copper/5 px-2 py-1 rounded">Click [VOID] cell to protocol task</span>
          </div>
          <div className="overflow-x-auto bg-surface/40 backdrop-blur-2xl border border-grid rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] custom-scrollbar">
            <table className="w-full border-collapse table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-surface2/60 border-b border-grid">
                  <th className="w-40 p-5 border-r border-grid text-left font-sans text-[10px] font-bold uppercase text-muted tracking-[0.2em] sticky left-0 z-20">Entity Node</th>
                  {TIME_SLOTS.map(slot => (
                    <th key={slot} className="p-5 border-r border-grid last:border-0 font-sans text-[9px] font-bold uppercase text-muted tracking-[0.2em] text-center">{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teacherIds.map(id => {
                  const teacher = TEACHERS[id];
                  return (
                    <tr key={id} className="border-b border-grid last:border-0 hover:bg-surface2 transition-colors group">
                      <td className="w-40 p-4 border-r border-grid sticky left-0 z-10 bg-surface/95 backdrop-blur-xl group-hover:bg-surface2/80 transition-colors relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors" />
                        <Link href={`/faculty/${id}`} className="text-sm font-display font-bold uppercase tracking-tight text-cream group-hover:text-copper transition-colors block pl-3">
                          {teacher.name}
                        </Link>
                        <div className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.2em] mt-0.5 pl-3">ID: {teacher.id}</div>
                      </td>
                      {TIME_SLOTS.map(slot => {
                        const subj = teacher.schedule[currentDay]?.[slot];
                        const duty = duties.find(d => d.teacherId === id && d.day === currentDay && d.slot === slot && d.weekKey === currentWeekKey);
                        
                        if (subj) {
                          const parsed = parseSubject(subj);
                          return (
                             <td key={slot} className="p-2 border-r border-grid last:border-0 text-center cursor-help">
                              <div className="bg-surface2 border border-grid rounded h-full p-2 flex items-center justify-center min-h-[3.5rem] shadow-inner" title={parsed?.full}>
                                <span className="text-[10px] font-sans font-bold text-muted/60 uppercase tracking-widest leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{parsed?.short}</span>
                              </div>
                            </td>
                          );
                        }

                        if (duty) {
                          return (
                            <td key={slot} className="p-2 border-r border-grid last:border-0 relative">
                              <div className="bg-gradient-to-br from-copper/20 to-magenta/20 border border-copper/50 rounded h-full p-1.5 flex flex-col items-center justify-center min-h-[3.5rem] shadow-[0_0_15px_rgba(50,95,232,0.15)] relative overflow-hidden" title={`Task: ${duty.reason}`}>
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-copper to-magenta" />
                                <span className="text-[8px] font-sans font-bold uppercase tracking-[0.3em] text-copper mb-0.5">Assigned</span>
                                <span className="font-display font-bold text-[11px] text-cream truncate max-w-full text-center leading-tight block">{duty.reason}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={slot}
                            onClick={() => {
                              setActiveTeacher(teacher);
                              setModalSlot(slot);
                              setIsModalOpen(true);
                            }}
                            className="p-2 border-r border-grid last:border-0 text-center cursor-pointer group/cell relative"
                          >
                            <div className="border border-dashed border-grid/50 rounded h-full w-full min-h-[3.5rem] flex items-center justify-center group-hover/cell:border-copper group-hover/cell:bg-copper/5 transition-all shadow-inner">
                              <span className="text-[10px] text-muted/30 font-sans font-bold uppercase tracking-[0.2em] group-hover/cell:text-copper transition-colors">[ VOID ]</span>
                            </div>
                            <div className="absolute inset-0 bg-copper opacity-0 group-hover/cell:opacity-10 transition-opacity blur-[10px] pointer-events-none" />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Two Column Layout: Faculty Profiles + Analytics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 relative">
          <div className="absolute inset-0 bg-grid opacity-[0.05] mix-blend-screen pointer-events-none" />
          <motion.div variants={itemVariants} className="border border-grid flex flex-col bg-surface/50 backdrop-blur-xl rounded-xl overflow-hidden shadow-cyan relative">
            <h2 className="text-lg font-display font-black uppercase tracking-tight text-cream p-6 border-b border-grid bg-surface/80 flex items-center gap-3">
              <span className="w-2 h-2 bg-copper rounded-sm" /> Faculty Registry Directory
            </h2>
            <div className="divide-y divide-grid/60 flex-1 overflow-y-auto max-h-[500px] bg-surface/30">
              {teacherIds.map(id => {
                const t = TEACHERS[id];
                const status = getLoadStatus(id);
                return (
                  <Link key={id} href={`/faculty/${id}`} className="p-6 flex justify-between items-center hover:bg-surface2/80 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors" />
                    <div className="pl-2">
                      <div className="text-xl font-display font-bold uppercase tracking-tight text-cream group-hover:text-copper transition-colors">{t.name}</div>
                      <div className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mt-1">{t.department}</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className={`text-[9px] font-sans font-bold uppercase tracking-[0.3em] px-3 py-1 bg-ink border border-grid rounded mb-2 ${status.color}`}>
                        {status.label}
                      </div>
                      <div className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em]">
                        {getTotalClasses(id)} Blocks/Wk
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid flex flex-col bg-surface/50 backdrop-blur-xl rounded-xl overflow-hidden shadow-cyan relative">
             <h2 className="text-lg font-display font-black uppercase tracking-tight text-copper p-6 border-b border-grid bg-surface/80 flex items-center gap-3">
              <span className="w-2 h-2 bg-magenta rounded-sm shadow-[0_0_10px_rgba(226,31,135,0.6)] animate-pulse" /> Workload Metric Distribution
            </h2>
            <div className="p-8 flex flex-col gap-8 flex-1 overflow-y-auto max-h-[500px] bg-surface/30">
              {sortedByBalance.map(id => {
                const fairness = getFairnessRating(id);
                const perc = (fairness / maxFairness) * 100;
                const dutyCount = getDutyCount(id);
                const isBusy = dutyCount > 0;

                return (
                  <div key={id} className="w-full">
                    <div className="flex justify-between text-[10px] font-sans font-bold text-muted mb-2 uppercase tracking-[0.2em]">
                      <span>{TEACHERS[id].name}</span>
                      <span className={isBusy ? 'text-copper drop-shadow-[0_0_5px_rgba(50,95,232,0.5)]' : ''}>
                        {isBusy ? 'ACTIVE TASK' : 'Standby'} — {dutyCount} Logs
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface2 relative rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${perc}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className={`absolute left-0 top-0 h-full rounded-full ${isBusy ? 'bg-gradient-to-r from-copper to-magenta shadow-[0_0_10px_rgba(50,95,232,0.8)]' : 'bg-copper/20'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

      </motion.div>
    </main>
  );
}
