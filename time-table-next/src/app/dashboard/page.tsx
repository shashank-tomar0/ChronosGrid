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
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
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
        <motion.div variants={itemVariants} className="mb-16">
          <h1 className="text-huge font-display text-copper uppercase leading-none tracking-tighter mix-blend-difference mb-4">
            Dashboard
          </h1>
          <p className="text-muted font-sans uppercase tracking-widest text-sm max-w-lg">
            Realtime administrative oversight. System metrics, assignments, and workload balance.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-grid mb-16">
          <div className="p-8 border-b md:border-b-0 md:border-r border-grid flex flex-col justify-between group hover:bg-surface2 transition-colors">
            <span className="text-xs font-sans text-muted uppercase tracking-widest mb-12 block group-hover:text-cream">Total Faculty</span>
            <span className="text-massive font-display text-cream leading-none">{String(totalFaculty).padStart(2, '0')}</span>
          </div>
          <div className="p-8 border-b md:border-b-0 lg:border-r border-grid flex flex-col justify-between group hover:bg-surface2 transition-colors">
            <span className="text-xs font-sans text-muted uppercase tracking-widest mb-12 block group-hover:text-cream">Free Slot Capacity</span>
            <span className="text-massive font-display text-copper leading-none">{totalFreeToday}</span>
          </div>
          <div className="p-8 border-b md:border-b-0 md:border-r lg:border-r border-grid flex flex-col justify-between group hover:bg-surface2 transition-colors">
            <span className="text-xs font-sans text-muted uppercase tracking-widest mb-12 block group-hover:text-cream">Active Duties</span>
            <span className="text-massive font-display text-cream leading-none">{totalDuties}</span>
          </div>
          <div className="p-8 flex flex-col justify-between group hover:bg-surface2 transition-colors">
            <span className="text-xs font-sans text-muted uppercase tracking-widest mb-12 block group-hover:text-cream">System Balance</span>
            <span className="text-massive font-display text-white italic leading-none">{(100 - (totalDuties / totalFreeToday * 100)).toFixed(0)}%</span>
          </div>
        </motion.div>

        {/* Today's Horizontal Matrix Schedule */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex justify-between items-end border-b border-grid pb-2 mb-6">
            <div className="flex items-baseline gap-4">
              <h2 className="text-2xl font-display uppercase tracking-wider text-copper">Today&apos;s Schedule — {currentDay}</h2>
              <span className="text-sm font-sans tracking-wide text-muted hidden md:inline-block">{formattedToday}</span>
            </div>
            <span className="text-[10px] font-sans text-muted uppercase tracking-[0.3em] pb-1">Click any &quot;Free&quot; slot to assign duty</span>
          </div>
          <div className="overflow-x-auto border border-grid custom-scrollbar">
            <table className="w-full border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-surface/90 backdrop-blur-md border-b border-grid">
                  <th className="w-36 p-4 border-r border-grid text-left font-sans text-xs font-normal uppercase text-muted tracking-widest bg-ink sticky left-0 z-20">Teacher Name</th>
                  {TIME_SLOTS.map(slot => (
                    <th key={slot} className="p-4 border-r border-grid last:border-0 font-sans text-xs font-normal uppercase text-muted tracking-widest text-center">{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teacherIds.map(id => {
                  const teacher = TEACHERS[id];
                  return (
                    <tr key={id} className="border-b border-grid last:border-0 hover:bg-surface2/40 transition-colors group">
                      <td className="w-36 p-4 border-r border-grid sticky left-0 z-10 bg-surface group-hover:bg-surface2 transition-colors">
                        <Link href={`/faculty/${id}`} className="text-[11px] font-display uppercase tracking-widest group-hover:text-copper transition-colors block">
                          {teacher.name}
                        </Link>
                      </td>
                      {TIME_SLOTS.map(slot => {
                        const subj = teacher.schedule[currentDay]?.[slot];
                        const duty = duties.find(d => d.teacherId === id && d.day === currentDay && d.slot === slot && d.weekKey === currentWeekKey);
                        
                        if (subj) {
                          const parsed = parseSubject(subj);
                          return (
                            <td key={slot} className="p-3 border-r border-grid last:border-0 bg-ink/40 text-[11px] font-sans text-muted/70 text-center cursor-help" title={parsed?.full}>
                              <span className="leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{parsed?.short}</span>
                            </td>
                          );
                        }

                        if (duty) {
                          return (
                            <td key={slot} className="p-3 border-r border-grid last:border-0 bg-copper/10 border-l-2 border-l-copper/40 relative" title={`Duty: ${duty.reason}`}>
                              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-copper rounded-bl-sm" />
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[8px] font-sans uppercase tracking-widest text-copper/60">Duty</span>
                                <span className="font-display text-[11px] text-cream truncate max-w-full text-center leading-tight block">{duty.reason}</span>
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
                            className="p-3 border-r border-grid last:border-0 text-center text-[10px] text-copper/30 font-sans uppercase tracking-widest cursor-pointer hover:bg-copper/10 hover:text-copper transition-all"
                          >
                            Free
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={itemVariants} className="border border-grid flex flex-col">
            <h2 className="text-xl font-display uppercase tracking-wider text-cream p-6 border-b border-grid">Faculty Summary</h2>
            <div className="divide-y divide-grid">
              {teacherIds.map(id => {
                const t = TEACHERS[id];
                const status = getLoadStatus(id);
                return (
                  <Link key={id} href={`/faculty/${id}`} className="p-6 flex justify-between items-center hover:bg-surface2 transition-colors group">
                    <div>
                      <div className="text-lg font-display uppercase tracking-wider group-hover:text-copper transition-colors">{t.name}</div>
                      <div className="text-xs font-sans text-muted mt-1">{t.department}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-sans font-bold tracking-[0.2em] px-3 py-1 bg-ink border border-grid rounded-full mb-2 ${status.color}`}>
                        {status.label}
                      </div>
                      <div className="text-[10px] font-sans text-muted uppercase tracking-widest">
                        {getTotalClasses(id)} Classes / Wk
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid flex flex-col">
            <h2 className="text-xl font-display uppercase tracking-wider text-copper p-6 border-b border-grid">Workload Balance</h2>
            <div className="p-8 flex flex-col gap-8 flex-1 justify-center bg-ink/30">
              {sortedByBalance.map(id => {
                const fairness = getFairnessRating(id);
                const perc = (fairness / maxFairness) * 100;
                const dutyCount = getDutyCount(id);
                const isBusy = dutyCount > 0;

                return (
                  <div key={id} className="w-full">
                    <div className="flex justify-between text-[10px] font-sans text-muted mb-2 uppercase tracking-widest">
                      <span>{TEACHERS[id].name}</span>
                      <span className={isBusy ? 'text-copper font-bold' : ''}>
                        {isBusy ? 'ACTIVE DUTY' : 'Available'} — {dutyCount} Tasks
                      </span>
                    </div>
                    <div className="h-1 w-full bg-surface2 relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${perc}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className={`absolute left-0 top-0 h-full ${isBusy ? 'bg-copper shadow-[0_0_10px_rgba(232,114,74,0.3)]' : 'bg-cream/40'}`}
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
