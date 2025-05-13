class SalonistUI {
  constructor(app) {
    this.app = app;
    this.elements = {
      loading: document.querySelector('.salonist-loading'),
      error: document.querySelector('.salonist-error'),
      stepIndicators: document.querySelectorAll('.salonist-step'),
      stepContents: document.querySelectorAll('.salonist-step-content'),
      branchList: document.querySelector('.salonist-branch-list'),
      staffList: document.querySelector('.salonist-staff-list'),
      calendar: document.querySelector('.salonist-calendar'),
      timeSlots: document.querySelector('.salonist-time-slots'),
      summary: document.querySelector('.salonist-summary'),
      prevBtn: document.querySelector('.salonist-prev-btn'),
      nextBtn: document.querySelector('.salonist-next-btn'),
      bookBtn: document.querySelector('.salonist-book-btn'),
    };
  }

  init() {
    this.elements.nextBtn.addEventListener('click', () => this.app.nextStep());
    this.elements.prevBtn.addEventListener('click', () => this.app.prevStep());
    this.elements.bookBtn.addEventListener('click', () => this.app.bookAppointment());
  }

  renderBranches(branches) {
    this.elements.branchList.innerHTML = branches.map(branch => `
      <div class="salonist-branch-item" 
           data-branch-id="${branch.Detail.id}"
           data-domain-id="${branch.Domain.id}"
           data-staff-select="${branch.Detail.staff_select.toLowerCase()}">
        <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
          <path d="M1.5 5H16.5C16.75 5 17 4.78125 17 4.5V3.375C17 3.15625 16.8438 2.96875 16.6562 2.90625L9.34375 0.09375C9.21875 0.03125 9.09375 0 9 0C8.875 0 8.75 0.03125 8.625 0.09375L1.3125 2.90625C1.125 2.96875 1 3.15625 1 3.375V4.5C1 4.78125 1.21875 5 1.5 5ZM9 1.5625L14.0938 3.5H3.875L9 1.5625ZM17.5 14.5H17V12.5C17 11.9688 16.4688 11.5 15.8438 11.5H15V6H13.5V11.5H11.5V6H10V11.5H8V6H6.5V11.5H4.5V6H3V11.5H2.125C1.5 11.5 1 11.9688 1 12.5V14.5H0.5C0.21875 14.5 0 14.75 0 15V15.5C0 15.7812 0.21875 16 0.5 16H17.5C17.75 16 18 15.7812 18 15.5V15C18 14.75 17.75 14.5 17.5 14.5ZM15.5 14.5H2.5V13H15.5V14.5Z" fill="#159957"></path>
        </svg>
        <h3>${branch.Detail.name}</h3>
      </div>
    `).join('');
  }

  renderStaff(staffList) {
    this.elements.staffList.innerHTML = staffList.map(staff => `
      <div class="salonist-staff-item" data-staff-id="${staff.id}">
        <img src="${staff?.img ? `https://salonist.io/img/user/${staff.img}` : 'https://salonist.io/img/user/no_image.png'}" alt="${staff.name}">
        <h4>${staff.name}</h4>
      </div>
    `).join('');
  }

  renderCalendar(calendarData) {
    const _$ = window._$;
    const calendarEl = this.elements.calendar;
    calendarEl.innerHTML = '<div class="salonist-datepicker"></div>';

    const closedDays = [];
    const businessHours = calendarData?.list || [];

    businessHours.forEach(day => {
      const bh = day.Businesshours;
      if (bh.status.toLowerCase() === 'close') {
        const dayIndex = this.getDayIndex(bh.days);
        if (!closedDays.includes(dayIndex)) closedDays.push(dayIndex);
      }
    });

    const maxAdvanceBooking = parseInt(calendarData.details?.Insdetail?.max_advance_booking || '0');

    _$('<div></div>')
      .datepicker({
        inline:false,
        firstDay: parseInt(calendarData.details?.Insdetail?.weekdays || 0),
        minDate: maxAdvanceBooking,
        showOtherMonths: true,
        dateFormat: 'dd-mm-yy',
        beforeShowDay: (date) => {
          const isClosed = closedDays.includes(date.getDay());
          return [!isClosed];
        },
        onSelect: (dateText) => {
          this.app.state.selected.date = dateText;
          this.app.handleDateSelect(dateText);
          return dateText;
        }
      }).appendTo(calendarEl.querySelector('.salonist-datepicker'));
  }

  getDayIndex(dayName) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  }

  renderTimeSlots(timeSlotsHTML) {
    this.elements.timeSlots.innerHTML = timeSlotsHTML;
    const slots = this.elements.timeSlots.querySelectorAll('label');
    slots.forEach((slot) => {
      slot.classList.add('salonist-time-slot');
      const input = slot.querySelector('input');
      slot.dataset.time = input.dataset.attr;
      input.style.display = 'none';
    });
  }

  renderSummary() {

    const { shop, domain, staff, date, time } = this.app.state.selected;
    this.elements.summary.innerHTML = `
      <h3>Appointment Summary</h3>
      <p><strong>Shop:</strong> ${shop}</p>
      ${staff ? `<p><strong>Staff:</strong> ${staff}</p>` : ''}
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
    `;
  }

  updateStepIndicators(currentStep) {
    this.elements.stepIndicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index + 1 === currentStep);
    });
  }

  toggleButtons(currentStep) {
    this.elements.prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-block';
    this.elements.nextBtn.style.display = currentStep === 3 ? 'none' : 'inline-block';
    this.elements.bookBtn.style.display = currentStep === 3 ? 'inline-block' : 'none';
  }

  showLoading() {
    this.elements.loading.style.display = 'flex';
  }

  hideLoading() {
    this.elements.loading.style.display = 'none';
  }

  showError(message) {
    this.elements.error.textContent = message;
    this.elements.error.style.display = 'block';
    setTimeout(() => {
      this.elements.error.style.display = 'none';
    }, 5000);
  }
}
