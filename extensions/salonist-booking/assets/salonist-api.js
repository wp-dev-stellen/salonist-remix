class SalonistAPI {
    constructor() {
      this.baseUrl = 'https://anatomy-courage-recommendations-teacher.trycloudflare.com/api';
      this.endpoints = {
        branches: '/branches',
        staff: '/service-staff',
        calendar: '/calendar',
        timeslots: '/timeslots'
      };
    }
  
    async fetchBranches(data) {

      const response = await fetch(`${this.baseUrl}${this.endpoints.branches}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'domainId': data.domainid,
          'shop': data.shop
        }
      });
    
      const responseJson = await response.json();
      console.log(responseJson?.data);
      if (responseJson?.data.message?.type !== 'success') {

        throw new Error(responseJson.message || 'Failed to load Branches');
      }
    
      return responseJson?.data?.locations || [];
    }
  
    async fetchStaff(data) {
     
      const response = await fetch(`${this.baseUrl}${this.endpoints.staff}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'domainId': data.domainId,
          'serviceId': data.serviceId,
          'shop': data.shop
        }
      }); 

      const responseJson = await response.json(); 
      if (responseJson?.data?.message?.type !== 'success') throw new Error(responseJson?.message?.text || 'Failed to load staff');

      return responseJson?.data?.staff || [];
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