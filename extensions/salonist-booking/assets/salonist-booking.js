class SalonistBookingApp {
  constructor() {
    this.modal = new SalonistModal();
    this.api = new SalonistAPI();
    this.state = new SalonistState();
    this.ui = new SalonistUI(this);
    this.totalSteps = 5;
    this.skipstep = ''
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
      if(branches.length == 1){ this.defaultBrancheSelect(branches[0]);}

    } catch (error) {
      this.ui.showError(error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

async defaultBrancheSelect(branch) {

  const branchId = branch.Detail.id;
  const domainId = branch.Domain.id;
  const staffSelect = branch.Detail.staff_select;

  if (!branchId || !domainId || !staffSelect) {
      this.ui.showError("Invalid selection. Please try again.");
    }

   this.state.selected.branch = branchId;
    this.state.selected.domain = domainId;
    this.state.staffSelectionType = staffSelect?.toLowerCase?.() || '';
    this.skipstep = '';
    if (this.state.staffSelectionType === 'none') {
      await this.loadCalendar();
      this.skipstep = 2;
      this.nextStep(3);
    } else {
      await this.loadStaff();
      this.nextStep();
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
    this.state.staffSelectionType = staffSelect?.toLowerCase?.() || '';
    this.skipstep = '';
    if (this.state.staffSelectionType === 'none') {
      await this.loadCalendar();
      this.skipstep = 2;
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
   this.state.selected.staffName = staffElement.dataset.staffName;
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
  const stepToGo = this?.skipstep - 1;
  const currentStep = this.state.currentStep - 1;
  console.log(stepToGo,'stepToGo');
  if (currentStep === this.skipstep) {
    this.state.goToStep(stepToGo);
  } else {
    this.state.prevStep();
  }

  this.updateUI();
}

  clearStepsFrom(step) {
  const fieldsToReset = {
    2: () => { this.elements.staffList.innerHTML = ''; },
    3: () => { this.elements.calendar.innerHTML = ''; },
    4: () => { this.elements.timeSlotContainer.innerHTML = ''; },
    5: () => { this.elements.summary.innerHTML = ''; },
  };

  for (let i = step; i <= 5; i++) {
    fieldsToReset[i]?.();
    this.elements.stepContents[i - 1]?.classList.remove('active');
  }
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

   if (this.state.currentStep === 4 && this.state.selected.time) {
      const selectedTimeSlot = this.ui.elements.timeSlots.querySelector(`[data-time="${this.state.selected.time}"]`);
      
      if (selectedTimeSlot) {
        this.ui.elements.timeSlots.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        selectedTimeSlot.classList.add('selected');
      }
    }
  
    this.ui.elements.stepContents[this.state.currentStep - 1].classList.add('active');
  }

  async bookAppointment() {
  try {
    this.ui.showLoading();

    const cartData = await this.fetchCartData();
    const newProps = this.buildBookingProperties();

    const conflictMessage = this.checkForConflicts(cartData, newProps);

    if (conflictMessage) {
      this.ui.showError(conflictMessage);
      return;
    }

    const success = await this.addBookingToCart(newProps);
      const cartDrawer = document.querySelector('.drawer');
      const cartOpen   = this.state.data?.cart || 'page';

      if (success) {
        this.modal.close();
        if (cartOpen === 'drawer' && cartDrawer) {
          cartDrawer.classList.add('active');
        } else {
          window.location.href = '/cart';
        }
      }

  } catch (error) {
    this.ui.showError(error.message);
  } finally {
    this.ui.hideLoading();
  }
}

async fetchCartData() {
  const response = await fetch('/cart.js');
  if (!response.ok) throw new Error('Failed to load cart data.');
  return await response.json();
}

    buildBookingProperties() {
      const { selected, data } = this.state;
      return {
        '_booking_type': 'service',
        '_domain_id':    selected.domain,
        'Staff':         selected.staffName || 'any',
        '_staff_id':     selected.staff || 'any',
        'Date':         selected.date,
        'Service Time': selected.time,
        '_service_time': selected.time,
        'Duration':     data.duration,
        '_isBooking': true,
      };
    }

    parseDuration(durationStr) {
      if (!durationStr) return 0;
      const [h, m] = durationStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }

    parseDateDMY(dateStr) {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    parseTime12Hour(dateStr, timeStr) {
      const dt = this.parseDateDMY(dateStr);
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      dt.setHours(hours, minutes, 0, 0);
      return dt;
    }

    checkForConflicts(cartData, newProps) {
        const selectedDate     = newProps['Date'];
        const selectedStart    = this.parseTime12Hour(selectedDate, newProps['_service_time']);
        const selectedDuration = this.parseDuration(newProps['Duration']);     
        const bufferMinutes    = Math.max(selectedDuration - 1, 0);            
        const selectedEnd      = new Date(selectedStart.getTime() + selectedDuration * 60000);
        const selectedStaff    = (newProps['_staff_id'] || '').toLowerCase();

      for (const item of cartData.items) {
        const props = item.properties || {};
        const isExactDuplicate = 
          item.variant_id === this.state.data.variantid &&
          Object.entries(newProps).every(([k, v]) => props[k] === v);

          if (!selectedStaff || selectedStaff === 'any') {
            if (isExactDuplicate) return 'This booking is already in your cart.';
            continue;
          }

          if (
            (props['_staff_id'] || '').toLowerCase() !== selectedStaff ||
            props['Date'] !== selectedDate
          ) {
            if (isExactDuplicate) return 'This booking is already in your cart.';
            continue;
          }


        const itemStart    = this.parseTime12Hour(props['Date'], props['_service_time']);
        const itemDuration = this.parseDuration(props['Duration']);
        const itemEnd      = new Date(itemStart.getTime() + itemDuration * 60000);

 
        const bufferBefore = new Date(itemStart.getTime() - bufferMinutes * 60000);
        const bufferAfter  = new Date(itemStart.getTime() + bufferMinutes * 60000);

        const isOverlap      = selectedStart < itemEnd   && selectedEnd > itemStart;
        const isWithinBuffer = selectedStart >= bufferBefore && selectedStart <= bufferAfter;

        console.log({ isExactDuplicate, isOverlap, isWithinBuffer });
   

        if (isExactDuplicate) {
          return 'This booking is already in your cart.';
        }

        if (isOverlap || isWithinBuffer) {
          return `Staff is already booked within a ${bufferMinutes}-minute window around that time.`;
        }

      }

      return null;  
    }

      async addBookingToCart(properties) {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id:       this.state.data.variantid,
              quantity: 1,
              properties
            }]
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Booking failed');
        return true;
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
