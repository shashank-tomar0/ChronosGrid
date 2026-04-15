"use client";

import { motion, Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Search, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { TEACHERS, getFreeTeachers, getTeachersWithOverrides, TIME_SLOTS, DAYS, Day, TimeSlot, Teacher } from "@/lib/data";
import { useDuties } from "@/hooks/useDuties";
import { DutyModal } from "@/components/DutyModal";

export default function AvailabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day>('MONDAY');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('10:40-11:30');
  
  const { duties, assignDuty } = useDuties();

  // Use dynamic teachers list to support manual overrides
  const [teachers, setTeachers] = useState<Record<string, Teacher>>(TEACHERS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);

  const detectNow = () => {
    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDayLabel = days[now.getDay()];

    if (currentDayLabel === 'SATURDAY' || currentDayLabel === 'SUNDAY') {
      setSelectedDay('MONDAY');
      setSelectedSlot(TIME_SLOTS[0]);
      return;
    }

    setSelectedDay(currentDayLabel as Day);

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
    
    if (!found) {
      if (currentTimeMinutes < (8*60+50)) setSelectedSlot(TIME_SLOTS[0]);
      else if (currentTimeMinutes > (16*60+30)) setSelectedSlot(TIME_SLOTS[TIME_SLOTS.length-1]);
    }
  };

  useEffect(() => {
    detectNow();
    setMounted(true);
    setTeachers(getTeachersWithOverrides());
  }, []);

  if (!mounted) return null;

  const freeTeachers = getFreeTeachers(selectedDay, selectedSlot);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  return (
    <main className="min-h-screen pt-32 pb-40 bg-surface2 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-copper/5 to-transparent pointer-events-none" />
      
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

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1400px] mx-auto px-6 relative z-10"
      >
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-[1px] bg-copper" />
            <span className="text-[11px] font-sans font-black text-copper uppercase tracking-[0.4em]">Real-time Intelligence</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-black text-ink uppercase leading-none tracking-tighter mb-6">
            Presence <span className="text-copper">Scanner</span>
          </h1>
          <p className="text-lg font-sans text-muted max-w-2xl leading-relaxed">
            Identify and deploy available faculty members across the campus network. 
            Real-time synchronization with primary schedule databases.
          </p>
        </motion.div>

        {/* Control Center */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-4 gap-10 mb-20">
          
          {/* Day & Time Selector */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="glass-card p-10 rounded-[2.5rem] border-black/5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex flex-col gap-4 w-full md:w-auto">
                   <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] ml-2">Operational Period</span>
                   <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-black/[0.03] p-2 rounded-2xl">
                     {DAYS.map(day => (
                       <button
                         key={day}
                         onClick={() => setSelectedDay(day)}
                         className={`px-4 py-2 text-[10px] font-black font-sans uppercase tracking-[0.1em] transition-all rounded-xl ${
                           selectedDay === day 
                             ? 'bg-ink text-white shadow-xl' 
                             : 'text-muted hover:text-ink hover:bg-black/5'
                         }`}
                       >
                         {day.substring(0, 3)}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="w-[1px] h-12 bg-black/5 hidden md:block" />

                <div className="flex flex-col items-center gap-4">
                  <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em]">Target Synchronization</span>
                  <button 
                    onClick={detectNow}
                    className="group flex items-center gap-3 px-8 py-4 bg-copper/5 border border-copper/20 rounded-2xl text-[10px] font-black font-sans text-copper uppercase tracking-[0.2em] hover:bg-copper hover:text-white transition-all shadow-sm"
                  >
                    <Clock size={14} className="group-hover:rotate-12 transition-transform" />
                    Sync to System Time
                  </button>
                </div>
              </div>

              <div className="mt-12">
                 <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] block mb-6 ml-2">Temporal Index</span>
                 <div className="flex gap-3 overflow-x-auto custom-scrollbar-light pb-4">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`whitespace-nowrap px-8 py-4 text-[10px] font-black uppercase font-sans tracking-[0.3em] transition-all rounded-2xl border ${
                        selectedSlot === slot 
                          ? 'bg-ink text-white border-ink shadow-lg scale-105' 
                          : 'bg-white text-muted border-black/5 hover:border-copper/40 hover:text-copper hover:bg-copper/5 shadow-sm'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="flex flex-col gap-6">
            <div className="glass-card p-10 rounded-[2.5rem] bg-gradient-to-br from-white to-surface2 border-black/5 flex-1 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.3em] mb-4">Availability Load</span>
              <div className="text-8xl font-display font-black text-ink mb-4">{freeTeachers.length}</div>
              <span className="text-[11px] font-sans font-black text-copper uppercase tracking-[0.4em]">Nodes Detected</span>
            </div>
            <div className="glass-card p-8 rounded-[2rem] border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/5 rounded-xl"><Users size={16} className="text-muted" /></div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-sans font-bold text-muted uppercase tracking-[0.1em]">Staff Coverage</span>
                   <span className="text-lg font-display font-bold text-ink">{((freeTeachers.length / Object.keys(TEACHERS).length) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="w-1.5 h-1.5 bg-copper rounded-full animate-ping shadow-copper" />
            </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        <motion.div variants={itemVariants} className="relative">
          <div className="flex items-center justify-between mb-12 px-4">
            <h3 className="text-2xl font-display font-black text-ink uppercase tracking-tight">Available Personnel</h3>
            <div className="flex items-center gap-4 text-[10px] font-sans font-bold text-muted/40 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-copper shadow-copper" />
              Live Stream Active
            </div>
          </div>

          {freeTeachers.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center glass-card rounded-[3rem] border-dashed border-2 border-black/5 text-center">
               <div className="w-20 h-20 bg-red-500/5 rounded-full flex items-center justify-center mb-6">
                  <Search size={32} className="text-red-500/40" />
               </div>
               <h3 className="text-[12px] font-sans font-black text-red-500 uppercase tracking-[0.5em]">Critical Load: Zero Nodes Available</h3>
            </div>
          ) : (
        {/* Results Grid - Redesigned as Premium Structured List */}
        <motion.div variants={itemVariants} className="relative">
          <div className="flex items-center justify-between mb-12 px-4">
            <h3 className="text-2xl font-display font-black text-ink uppercase tracking-tight">Active Personnel Inventory</h3>
            <div className="flex items-center gap-4 text-[10px] font-sans font-bold text-muted/40 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-copper shadow-copper animate-pulse" />
              Live Stream Active
            </div>
          </div>

          {freeTeachers.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center glass-card rounded-[3rem] border-dashed border-2 border-black/5 text-center">
               <div className="w-20 h-20 bg-red-500/5 rounded-full flex items-center justify-center mb-6">
                  <Search size={32} className="text-red-500/40" />
               </div>
               <h3 className="text-[12px] font-sans font-black text-red-500 uppercase tracking-[0.5em]">Critical Load: Zero Nodes Available</h3>
            </div>
          ) : (
            <div className="flex flex-col gap-px bg-black/5 border border-black/5 rounded-3xl overflow-hidden backdrop-blur-md">
              {/* Table Headers */}
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-6 px-10 py-6 bg-ink/40 border-b border-black/5">
                <span className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em]">Faculty Name</span>
                <span className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em] text-center hidden md:block">Duty Records</span>
                <span className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em] text-center hidden md:block">Status</span>
                <span className="text-[10px] font-sans font-black text-muted uppercase tracking-[0.3em] text-right hidden md:block">Manual Assign</span>
              </div>

              {freeTeachers.map((teacher, idx) => {
                const dutyCount = duties.filter(d => d.teacherId === teacher.id).length;
                
                const cleanName = teacher.name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
                const initial = cleanName.charAt(0).toUpperCase();
                
                return (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => { setActiveTeacher(teacher); setIsModalOpen(true); }}
                    className="group grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-6 px-10 py-8 bg-white/40 hover:bg-white/80 transition-all duration-300 cursor-pointer items-center"
                  >
                    {/* Faculty Name Column */}
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center font-display font-black text-xl shadow-xl group-hover:scale-110 group-hover:bg-copper transition-all duration-500">
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-xl font-display font-black text-ink uppercase tracking-tight leading-none mb-1.5 group-hover:text-copper transition-colors">
                          {teacher.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-ink text-[9px] font-sans font-bold text-muted uppercase tracking-widest border border-black/5 rounded">ID: {teacher.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Duty Records Column */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-3xl font-display font-black text-ink leading-none">{String(dutyCount).padStart(2, '0')}</div>
                      <span className="text-[8px] font-sans font-bold text-muted/60 uppercase tracking-widest mt-1">Duties</span>
                    </div>

                    {/* Status Column */}
                    <div className="flex items-center justify-center">
                      <div className="px-5 py-2 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center gap-3 group-hover:bg-green-500/10 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[10px] font-sans font-black text-green-600 uppercase tracking-[0.2em]">Available</span>
                      </div>
                    </div>

                    {/* Manual Assign Column */}
                    <div className="flex justify-end">
                      <button className="px-10 py-4 border border-ink bg-ink text-white text-[10px] font-sans font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-copper hover:border-copper hover:shadow-[0_10px_20px_rgba(50,95,232,0.2)] transition-all active:scale-95">
                        Assign Now
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}
