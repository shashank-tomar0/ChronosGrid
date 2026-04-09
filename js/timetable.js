/* ================================================
   timetable.js — Individual Timetable Viewer
   ================================================ */

const TimetableView = (() => {

  let selectedTeacher = TimetableData.getTeacherIds()[0];

  function render() {
    const teacherIds = TimetableData.getTeacherIds();
    const teacher = TimetableData.getTeacher(selectedTeacher);
    const dutyCount = Utils.getDutyCount(selectedTeacher);
    const totalClasses = TimetableData.getTotalClasses(selectedTeacher);
    const totalFree = TimetableData.getTotalFreeSlots(selectedTeacher);
    const selectedIdx = teacherIds.indexOf(selectedTeacher);

    return `
      <div class="view-container" id="timetable-view">
        <div class="page-header">
          <h1>📅 Timetable Viewer</h1>
          <p>View individual faculty's weekly timetable with slot details</p>
        </div>

        <!-- Teacher Selection -->
        <div class="teacher-select-grid">
          ${teacherIds.map((id, idx) => {
            const t = TimetableData.getTeacher(id);
            return `
              <div class="teacher-select-card ${id === selectedTeacher ? 'active' : ''}" 
                   onclick="TimetableView.selectTeacher('${id}')"
                   id="teacher-select-${id}">
                <div class="teacher-avatar" style="background: ${TimetableData.getAvatarColor(idx)}; width: 36px; height: 36px; font-size: 0.75rem;">
                  ${TimetableData.getInitials(id)}
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">${t.name}</div>
                  <div style="font-size: 0.7rem; color: var(--text-tertiary);">${t.shortDept}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Teacher Info Card -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-body" style="display: flex; align-items: center; gap: var(--space-xl); flex-wrap: wrap;">
            <div class="teacher-avatar" style="background: ${TimetableData.getAvatarColor(selectedIdx)}; width: 56px; height: 56px; font-size: 1.1rem;">
              ${TimetableData.getInitials(selectedTeacher)}
            </div>
            <div style="flex: 1; min-width: 200px;">
              <h3 style="font-size: 1.2rem; font-weight: 700;">${teacher.name}</h3>
              <p style="font-size: 0.82rem; color: var(--text-tertiary);">${teacher.department}</p>
            </div>
            <div class="teacher-card-stats" style="margin: 0; gap: var(--space-lg);">
              <div class="teacher-stat">
                <div class="teacher-stat-value">${teacher.lectures}</div>
                <div class="teacher-stat-label">Lectures</div>
              </div>
              <div class="teacher-stat">
                <div class="teacher-stat-value">${teacher.tutorials}</div>
                <div class="teacher-stat-label">Tutorials</div>
              </div>
              <div class="teacher-stat">
                <div class="teacher-stat-value">${teacher.practicals}</div>
                <div class="teacher-stat-label">Practicals</div>
              </div>
              <div class="teacher-stat">
                <div class="teacher-stat-value" style="color: var(--accent-emerald);">${totalFree}</div>
                <div class="teacher-stat-label">Free Slots</div>
              </div>
              <div class="teacher-stat">
                <div class="teacher-stat-value" style="color: var(--accent-amber);">${dutyCount}</div>
                <div class="teacher-stat-label">Duties</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Timetable Grid -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📊 Weekly Schedule</span>
            <span class="badge badge--emerald">${totalFree} free periods</span>
          </div>
          <div class="card-body" style="padding: var(--space-md); overflow-x: auto;">
            <table class="schedule-grid">
              <thead>
                <tr>
                  <th>Day / Time</th>
                  ${TimetableData.TIME_SLOTS.map(slot => `<th>${slot}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${TimetableData.DAYS.map(day => `
                  <tr>
                    <td class="day-header">${day.substring(0, 3)}</td>
                    ${TimetableData.TIME_SLOTS.map(slot => {
                      const subj = TimetableData.getSubject(selectedTeacher, day, slot);
                      if (subj) {
                        const parsed = TimetableData.parseSubject(subj);
                        return `
                          <td class="cell-busy" title="${parsed.full}">
                            <div class="cell-subject">${parsed.short}</div>
                          </td>
                        `;
                      }
                      // Check if duty assigned
                      const duties = Utils.getDuties();
                      const hasDuty = duties.some(d => d.teacherId === selectedTeacher && d.day === day && d.slot === slot);
                      if (hasDuty) {
                        return `
                          <td class="cell-duty" onclick="TimetableView.clickFreeCell('${selectedTeacher}', '${day}', '${slot}')" title="Duty assigned">
                            <div class="duty-label">📋 Duty</div>
                          </td>
                        `;
                      }
                      return `
                        <td class="cell-free" onclick="TimetableView.clickFreeCell('${selectedTeacher}', '${day}', '${slot}')" title="Click to assign duty">
                          <div class="free-label">Free</div>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Legend -->
        <div style="display: flex; gap: var(--space-xl); margin-top: var(--space-lg); font-size: 0.78rem; color: var(--text-tertiary);">
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <div style="width: 14px; height: 14px; border-radius: 3px; background: rgba(244, 63, 94, 0.15);"></div>
            <span>Busy / Class</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <div style="width: 14px; height: 14px; border-radius: 3px; background: rgba(16, 185, 129, 0.15);"></div>
            <span>Free (click to assign)</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <div style="width: 14px; height: 14px; border-radius: 3px; background: rgba(245, 158, 11, 0.15);"></div>
            <span>Duty Assigned</span>
          </div>
        </div>
      </div>
    `;
  }

  function selectTeacher(id) {
    selectedTeacher = id;
    App.refreshView();
  }

  function clickFreeCell(teacherId, day, slot) {
    App.showDutyModal(teacherId, day, slot);
  }

  return { render, selectTeacher, clickFreeCell };
})();
