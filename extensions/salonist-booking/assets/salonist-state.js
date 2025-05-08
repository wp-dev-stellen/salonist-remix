class SalonistState {
    constructor() {
      this.reset();
    }
  
    reset() {
      this.currentStep = 1;
      this.selected = {
        shop: null,
        domain: null,
        staff: null,
        date: null,
        time: null,
        service: null
      };
      this.staffSelectionType = null;
      this.data = {
        shops: [],
        staff: [],
        calendar: null,
        timeSlots: null
      };
    }
  
    setShops(shops) {
      this.data.shops = shops;
    }
  
    setStaff(staff) {
      this.data.staff = staff;
    }
  
    setCalendar(calendarData) {
      this.data.calendar = calendarData;
    }
  
    setTimeSlots(timeSlots) {
      this.data.timeSlots = timeSlots;
    }
  
    nextStep() {
      this.currentStep++;
    }
  
    prevStep() {
      this.currentStep--;
    }
  
    goToStep(step) {
      this.currentStep = step;
    }
  }