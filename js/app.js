/* ================================================
   app.js — Main Application Controller
   ================================================ */

const App = (() => {
  let currentView = 'dashboard';

  const views = {
    dashboard: { label: 'Dashboard', icon: '📊', module: () => DashboardView },
    availability: { label: 'Find Available', icon: '🔍', module: () => AvailabilityView },
    timetable: { label: 'Timetable', icon: '📅', module: () => TimetableView },
    duties: { label: 'Duty Tracker', icon: '📋', module: () => DutyView }
  };

  function init() {
    renderShell();
    navigateTo('dashboard');
    updateClock();
    setInterval(updateClock, 60000);

    // Responsive sidebar toggle
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', toggleSidebar);
    }
  }

  function renderShell() {
    document.getElementById('app').innerHTML = `
      <div class="app-layout">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand">
            <div class="sidebar-brand-icon">🎓</div>
            <div class="sidebar-brand-text">
              <span class="sidebar-brand-title">ABES Timetable</span>
              <span class="sidebar-brand-subtitle">Management System</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            <div class="sidebar-section-title">Navigation</div>
            ${Object.entries(views).map(([key, view]) => `
              <div class="nav-item ${key === currentView ? 'active' : ''}" 
                   onclick="App.navigateTo('${key}')"
                   id="nav-${key}">
                <span class="nav-item-icon">${view.icon}</span>
                <span>${view.label}</span>
                ${key === 'duties' ? `<span class="nav-item-badge" id="duty-badge">${Utils.getDuties().length}</span>` : ''}
              </div>
            `).join('')}

            <div class="sidebar-section-title" style="margin-top: var(--space-xl);">Information</div>
            <div class="nav-item" style="cursor: default; opacity: 0.6;">
              <span class="nav-item-icon">🏫</span>
              <span>ABES EC, Ghaziabad</span>
            </div>
            <div class="nav-item" style="cursor: default; opacity: 0.6;">
              <span class="nav-item-icon">📆</span>
              <span>Session 2025-26</span>
            </div>
          </nav>

          <div class="sidebar-footer">
            <div>ABES Engineering College</div>
            <div style="margin-top: 2px; font-size: 0.65rem;">Even Semester · w.e.f 27th Jan 2026</div>
          </div>
        </aside>

        <!-- Sidebar overlay for mobile -->
        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <!-- Main -->
        <main class="main-content">
          <header class="topbar">
            <div class="topbar-left">
              <button class="menu-toggle" id="menu-toggle" onclick="App.toggleSidebar()">☰</button>
              <div>
                <div class="topbar-title" id="topbar-title">Dashboard</div>
                <div class="topbar-breadcrumb" id="topbar-breadcrumb">Home / Dashboard</div>
              </div>
            </div>
            <div class="topbar-right">
              <span style="font-size: 0.78rem; color: var(--text-tertiary);" id="clock-display"></span>
              <span class="badge badge--emerald" id="today-badge">${TimetableData.getCurrentDay().charAt(0) + TimetableData.getCurrentDay().slice(1).toLowerCase()}</span>
            </div>
          </header>

          <div class="page-content" id="page-content">
            <!-- Views rendered here -->
          </div>
        </main>
      </div>

      <!-- Toast Container -->
      <div class="toast-container" id="toast-container"></div>

      <!-- Modal Container -->
      <div id="modal-container"></div>
    `;
  }

  function navigateTo(viewKey) {
    currentView = viewKey;
    const view = views[viewKey];
    if (!view) return;

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
    });
    const navItem = document.getElementById(`nav-${viewKey}`);
    if (navItem) navItem.classList.add('active');

    // Update topbar
    const topbarTitle = document.getElementById('topbar-title');
    const topbarBreadcrumb = document.getElementById('topbar-breadcrumb');
    if (topbarTitle) topbarTitle.textContent = view.label;
    if (topbarBreadcrumb) topbarBreadcrumb.textContent = `Home / ${view.label}`;

    // Render view
    refreshView();

    // Update duty badge
    updateDutyBadge();

    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }

  function refreshView() {
    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;

    const view = views[currentView];
    if (!view) return;

    const mod = view.module();
    pageContent.innerHTML = mod.render();

    // Update duty badge
    updateDutyBadge();
  }

  function updateDutyBadge() {
    const badge = document.getElementById('duty-badge');
    if (badge) {
      badge.textContent = Utils.getDuties().length;
    }
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('visible');
  }

  function updateClock() {
    const el = document.getElementById('clock-display');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' · ' + now.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  // --- Duty Assignment Modal ---
  function showDutyModal(teacherId, day, slot) {
    const teacher = TimetableData.getTeacher(teacherId);
    if (!teacher) return;

    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay" id="duty-modal-overlay" onclick="App.closeDutyModal(event)">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">📋 Assign Duty</h3>
            <button class="modal-close" onclick="App.closeDutyModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background: var(--bg-glass); border-radius: var(--radius-md); padding: var(--space-lg); margin-bottom: var(--space-lg); border: 1px solid var(--border-primary);">
              <div style="font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: var(--space-sm);">Assigning duty to</div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${teacher.name}</div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: var(--space-xs);">
                ${day.charAt(0) + day.slice(1).toLowerCase()} · ${slot}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="duty-reason">Reason / Notes</label>
              <textarea class="form-textarea" id="duty-reason" placeholder="e.g., Substitute for Prof. XYZ's class, Exam invigilation, Lab supervision..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="App.closeDutyModal()">Cancel</button>
            <button class="btn btn-success" onclick="App.confirmDuty('${teacherId}', '${day}', '${slot}')" id="confirm-duty-btn">
              ✅ Confirm Assignment
            </button>
          </div>
        </div>
      </div>
    `;

    // Focus textarea
    setTimeout(() => {
      const textarea = document.getElementById('duty-reason');
      if (textarea) textarea.focus();
    }, 100);
  }

  function closeDutyModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const container = document.getElementById('modal-container');
    container.innerHTML = '';
  }

  function confirmDuty(teacherId, day, slot) {
    const reasonEl = document.getElementById('duty-reason');
    const reason = reasonEl ? reasonEl.value.trim() : '';

    const duty = Utils.addDuty({
      teacherId,
      day,
      slot,
      reason
    });

    closeDutyModal();
    Utils.showToast(`Duty assigned to ${TimetableData.getTeacherName(teacherId)}`, 'success');
    refreshView();
  }

  return {
    init,
    navigateTo,
    refreshView,
    toggleSidebar,
    showDutyModal,
    closeDutyModal,
    confirmDuty
  };
})();

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
