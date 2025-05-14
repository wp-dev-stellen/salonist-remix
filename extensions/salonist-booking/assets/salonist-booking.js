class SalonistBookingApp {
  constructor() {
    this.modal = new SalonistModal();
    this.api = new SalonistAPI();
    this.state = new SalonistState();
    this.ui = new SalonistUI(this);
    this.totalSteps = 5;
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
    this.state.staffSelectionType = staffSelect?.toLowerCase?.() || '';staffSelect;
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

  const calendarData = {domainId: this.state.selected.domain, shop: this.state.data.shop, };
  try {
    this.state.selected.date = '';
    const calendar = await this.api.fetchCalendar(calendarData);
    this.state.setCalendar(calendar);
    this.ui.renderCalendar(calendar);
    console.log(this.state.selected);
    const date = this.state.selected.date

   if (date){
    await this.handleDateSelect(date);
   }
    
    
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
      const slotsData = {
        domainId:this.state.selected.domain,
        adate:this.state.selected.date,
        shop:this.state.data.shop,
        staffId:this.state.selected.staff,
        serviceId:this.state.data.serviceid,
      }
      const timeSlots = await this.api.fetchTimeSlots(slotsData);
      this.state.setTimeSlots(timeSlots);
      this.ui.renderTimeSlots(timeSlots);

    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

 async handleTimeSelect(timeElement) {
    this.state.selected.time = timeElement.dataset.time;
    await this.loadSummary();
    this.nextStep(5);
     
  }

  async loadSummary() {
    this.ui.showLoading();
    try {
       this.ui.renderSummary();
    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
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
        if (!this.state.selected.date) {
          this.ui.showError("Please select a Appointment Date to continue.");
          return;
        }
        break;
      case 4:
        if (!this.state.selected.time) {
          this.ui.showError("Please select a Time Slot to continue.");
          return;
        }
        break;
      case 5:
        if (!this.state.selected.time) {
          this.ui.showError("Please select a Time Slot to continue.");
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
      
      if (selectedBranchEl) {
       
        this.ui.elements.branchList.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    
        selectedBranchEl.classList.add('selected');
      }
    }

    if (this.state.currentStep === 2 && this.state.selected.staff) {
      const selectedStaff1 = this.ui.elements.staffList.querySelector(`[data-staff-id="${this.state.selected.staff}"]`);
      
      if (selectedStaff1) {
       
        this.ui.elements.staffList.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    
        selectedStaff1.classList.add('selected');
      }
    }
  
    this.ui.elements.stepContents[this.state.currentStep - 1].classList.add('active');
  }

async bookAppointment() {
  try {
    this.ui.showLoading();

    // Step 1: Fetch existing cart
    const cartRes = await fetch('/cart.js');
    const cartData = await cartRes.json();

    // Step 2: Build property map of new booking
    const newProps = {
      'Booking Type': 'Service',
      'Domain ID': this.state.selected.domain,
      'Staff ID': this.state.selected.staff || 'N/A',
      'Date': this.state.selected.date,
      'Time': this.state.selected.time
    };

    // Step 3: Check if item with same variant and properties exists
    const isDuplicate = cartData.items.some(item => {
      if (item.variant_id !== this.state.data.variantid) return false;

      const itemProps = item.properties || {};
      return Object.entries(newProps).every(([key, val]) => itemProps[key] === val);
    });

    if (isDuplicate) {
      this.ui.showError('This booking is already in your cart.');
      return;
    }

    // Step 4: Add to cart if not duplicate
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          id: this.state.data.variantid,
          quantity: 1,
          properties: newProps
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

document.addEventListener('DOMContentLoaded', () => {
  const salonistApp = new SalonistBookingApp();

  document.querySelectorAll('.salonist-booking-trigger').forEach(trigger => {

    trigger.addEventListener('click', () => {
      
      const bookingData = JSON.parse(trigger.getAttribute('data-product-info') || '{}');
      salonistApp.modal.open();
      salonistApp.state.reset();
      salonistApp.state.set(bookingData);
      salonistApp.updateUI();
      salonistApp.loadBranches(); 

    });

  });
});
