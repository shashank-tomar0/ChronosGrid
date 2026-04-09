/* ================================================
   availability.js — Availability Finder View
   ================================================ */

const AvailabilityView = (() => {

  let selectedDay = TimetableData.getCurrentDay();
  let selectedSlot = TimetableData.TIME_SLOTS[0];

  function render() {
    const freeTeachers = TimetableData.getFreeTeachers(selectedDay, selectedSlot);
    const dutyCountMap = Utils.getDutyCountMap();

    return `
      <div class="view-container" id="availability-view">
        <div class="page-header">
          <h1>🔍 Availability Finder</h1>
          <p>Select a day and time slot to find available teachers for substitute duties</p>
        </div>

        <!-- Day Selector -->
        <div class="card" style="margin-bottom: var(--space-lg);">
          <div class="card-body">
            <div class="filter-label" style="margin-bottom: var(--space-md);">Select Day</div>
            <div class="day-pills">
              ${TimetableData.DAYS.map(day => `
                <button class="day-pill ${day === selectedDay ? 'active' : ''}" 
                        onclick="AvailabilityView.selectDay('${day}')"
                        id="day-pill-${day}">
                  ${day.charAt(0) + day.slice(1, 3).toLowerCase()}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Time Slot Selector -->
        <div class="card" style="margin-bottom: var(--space-xl);">
          <div class="card-body">
            <div class="filter-label" style="margin-bottom: var(--space-md);">Select Time Slot</div>
            <div class="slot-grid">
              ${TimetableData.TIME_SLOTS.map((slot, idx) => `
                <button class="slot-btn ${slot === selectedSlot ? 'active' : ''}" 
                        onclick="AvailabilityView.selectSlot('${slot}')"
                        id="slot-btn-${idx}">
                  ${slot}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="results-panel">
          <div class="results-header">
            <h3 style="font-size: 1rem; font-weight: 700;">
              Available Teachers
            </h3>
            <div class="results-count">
              <strong>${freeTeachers.length}</strong> of ${TimetableData.getTeacherIds().length} teachers free
            </div>
          </div>

          ${freeTeachers.length === 0 ? `
            <div class="card">
              <div class="empty-state">
                <div class="empty-state-icon">😔</div>
                <h3>No Teachers Available</h3>
                <p>All teachers are busy during this slot. Try selecting a different time or day.</p>
              </div>
            </div>
          ` : freeTeachers.map((id, idx) => {
            const teacher = TimetableData.getTeacher(id);
            const dutyCount = dutyCountMap[id] || 0;
            const freeToday = TimetableData.getFreeSlotCount(id, selectedDay);
            const totalFree = TimetableData.getTotalFreeSlots(id);
            const colorIdx = TimetableData.getTeacherIds().indexOf(id);

            return `
              <div class="avail-card" id="avail-card-${id}">
                <div class="avail-card-left">
                  <div class="teacher-avatar" style="background: ${TimetableData.getAvatarColor(colorIdx)};">
                    ${TimetableData.getInitials(id)}
                  </div>
                  <div class="avail-card-info">
                    <h4>${teacher.name}</h4>
                    <p>${teacher.shortDept} · ${freeToday} free slots today · ${totalFree} free/week</p>
                  </div>
                </div>
                <div class="avail-card-meta">
                  <div class="duty-count-badge duty-count-badge--${Utils.getDutyLevel(dutyCount)}">
                    📋 ${dutyCount} duties
                  </div>
                  <button class="btn btn-success btn-sm" 
                          onclick="AvailabilityView.assignDuty('${id}', '${selectedDay}', '${selectedSlot}')"
                          id="assign-btn-${id}">
                    ✚ Assign Duty
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- All Teacher Status for this slot -->
        <div class="card" style="margin-top: var(--space-xl);">
          <div class="card-header">
            <span class="card-title">📋 All Faculty Status — ${selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()} ${selectedSlot}</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="duty-table-wrapper" style="border: none; border-radius: 0;">
              <table class="duty-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Status</th>
                    <th>Subject / Activity</th>
                    <th>Duties Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  ${TimetableData.getTeacherIds().map(id => {
                    const teacher = TimetableData.getTeacher(id);
                    const subj = TimetableData.getSubject(id, selectedDay, selectedSlot);
                    const dutyCount = dutyCountMap[id] || 0;
                    const isFree = !subj;
                    return `
                      <tr>
                        <td>${teacher.name}</td>
                        <td>
                          <span class="badge ${isFree ? 'badge--emerald' : 'badge--amber'}">
                            ${isFree ? '✅ Free' : '🔴 Busy'}
                          </span>
                        </td>
                        <td style="color: var(--text-tertiary); font-size: 0.78rem; max-width: 300px; white-space: normal;">
                          ${subj ? TimetableData.parseSubject(subj).short : '—'}
                        </td>
                        <td>
                          <span class="duty-count-badge duty-count-badge--${Utils.getDutyLevel(dutyCount)}">
                            ${dutyCount}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function selectDay(day) {
    selectedDay = day;
    App.refreshView();
  }

  function selectSlot(slot) {
    selectedSlot = slot;
    App.refreshView();
  }

  function assignDuty(teacherId, day, slot) {
    App.showDutyModal(teacherId, day, slot);
  }

  return { render, selectDay, selectSlot, assignDuty };
})();
