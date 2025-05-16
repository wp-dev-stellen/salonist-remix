class SalonistState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentStep = 1;
    this.selected = {
      branch: null,
      domain: null,
      staff: null,
      date: null,
      time: null,
      service: null
    };
    this.staffSelectionType = null;
    this.data = {
      branches: [],
      staff: [],
      calendar: null,
      timeSlots: null,
      shop:null,
      domainid: null,
      serviceid: null,
      productid: null,
      variantid: null,
      duration:null,
      cart:null,
    };
  }

  set(data = {}) {
    console.log('Setting state with:', data);
    this.data.shop = window.location?.host || window.location?.hostname;
    this.data.domainid = data?.domainid || null;
    this.data.serviceid = data?.salonistid || null;
    this.data.productid = data?.productid || null;
    this.data.variantid = data?.variantid || null;
    this.data.duration = data?.duration || null;
    this.data.cart = data?.cart || null;

    console.log('Updated state:', this.data);
  }

  get() {
    return { ...this.data ,...this.selected};
  }

  setBranches(branches) {
    this.data.branches = branches;
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
