class Calendar {
  constructor({ selector, weekStart = 0, data, currentDate = new Date() }) {
    this.container = document.querySelector(selector);
    this.weekStart = weekStart;
    this.rawData = data;
    this.days = this.mapDataToDays();
    this.currentDate = currentDate;
    this.selectedDate = null; // To store selected date
  }

  mapDataToDays() {
    const weekMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const result = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      open: false,
      tooltip: "Closed"
    }));

    this.rawData.list.forEach(item => {
      const { days, status, start, end } = item.Businesshours;
      const dayIndex = weekMap[days];
      result[dayIndex] = {
        day: dayIndex,
        open: status === "Open",
        tooltip: status === "Open" ? `Open from ${start} to ${end}` : "Closed"
      };
    });

    return result;
  }

  getOrderedDays() {
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return [...labels.slice(this.weekStart), ...labels.slice(0, this.weekStart)];
  }

  getMonthDates() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Getting the first weekday of the month
    const firstDayWeekday = firstDayOfMonth.getDay();

    const dates = Array.from({ length: totalDaysInMonth }, (_, i) => {
      const day = i + 1;
      const weekday = new Date(year, month, day).getDay();
      const isOpen = this.days[weekday].open;
      const tooltip = isOpen ? `Open` : "Closed";
      return { day, weekday, isOpen, tooltip };
    });

    return { firstDayWeekday, dates };
  }

  handleDateClick(day) {
    if (day.isOpen) {
      this.selectedDate = day.day;
      this.render();
    }
  }

  render() {
    if (!this.container) return console.error('Calendar container not found!');
    const orderedDays = this.getOrderedDays();
    const { firstDayWeekday, dates } = this.getMonthDates();

    const html = `
      <div class="calendar-header">
        ${orderedDays.map(label => `<div class="calendar-header-day">${label}</div>`).join('')}
      </div>
      <div class="calendar-body">
        ${this.renderDates(dates, firstDayWeekday)}
      </div>
    `;

    this.container.innerHTML = html;
  }

  renderDates(dates, firstDayWeekday) {
    let daysHTML = '';
    let emptyCells = firstDayWeekday;

    // Add empty cells before the first day of the month
    for (let i = 0; i < emptyCells; i++) {
      daysHTML += '<div class="calendar-day empty"></div>';
    }

    // Add the actual dates
    dates.forEach(date => {
      const { day, isOpen, tooltip } = date;
      const isSelected = this.selectedDate === day ? 'selected' : '';
      const statusClass = isOpen ? 'open' : 'closed';
      daysHTML += `
        <div class="calendar-day ${statusClass} ${isSelected}" title="${tooltip}" data-day="${day}" onclick="calendar.handleDateClick(${JSON.stringify(date)})">
          <span class="date">${day}</span>
        </div>
      `;
    });

    return daysHTML;
  }
}
