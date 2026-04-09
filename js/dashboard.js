/* ================================================
   dashboard.js — Dashboard View
   ================================================ */

const DashboardView = (() => {

  function render() {
    const currentDay = TimetableData.getCurrentDay();
    const teacherIds = TimetableData.getTeacherIds();
    const dutyCountMap = Utils.getDutyCountMap();
    const totalDuties = Object.values(dutyCountMap).reduce((a, b) => a + b, 0);

    // Count free teachers right now
    const currentSlotIndex = TimetableData.getCurrentSlotIndex();
    const currentSlot = TimetableData.TIME_SLOTS[currentSlotIndex];
    const freeNow = TimetableData.getFreeTeachers(currentDay, currentSlot).length;

    // Total free slots today across all teachers
    let totalFreeToday = 0;
    teacherIds.forEach(id => {
      totalFreeToday += TimetableData.getFreeSlotCount(id, currentDay);
    });

    return `
      <div class="view-container" id="dashboard-view">
        <div class="page-header">
          <h1>📊 Dashboard</h1>
          <p>Overview of today's timetable and teacher availability — ${currentDay.charAt(0) + currentDay.slice(1).toLowerCase()}</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card stat-card--indigo">
            <div class="stat-icon stat-icon--indigo">👨‍🏫</div>
            <div class="stat-info">
              <div class="stat-label">Total Faculty</div>
              <div class="stat-value">${teacherIds.length}</div>
              <div class="stat-change">CSE Department</div>
            </div>
          </div>
          <div class="stat-card stat-card--emerald">
            <div class="stat-icon stat-icon--emerald">✅</div>
            <div class="stat-info">
              <div class="stat-label">Free Right Now</div>
              <div class="stat-value">${freeNow}</div>
              <div class="stat-change">Slot: ${currentSlot}</div>
            </div>
          </div>
          <div class="stat-card stat-card--amber">
            <div class="stat-icon stat-icon--amber">📋</div>
            <div class="stat-info">
              <div class="stat-label">Free Slots Today</div>
              <div class="stat-value">${totalFreeToday}</div>
              <div class="stat-change">Across all faculty</div>
            </div>
          </div>
          <div class="stat-card stat-card--rose">
            <div class="stat-icon stat-icon--rose">🔄</div>
            <div class="stat-info">
              <div class="stat-label">Duties Assigned</div>
              <div class="stat-value">${totalDuties}</div>
              <div class="stat-change">All time total</div>
            </div>
          </div>
        </div>

        <!-- Today's Schedule Overview -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <span class="card-title">📅 Today's Schedule — ${currentDay.charAt(0) + currentDay.slice(1).toLowerCase()}</span>
            <span class="badge badge--indigo">${teacherIds.length} Faculty</span>
          </div>
          <div class="card-body" style="padding: var(--space-md); overflow-x: auto;">
            <div class="today-schedule-grid" style="grid-template-columns: 100px repeat(${TimetableData.TIME_SLOTS.length}, minmax(90px, 1fr));">
              <!-- Header row -->
              <div class="today-grid-header">Faculty</div>
              ${TimetableData.TIME_SLOTS.map(slot =>
                `<div class="today-grid-header">${TimetableData.getShortTime(slot)}</div>`
              ).join('')}
              
              <!-- Teacher rows -->
              ${teacherIds.map(id => {
                const teacher = TimetableData.getTeacher(id);
                return `
                  <div class="today-grid-name">${id}</div>
                  ${TimetableData.TIME_SLOTS.map(slot => {
                    const subj = TimetableData.getSubject(id, currentDay, slot);
                    if (subj) {
                      const parsed = TimetableData.parseSubject(subj);
                      return `<div class="today-grid-busy" title="${parsed.full}">${parsed.short}</div>`;
                    }
                    return `<div class="today-grid-free">Free</div>`;
                  }).join('')}
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Two column: Teacher cards + Duty chart -->
        <div class="two-col">
          <!-- Faculty Summary Cards -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">👨‍🏫 Faculty Summary</span>
            </div>
            <div class="card-body">
              ${teacherIds.map((id, idx) => {
                const t = TimetableData.getTeacher(id);
                const totalClasses = TimetableData.getTotalClasses(id);
                const totalFree = TimetableData.getTotalFreeSlots(id);
                const duties = dutyCountMap[id] || 0;
                return `
                  <div style="display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md) 0; border-bottom: 1px solid var(--border-primary);">
                    <div class="teacher-avatar" style="background: ${TimetableData.getAvatarColor(idx)}; width: 36px; height: 36px; font-size: 0.75rem;">
                      ${TimetableData.getInitials(id)}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 0.88rem;">${t.name}</div>
                      <div style="font-size: 0.72rem; color: var(--text-tertiary);">L:${t.lectures} T:${t.tutorials} P:${t.practicals} | ${totalClasses} classes/week</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-emerald);">${totalFree} free</div>
                      <div class="duty-count-badge duty-count-badge--${Utils.getDutyLevel(duties)}" style="font-size: 0.65rem;">${duties} duties</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Duty Distribution Chart -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">📊 Duty Distribution</span>
            </div>
            <div class="card-body">
              <div class="duty-chart">
                ${teacherIds.map((id, idx) => {
                  const count = dutyCountMap[id] || 0;
                  const max = Utils.getMaxDutyCount();
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  const colors = ['var(--accent-indigo)', 'var(--accent-emerald)', 'var(--accent-amber)', 'var(--accent-rose)', 'var(--accent-cyan)', 'var(--accent-violet)'];
                  return `
                    <div class="duty-bar-row">
                      <div class="duty-bar-label">${id}</div>
                      <div class="duty-bar-track">
                        <div class="duty-bar-fill" style="width: ${Math.max(pct, 8)}%; background: ${colors[idx % colors.length]};">${count}</div>
                      </div>
                      <div class="duty-bar-count">${count}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              ${totalDuties === 0 ? `
                <div class="empty-state" style="padding: var(--space-xl);">
                  <p style="font-size: 0.8rem;">No duties assigned yet. Use the <strong>Availability Finder</strong> to assign duties.</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return { render };
})();
