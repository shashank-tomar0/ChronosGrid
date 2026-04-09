import rawData from './timetable_data.json';

const typedRawData = rawData as Record<string, any>;

export type TimeSlot =
  | '08:50-09:40'
  | '09:40-10:30'
  | '10:40-11:30'
  | '11:30-12:20'
  | '12:20-01:10'
  | '01:10-02:00'
  | '02:00-02:50'
  | '02:50-03:40'
  | '03:40-04:30';

export type Day = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export const TIME_SLOTS: TimeSlot[] = [
  '08:50-09:40',
  '09:40-10:30',
  '10:40-11:30',
  '11:30-12:20',
  '12:20-01:10',
  '01:10-02:00',
  '02:00-02:50',
  '02:50-03:40',
  '03:40-04:30'
];

export const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export interface Teacher {
  id: string;
  name: string;
  department: string;
  shortDept: string;
  lectures: number;
  tutorials: number;
  practicals: number;
  schedule: Partial<Record<Day, Partial<Record<TimeSlot, string>>>>;
}

// Map the JSON data to the Teacher interface
export const TEACHERS: Record<string, Teacher> = Object.entries(typedRawData).reduce((acc, [id, data]) => {
  acc[id] = {
    id,
    name: data.name,
    department: data.department,
    shortDept: data.department?.includes('Computer Science') ? 'CSE' : 'DEPT',
    lectures: data.lectures || 0,
    tutorials: data.tutorials || 0,
    practicals: data.practicals || 0,
    schedule: data.schedule as any
  };
  return acc;
}, {} as Record<string, Teacher>);

export function getFreeTeachers(day: Day, slot: TimeSlot): Teacher[] {
  return Object.values(TEACHERS).filter(teacher => !teacher.schedule[day]?.[slot]);
}

export function getTotalClasses(teacherId: string): number {
  const teacher = TEACHERS[teacherId];
  let count = 0;
  Object.values(teacher.schedule).forEach(day => {
    count += Object.keys(day || {}).length;
  });
  return count;
}

export function getTotalFreeSlots(teacherId: string): number {
  return (DAYS.length * TIME_SLOTS.length) - getTotalClasses(teacherId);
}

export function getFreeSlotCountByDay(teacherId: string, day: Day): number {
  const teacher = TEACHERS[teacherId];
  const busy = Object.keys(teacher.schedule[day] || {}).length;
  return TIME_SLOTS.length - busy;
}

export function parseSubject(subjectStr: string): { short: string; full: string } | null {
  if (!subjectStr) return null;
  const parts = subjectStr.split(':');
  return {
    short: parts[0]?.trim() || subjectStr,
    full: parts[1]?.trim() || subjectStr
  };
}

export function getWorkloadScore(teacherId: string): number {
  const t = TEACHERS[teacherId];
  // Simple heuristic: Lectures weight 1, Tutorials 0.8, Practicals 0.5
  return (t.lectures * 1) + (t.tutorials * 0.8) + (t.practicals * 0.5);
}

export function getLoadStatus(teacherId: string): { label: string; color: string } {
  const score = getWorkloadScore(teacherId);
  if (score > 16) return { label: 'HEAVY DUTY', color: 'text-copper' };
  if (score > 12) return { label: 'OPTIMAL', color: 'text-cream' };
  return { label: 'LIGHT', color: 'text-muted' };
}

export function getRecommendedTeachers(day: Day, slot: TimeSlot, currentDuties: any[]): Teacher[] {
  const free = getFreeTeachers(day, slot);
  
  // Filter out those who already have a duty in this slot
  const available = free.filter(teacher => 
    !currentDuties.some(d => d.teacherId === teacher.id && d.day === day && d.slot === slot)
  );

  return available.sort((a, b) => {
    const scoreA = getWorkloadScore(a.id) + (currentDuties.filter(d => d.teacherId === a.id).length * 2);
    const scoreB = getWorkloadScore(b.id) + (currentDuties.filter(d => d.teacherId === b.id).length * 2);
    return scoreA - scoreB;
  }).slice(0, 6);
}
