class SalonistAPI {
    constructor() {
      this.baseUrl = '/apps/api';
      this.endpoints = {
        locations: '/locations',
        staff: '/staff',
        calendar: '/calendar',
        timeslots: '/timeslots'
      };
    }
  
    async fetchShops() {
      const response = await fetch(`${this.baseUrl}${this.endpoints.locations}`);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to load shops');
      return data.locations;
    }
  
    async fetchStaff(domainId, shopId, serviceId = null) {
      let url = `${this.baseUrl}${this.endpoints.staff}?domain_id=${domainId}&shop_id=${shopId}`;
      if (serviceId) url += `&service_id=${serviceId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to load staff');
      return data.list;
    }
  
    async fetchCalendar(domainId, shopId, staffId = null, serviceId = null) {
      let url = `${this.baseUrl}${this.endpoints.calendar}?domain_id=${domainId}&shop_id=${shopId}`;
      if (staffId) url += `&staff_id=${staffId}`;
      if (serviceId) url += `&service_id=${serviceId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to load calendar');
      return data;
    }
  
    async fetchTimeSlots(domainId, date, shopId, staffId = null, serviceId = null) {
      let url = `${this.baseUrl}${this.endpoints.timeslots}?domain_id=${domainId}&date=${date}&shop_id=${shopId}`;
      if (staffId) url += `&staff_id=${staffId}`;
      if (serviceId) url += `&service_id=${serviceId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.type !== 'success') throw new Error(data.message || 'Failed to load time slots');
      return data.html;
    }
  }