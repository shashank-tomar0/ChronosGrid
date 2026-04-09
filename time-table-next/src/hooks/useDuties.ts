"use client";

import { useState, useEffect } from 'react';
import { Day, TimeSlot } from '@/lib/data';

export interface Duty {
  id: string;
  teacherId: string;
  day: Day;
  slot: TimeSlot;
  reason: string;
  timestamp: string;
  /** ISO date string (YYYY-MM-DD) for the specific date this duty applies to */
  date: string;
  /** ISO week key, e.g. "2026-W15" */
  weekKey: string;
}

const DUTY_KEY = 'timetable_duties_next';

/** Get the Monday of the week containing `d`. */
export function getMonday(d: Date): Date {
  const copy = new Date(d);
  const dayOfWeek = copy.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday => go back 6
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Return an ISO week key like "2026-W15" */
export function getWeekKey(d: Date): string {
  const monday = getMonday(d);
  const yearStart = new Date(monday.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((monday.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${monday.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Get the specific calendar date for a Day within a given week. */
export function getDateForDay(weekMonday: Date, day: Day): string {
  const dayIndex: Record<Day, number> = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
  };
  const target = new Date(weekMonday);
  target.setDate(target.getDate() + dayIndex[day]);
  return target.toISOString().split('T')[0];
}

export function useDuties() {
  const [duties, setDuties] = useState<Duty[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DUTY_KEY);
      if (raw) {
        const parsed: Duty[] = JSON.parse(raw);
        // Migration: add weekKey/date to old duties that don't have them
        const migrated = parsed.map(d => {
          if (!d.weekKey || !d.date) {
            const ts = new Date(d.timestamp);
            return {
              ...d,
              weekKey: d.weekKey || getWeekKey(ts),
              date: d.date || ts.toISOString().split('T')[0],
            };
          }
          return d;
        });
        setDuties(migrated);
      }
    } catch (e) {
      console.error('Failed to load duties from localStorage');
    }
  }, []);

  const saveDuties = (newDuties: Duty[]) => {
    setDuties(newDuties);
    localStorage.setItem(DUTY_KEY, JSON.stringify(newDuties));
  };

  const assignDuty = (teacherId: string, day: Day, slot: TimeSlot, reason: string, weekMonday?: Date) => {
    const monday = weekMonday || getMonday(new Date());
    const date = getDateForDay(monday, day);
    const weekKey = getWeekKey(monday);

    const newDuty: Duty = {
      id: Math.random().toString(36).substring(2, 9),
      teacherId,
      day,
      slot,
      reason,
      timestamp: new Date().toISOString(),
      date,
      weekKey,
    };
    saveDuties([...duties, newDuty]);
  };

  const removeDuty = (id: string) => {
    saveDuties(duties.filter(d => d.id !== id));
  };

  const getDutyCount = (teacherId: string) => {
    return duties.filter(d => d.teacherId === teacherId).length;
  };

  /** Get duties for a specific week */
  const getDutiesForWeek = (weekKey: string) => {
    return duties.filter(d => d.weekKey === weekKey);
  };

  /** Clear all duties */
  const clearAllDuties = () => {
    saveDuties([]);
  };

  /** Clear duties for a specific week */
  const clearWeekDuties = (weekKey: string) => {
    saveDuties(duties.filter(d => d.weekKey !== weekKey));
  };

  return { duties, assignDuty, removeDuty, getDutyCount, getDutiesForWeek, clearAllDuties, clearWeekDuties };
}
