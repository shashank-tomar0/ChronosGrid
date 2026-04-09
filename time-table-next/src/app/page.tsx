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
      <section className="relative h-screen flex justify-center overflow-hidden border-b border-grid bg-ink/50 pt-32 pb-16">
        {/* Dark Moody Background Image entirely matching the vibe */}
        <motion.div style={{ y }} className="absolute inset-0 z-0 opacity-20 hover:opacity-30 transition-opacity">
          <Image 
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop" 
            alt="Dark architecture"
            fill
            className="object-cover mix-blend-screen mix-blend-luminosity saturate-200"
            priority
          />
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />
        </motion.div>

        {/* Diagonal Tech Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(50,95,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(50,95,232,0.03)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

        {/* Massive Typography */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="z-10 text-center flex flex-col justify-center items-center px-4 w-full relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-copper/20 blur-[150px] rounded-full pointer-events-none" />

          <div className="overflow-hidden mb-4 border border-copper/30 bg-copper/5 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(50,95,232,0.2)]">
            <motion.div variants={itemReveal} className="text-xs font-sans uppercase tracking-[0.3em] font-bold text-copper flex items-center gap-3">
              <span className="w-2 h-2 bg-copper animate-ping rounded-full inline-block" /> SECURITY & LOAD DISTRIBUTION
            </motion.div>
          </div>
          
          <div className="overflow-hidden">
            <motion.h1 variants={itemReveal} className="text-[clamp(3rem,8vw,8rem)] font-display uppercase font-black tracking-tighter whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-cream to-cream/40 leading-none drop-shadow-2xl hover:scale-105 transition-transform duration-700">
              TIMETABLE
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1 variants={itemReveal} className="text-[clamp(3rem,8vw,8rem)] font-display uppercase font-black tracking-tighter whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-copper via-cream to-magenta leading-[0.8] drop-shadow-[0_0_20px_rgba(50,95,232,0.4)]">
              INTELLIGENCE
            </motion.h1>
          </div>
          
          <motion.div variants={itemReveal} className="mt-8 max-w-2xl mx-auto">
            <p className="text-muted font-sans text-lg lg:text-xl font-medium tracking-wide">
              Advanced resource allocation and real-time mapping engine. <br/> Stop scheduling manually, start deploying securely.
            </p>
          </motion.div>

          <motion.div variants={itemReveal} className="mt-12 flex gap-6">
            <button className="bg-copper text-ink font-bold font-sans uppercase tracking-[0.2em] px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(50,95,232,0.5)] hover:shadow-[0_0_35px_rgba(50,95,232,0.8)] hover:bg-white transition-all transform hover:-translate-y-1">
              Initialize Matrix
            </button>
            <button className="text-muted border border-grid bg-surface/50 font-bold font-sans uppercase tracking-[0.2em] px-8 py-4 rounded-xl hover:border-magenta hover:text-magenta transition-all drop-shadow-lg">
              View Analytics
            </button>
          </motion.div>

        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold flex flex-col items-center gap-2 z-10 text-copper/60 hover:text-copper transition-colors"
        >
          <ArrowDown className="w-5 h-5 animate-bounce" />
          SYSTEM SCAN ACTIVE
        </motion.div>
      </section>

      {/* Massive Overlapping Text Section */}
      <section className="py-24 border-b border-grid relative overflow-hidden bg-ink">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="max-w-[1400px] mx-auto px-6"
        >
          <div className="relative">
            <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-copper to-magenta rounded-full"></div>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter leading-none whitespace-normal break-words pl-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cream to-muted">Identify vulnerabilities in</span><br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-copper to-magenta">resource distribution.</span>
            </h2>
          </div>
        </motion.div>
      </section>

      {/* Simple Control Console */}
      <section className="bg-ink relative border-b border-grid backdrop-blur-xl bg-ink/90">
        <div className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col gap-10">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
            {/* 1. Visual Day Switcher */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <span className="text-[10px] font-sans font-bold text-copper uppercase tracking-[0.3em]">Temporal Scope</span>
              <div className="flex bg-surface p-1 border border-grid rounded-xl w-full lg:w-fit shadow-inner">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 lg:flex-none px-6 py-2 text-[10px] font-bold uppercase font-sans tracking-[0.2em] transition-all duration-300 rounded-lg ${
                      selectedDay === day 
                        ? 'bg-copper text-ink shadow-[0_0_15px_rgba(50,95,232,0.4)]' 
                        : 'text-muted hover:text-cream hover:bg-surface2'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-10 bg-surface/50 backdrop-blur-md p-6 border border-grid/80 rounded-2xl w-full lg:w-auto shadow-cyan relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-copper to-magenta" />
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mb-1">Nodes Online</span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-copper to-copper-dim">{freeTeachers.length}</span>
                  <div className="flex flex-col">
                    <div className="w-12 h-[3px] bg-gradient-to-r from-copper to-transparent rounded-full" />
                    <span className="text-[10px] font-sans text-muted uppercase tracking-[0.2em] mt-1">Available</span>
                  </div>
                </div>
              </div>
              <div className="w-[1px] h-12 bg-grid" />
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mb-1">System Load</span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-magenta to-red-500">{((1 - (freeTeachers.length / Object.keys(TEACHERS).length)) * 100).toFixed(0)}%</span>
                  <div className="flex flex-col">
                    <div className="w-8 h-[3px] bg-gradient-to-r from-magenta to-transparent rounded-full" />
                    <span className="text-[10px] font-sans text-muted uppercase tracking-[0.2em] mt-1">Consumed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Horizontal Time Strip */}
          <div className="flex flex-col gap-4 w-full border-t border-grid/30 pt-8">
             <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-sans font-bold text-copper uppercase tracking-[0.3em]">Network Slot Index</span>
                <button 
                  onClick={detectNow}
                  className="text-[10px] font-sans font-bold text-copper uppercase tracking-[0.2em] border border-copper/30 bg-copper/5 px-4 py-2 rounded-full hover:bg-copper hover:text-ink transition-all flex items-center gap-2 group shadow-sm hover:shadow-cyan"
                >
                  <span className="w-2 h-2 bg-copper group-hover:bg-ink rounded-full animate-pulse" />
                  SYNC REALTIME
                </button>
             </div>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-4 no-scrollbar">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`whitespace-nowrap px-6 py-3 text-[10px] font-bold uppercase font-sans tracking-[0.2em] transition-all rounded-xl border ${
                      selectedSlot === slot 
                        ? 'bg-cream text-ink border-cream shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                        : 'bg-surface/50 text-muted border-grid hover:border-copper/50 hover:text-cream hover:bg-surface2/80 hover:shadow-cyan'
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
      <section className="bg-ink relative min-h-screen pb-24 border-t border-grid">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none mix-blend-screen" />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          {freeTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 border border-grid/60 bg-surface/30 backdrop-blur-sm rounded-3xl mt-12 shadow-[0_0_50px_rgba(226,31,135,0.05)]">
              <div className="text-muted/10 font-display font-black text-6xl uppercase tracking-tighter mb-4">Offline</div>
              <span className="text-[10px] font-sans font-bold text-magenta uppercase tracking-[0.4em] flex items-center gap-3">
                <span className="w-2 h-2 bg-magenta rounded-full animate-pulse blur-[1px]"></span> NO ENTITIES AVAILABLE
              </span>
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
                  <div className="flex items-center gap-4 mb-6 border-b border-grid pb-4 relative">
                    <div className="absolute bottom-0 left-0 w-24 h-0.5 bg-gradient-to-r from-copper to-magenta" />
                    <h2 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cream to-muted uppercase tracking-tight">
                      {dept}
                    </h2>
                    <span className="text-[10px] font-sans font-bold text-copper uppercase tracking-[0.2em] bg-copper/10 px-3 py-1 rounded border border-copper/30">
                      {teachers.length} Active
                    </span>
                  </div>

                  {/* Availability Table */}
                  <div className="overflow-x-auto bg-surface/40 backdrop-blur-xl rounded-2xl border border-grid shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface2/60 border-b border-grid text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em]">
                          <th className="px-8 py-5">Node Identity</th>
                          <th className="px-8 py-5 text-center">Protocol History</th>
                          <th className="px-8 py-5 text-center">System State</th>
                          <th className="px-8 py-5 text-right">Action Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-grid/40">
                        {[...teachers]
                          .sort((a, b) => {
                            const countA = duties.filter(d => d.teacherId === a.id).length;
                            const countB = duties.filter(d => d.teacherId === b.id).length;
                            if (countA !== countB) return countA - countB;
                            return a.name.localeCompare(b.name);
                          })
                          .map((teacher, idx) => {
                          const historyCount = duties.filter(d => d.teacherId === teacher.id).length;
                          return (
                            <motion.tr 
                              key={teacher.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              className="group/row hover:bg-surface2/80 transition-colors cursor-pointer relative"
                              onClick={() => {
                                setActiveTeacher(teacher);
                                setIsModalOpen(true);
                              }}
                            >
                              <td className="px-8 py-6 relative">
                                <div className="absolute left-0 top-0 w-1 h-full bg-grid group-hover/row:bg-copper transition-colors" />
                                <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-xl border border-grid/60 flex items-center justify-center text-lg font-display font-black text-copper bg-surface group-hover/row:border-copper group-hover/row:shadow-[0_0_15px_rgba(50,95,232,0.4)] transition-all shrink-0">
                                    {teacher.name.split(' ').pop()?.charAt(0) || teacher.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-xl font-display font-bold text-cream group-hover/row:text-copper transition-colors leading-none mb-2 tracking-tight">
                                      {teacher.name}
                                    </div>
                                    <div className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] bg-surface2 px-2 py-0.5 rounded flex w-fit border border-grid">
                                      ID: {teacher.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className={`text-2xl font-display font-black ${historyCount > 3 ? 'text-copper drop-shadow-[0_0_5px_rgba(50,95,232,0.8)]' : 'text-muted'}`}>
                                  {historyCount.toString().padStart(2, '0')}
                                </div>
                                <div className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.2em] mt-1">Executions</div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-copper/5 border border-copper/30 text-[10px] font-sans font-bold text-copper uppercase tracking-[0.2em] rounded shadow-[0_0_10px_rgba(50,95,232,0.1)]">
                                  <span className="w-1.5 h-1.5 bg-copper rounded-sm animate-pulse shadow-[0_0_5px_rgba(50,95,232,0.8)]" />
                                  Online
                                </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button className="bg-copper/10 border border-copper text-copper text-[10px] font-bold uppercase tracking-[0.2em] py-3 px-6 rounded-lg hover:bg-copper hover:text-ink transition-all shadow-[0_0_10px_rgba(50,95,232,0.2)] hover:shadow-[0_0_20px_rgba(50,95,232,0.6)]">
                                  Execute Task
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
      <section className="bg-ink border-b border-grid relative">
        <div className="max-w-[1400px] mx-auto z-10 relative">
          {/* Section Header with Week Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-grid bg-surface/30">
            <div className="md:col-span-4 p-8 md:p-10 border-r border-grid">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-copper shadow-[0_0_10px_rgba(50,95,232,0.8)] rounded-sm animate-pulse" />
                <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-copper">Activity Feed</h3>
              </div>
              <p className="text-[10px] font-sans text-muted uppercase tracking-[0.2em] leading-relaxed mb-6">
                System tracking records and deployment history.
              </p>
              {logWeekDuties.length > 0 && (
                <button
                  onClick={() => clearWeekDuties(logWeekKey)}
                  className="text-[9px] font-sans font-bold text-muted hover:text-magenta uppercase tracking-[0.2em] flex items-center gap-2 border border-grid hover:border-magenta/50 px-4 py-2 transition-all rounded shadow-sm hover:bg-magenta/5"
                >
                  <Trash2 size={12} />
                  Purge Data ({logWeekDuties.length})
                </button>
              )}
            </div>

            <div className="md:col-span-8 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <button
                onClick={() => { const d = new Date(logMonday); d.setDate(d.getDate() - 7); setLogMonday(d); }}
                className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans font-bold uppercase tracking-[0.2em] group border border-grid px-4 py-2 rounded"
              >
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Previous Period
              </button>

              <div className="flex items-center gap-4 bg-surface2/60 px-6 py-3 rounded-lg border border-grid">
                <CalendarDays size={16} className="text-copper" />
                <span className="text-sm font-display font-bold uppercase tracking-[0.1em] text-cream">{logWeekLabel}</span>
                {isLogCurrentWeek ? (
                  <span className="text-[8px] font-sans font-bold text-copper uppercase tracking-[0.2em] bg-copper/10 border border-copper/30 px-3 py-1 rounded shadow-[0_0_10px_rgba(50,95,232,0.1)]">Active Epoch</span>
                ) : (
                  <button
                    onClick={() => setLogMonday(logTodayMonday)}
                    className="text-[9px] font-sans font-bold text-ink bg-cream uppercase tracking-[0.2em] px-4 py-1.5 rounded hover:bg-copper transition-all"
                  >
                    Sync Current
                  </button>
                )}
              </div>

              <button
                onClick={() => { const d = new Date(logMonday); d.setDate(d.getDate() + 7); setLogMonday(d); }}
                className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans font-bold uppercase tracking-[0.2em] group border border-grid px-4 py-2 rounded"
              >
                Forward Period
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Duty Entries */}
          <div className="min-h-[200px] bg-surface/20">
            {logWeekDuties.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-24 gap-4 max-w-lg mx-auto text-center">
                <div className="text-muted/10 font-display font-black text-6xl uppercase tracking-tighter">Void</div>
                <span className="text-muted font-sans font-bold uppercase tracking-[0.3em] text-[10px]">
                  No tracking data recorded for {logWeekLabel}
                </span>
              </div>
            ) : (
              <div className="divide-y divide-grid/50">
                {logWeekDuties.map((duty, idx) => {
                  const teacher = TEACHERS[duty.teacherId];
                  return (
                    <div key={duty.id} className="group flex flex-col md:flex-row md:items-center justify-between hover:bg-surface/60 border-l-2 border-transparent hover:border-copper transition-all">
                      <Link
                        href={`/faculty/${duty.teacherId}`}
                        className="flex-1 flex items-center gap-6 p-6 md:p-8"
                      >
                        <span className="text-[10px] font-sans font-bold text-muted/30 tracking-[0.2em] uppercase">
                          REC-{String(idx + 1).padStart(3, '0')}
                        </span>
                        <div className="flex-1">
                          <div className="text-xl md:text-2xl font-display font-bold uppercase tracking-tight text-cream group-hover:text-copper transition-colors">
                            {teacher?.name || duty.teacherId}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.3em] bg-surface2 px-2 py-1 rounded">
                              {duty.day} <span className="mx-1 text-copper/40">•</span> {duty.slot}
                            </span>
                            {duty.date && (
                              <span className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.2em]">
                                T—{new Date(duty.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-6 px-8 pb-6 md:pb-0">
                        <div className="hidden lg:block text-right pr-6 border-r border-grid/50">
                          <span className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.2em] block mb-1">Execution Code</span>
                          <span className="text-sm font-sans font-medium text-cream">{duty.reason}</span>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); removeDuty(duty.id); }}
                          className="w-12 h-12 rounded border border-grid flex items-center justify-center hover:border-magenta hover:bg-magenta/10 hover:shadow-[0_0_15px_rgba(226,31,135,0.2)] transition-all group/del"
                          title="Purge record"
                        >
                          <Trash2 size={16} className="text-muted/60 group-hover/del:text-magenta transition-colors" />
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
          <span>ABES GO</span>
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
