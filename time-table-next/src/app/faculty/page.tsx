"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { TEACHERS, TIME_SLOTS, DAYS, Day, TimeSlot, parseSubject, getTotalFreeSlots } from "@/lib/data";
import { useDuties, getMonday, getWeekKey, getDateForDay } from "@/hooks/useDuties";
import { DutyModal } from "@/components/DutyModal";
import { ChevronLeft, ChevronRight, CalendarDays, Trash2, XCircle } from "lucide-react";

export default function FacultyPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  
  const { duties, assignDuty, removeDuty, getDutiesForWeek, clearAllDuties, clearWeekDuties } = useDuties();
  const teacherIds = Object.keys(TEACHERS);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(idParam && TEACHERS[idParam] ? idParam : teacherIds[0]);

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
    if (idParam && TEACHERS[idParam]) {
      setSelectedTeacherId(idParam);
    }
  }, [idParam]);

  if (!mounted) return null;

  const teacher = TEACHERS[selectedTeacherId];
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
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
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
        <div className="xl:col-span-3 flex flex-col gap-8">
          <motion.div variants={itemVariants}>
            <h1 className="text-huge font-display text-copper uppercase leading-none tracking-tighter mb-4">
              Schedule
            </h1>
            <p className="text-muted font-sans uppercase tracking-widest text-sm">
              Individual weekly timetables and faculty teaching analysis.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid">
            <div className="p-6 border-b border-grid bg-surface/50 text-xs text-muted font-sans uppercase tracking-widest">
              Teacher List
            </div>
            <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
              {teacherIds.map(id => {
                const isActive = id === selectedTeacherId;
                const t = TEACHERS[id];
                const dutyCount = weekDuties.filter(d => d.teacherId === id).length;
                return (
                  <button
                    key={id}
                    onClick={() => { setSelectedTeacherId(id); setConfirmDeleteId(null); }}
                    className={`text-left p-4 border-b border-grid last:border-0 transition-colors ${
                      isActive ? 'bg-copper text-white' : 'hover:bg-surface2 text-cream'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-display uppercase tracking-wider text-lg">{t.name}</div>
                        <div className={`text-xs font-sans mt-1 ${isActive ? 'text-white/80' : 'text-muted'}`}>{t.shortDept}</div>
                      </div>
                      {dutyCount > 0 && (
                        <span className={`text-[9px] font-sans uppercase tracking-widest px-2 py-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-copper/10 text-copper border border-copper/20'}`}>
                          {dutyCount} {dutyCount === 1 ? 'duty' : 'duties'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid p-6">
            <h3 className="font-display uppercase tracking-wider text-xl mb-6 text-cream">Teaching Load</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end border-b border-grid pb-2">
                <span className="text-xs font-sans uppercase text-muted tracking-widest">Lectures</span>
                <span className="text-xl font-display">{teacher.lectures}</span>
              </div>
              <div className="flex justify-between items-end border-b border-grid pb-2">
                <span className="text-xs font-sans uppercase text-muted tracking-widest">Tutorials</span>
                <span className="text-xl font-display">{teacher.tutorials}</span>
              </div>
              <div className="flex justify-between items-end border-b border-grid pb-2">
                <span className="text-xs font-sans uppercase text-muted tracking-widest">Practicals</span>
                <span className="text-xl font-display">{teacher.practicals}</span>
              </div>
              <div className="flex justify-between items-end border-b border-grid pb-2">
                <span className="text-xs font-sans uppercase text-muted tracking-widest">Free Cells</span>
                <span className="text-xl font-display text-copper">{getTotalFreeSlots(teacher.id)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-sans uppercase text-copper tracking-widest">Duties This Week</span>
                <span className="text-xl font-display text-white italic">{teacherWeekDuties.length}</span>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants} className="border border-grid/40 p-6 bg-surface/20">
            <h3 className="font-display uppercase tracking-wider text-sm mb-4 text-muted">Duty Management</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowClearConfirm('week')}
                disabled={weekDuties.length === 0}
                className="w-full text-left px-4 py-3 border border-grid hover:border-red-500/40 hover:bg-red-500/5 transition-all text-muted hover:text-red-400 text-[10px] font-sans uppercase tracking-widest flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                Clear This Week ({weekDuties.length})
              </button>
              <button
                onClick={() => setShowClearConfirm('all')}
                disabled={duties.length === 0}
                className="w-full text-left px-4 py-3 border border-grid hover:border-red-500/40 hover:bg-red-500/5 transition-all text-muted hover:text-red-400 text-[10px] font-sans uppercase tracking-widest flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <XCircle size={14} />
                Clear All Duties ({duties.length})
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: The Timetable Matrix */}
        <div className="xl:col-span-9">
          {/* Week Navigation */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 border border-grid bg-surface/30 p-4 rounded-sm">
            <button onClick={goToPrevWeek} className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans uppercase tracking-[0.2em] group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Prev
            </button>
            <div className="flex items-center gap-4">
              <CalendarDays size={16} className="text-copper" />
              <span className="text-sm font-display uppercase tracking-wider text-cream">{weekLabel}</span>
              {isCurrentWeek && (
                <span className="text-[8px] font-sans text-copper uppercase tracking-widest bg-copper/10 border border-copper/20 px-2 py-0.5 rounded-full">
                  Current Week
                </span>
              )}
              {!isCurrentWeek && (
                <button onClick={goToThisWeek} className="text-[9px] font-sans text-copper uppercase tracking-widest border border-copper/30 px-3 py-1 rounded-full hover:bg-copper hover:text-white transition-all">
                  Today
                </button>
              )}
            </div>
            <button onClick={goToNextWeek} className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans uppercase tracking-[0.2em] group">
              Next
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="border border-grid" key={`${selectedTeacherId}-${currentWeekKey}`}>
            <div className="p-6 border-b border-grid flex justify-between items-end bg-surface/50">
              <div>
                <h2 className="text-3xl font-display uppercase tracking-wider text-cream">{teacher.name}</h2>
                <div className="text-sm font-sans text-muted uppercase tracking-widest mt-2">{teacher.department}</div>
              </div>
              <div className="hidden md:flex gap-4 text-xs font-sans uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-surface2 border border-white/20 inline-block" /> Busy</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-ink border border-grid inline-block" /> Free</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-copper inline-block" /> Duty</span>
              </div>
            </div>

            <div className="overflow-x-auto relative custom-scrollbar">
              <table className="w-full border-collapse table-fixed min-w-[800px]">
                <thead>
                  <tr className="border-b border-grid bg-surface/90 backdrop-blur-md sticky top-0 z-20">
                    <th className="w-24 p-4 border-r border-grid font-sans text-xs font-normal uppercase text-muted tracking-widest bg-ink text-left">Day</th>
                    {TIME_SLOTS.map(slot => (
                      <th key={slot} className="p-3 border-r border-grid last:border-0 font-sans text-[10px] font-normal uppercase text-muted tracking-widest text-center bg-ink">
                        {slot.replace('-', ' - ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day} className="border-b border-grid last:border-0 group">
                      <td className="w-24 p-4 border-r border-grid bg-surface/30 group-hover:bg-surface/60 transition-colors sticky left-0 z-10 text-center">
                        <span className="font-display text-lg uppercase tracking-wider text-cream block">{day.substring(0, 3)}</span>
                        <span className="text-[9px] font-sans text-muted/50 mt-1 block">{getDayDate(day)}</span>
                      </td>
                      
                      {TIME_SLOTS.map(slot => {
                        const subj = teacher.schedule[day]?.[slot];
                        const duty = teacherWeekDuties.find(d => d.day === day && d.slot === slot);
                        const isConfirmingDelete = duty && confirmDeleteId === duty.id;
                        
                        // Scenario 1: Busy with regular class
                        if (subj) {
                          const parsed = parseSubject(subj);
                          return (
                            <td key={slot} className="p-2 border-r border-grid last:border-0 bg-surface2/50 cursor-not-allowed group-hover:bg-surface2/80 transition-colors" title={parsed?.full}>
                              <div className="text-[9px] font-sans text-muted uppercase tracking-widest border-b border-white/5 pb-1">Class</div>
                              <div className="text-[11px] font-display text-cream leading-snug overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{parsed?.short}</div>
                            </td>
                          );
                        }

                        // Scenario 2: Duty Assigned
                        if (duty) {
                          return (
                            <td 
                              key={slot} 
                              onClick={() => handleCellClick(day, slot)} 
                              className={`p-2 border-r border-grid last:border-0 cursor-pointer transition-all relative overflow-hidden ${
                                isConfirmingDelete ? 'bg-red-500/20 border-l-2 border-l-red-500' : 'bg-copper/15 hover:bg-copper/25 border-l-2 border-l-copper/50'
                              }`} 
                              title={isConfirmingDelete ? 'Click again to delete' : `${duty.reason} — Click to remove`}
                            >
                              {isConfirmingDelete ? (
                                <>
                                  <div className="text-[9px] font-sans text-red-400 uppercase tracking-widest">Remove?</div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); removeDuty(duty.id); setConfirmDeleteId(null); }}
                                    className="text-[10px] font-sans text-red-400 uppercase tracking-widest flex items-center gap-1 hover:text-red-300 transition-colors mt-1"
                                  >
                                    <Trash2 size={10} /> Delete
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                    className="text-[9px] font-sans text-muted uppercase tracking-widest hover:text-cream transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="absolute top-0 right-0 w-2 h-2 bg-copper rounded-bl-sm" />
                                  <div className="text-[10px] font-sans text-copper uppercase tracking-widest border-b border-copper/20 pb-1">Duty</div>
                                  <div className="text-xs font-display text-cream leading-tight truncate">{duty.reason}</div>
                                </>
                              )}
                            </td>
                          );
                        }

                        // Scenario 3: Free Slot
                        return (
                          <td key={slot} onClick={() => handleCellClick(day, slot)} className="p-2 border-r border-grid last:border-0 bg-ink hover:bg-surface2 cursor-pointer transition-colors text-center group-hover:bg-ink/50" title="Click to assign duty">
                            <span className="text-[10px] uppercase tracking-widest text-muted/30 font-sans group-hover:text-muted/60">Free</span>
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
          <motion.div variants={itemVariants} className="mt-8 border border-grid bg-surface">
            <div className="p-6 border-b border-grid">
              <h3 className="text-xl font-display uppercase tracking-wider text-copper">Duty Log — {teacher.name}</h3>
              <p className="text-xs font-sans text-muted uppercase tracking-widest mt-2">Comprehensive list of all assigned duties</p>
            </div>
            <div className="flex flex-col">
              {teacherAllDuties.length === 0 ? (
                <div className="p-8 text-center text-sm font-sans uppercase tracking-widest text-muted/50">No duties assigned</div>
              ) : (
                teacherAllDuties.map(duty => (
                  <div key={duty.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b border-grid last:border-0 hover:bg-surface2/40 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-copper/10 border border-copper/20 text-copper font-display text-lg">
                        {duty.day.substring(0, 3)}
                      </div>
                      <div>
                        <div className="text-cream font-display uppercase tracking-wider text-lg">{duty.reason}</div>
                        <div className="text-[10px] font-sans uppercase tracking-widest text-muted mt-1">
                          {new Date(duty.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {duty.slot}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDuty(duty.id)}
                      className="text-[10px] font-sans uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-2 border border-red-500/20 px-3 py-2 bg-red-500/5 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 size={12} /> Remove
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
