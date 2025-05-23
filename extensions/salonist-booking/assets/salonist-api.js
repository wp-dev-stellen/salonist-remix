class SalonistAPI {
    constructor() {
      this.baseUrl = 'https://gr-mn-procedure-drove.trycloudflare.com/api';
      this.endpoints = {
        branches: '/branches',
        staff: '/service-staff',
        calendar: '/calendar',
        timeslots: '/timeslots',
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
  

    async fetchCalendar(data) {
     
      const response = await fetch(`${this.baseUrl}${this.endpoints.calendar}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'domainId': data.domainId,
          'shop': data.shop
        }
      }); 

      const responseJson = await response.json(); 
      if (responseJson?.data?.message?.type !== 'success') throw new Error(responseJson?.message?.text || 'Failed to load Calendar');

      return responseJson?.data?.calendarEvents || [];
    }


    async fetchTimeSlots(data) {
     const response = await fetch(`${this.baseUrl}${this.endpoints.timeslots}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         ...data,
        }
      }); 

      const responseJson = await response.json(); 
      if (responseJson?.data?.message?.type !== 'success') throw new Error(responseJson?.message?.text || 'Failed to load Slots');

      return responseJson?.data?.timeSlots || [];
    }
  }
