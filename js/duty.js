/* ================================================
   duty.js — Duty Assignment & Tracking View
   ================================================ */

const DutyView = (() => {

  let filterTeacher = 'all';
  let filterDay = 'all';
  let sortBy = 'newest';

  function render() {
    const duties = Utils.getDuties();
    const dutyCountMap = Utils.getDutyCountMap();
    const teacherIds = TimetableData.getTeacherIds();
    const maxCount = Utils.getMaxDutyCount();

    // Filter duties
    let filtered = [...duties];
    if (filterTeacher !== 'all') {
      filtered = filtered.filter(d => d.teacherId === filterTeacher);
    }
    if (filterDay !== 'all') {
      filtered = filtered.filter(d => d.day === filterDay);
    }

    // Sort duties
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'teacher') {
      filtered.sort((a, b) => a.teacherId.localeCompare(b.teacherId));
    }

    return `
      <div class="view-container" id="duty-view">
        <div class="page-header">
          <h1>📋 Duty Tracker</h1>
          <p>Track and manage all duty assignments with fairness monitoring</p>
        </div>

        <!-- Duty Distribution Overview -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-header">
            <span class="card-title">📊 Duty Fairness Overview</span>
            <span class="badge badge--indigo">${duties.length} total assignments</span>
          </div>
          <div class="card-body">
            <div class="duty-chart">
              ${teacherIds.map((id, idx) => {
                const count = dutyCountMap[id] || 0;
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const teacher = TimetableData.getTeacher(id);
                const colors = ['var(--accent-indigo)', 'var(--accent-emerald)', 'var(--accent-amber)', 'var(--accent-rose)', 'var(--accent-cyan)', 'var(--accent-violet)'];
                const level = Utils.getDutyLevel(count);
                return `
                  <div class="duty-bar-row">
                    <div class="duty-bar-label">${teacher.name}</div>
                    <div class="duty-bar-track">
                      <div class="duty-bar-fill" style="width: ${Math.max(pct, 8)}%; background: ${colors[idx % colors.length]};">
                        ${count}
                      </div>
                    </div>
                    <div class="duty-bar-count">
                      <span class="duty-count-badge duty-count-badge--${level}">${count}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ${duties.length === 0 ? `
              <div style="text-align: center; padding: var(--space-lg); color: var(--text-tertiary); font-size: 0.85rem;">
                <p>No duties assigned yet. Go to <strong>Availability Finder</strong> or <strong>Timetable Viewer</strong> to assign duties.</p>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Filter & History -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📜 Assignment History</span>
            <div style="display: flex; gap: var(--space-md); align-items: center;">
              <button class="btn btn-danger btn-sm" onclick="DutyView.clearAll()" id="clear-all-btn" 
                      ${duties.length === 0 ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}>
                🗑️ Clear All
              </button>
            </div>
          </div>
          <div class="card-body" style="padding-bottom: 0;">
            <!-- Filters -->
            <div class="filter-bar" style="margin-bottom: var(--space-lg);">
              <div class="filter-group">
                <label class="filter-label">Filter by Teacher</label>
                <select class="filter-select" onchange="DutyView.setFilterTeacher(this.value)" id="duty-filter-teacher">
                  <option value="all">All Teachers</option>
                  ${teacherIds.map(id => `
                    <option value="${id}" ${filterTeacher === id ? 'selected' : ''}>${TimetableData.getTeacherName(id)}</option>
                  `).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Filter by Day</label>
                <select class="filter-select" onchange="DutyView.setFilterDay(this.value)" id="duty-filter-day">
                  <option value="all">All Days</option>
                  ${TimetableData.DAYS.map(day => `
                    <option value="${day}" ${filterDay === day ? 'selected' : ''}>${day.charAt(0) + day.slice(1).toLowerCase()}</option>
                  `).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Sort By</label>
                <select class="filter-select" onchange="DutyView.setSortBy(this.value)" id="duty-sort">
                  <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
                  <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
                  <option value="teacher" ${sortBy === 'teacher' ? 'selected' : ''}>By Teacher</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Duty Table -->
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <h3>No Assignments Found</h3>
              <p>${duties.length > 0 ? 'No duties match your current filters. Try adjusting them.' : 'Start by assigning duties from the Availability Finder or Timetable Viewer.'}</p>
            </div>
          ` : `
            <div class="duty-table-wrapper" style="border: none; border-top: 1px solid var(--border-primary); border-radius: 0;">
              <table class="duty-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Teacher</th>
                    <th>Day</th>
                    <th>Time Slot</th>
                    <th>Reason</th>
                    <th>Assigned On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map((duty, idx) => {
                    const teacher = TimetableData.getTeacher(duty.teacherId);
                    return `
                      <tr id="duty-row-${duty.id}">
                        <td style="color: var(--text-tertiary);">${idx + 1}</td>
                        <td>${teacher ? teacher.name : duty.teacherId}</td>
                        <td>
                          <span class="badge badge--indigo">${duty.day.charAt(0) + duty.day.slice(1, 3).toLowerCase()}</span>
                        </td>
                        <td>${duty.slot}</td>
                        <td style="color: var(--text-tertiary); max-width: 200px; white-space: normal; font-size: 0.78rem;">
                          ${duty.reason || '—'}
                        </td>
                        <td style="color: var(--text-tertiary); font-size: 0.78rem;">
                          ${Utils.formatDate(duty.timestamp)}
                        </td>
                        <td>
                          <button class="delete-btn" onclick="DutyView.removeDuty('${duty.id}')" title="Remove">
                            ✕
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function setFilterTeacher(val) {
    filterTeacher = val;
    App.refreshView();
  }

  function setFilterDay(val) {
    filterDay = val;
    App.refreshView();
  }

  function setSortBy(val) {
    sortBy = val;
    App.refreshView();
  }

  function removeDuty(id) {
    Utils.removeDuty(id);
    Utils.showToast('Duty assignment removed', 'info');
    App.refreshView();
  }

  function clearAll() {
    if (confirm('Are you sure you want to clear ALL duty assignments? This cannot be undone.')) {
      Utils.saveDuties([]);
      Utils.showToast('All duty assignments cleared', 'info');
      App.refreshView();
    }
  }

  return { render, setFilterTeacher, setFilterDay, setSortBy, removeDuty, clearAll };
})();
