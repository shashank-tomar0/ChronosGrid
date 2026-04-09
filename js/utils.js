/* ================================================
   utils.js — Shared Utilities
   ================================================ */

const Utils = (() => {

  // --- DOM Helpers ---
  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'className') el.className = val;
      else if (key === 'innerHTML') el.innerHTML = val;
      else if (key === 'textContent') el.textContent = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else el.setAttribute(key, val);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  }

  // --- LocalStorage Wrapper ---
  const DUTY_KEY = 'timetable_duties';

  function getDuties() {
    try {
      const raw = localStorage.getItem(DUTY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveDuties(duties) {
    localStorage.setItem(DUTY_KEY, JSON.stringify(duties));
  }

  function addDuty(duty) {
    const duties = getDuties();
    duty.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    duty.timestamp = new Date().toISOString();
    duties.push(duty);
    saveDuties(duties);
    return duty;
  }

  function removeDuty(id) {
    let duties = getDuties();
    duties = duties.filter(d => d.id !== id);
    saveDuties(duties);
  }

  function getDutyCount(teacherId) {
    return getDuties().filter(d => d.teacherId === teacherId).length;
  }

  function getDutyCountMap() {
    const duties = getDuties();
    const map = {};
    TimetableData.getTeacherIds().forEach(id => { map[id] = 0; });
    duties.forEach(d => {
      if (map[d.teacherId] !== undefined) map[d.teacherId]++;
    });
    return map;
  }

  function getMaxDutyCount() {
    const map = getDutyCountMap();
    return Math.max(...Object.values(map), 1);
  }

  // --- Toast System ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };

    const toast = createElement('div', {
      className: `toast toast--${type}`,
      innerHTML: `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
      `
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Date Helpers ---
  function getDayName() {
    return TimetableData.getCurrentDay();
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // --- Duty Badge Level ---
  function getDutyLevel(count) {
    if (count <= 2) return 'low';
    if (count <= 5) return 'mid';
    return 'high';
  }

  return {
    $,
    $$,
    createElement,
    getDuties,
    saveDuties,
    addDuty,
    removeDuty,
    getDutyCount,
    getDutyCountMap,
    getMaxDutyCount,
    showToast,
    getDayName,
    formatDate,
    getDutyLevel
  };
})();
