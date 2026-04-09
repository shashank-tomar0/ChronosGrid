"use client";

import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowDown, ChevronLeft, ChevronRight, Trash2, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { TEACHERS, getFreeTeachers, TIME_SLOTS, DAYS, Day, TimeSlot, Teacher } from "@/lib/data";
import { useDuties, getMonday, getWeekKey } from "@/hooks/useDuties";
import { DutyModal } from "@/components/DutyModal";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day>('MONDAY');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('10:40-11:30');
  
  const { duties, assignDuty, removeDuty, getDutiesForWeek, clearWeekDuties } = useDuties();

  // Activity log week navigation
  const [logMonday, setLogMonday] = useState<Date>(getMonday(new Date()));
  const logWeekKey = getWeekKey(logMonday);
  const logWeekDuties = getDutiesForWeek(logWeekKey);
  const logTodayMonday = getMonday(new Date());
  const isLogCurrentWeek = logMonday.getTime() === logTodayMonday.getTime();
  const logWeekEnd = new Date(logMonday); logWeekEnd.setDate(logWeekEnd.getDate() + 4);
  const fmtLog = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const logWeekLabel = `${fmtLog(logMonday)} — ${fmtLog(logWeekEnd)}`;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Detect current day and time slot
  const detectNow = () => {
    const now = new Date();
    const days: Day[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as any;
    let currentDay = days[now.getDay()];

    if (currentDay === 'SATURDAY' || currentDay === 'SUNDAY') {
      setSelectedDay('MONDAY');
      setSelectedSlot(TIME_SLOTS[0]);
      return;
    }

    setSelectedDay(currentDay);

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    let found = false;
    for (const slot of TIME_SLOTS) {
      const [start, end] = slot.split('-');
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      
      const norm = (h: number) => (h < 8 ? h + 12 : h);
      const startMin = norm(sH) * 60 + sM;
      const endMin = norm(eH) * 60 + eM;

      if (currentTimeMinutes >= startMin && currentTimeMinutes < endMin) {
        setSelectedSlot(slot);
        found = true;
        break;
      }
    }
    
    // If we're between slots or before/after school, default to first/closest
    if (!found) {
      if (currentTimeMinutes < (8*60+50)) setSelectedSlot(TIME_SLOTS[0]);
      else if (currentTimeMinutes > (16*60+30)) setSelectedSlot(TIME_SLOTS[TIME_SLOTS.length-1]);
    }
  };

  useEffect(() => {
    detectNow();
    const timeout = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timeout);
  }, []);

  if (!mounted) return null;

  const freeTeachers = getFreeTeachers(selectedDay, selectedSlot);

  // Animation variants
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 1.8 } // Wait for loader
    }
  };

  const itemReveal: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <main className="min-h-screen bg-ink text-cream relative bg-grid">
      <DutyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(reason) => {
          if (activeTeacher) assignDuty(activeTeacher.id, selectedDay, selectedSlot, reason);
        }}
        onTeacherChange={(t) => setActiveTeacher(t)}
        teacher={activeTeacher || freeTeachers[0] || TEACHERS[Object.keys(TEACHERS)[0]]}
        day={selectedDay}
        slot={selectedSlot}
      />
      {/* Navbar has been moved to global layout */}

      {/* Hero Section with Parallax Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden border-b border-grid">
        {/* Dark Moody Background Image entirely matching the vibe */}
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop" 
            alt="Dark architecture"
            fill
            className="object-cover opacity-40 mix-blend-luminosity"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>

        {/* Vertical Grid Lines visible over the image */}
        <div className="absolute inset-0 flex justify-between px-6 pointer-events-none z-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-white" />
          ))}
        </div>

        {/* Massive Typography */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="z-10 text-center flex flex-col items-center px-4 w-full"
        >
          <div className="overflow-hidden">
            <motion.h1 variants={itemReveal} className="text-massive font-display uppercase tracking-tighter mix-blend-difference whitespace-nowrap text-cream">
              TIMETABLE
            </motion.h1>
          </div>
          <div className="overflow-hidden -mt-4 md:-mt-12">
            <motion.h1 variants={itemReveal} className="text-massive font-display uppercase tracking-tighter mix-blend-difference whitespace-nowrap text-cream font-light italic text-copper">
              MANAGEMENT
            </motion.h1>
          </div>
          <div className="overflow-hidden -mt-4 md:-mt-12">
            <motion.h1 variants={itemReveal} className="text-massive font-display uppercase tracking-tighter mix-blend-difference whitespace-nowrap text-cream">
              SYSTEM
            </motion.h1>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-6 text-xs uppercase tracking-widest font-bold flex items-center gap-2 mix-blend-difference z-10"
        >
          SCROLL TO EXPLORE <ArrowDown className="w-3 h-3" />
        </motion.div>
      </section>

      {/* Massive Overlapping Text Section */}
      <section className="py-32 border-b border-grid relative overflow-hidden bg-ink">
        <div className="absolute inset-0 flex justify-between px-6 pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => <div key={i} className="w-[1px] h-full bg-white" />)}
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="px-6 md:px-0 text-muted"
        >
          <h2 className="text-huge font-display font-light uppercase tracking-tighter leading-none whitespace-normal md:whitespace-nowrap break-words">
            <span className="text-cream">EFFICIENCY IS</span><br/>
            <span className="italic text-copper">CONNECTION.</span> WE BRIDGE<br/>
            THE GAP BETWEEN<br/>
            FACULTY AND TIME.
          </h2>
        </motion.div>
      </section>

      {/* Simple Control Console */}
      <section className="bg-ink relative border-b border-grid backdrop-blur-xl bg-ink/90">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-10">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            {/* 1. Visual Day Switcher */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <span className="text-[10px] font-sans text-muted uppercase tracking-[0.3em]">1. Select Day</span>
              <div className="flex bg-surface2/30 p-1 border border-grid rounded-sm w-full lg:w-fit">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 lg:flex-none px-8 py-2 text-[10px] uppercase font-sans tracking-widest transition-all duration-300 ${
                      selectedDay === day 
                        ? 'bg-copper text-white shadow-lg' 
                        : 'text-muted hover:text-cream hover:bg-surface2'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-10 bg-surface/20 p-5 border border-grid/40 rounded-sm w-full lg:w-auto">
              <div className="flex flex-col">
                <span className="text-[9px] font-sans text-muted uppercase tracking-[0.2em] mb-1">Available Now</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-display text-copper">{freeTeachers.length}</span>
                  <div className="flex flex-col">
                    <div className="w-12 h-[1px] bg-grid" />
                    <span className="text-[8px] font-sans text-muted uppercase">Teachers</span>
                  </div>
                </div>
              </div>
              <div className="w-[1px] h-10 bg-grid" />
              <div className="flex flex-col">
                <span className="text-[9px] font-sans text-muted uppercase tracking-[0.2em] mb-1">Campus Occupancy</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-display text-cream">{((1 - (freeTeachers.length / Object.keys(TEACHERS).length)) * 100).toFixed(0)}%</span>
                  <div className="flex flex-col">
                    <div className="w-8 h-[1px] bg-grid" />
                    <span className="text-[8px] font-sans text-muted uppercase">Busy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Horizontal Time Strip */}
          <div className="flex flex-col gap-3 w-full border-t border-grid/20 pt-8">
             <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-sans text-muted uppercase tracking-[0.3em]">2. Select Time Slot</span>
                <button 
                  onClick={detectNow}
                  className="text-[9px] font-sans text-copper uppercase tracking-widest border border-copper/30 px-3 py-1 rounded-full hover:bg-copper hover:text-white transition-all flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-copper group-hover:bg-white rounded-full animate-pulse" />
                  Jump to Current Time
                </button>
             </div>
             <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-4 no-scrollbar">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`whitespace-nowrap px-6 py-3 text-[11px] uppercase font-sans tracking-widest transition-all border ${
                      selectedSlot === slot 
                        ? 'bg-cream text-ink border-cream shadow-xl' 
                        : 'bg-transparent text-muted border-grid/40 hover:border-muted hover:text-cream'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
             </div>
          </div>

        </div>
      </section>

      {/* Structured Availability Table */}
      <section className="bg-ink relative min-h-screen pb-24">
        <div className="max-w-[1400px] mx-auto px-6">
          {freeTeachers.length === 0 ? (
            <div className="flex items-center justify-center p-32 text-muted font-sans uppercase tracking-[0.4em] text-sm">
              NO TEACHERS FREE AT THIS TIME
            </div>
          ) : (
            <div className="flex flex-col gap-12 mt-12">
              {Object.entries(
                freeTeachers.reduce((acc, t) => {
                  const dept = t.department || "Other";
                  if (!acc[dept]) acc[dept] = [];
                  acc[dept].push(t);
                  return acc;
                }, {} as Record<string, Teacher[]>)
              ).map(([dept, teachers]) => (
                <div key={dept} className="group">
                  {/* Department Name */}
                  <div className="flex items-baseline gap-4 mb-6 border-b border-grid/40 pb-2">
                    <h2 className="text-2xl font-display text-cream uppercase tracking-tight italic">
                      {dept}
                    </h2>
                    <span className="text-[10px] font-sans text-muted uppercase tracking-[0.3em] font-light">
                      — {teachers.length} available
                    </span>
                  </div>

                  {/* Availability Table */}
                  <div className="overflow-x-auto border border-grid/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface/30 border-b border-grid text-[10px] font-sans text-muted uppercase tracking-[0.2em]">
                          <th className="px-6 py-4 font-normal">Teacher Name & ID</th>
                          <th className="px-6 py-4 font-normal text-center">Duties Assigned</th>
                          <th className="px-6 py-4 font-normal text-center">Current Status</th>
                          <th className="px-6 py-4 font-normal text-right">Tasking</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-grid/20">
                        {teachers.map((teacher, idx) => {
                          const historyCount = duties.filter(d => d.teacherId === teacher.id).length;
                          return (
                            <motion.tr 
                              key={teacher.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              className="group/row hover:bg-surface2/40 transition-colors cursor-pointer"
                              onClick={() => {
                                setActiveTeacher(teacher);
                                setIsModalOpen(true);
                              }}
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full border border-grid flex items-center justify-center text-[11px] font-display text-copper bg-ink group-hover/row:border-copper transition-colors shrink-0">
                                    {teacher.name.split(' ').pop()?.charAt(0) || teacher.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-lg font-display text-cream group-hover/row:text-copper transition-colors leading-none mb-1">
                                      {teacher.name}
                                    </div>
                                    <div className="text-[9px] font-sans text-muted uppercase tracking-widest">
                                      ID: {teacher.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className={`text-xl font-display ${historyCount > 3 ? 'text-copper' : 'text-cream/80'}`}>
                                  {historyCount.toString().padStart(2, '0')}
                                </div>
                                <div className="text-[8px] font-sans text-muted uppercase tracking-widest mt-1">Assignments</div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-ink border border-green-500/20 text-[9px] font-sans text-green-500 uppercase tracking-widest rounded-full">
                                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                  Available
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button className="bg-copper text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-sm hover:bg-cream hover:text-ink transition-colors shadow-lg shadow-copper/10">
                                  Assign Task
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Weekly Duty Log */}
      <section className="bg-ink border-b border-grid">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header with Week Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-grid">
            <div className="md:col-span-3 p-8 md:p-10 border-r border-grid">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-1.5 bg-copper rounded-full animate-pulse" />
                <h3 className="text-xs font-sans uppercase tracking-[0.4em] text-copper">Duty Log</h3>
              </div>
              <p className="text-[10px] font-sans text-muted uppercase tracking-widest leading-relaxed mb-6">
                Weekly duty assignments and faculty tasking records.
              </p>
              {logWeekDuties.length > 0 && (
                <button
                  onClick={() => clearWeekDuties(logWeekKey)}
                  className="text-[9px] font-sans text-muted hover:text-red-400 uppercase tracking-widest flex items-center gap-2 border border-grid hover:border-red-500/30 px-3 py-2 transition-all"
                >
                  <Trash2 size={12} />
                  Clear Week ({logWeekDuties.length})
                </button>
              )}
            </div>

            <div className="md:col-span-9 p-6 flex items-center justify-between">
              <button
                onClick={() => { const d = new Date(logMonday); d.setDate(d.getDate() - 7); setLogMonday(d); }}
                className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans uppercase tracking-[0.2em] group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Prev
              </button>

              <div className="flex items-center gap-4">
                <CalendarDays size={16} className="text-copper" />
                <span className="text-sm font-display uppercase tracking-wider text-cream">{logWeekLabel}</span>
                {isLogCurrentWeek ? (
                  <span className="text-[8px] font-sans text-copper uppercase tracking-widest bg-copper/10 border border-copper/20 px-2 py-0.5 rounded-full">This Week</span>
                ) : (
                  <button
                    onClick={() => setLogMonday(logTodayMonday)}
                    className="text-[9px] font-sans text-copper uppercase tracking-widest border border-copper/30 px-3 py-1 rounded-full hover:bg-copper hover:text-white transition-all"
                  >
                    Today
                  </button>
                )}
              </div>

              <button
                onClick={() => { const d = new Date(logMonday); d.setDate(d.getDate() + 7); setLogMonday(d); }}
                className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans uppercase tracking-[0.2em] group"
              >
                Next
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Duty Entries */}
          <div className="min-h-[200px]">
            {logWeekDuties.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="text-muted/10 font-display text-6xl uppercase italic">Empty</div>
                <span className="text-muted/30 font-sans uppercase tracking-widest text-[10px]">
                  No duties assigned for {logWeekLabel}
                </span>
              </div>
            ) : (
              <div className="divide-y divide-grid/30">
                {logWeekDuties.map((duty, idx) => {
                  const teacher = TEACHERS[duty.teacherId];
                  return (
                    <div key={duty.id} className="group flex flex-col md:flex-row md:items-center justify-between hover:bg-surface2/40 transition-all">
                      <Link
                        href={`/faculty/${duty.teacherId}`}
                        className="flex-1 flex items-center gap-8 p-8"
                      >
                        <span className="text-[10px] font-sans text-muted/30 font-mono tracking-tighter w-8">
                          {String(idx + 1).padStart(3, '0')}
                        </span>
                        <div className="flex-1">
                          <div className="text-2xl font-display uppercase tracking-tight text-cream group-hover:text-copper transition-colors">
                            {teacher?.name || duty.teacherId}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[9px] font-sans text-muted uppercase tracking-[0.3em]">
                              {duty.day} <span className="mx-1 text-grid">/</span> {duty.slot}
                            </span>
                            {duty.date && (
                              <span className="text-[8px] font-sans text-muted/40 uppercase tracking-widest bg-surface2/40 px-2 py-0.5">
                                {new Date(duty.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-4 px-8 pb-6 md:pb-0">
                        <div className="hidden lg:block text-right">
                          <span className="text-[10px] font-sans text-muted/50 uppercase tracking-widest block mb-1">Reason</span>
                          <span className="text-xs font-sans text-cream italic">{duty.reason}</span>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); removeDuty(duty.id); }}
                          className="w-10 h-10 border border-grid flex items-center justify-center hover:border-red-500/50 hover:bg-red-500/10 transition-all group/del"
                          title="Remove this duty"
                        >
                          <Trash2 size={14} className="text-muted/40 group-hover/del:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ultra Minimal Footer */}
      <footer className="p-6 bg-surface flex flex-col md:flex-row justify-between items-center text-[10px] font-sans uppercase tracking-widest text-muted">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-2 h-2 bg-copper rotate-45" />
          <span>ChronosGrid</span>
        </div>
        <div className="flex gap-8">
          <span className="hover:text-cream cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-cream cursor-pointer transition-colors">Terms</span>
          <span className="text-copper">Nova Digital ©2026</span>
        </div>
      </footer>
    </main>
  );
}
