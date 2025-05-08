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
      this.loadShops();
      
      // Add event listeners for dynamic elements
      document.addEventListener('click', (e) => {
        if (e.target.closest('.salonist-shop-item')) {
          this.handleShopSelect(e.target.closest('.salonist-shop-item'));
        }
        if (e.target.closest('.salonist-staff-item')) {
          this.handleStaffSelect(e.target.closest('.salonist-staff-item'));
        }
        if (e.target.closest('.salonist-time-slot')) {
          this.handleTimeSelect(e.target.closest('.salonist-time-slot'));
        }
      });
    }
  
    async loadShops() {
      this.ui.showLoading();
      try {
        const shops = await this.api.fetchShops();
        this.state.setShops(shops);
        this.ui.renderShops(shops);
      } catch (error) {
        this.ui.showError(error.message);
      } finally {
        this.ui.hideLoading();
      }
    }
  
    async handleShopSelect(shopElement) {
      this.state.selected.shop = shopElement.dataset.shopId;
      this.state.selected.domain = shopElement.dataset.domainId;
      this.state.staffSelectionType = shopElement.dataset.staffSelect;
      
      if (this.state.staffSelectionType === 'none') {
        await this.loadCalendar();
        this.nextStep(3); // Skip to calendar (step 3)
      } else {
        await this.loadStaff();
        this.nextStep();
      }
    }
  
    async loadStaff() {
      this.ui.showLoading();
      try {
        const staff = await this.api.fetchStaff(
          this.state.selected.domain,
          this.state.selected.shop,
          this.state.selected.service
        );
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
      
      // Hide all steps
      this.ui.elements.stepContents.forEach(step => {
        step.classList.remove('active');
      });
      
      // Show current step
      this.ui.elements.stepContents[this.state.currentStep - 1].classList.add('active');
    }
  
    async bookAppointment() {
      try {
        this.ui.showLoading();
        
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [{
              id: 123456789, // Your product variant ID
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
    
    // Add trigger button event
    document.querySelectorAll('.salonist-booking-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        salonistApp.modal.open();
        salonistApp.state.reset();
        salonistApp.updateUI();
      });
    });
  });