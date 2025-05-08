class SalonistUI {
    constructor(app) {
      this.app = app;
      this.elements = {
        loading: document.querySelector('.salonist-loading'),
        error: document.querySelector('.salonist-error'),
        stepIndicators: document.querySelectorAll('.salonist-step'),
        stepContents: document.querySelectorAll('.salonist-step-content'),
        shopList: document.querySelector('.salonist-shop-list'),
        staffList: document.querySelector('.salonist-staff-list'),
        calendar: document.querySelector('.salonist-calendar'),
        timeSlots: document.querySelector('.salonist-time-slots'),
        summary: document.querySelector('.salonist-summary'),
        prevBtn: document.querySelector('.salonist-prev-btn'),
        nextBtn: document.querySelector('.salonist-next-btn'),
        bookBtn: document.querySelector('.salonist-book-btn')
      };
    }
  
    init() {
      this.elements.nextBtn.addEventListener('click', () => this.app.nextStep());
      this.elements.prevBtn.addEventListener('click', () => this.app.prevStep());
      this.elements.bookBtn.addEventListener('click', () => this.app.bookAppointment());
    }
  
    renderShops(shops) {
      this.elements.shopList.innerHTML = shops.map(shop => `
        <div class="salonist-shop-item" 
             data-shop-id="${shop.Detail.id}"
             data-domain-id="${shop.Domain.id}"
             data-staff-select="${shop.Detail.staff_select.toLowerCase()}">
          <h3>${shop.Detail.name}</h3>
          <p>${shop.Detail.address}</p>
          <p>${shop.Detail.country_code} ${shop.Detail.salon_contact}</p>
        </div>
      `).join('');
    }
  
    renderStaff(staffList) {
      this.elements.staffList.innerHTML = staffList.map(staff => `
        <div class="salonist-staff-item" data-staff-id="${staff.id}">
          <img src="/staff-images/${staff.img || 'default-staff.jpg'}" 
               alt="${staff.name}"
               onerror="this.src='/staff-images/default-staff.jpg'">
          <h4>${staff.name}</h4>
        </div>
      `).join('');
    }
  
    renderCalendar(calendarData) {
      // Implement calendar rendering based on calendarData
      // This would create the calendar grid with available dates
    }
  
    renderTimeSlots(timeSlotsHTML) {
      this.elements.timeSlots.innerHTML = timeSlotsHTML;
      // Add custom styling and event handling
      const slots = this.elements.timeSlots.querySelectorAll('label');
      slots.forEach(slot => {
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
        if (index + 1 === currentStep) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }
  
    toggleButtons(currentStep, totalSteps) {
      this.elements.prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
      this.elements.nextBtn.style.display = currentStep === totalSteps ? 'none' : 'block';
      this.elements.bookBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
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