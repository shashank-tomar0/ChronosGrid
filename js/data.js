/* ================================================
   data.js — Timetable Data Module
   ================================================ */

const TimetableData = (() => {
  // Time slots matching the Excel structure
  const TIME_SLOTS = [
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

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const SHORT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  // Parsed from "Individual TT Format.xlsx"
  // Names are placeholders — will be replaced with real names for the MVP presentation
  const TEACHERS = {
    'ABC': {
      name: 'Mr. ABC',
      department: 'Computer Science and Engineering',
      shortDept: 'CSE',
      lectures: 10,
      tutorials: 6,
      practicals: 4,
      schedule: {
        MONDAY: {
          '08:50-09:40': 'BCS 403/CSE-27 {ABC}/KC-305',
          '12:20-01:10': 'BCS 403/CSE-21 {ABC}/KC-301',
          '02:00-02:50': 'BCS 403/CSE-21 {ABC}/KC-301',
          '03:40-04:30': 'DSA TRAINING/ CSE24/KC 210 {ABC, KLM}'
        },
        TUESDAY: {
          '09:40-10:30': 'BCS 403/CSE-27 {ABC}/KC-305',
          '11:30-12:20': 'DSA TRAINING/ CSE24/KC 210 {ABC, KLM}',
          '02:50-03:40': 'BCS 403/CSE-27 {ABC}/KC-305',
          '03:40-04:30': 'DSA TRAINING/ CSE21/KC 207 {ABC, MNO}'
        },
        WEDNESDAY: {
          '08:50-09:40': 'BCS 452 {ABC,SP}/CSE-27/KC-305',
          '12:20-01:10': 'BCS 403/CSE-21 {ABC}/KC-301',
          '02:50-03:40': 'BCS 452 {ABC,RA}/CSE-21/KC-301'
        },
        THURSDAY: {
          '02:00-02:50': 'BCS 403/CSE-27 {ABC}/KC-305',
          '03:40-04:30': 'BCS 403/CSE-21 {ABC}/KC-301'
        },
        FRIDAY: {
          '08:50-09:40': 'DSA TRAINING/ CSE21/KC 207 {ABC, MNO}',
          '11:30-12:20': 'BCS 403/CSE-27 {ABC}/KC-305',
          '02:00-02:50': 'BCS 403/CSE-21 {ABC}/KC-301'
        }
      }
    },
    'DEF': {
      name: 'Prof. DEF',
      department: 'Computer Science and Engineering',
      shortDept: 'CSE',
      lectures: 8,
      tutorials: 8,
      practicals: 4,
      schedule: {
        MONDAY: {
          '10:40-11:30': 'DOMAIN TRAINING (Cloud Computing)/2nd Year',
          '02:50-03:40': 'BCS 401 {DEF}/CSE-29/KC-307',
          '03:40-04:30': 'BCS 401 {DEF}/CSE-29/KC-307'
        },
        TUESDAY: {
          '08:50-09:40': 'DSA TRAINING/ CSE22/KC 304 {DEF, VV}',
          '09:40-10:30': 'BCS 401 {DEF}/CSE-26/KC-301',
          '11:30-12:20': 'BCS 401 {DEF}/CSE-26/KC-301',
          '02:50-03:40': 'BCS 451 {DEF,ACH}/CSE-26/KC-301'
        },
        WEDNESDAY: {
          '10:40-11:30': 'DOMAIN TRAINING (Cloud Computing)/3rd Year',
          '02:50-03:40': 'BCS 451 {DEF,NG}/CSE-29/KC-307'
        },
        THURSDAY: {
          '08:50-09:40': 'BCS 401 {DEF}/CSE-26/KC-301',
          '10:40-11:30': 'DOMAIN TRAINING (Cloud Computing)/2nd Year',
          '12:20-01:10': 'BCS 401 {DEF}/CSE-26/KC-301',
          '02:50-03:40': 'DSA TRAINING/ CSE22/KC 304 {DEF, VV}'
        },
        FRIDAY: {
          '08:50-09:40': 'BCS 401 {DEF}/CSE-29/KC-307',
          '02:00-02:50': 'BCS 401 {DEF}/CSE-29/KC-307'
        }
      }
    },
    'HIJ': {
      name: 'Dr. HIJ',
      department: 'Computer Science and Engineering',
      shortDept: 'CSE',
      lectures: 5,
      tutorials: 9,
      practicals: 4,
      schedule: {
        MONDAY: {
          '09:40-10:30': 'FSD/CSE27/KC 304 {HIJ, LS}',
          '12:20-01:10': 'FSD/CSE 24/KC 210 {mno, HIJ}',
          '02:50-03:40': 'FSD/CSE11/KC 101 {HIJ,mno}'
        },
        TUESDAY: {
          '08:50-09:40': 'BCS 403 {HIJ}/CSE-14/KC-105',
          '09:40-10:30': 'BCS 403 {HIJ}/CSE-14/KC-105',
          '02:50-03:40': 'BCS 452/CSE-17 {MAG,HIJ}/KC-202'
        },
        WEDNESDAY: {
          '10:40-11:30': 'BCS 403 {HIJ}/CSE-14/KC-105',
          '12:20-01:10': 'BCS 403 {HIJ}/CSE-14/KC-105',
          '02:50-03:40': 'FSD/CSE27/KC 304 {HIJ, LS}'
        },
        THURSDAY: {
          '08:50-09:40': 'BCS 452 {HIJ,MAG}/CSE-14/KC-105',
          '02:50-03:40': 'FSD/CSE11/KC 101 {HIJ,mno}'
        },
        FRIDAY: {
          '11:30-12:20': 'FSD/CSE 24/KC 210 {mno, HIJ}',
          '03:40-04:30': 'BCS 403 {HIJ}/CSE-14/KC-105'
        }
      }
    },
    'KLM': {
      name: 'Ms. KLM',
      department: 'Computer Science and Engineering',
      shortDept: 'CSE',
      lectures: 11,
      tutorials: 6,
      practicals: 2,
      schedule: {
        MONDAY: {
          '10:40-11:30': 'BCS 061/CSE-C {klm}/KC-402',
          '12:20-01:10': 'FSD/CSE12/KC 102 {klm, SWT}',
          '02:00-02:50': 'BCS 402/CSE-19 {klm}/KC-205'
        },
        TUESDAY: {
          '08:50-09:40': 'BCS 452 {klm,ATD}/CSE-19/KC-205',
          '11:30-12:20': 'FSD/CSE12/KC 102 {klm, SWT}',
          '03:40-04:30': 'BCS 402/CSE-19 {klm}/KC-205'
        },
        WEDNESDAY: {
          '08:50-09:40': 'BCS 061/CSE-D {klm}/KC-404',
          '09:40-10:30': 'BCS 061/CSE-C {klm}/KC-402',
          '12:20-01:10': 'BCS 402/CSE-19 {klm}/KC-205',
          '02:00-02:50': 'BCS 061/CSE-D {klm}/KC-404',
          '02:50-03:40': 'FSD/CSE13/KC 104 {SWT, klm}'
        },
        THURSDAY: {
          '02:50-03:40': 'BCS 402/CSE-19 {klm}/KC-205'
        },
        FRIDAY: {
          '10:40-11:30': 'BCS 061/CSE-C {klm}/KC-402',
          '11:30-12:20': 'BCS 402/CSE-19 {klm}/KC-205',
          '02:00-02:50': 'BCS 061/CSE-D {klm}/KC-404',
          '03:40-04:30': 'FSD/CSE13/KC 104 {klm, SWT}'
        }
      }
    }
  };

  // Color palette for teacher avatars
  const AVATAR_COLORS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #f43f5e, #fb7185)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'linear-gradient(135deg, #8b5cf6, #c084fc)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #14b8a6, #5eead4)'
  ];

  // Public API
  return {
    TIME_SLOTS,
    DAYS,
    SHORT_DAYS,
    TEACHERS,
    AVATAR_COLORS,

    getTeacherIds() {
      return Object.keys(TEACHERS);
    },

    getTeacher(id) {
      return TEACHERS[id] || null;
    },

    getTeacherName(id) {
      return TEACHERS[id]?.name || id;
    },

    getAvatarColor(index) {
      return AVATAR_COLORS[index % AVATAR_COLORS.length];
    },

    getInitials(id) {
      return id.toUpperCase().substring(0, 2);
    },

    getSchedule(teacherId, day) {
      return TEACHERS[teacherId]?.schedule[day] || {};
    },

    isBusy(teacherId, day, slot) {
      return !!TEACHERS[teacherId]?.schedule[day]?.[slot];
    },

    isFree(teacherId, day, slot) {
      return !this.isBusy(teacherId, day, slot);
    },

    getSubject(teacherId, day, slot) {
      return TEACHERS[teacherId]?.schedule[day]?.[slot] || null;
    },

    /**
     * Get all teachers free during a specific day + slot
     */
    getFreeTeachers(day, slot) {
      return this.getTeacherIds().filter(id => this.isFree(id, day, slot));
    },

    /**
     * Get count of free slots for a teacher on a given day
     */
    getFreeSlotCount(teacherId, day) {
      const schedule = this.getSchedule(teacherId, day);
      return TIME_SLOTS.length - Object.keys(schedule).length;
    },

    /**
     * Get total classes for a teacher in the whole week
     */
    getTotalClasses(teacherId) {
      let count = 0;
      DAYS.forEach(day => {
        count += Object.keys(this.getSchedule(teacherId, day)).length;
      });
      return count;
    },

    /**
     * Get total free periods for a teacher in the whole week
     */
    getTotalFreeSlots(teacherId) {
      return (TIME_SLOTS.length * DAYS.length) - this.getTotalClasses(teacherId);
    },

    /**
     * Get current day name (or default to MONDAY for weekends)
     */
    getCurrentDay() {
      const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon
      if (dayIndex === 0 || dayIndex === 6) return 'MONDAY';
      return DAYS[dayIndex - 1];
    },

    /**
     * Get current time slot index (or default to 0)
     */
    getCurrentSlotIndex() {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes();
      const currentMins = hours * 60 + mins;

      const slotTimes = [
        { start: 8 * 60 + 50, end: 9 * 60 + 40 },
        { start: 9 * 60 + 40, end: 10 * 60 + 30 },
        { start: 10 * 60 + 40, end: 11 * 60 + 30 },
        { start: 11 * 60 + 30, end: 12 * 60 + 20 },
        { start: 12 * 60 + 20, end: 13 * 60 + 10 },
        { start: 13 * 60 + 10, end: 14 * 60 + 0 },
        { start: 14 * 60 + 0, end: 14 * 60 + 50 },
        { start: 14 * 60 + 50, end: 15 * 60 + 40 },
        { start: 15 * 60 + 40, end: 16 * 60 + 30 }
      ];

      for (let i = 0; i < slotTimes.length; i++) {
        if (currentMins >= slotTimes[i].start && currentMins < slotTimes[i].end) {
          return i;
        }
      }
      return 0;
    },

    /**
     * Get short time label for display
     */
    getShortTime(slot) {
      const parts = slot.split('-');
      return parts[0].trim();
    },

    /**
     * Parse subject string to extract components
     */
    parseSubject(subjectStr) {
      if (!subjectStr) return null;
      // Try to extract code, section, room
      const clean = subjectStr.replace(/\n/g, ' ').trim();
      return {
        full: clean,
        short: clean.length > 30 ? clean.substring(0, 27) + '...' : clean
      };
    }
  };
})();
