class SalonistBookingApp {
  constructor() {
    this.modal = new SalonistModal();
    this.api = new SalonistAPI();
    this.state = new SalonistState();
    this.ui = new SalonistUI(this);
    this.totalSteps = 4;
    this.init();
  }

  init() {
    this.modal.init();
    this.ui.init();
    document.addEventListener('click', (e) => {
      if (e.target.closest('.salonist-branch-item')) {
        this.handleBranchesSelect(e.target.closest('.salonist-branch-item'));
      }
      if (e.target.closest('.salonist-staff-item')) {
        this.handleStaffSelect(e.target.closest('.salonist-staff-item'));
      }
      if (e.target.closest('.salonist-time-slot')) {
        this.handleTimeSelect(e.target.closest('.salonist-time-slot'));
      }
    });
  }

  async loadBranches() {
    this.ui.showLoading();
    try {
      const data = this.state.get();
      const branches = await this.api.fetchBranches(data);

      this.state.setBranches(branches);
      this.ui.renderBranches(branches);
    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async handleBranchesSelect(branchElement) {
    const branchId = branchElement.dataset.branchId;
    const domainId = branchElement.dataset.domainId;
    const staffSelect = branchElement.dataset.staffSelect;
  

    if (!branchId || !domainId || !staffSelect) {
      this.ui.showError("Invalid selection. Please try again.");
    }

    this.state.selected.branch = branchId;
    this.state.selected.domain = domainId;
    this.state.staffSelectionType = staffSelect;

    if (this.state.staffSelectionType === 'none') {
      await this.loadCalendar();
      this.nextStep(3);
    } else {
      await this.loadStaff();
      this.nextStep();
    }
     
  }

  async loadStaff() {
    this.ui.showLoading();
    try {
      const staffData = {
        domainId: this.state.selected.domain,
        shop: this.state.data.shop,
        serviceId: this.state.data.serviceid
      }
      const staff = await this.api.fetchStaff(staffData);
      this.state.setStaff(staff);
      this.ui.renderStaff(staff);
    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async loadCalendar() {
    this.ui.showLoading();
    try {
      const calendarData = await this.api.fetchCalendar(
        this.state.selected.domain,
        this.state.selected.shop,
        this.state.selected.staff,
        this.state.selected.service
      );
      this.state.setCalendar(calendarData);
      this.ui.renderCalendar(calendarData);
    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async handleStaffSelect(staffElement) {
    this.state.selected.staff = staffElement.dataset.staffId;
    await this.loadCalendar();
    this.nextStep();
  }

  async handleDateSelect(date) {
    this.state.selected.date = date;
    await this.loadTimeSlots();
    this.nextStep();
  }

  async loadTimeSlots() {
    this.ui.showLoading();
    try {
      const timeSlots = await this.api.fetchTimeSlots(
        this.state.selected.domain,
        this.state.selected.date,
        this.state.selected.shop,
        this.state.selected.staff,
        this.state.selected.service
      );
      this.state.setTimeSlots(timeSlots);
      this.ui.renderTimeSlots(timeSlots);
    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  handleTimeSelect(timeElement) {
    this.state.selected.time = timeElement.dataset.time;
    this.ui.renderSummary();
    this.nextStep();
  }

  nextStep(skipTo = null) {
    const stepToGo = skipTo || this.state.currentStep + 1;

    switch (this.state.currentStep) {
      case 1: 
        if (!this.state.selected.branch || !this.state.selected.domain) {
          this.ui.showError("Please select a branch to continue.");
          return;
        }
        break;
      case 2: 
        if (this.state.staffSelectionType !== 'none' && !this.state.selected.staff) {
          this.ui.showError("Please select a staff member to continue.");
          return;
        }
        break;
      case 3:
        if (!this.state.selected.time) {
          this.ui.showError("Please select a time slot to continue.");
          return;
        }
        break;
    }
  
    if (skipTo) {
      this.state.goToStep(skipTo);
    } else {
      this.state.nextStep();
    }
  
    this.updateUI();
  }

  prevStep() {
    this.state.prevStep();
    this.updateUI();
  }

  updateUI() {
    this.ui.updateStepIndicators(this.state.currentStep);
    this.ui.toggleButtons(this.state.currentStep, this.totalSteps);

    this.ui.elements.stepContents.forEach(step => {
      step.classList.remove('active');
    });

    if (this.state.currentStep === 1 && this.state.selected.branch) {
      const selectedBranchEl = this.ui.elements.branchList.querySelector(`[data-branch-id="${this.state.selected.branch}"]`);
       selectedBranchEl.classList.remove('selected');
      if (selectedBranchEl) {
        selectedBranchEl.classList.add('selected');
      }
    }

    this.ui.elements.stepContents[this.state.currentStep - 1].classList.add('active');
  }

  async bookAppointment() {
    try {
      this.ui.showLoading();

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: 123456789, // Replace with dynamic variant ID
            quantity: 1,
            properties: {
              booking_type: 'service',
              shop_id: this.state.selected.shop,
              domain_id: this.state.selected.domain,
              staff_id: this.state.selected.staff,
              date: this.state.selected.date,
              time: this.state.selected.time
            }
          }]
        })
      });

      const result = await response.json();

      if (response.ok) {
        window.location.href = '/cart';
      } else {
        throw new Error(result.message || 'Booking failed');
      }
    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const salonistApp = new SalonistBookingApp();

  document.querySelectorAll('.salonist-booking-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const bookingData = JSON.parse(trigger.getAttribute('data-product-info') || '{}');
      console.log(bookingData, 'Booking data on click');

      salonistApp.modal.open();
      salonistApp.state.reset();
      salonistApp.state.set(bookingData);
      salonistApp.updateUI();

      salonistApp.loadBranches(); // Load with updated data
    });
  });
});
