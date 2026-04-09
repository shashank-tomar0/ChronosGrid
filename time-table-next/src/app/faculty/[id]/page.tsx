"use client";

import { useParams, useRouter } from "next/navigation";
import { TEACHERS, TIME_SLOTS, DAYS, parseSubject, getLoadStatus, getTotalClasses, Day, TimeSlot, Teacher } from "@/lib/data";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useDuties, getMonday, getWeekKey, getDateForDay } from "@/hooks/useDuties";
import { DutyModal } from "@/components/DutyModal";

export default function FacultyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const teacher = TEACHERS[id];
  const [mounted, setMounted] = useState(false);

  // Week navigation state
  const [currentMonday, setCurrentMonday] = useState<Date>(getMonday(new Date()));
  const currentWeekKey = getWeekKey(currentMonday);

  const { duties, assignDuty, getDutiesForWeek } = useDuties();
  const weekDuties = getDutiesForWeek(currentWeekKey);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<Day>('MONDAY');
  const [modalSlot, setModalSlot] = useState<TimeSlot>(TIME_SLOTS[0]);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(teacher || null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !teacher || !activeTeacher) return null;

  const status = getLoadStatus(id);
  const todayMonday = getMonday(new Date());
  const isCurrentWeek = currentMonday.getTime() === todayMonday.getTime();

  // Week navigation
  const goToPrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const goToThisWeek = () => setCurrentMonday(todayMonday);

  // Format week range for display
  const weekEnd = new Date(currentMonday);
  weekEnd.setDate(weekEnd.getDate() + 4); // Friday
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekLabel = `${formatDate(currentMonday)} — ${formatDate(weekEnd)}, ${currentMonday.getFullYear()}`;

  // Get the calendar date for each day column header
  const getDayDate = (day: Day) => {
    const d = new Date(getDateForDay(currentMonday, day));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to open modal for a specific slot
  const handleSlotClick = (day: Day, slot: TimeSlot, isOccupied: boolean) => {
    if (isOccupied) return;
    setModalDay(day);
    setModalSlot(slot);
    setActiveTeacher(teacher);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-ink text-cream pt-24 pb-32 bg-grid">
      <DutyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(reason) => assignDuty(activeTeacher.id, modalDay, modalSlot, reason, currentMonday)}
        onTeacherChange={(t) => setActiveTeacher(t)}
        teacher={activeTeacher}
        day={modalDay}
        slot={modalSlot}
      />

      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Navigation & Header */}
        <div className="mb-12">
          <button 
            onClick={() => router.push('/faculty')}
            className="flex items-center gap-2 text-muted hover:text-copper transition-colors uppercase text-[10px] font-sans tracking-[0.3em] mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Faculty List
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <h1 className="text-6xl md:text-8xl font-display uppercase tracking-tighter leading-none mb-4">
                {teacher.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-xs font-sans text-muted uppercase tracking-widest">{teacher.department}</span>
                <div className="w-1 h-1 bg-grid rounded-full" />
                <span className="text-xs font-sans text-muted uppercase tracking-widest">ID: {teacher.id}</span>
              </div>
            </div>

            <div className="flex gap-4">
               <div className="bg-surface/40 border border-grid p-4 rounded-sm flex flex-col items-end">
                  <span className="text-[9px] font-sans text-muted uppercase tracking-widest mb-1">Workload Status</span>
                  <span className={`text-xl font-display ${status.color}`}>{status.label}</span>
               </div>
               <div className="bg-surface/40 border border-grid p-4 rounded-sm flex flex-col items-end">
                  <span className="text-[9px] font-sans text-muted uppercase tracking-widest mb-1">Weekly Volume</span>
                  <span className="text-xl font-display text-cream">{getTotalClasses(id)} Classes</span>
               </div>
               <div className="bg-surface/40 border border-grid p-4 rounded-sm flex flex-col items-end">
                  <span className="text-[9px] font-sans text-muted uppercase tracking-widest mb-1">Duties This Week</span>
                  <span className="text-xl font-display text-copper">{weekDuties.filter(d => d.teacherId === id).length}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Week Navigation Bar */}
        <div className="flex items-center justify-between mb-6 border border-grid bg-surface/30 p-4 rounded-sm">
          <button
            onClick={goToPrevWeek}
            className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans uppercase tracking-[0.2em] group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Prev Week
          </button>

          <div className="flex items-center gap-4">
            <CalendarDays size={16} className="text-copper" />
            <div className="text-center">
              <span className="text-sm font-display uppercase tracking-wider text-cream">{weekLabel}</span>
              {isCurrentWeek && (
                <span className="ml-3 text-[8px] font-sans text-copper uppercase tracking-widest bg-copper/10 border border-copper/20 px-2 py-0.5 rounded-full">
                  Current Week
                </span>
              )}
            </div>
            {!isCurrentWeek && (
              <button
                onClick={goToThisWeek}
                className="text-[9px] font-sans text-copper uppercase tracking-widest border border-copper/30 px-3 py-1 rounded-full hover:bg-copper hover:text-white transition-all"
              >
                Jump to Today
              </button>
            )}
          </div>

          <button
            onClick={goToNextWeek}
            className="flex items-center gap-2 text-muted hover:text-copper transition-colors text-[10px] font-sans uppercase tracking-[0.2em] group"
          >
            Next Week
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Weekly Matrix Schedule */}
        <section className="bg-surface/20 border border-grid overflow-hidden rounded-sm">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr]">
            {/* Sidebar with Time Slots */}
            <div className="hidden md:flex flex-col border-r border-grid bg-ink/40">
              <div className="h-20 border-b border-grid flex items-center justify-center">
                 <Clock size={16} className="text-muted/40" />
              </div>
              {TIME_SLOTS.map(slot => (
                <div key={slot} className="h-24 border-b last:border-0 border-grid flex items-center justify-center p-4">
                  <span className="text-[9px] font-sans text-muted uppercase vertical-text tracking-widest rotate-180">
                    {slot}
                  </span>
                </div>
              ))}
            </div>

            {/* Weekly Grid */}
            <div className="flex flex-col overflow-x-auto">
              {/* Day Headers with Dates */}
              <div className="flex border-b border-grid bg-surface/40">
                {DAYS.map(day => (
                  <div key={day} className="flex-1 p-4 text-center border-r last:border-0 border-grid">
                    <span className="text-[11px] font-sans text-cream uppercase tracking-[0.3em] block">{day}</span>
                    <span className="text-[9px] font-sans text-muted/60 uppercase tracking-widest">{getDayDate(day)}</span>
                  </div>
                ))}
              </div>

              {/* Slot Rows */}
              <div className="flex flex-col">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex border-b last:border-0 border-grid group">
                    {DAYS.map(day => {
                      const subject = teacher.schedule[day]?.[slot];
                      const parsed = subject ? parseSubject(subject) : null;
                      const hasDuty = weekDuties.some(d => d.teacherId === id && d.day === day && d.slot === slot);
                      const dutyInfo = weekDuties.find(d => d.teacherId === id && d.day === day && d.slot === slot);
                      const isOccupied = !!subject || hasDuty;
                      
                      return (
                        <div 
                          key={`${day}-${slot}`} 
                          onClick={() => handleSlotClick(day, slot, isOccupied)}
                          className={`flex-1 h-24 p-4 border-r last:border-0 border-grid transition-all ${isOccupied ? 'cursor-default' : 'cursor-pointer hover:bg-surface2/40'} ${
                            subject ? 'bg-ink/60' : hasDuty ? 'bg-copper/10 border-l-2 border-l-copper/50' : 'bg-transparent'
                          }`}
                        >
                          {subject && parsed ? (
                            <div className="flex flex-col h-full justify-between">
                              <span className="text-[10px] font-display text-copper uppercase tracking-wider line-clamp-2 leading-tight">
                                {parsed.short}
                              </span>
                              <span className="text-[8px] font-sans text-muted uppercase tracking-widest truncate">
                                SCHEDULED
                              </span>
                            </div>
                          ) : hasDuty ? (
                            <div className="flex flex-col h-full justify-between">
                               <span className="text-[10px] font-display text-copper uppercase tracking-widest leading-tight">
                                 {dutyInfo?.reason || 'Duty'}
                               </span>
                               <span className="text-[8px] font-sans text-copper uppercase tracking-[0.2em]">
                                 ASSIGNED • {dutyInfo?.date || ''}
                               </span>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full justify-end group/slot">
                              <span className="text-[8px] font-sans text-copper/30 uppercase tracking-widest group-hover/slot:text-copper transition-colors">
                                Free
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
