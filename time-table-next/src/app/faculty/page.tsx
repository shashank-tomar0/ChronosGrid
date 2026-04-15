"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { TEACHERS, getTeachersWithOverrides, TIME_SLOTS, DAYS, Day, TimeSlot, parseSubject, getTotalFreeSlots, Teacher } from "@/lib/data";
import { useDuties, getMonday, getWeekKey, getDateForDay } from "@/hooks/useDuties";
import { DutyModal } from "@/components/DutyModal";
import { ChevronLeft, ChevronRight, CalendarDays, Trash2, XCircle } from "lucide-react";

function FacultyPageContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  
  const { duties, assignDuty, removeDuty, getDutiesForWeek, clearAllDuties, clearWeekDuties } = useDuties();
  
  // Use dynamic teachers list to support manual overrides
  const [teachers, setTeachers] = useState<Record<string, Teacher>>(TEACHERS);
  
  useEffect(() => {
    setMounted(true);
    setTeachers(getTeachersWithOverrides());
  }, []);

  const teacherIds = Object.keys(teachers).sort((a, b) => 
    teachers[a].name.localeCompare(teachers[b].name)
  );
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    idParam && teachers[idParam] ? idParam : teacherIds[0]
  );

  // Week navigation state
  const [currentMonday, setCurrentMonday] = useState<Date>(getMonday(new Date()));
  const currentWeekKey = getWeekKey(currentMonday);
  const weekDuties = getDutiesForWeek(currentWeekKey);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: Day; slot: TimeSlot } | null>(null);
  
  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<'week' | 'all' | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (idParam && teachers[idParam]) {
      setSelectedTeacherId(idParam);
    }
  }, [idParam, teachers]);

  if (!mounted) return null;

  const teacher = teachers[selectedTeacherId];
  const teacherWeekDuties = weekDuties.filter(d => d.teacherId === selectedTeacherId);
  const teacherAllDuties = duties
    .filter(d => d.teacherId === selectedTeacherId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Week navigation
  const todayMonday = getMonday(new Date());
  const isCurrentWeek = currentMonday.getTime() === todayMonday.getTime();
  
  const goToPrevWeek = () => { const d = new Date(currentMonday); d.setDate(d.getDate() - 7); setCurrentMonday(d); };
  const goToNextWeek = () => { const d = new Date(currentMonday); d.setDate(d.getDate() + 7); setCurrentMonday(d); };
  const goToThisWeek = () => setCurrentMonday(todayMonday);

  // Format week label
  const weekEnd = new Date(currentMonday);
  weekEnd.setDate(weekEnd.getDate() + 4);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekLabel = `${fmt(currentMonday)} — ${fmt(weekEnd)}, ${currentMonday.getFullYear()}`;

  const getDayDate = (day: Day) => {
    const d = new Date(getDateForDay(currentMonday, day));
    return d.toLocaleDateString('en-US', { day: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  const handleCellClick = (day: Day, slot: TimeSlot) => {
    const subj = teacher.schedule[day]?.[slot];
    if (subj) return; // Can't click busy cells
    
    const duty = teacherWeekDuties.find(d => d.day === day && d.slot === slot);
    if (duty) {
      // Toggle confirm delete for this duty
      setConfirmDeleteId(confirmDeleteId === duty.id ? null : duty.id);
      return;
    }
    
    // Free slot -> open assign modal
    setActiveCell({ day, slot });
    setIsModalOpen(true);
  };

  const handleModalConfirm = (reason: string) => {
    if (activeCell) {
      assignDuty(teacher.id, activeCell.day, activeCell.slot, reason, currentMonday);
    }
  };

  const handleClearConfirm = () => {
    if (showClearConfirm === 'week') clearWeekDuties(currentWeekKey);
    if (showClearConfirm === 'all') clearAllDuties();
    setShowClearConfirm(null);
  };

  return (
    <main className="min-h-screen pt-24 pb-32">
      <DutyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        teacher={teacher}
        day={activeCell?.day || "MONDAY"}
        slot={activeCell?.slot || TIME_SLOTS[0]}
      />

      {/* Clear Confirmation Overlay */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-ink/90 backdrop-blur-xl" onClick={() => setShowClearConfirm(null)} />
          <div className="relative bg-surface border border-grid p-12 max-w-md w-full shadow-massive">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-500/30 to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <XCircle size={20} className="text-red-400" />
              <span className="text-[10px] font-sans text-red-400 uppercase tracking-[0.4em]">Destructive Action</span>
            </div>
            <h3 className="text-3xl font-display uppercase tracking-tight text-cream mb-4">
              {showClearConfirm === 'all' ? 'Clear All Duties' : 'Clear This Week'}
            </h3>
            <p className="text-sm font-sans text-muted mb-8">
              {showClearConfirm === 'all' 
                ? 'This will permanently remove all duty assignments across all weeks. This cannot be undone.'
                : `This will remove all duty assignments for the week of ${weekLabel}. This cannot be undone.`
              }
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleClearConfirm}
                className="flex-[2] bg-red-500 hover:bg-red-600 transition-all text-white uppercase tracking-[0.3em] font-sans font-black text-[11px] py-5"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowClearConfirm(null)}
                className="flex-1 border border-grid hover:border-muted transition-all text-muted hover:text-cream uppercase tracking-[0.3em] font-sans text-[11px] py-5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-12"
      >
        {/* Left Column: Faculty Selector & Stats */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <motion.div variants={itemVariants} className="bg-surface/50 backdrop-blur-xl p-6 rounded-xl border border-grid shadow-cyan relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-copper to-magenta" />
            <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-copper to-copper-dim uppercase leading-none tracking-tight mb-3">
              Faculty Timetable
            </h1>
            <p className="text-muted font-sans font-bold uppercase tracking-[0.2em] text-[10px] leading-relaxed">
              View and manage individual faculty schedules and duty assignments.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid bg-surface/50 backdrop-blur-xl rounded-xl overflow-hidden shadow-cyan flex flex-col max-h-[800px] relative">
            <div className="p-5 border-b border-grid bg-surface/80 text-[10px] text-muted font-sans font-bold uppercase tracking-[0.2em] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-magenta to-transparent" />
              Faculty List
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar bg-surface/30 px-3 py-4 gap-2">
              {teacherIds.map(id => {
                const isActive = id === selectedTeacherId;
                const t = teachers[id];
                const dutyCount = weekDuties.filter(d => d.teacherId === id).length;
                
                const cleanName = t.name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
                const initial = cleanName.charAt(0).toUpperCase();

                return (
                  <button
                    key={id}
                    onClick={() => { setSelectedTeacherId(id); setConfirmDeleteId(null); }}
                    className={`text-left p-4 rounded-xl transition-all duration-300 relative group flex items-center gap-4 ${
                      isActive 
                        ? 'bg-ink text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-copper/30' 
                        : 'hover:bg-white/5 text-cream border border-transparent'
                    }`}
                  >
                    {/* Avatar Pin */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-xs transition-all duration-300 ${
                      isActive ? 'bg-copper text-white shadow-[0_0_15px_rgba(50,95,232,0.5)]' : 'bg-surface2 text-muted group-hover:bg-ink group-hover:text-copper'
                    }`}>
                      {initial}
                    </div>

                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className={`font-display uppercase tracking-tight text-[11px] font-black truncate ${isActive ? 'text-copper' : 'group-hover:text-copper transition-colors'}`}>
                        {t.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[8px] font-sans font-black tracking-[0.1em] uppercase ${isActive ? 'text-white/40' : 'text-muted/60'}`}>
                          {t.id}
                        </span>
                        {dutyCount > 0 && (
                          <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span className="w-1 h-1 rounded-full bg-magenta animate-pulse shadow-[0_0_5px_rgba(226,31,135,0.8)]" />
                            <span className="text-[8px] font-sans font-black text-magenta uppercase">{dutyCount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-copper shadow-copper animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid p-6 bg-surface/50 backdrop-blur-xl rounded-xl shadow-cyan relative">
            <h3 className="font-display font-black uppercase tracking-tight text-lg mb-5 text-copper flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-copper rounded-sm" /> Faculty Stats
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end border-b border-grid/80 pb-2 hover:bg-surface2/30 px-2 transition-colors">
                <span className="text-[10px] font-bold font-sans uppercase text-muted tracking-[0.2em]">Lectures</span>
                <span className="text-lg font-display font-bold text-cream">{teacher.lectures}</span>
              </div>
              <div className="flex justify-between items-end border-b border-grid/80 pb-2 hover:bg-surface2/30 px-2 transition-colors">
                <span className="text-[10px] font-bold font-sans uppercase text-muted tracking-[0.2em]">Tutorials</span>
                <span className="text-lg font-display font-bold text-cream">{teacher.tutorials}</span>
              </div>
              <div className="flex justify-between items-end border-b border-grid/80 pb-2 hover:bg-surface2/30 px-2 transition-colors">
                <span className="text-[10px] font-bold font-sans uppercase text-muted tracking-[0.2em]">Practicals</span>
                <span className="text-lg font-display font-bold text-cream">{teacher.practicals}</span>
              </div>
              <div className="flex justify-between items-end border-b border-grid/80 pb-2 hover:bg-surface2/30 px-2 transition-colors">
                <span className="text-[10px] font-bold font-sans uppercase text-muted tracking-[0.2em]">Free Slots</span>
                <span className="text-lg font-display font-black text-copper">{getTotalFreeSlots(teacher.id)}</span>
              </div>
              <div className="flex justify-between items-end pt-1 bg-magenta/5 px-2 rounded mt-2 border border-magenta/10">
                <span className="text-[10px] font-bold font-sans uppercase text-magenta tracking-[0.2em] py-2">Tasks This Week</span>
                <span className="text-lg font-display font-black text-pink-400 drop-shadow-[0_0_5px_rgba(226,31,135,0.8)] pb-1">{teacherWeekDuties.length}</span>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants} className="border border-grid p-5 bg-surface/30 rounded-xl relative overflow-hidden group/danger">
            <div className="absolute top-0 right-0 w-full h-1 bg-red-500/20 group-hover/danger:bg-red-500 transition-colors" />
            <h3 className="font-display font-black uppercase tracking-tight text-[10px] mb-3 text-muted flex items-center gap-2">
              <XCircle size={10} className="text-red-500/50" /> System Purge Options
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowClearConfirm('week')}
                disabled={weekDuties.length === 0}
                className="w-full text-left px-4 py-3 rounded-lg border border-grid hover:border-red-500/80 hover:bg-red-500/10 transition-all text-muted hover:text-red-400 text-[10px] font-sans font-bold uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <Trash2 size={12} />
                Clear This Week ({weekDuties.length})
              </button>
              <button
                onClick={() => setShowClearConfirm('all')}
                disabled={duties.length === 0}
                className="w-full text-left px-4 py-3 rounded-lg border border-red-500/30 hover:border-red-500 hover:bg-red-500/20 transition-all text-red-500 hover:text-red-300 text-[10px] font-sans font-bold uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(239,68,68,0.1)]"
              >
                <XCircle size={12} />
                Clear All Duties ({duties.length})
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: The Timetable Matrix */}
        <div className="xl:col-span-9">
          {/* Week Navigation */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-6 border border-grid bg-surface/40 p-4 rounded-2xl shadow-sm">
            <button onClick={goToPrevWeek} className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-xs font-sans uppercase tracking-widest group bg-surface2/50 px-4 py-2 rounded-xl">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Prev
            </button>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-copper" />
                <span className="text-sm font-display uppercase tracking-wider text-cream">{weekLabel}</span>
              </div>
              {isCurrentWeek && (
                <span className="text-[10px] font-sans text-copper uppercase tracking-widest bg-copper/10 border border-copper/20 px-3 py-1 rounded-full">
                  Current Week
                </span>
              )}
              {!isCurrentWeek && (
                <button onClick={goToThisWeek} className="text-[10px] font-sans text-copper uppercase tracking-widest border border-copper/30 px-3 py-1 rounded-full hover:bg-copper hover:text-white transition-all shadow-sm">
                  Today
                </button>
              )}
            </div>
            <button onClick={goToNextWeek} className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-xs font-sans uppercase tracking-widest group bg-surface2/50 px-4 py-2 rounded-xl">
              Next
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid bg-surface/30 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden" key={`${selectedTeacherId}-${currentWeekKey}`}>
            <div className="p-5 border-b border-grid flex flex-col md:flex-row justify-between items-start md:items-end bg-surface/50 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-copper opacity-5 blur-[50px] pointer-events-none" />
              <div>
                <h2 className="text-2xl font-display font-black uppercase tracking-tight text-cream flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-gradient-to-b from-copper to-magenta" /> {teacher.name}
                </h2>
                <div className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.3em] mt-1 ml-4">{teacher.department}</div>
              </div>
              <div className="hidden md:flex gap-6 mt-4 md:mt-0 text-[9px] font-sans font-bold uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-surface2/60 border border-grid shadow-inner flex items-center justify-center"><span className="w-1 h-1 bg-muted/30 rounded-sm" /></span> Scheduled</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm border border-dashed border-grid/50" /> Free</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-copper/40 to-magenta/20 border border-copper/50 shadow-[0_0_5px_rgba(50,95,232,0.4)]" /> Assigned</span>
              </div>
            </div>

            <div className="overflow-x-auto relative custom-scrollbar">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '120px' }} />
                  {DAYS.map(day => (
                    <col key={day} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-grid bg-surface/90 backdrop-blur-md sticky top-0 z-20">
                    <th className="p-3 border-r border-grid font-sans text-[9px] font-bold uppercase text-muted tracking-[0.2em] bg-ink text-center">Time</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 border-r border-grid last:border-r-0 font-sans text-center bg-ink">
                        <div className="font-display text-sm uppercase tracking-tight text-cream font-bold">{day.substring(0, 3)}</div>
                        <div className="text-[9px] font-sans text-muted/50 mt-0.5">{getDayDate(day)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map(slot => (
                    <tr key={slot} className="border-b border-grid last:border-0 group">
                      <td className="p-2 border-r border-grid bg-surface/30 group-hover:bg-surface/60 transition-colors sticky left-0 z-10 text-center bg-ink">
                        <span className="font-mono text-xs text-muted font-semibold">{slot}</span>
                      </td>
                      
                      {DAYS.map(day => {
                        const subj = teacher.schedule[day]?.[slot];
                        const duty = teacherWeekDuties.find(d => d.day === day && d.slot === slot);
                        const isConfirmingDelete = duty && confirmDeleteId === duty.id;
                        
                        // Scenario 1: Busy with regular class
                        if (subj) {
                          const parsed = parseSubject(subj);
                          return (
                            <td key={day} className="p-1.5 border-r border-grid last:border-0 text-center cursor-help">
                              <div className="bg-surface2/50 border border-grid rounded h-full p-1.5 flex flex-col items-center justify-center min-h-[3rem] shadow-inner" title={parsed?.full}>
                                <div className="text-[7px] font-sans font-bold text-muted/40 uppercase tracking-[0.15em] pb-0.5 mb-0.5 w-full flex justify-center items-center gap-1">
                                  SCHEDULED
                                </div>
                                <div className="text-[9px] font-sans font-bold text-cream/80 leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>{parsed?.short}</div>
                              </div>
                            </td>
                          );
                        }

                        // Scenario 2: Duty Assigned
                        if (duty) {
                          return (
                            <td 
                              key={day} 
                              onClick={() => handleCellClick(day, slot)} 
                              className="p-1.5 border-r border-grid last:border-0 cursor-pointer text-center relative group/cell" 
                              title={isConfirmingDelete ? 'Click again to delete' : `${duty.reason} — Click to remove`}
                            >
                              <div className={`rounded h-full p-1.5 flex flex-col items-center justify-center min-h-[3rem] transition-all relative overflow-hidden ${
                                isConfirmingDelete 
                                  ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                                  : 'bg-gradient-to-br from-copper/10 to-magenta/10 hover:from-copper/20 hover:to-magenta/20 border border-copper/30 shadow-[0_0_15px_rgba(50,95,232,0.05)]'
                              }`}>
                                {!isConfirmingDelete && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-copper to-magenta opacity-70" />}
                                {isConfirmingDelete ? (
                                  <>
                                    <div className="text-[8px] font-sans text-red-400 uppercase tracking-widest font-bold">Remove?</div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); removeDuty(duty.id); setConfirmDeleteId(null); }}
                                      className="text-[8px] font-sans text-red-400 uppercase tracking-widest flex items-center gap-1 hover:text-red-300 transition-colors mt-1 bg-red-500/20 px-2 py-0.5 rounded"
                                    >
                                      <Trash2 size={8} /> Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-[8px] font-sans text-copper/80 uppercase tracking-widest font-bold pb-0.5">ASSIGNED</div>
                                    <div className="text-[9px] font-display text-cream leading-tight truncate px-1 max-w-full block">{duty.reason}</div>
                                    {duty.date && <div className="text-[7px] font-sans text-muted mt-0.5">{duty.date}</div>}
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Scenario 3: Free Slot
                        return (
                          <td key={day} onClick={() => handleCellClick(day, slot)} className="p-1.5 border-r border-grid last:border-0 text-center cursor-pointer group/cell relative" title="Click to assign">
                            <div className="border border-dashed border-grid/50 rounded h-full min-h-[3rem] flex flex-col items-center justify-center group-hover/cell:border-copper group-hover/cell:bg-copper/5 transition-all shadow-inner">
                              <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-muted/30 font-sans group-hover/cell:text-copper transition-colors">FREE</span>
                            </div>
                            <div className="absolute inset-0 bg-copper opacity-0 group-hover/cell:opacity-10 transition-opacity blur-[10px] pointer-events-none" />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Duty Log List Style */}
          <motion.div variants={itemVariants} className="mt-12 border border-grid bg-surface/30 backdrop-blur-xl rounded-xl shadow-cyan overflow-hidden relative">
            <div className="p-8 border-b border-grid bg-surface/50 relative overflow-hidden">
               <div className="absolute -left-20 top-0 w-64 h-full bg-copper opacity-10 blur-[80px] pointer-events-none" />
              <h3 className="text-xl font-display font-black uppercase tracking-tight text-copper flex items-center gap-3">
                <span className="w-2 h-2 bg-copper shadow-[0_0_10px_rgba(50,95,232,0.8)] animate-pulse rounded-sm" /> 
                Duty Records — {teacher.name}
              </h3>
              <p className="text-[10px] font-sans font-bold text-muted uppercase tracking-[0.2em] mt-2 ml-5">All assigned duties for this faculty member</p>
            </div>
            <div className="flex flex-col">
              {teacherAllDuties.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                   <div className="font-display font-black text-5xl text-muted/10 uppercase mb-4 tracking-tighter">Null</div>
                   <div className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-muted/60 border border-grid px-4 py-2 rounded shadow-inner">No records found</div>
                </div>
              ) : (
                teacherAllDuties.map((duty, idx) => (
                  <div key={duty.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 border-b border-grid last:border-0 hover:bg-surface2/60 transition-colors gap-6 group relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-grid group-hover:bg-copper transition-colors" />
                    <div className="flex items-center gap-5 pl-2">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-surface border border-grid text-muted font-display font-black text-xl group-hover:border-copper group-hover:text-copper transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                        {duty.day.substring(0, 3)}
                      </div>
                      <div>
                        <div className="text-cream font-display font-bold uppercase tracking-tight text-xl group-hover:text-copper transition-colors">{duty.reason}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] bg-surface px-2 py-1 rounded text-muted border border-grid shadow-inner">
                            {new Date(duty.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-copper/40">•</span>
                          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-muted">
                            SLOT: {duty.slot}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDuty(duty.id)}
                      className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-magenta hover:text-white flex items-center justify-center gap-2 border border-magenta/30 w-full md:w-auto px-6 py-4 rounded-lg hover:bg-magenta hover:shadow-[0_0_15px_rgba(226,31,135,0.5)] transition-all shrink-0 group/del"
                    >
                      <Trash2 size={12} className="group-hover/del:animate-bounce" /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

export default function FacultyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-copper font-display font-black text-2xl animate-pulse tracking-widest uppercase">
          Loading...
        </div>
      </div>
    }>
      <FacultyPageContent />
    </Suspense>
  );
}
