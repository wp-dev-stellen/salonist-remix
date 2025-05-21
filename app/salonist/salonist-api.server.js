import axios from 'axios';
import { upsertCrmCredentials } from './crm-credentials.server'; // Assuming you are using a named export


const API_LOGIN = 'https://salonist.io/secureweb/login';
const API_SERVICE = 'https://salonist.io/wordpressapi/services';
const API_PRODUCT = 'https://salonist.io/wordpressapi/products';
const API_PACKAGES = 'https://salonist.io/wordpressapi/packages';
const API_BRANCHES = 'https://salonist.io/wordpressapi/getAllLocations';
const API_STAFF_SERVICE = 'https://salonist.io/wordpressapi/service_staff';
const API_CALENDAR = "https://salonist.io/wordpressapi/business_hours";
const API_STAFF_TIME_SLOTS = 'https://salonist.io/wordpressapi/get_staff_time_availaibility';
const API_TIME_SLOTS = 'https://salonist.io/wordpressapi/get_business_time';
const API_ORDER_CREATE = 'https://salonist.io/wordpressapi/order_create';

/**
 * Logs into Salonist using email and password
 * @param {string} email
 * @param {string} password
 * @param {string} shop
 * @returns {Promise<object>} Salonist login result
 */
export  async function salonistLogin(email, password, shop) {
 
  try {
    const data = JSON.stringify({ email, password });
    const response = await axios.post(API_LOGIN, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data?.failure) {
      return {
        success: false,
        error: response.data.failure || "Invalid credentials",
      };
    }
    const crmData = {
      ...response.data, 
      'shop':shop, 
    };

    console.log(crmData,'-crmData');
    await upsertCrmCredentials(crmData);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Salonist login error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}


/**
 * Fetches services data from Salonist API using domainId
 * @param {string} domainId
 * @returns {Promise<object>} Salonist service data
 */
export async function fetchSalonistServices(domainId) {
  try {
    const formData = new FormData();
    formData.append('domainId', domainId);

    const response = await axios.post(API_SERVICE, formData); // No manual headers

    if (response.data?.status === 'error') {
      return {
        success: false,
        error: response.data.message || 'Failed to fetch services',
      };
    }

    return { 
      success: true,
      data: response.data.services,
      count: response.data.count,
    };
  } catch (error) {
    console.error('Salonist services fetch error:', error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || 'Something went wrong',
    };
  }
}


/**
 * Fetches products data from Salonist API using domainId
 * @param {string} domainId
 * @returns {Promise<object>} Salonist product data
 */
export async function fetchSalonistProducts(domainId) {
  try {
    const data = new FormData();
    data.append('domainId', domainId); 

    const response = await axios.post(API_PRODUCT, data);

    if (response.data?.failure) {
      return {
        success: false,
        error: response.data.failure || "Failed to fetch products",
      };
    }

    return {
      success: true,
      data: response.data.products,
      count: response.data.count,
    };
  } catch (error) {
    console.error("Salonist products fetch error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}

/**
 * Fetches packages data from Salonist API using domainId
 * @param {string} domainId
 * @returns {Promise<object>} Salonist package data
 */
export async function fetchSalonistPackages(domainId) {
  try {
    const data = new FormData();
    data.append('domainId', domainId);  

    const response = await axios.post(API_PACKAGES, data);

    if (response.data?.status == 'error') {
      return {
        success: false,
        error: response.data.message || "Failed to fetch packages",
      };
    }

    return {
      success: true,
      data: response.data,
      count: response.data.count,
    };
  } catch (error) {
    console.error("Salonist packages fetch error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}



/**
 * Fetches All Locations data from Salonist API using domainId
 * @param {*} domainId 
 * @returns 
 */
export async function fetchSalonistBranches(domainId) {
  try {
    const data = new FormData();
    data.append('domainId', domainId);  // Sending domainId instead of shop

    const response = await axios.post(API_BRANCHES, data);

    if (response.data?.status == 'error') {
      return {
        success: false,
        error: response.data.message || "Failed to fetch packages",
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Salonist Branches fetch error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}



/**
 * Fetches  staff data from Salonist API using domainId and serviceId
 * @param {string|number} domainId 
 * @param {string|number} serviceId 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */

export async function fetchServiceStaff(domainId, serviceId) {
  try {
    const data = new FormData();
    data.append('domainId', domainId);
    data.append('service_id', serviceId);

    const response = await axios.post(API_STAFF_SERVICE, data);

    if (response.data?.status === 'error') {
      return {
        success: false,
        error: response.data.message || "Failed to fetch branches or staff",
      };
    }
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Salonist Branches + Staff fetch error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}

/**
 * Fetches calendar events  Salonist API
 * @param {string|number} domainId 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */

export async function fetchSalonistCalendar(domainId) {
  try {
    const data = new FormData();
    data.append('domainId', domainId);

    const response = await axios.post(API_CALENDAR, data);

    if (response.data?.status === 'error') {
      return {
        success: false,
        error: response.data.message || "Failed to fetch calendar events",
      };
    }
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Salonist Calendar fetch error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}


/**
 * Fetches time slots from Salonist API
 * @param {string|number} domainId 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */

export async function fetchSalonistTimeSlots(adata) {

  try {
    const data = new FormData();
    data.append('domainId',adata.domainId);
    data.append('date', adata.date);
    data.append('serviceId', adata.serviceId);
    data.append('staff', adata.staffId);
    const url = adata.staffId ? API_STAFF_TIME_SLOTS : API_TIME_SLOTS;
    const response = await axios.post(url, data);
    if (response.data?.status === 'error') {
      return {
        success: false,
        error: response.data.message || "Failed to fetch time slots",
      };
    }

    return {
      success: true,
      data: response.data || [],
    };
  } catch (error) {
    console.error("Salonist Time Slots fetch error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}


/**
 * Creates an order in the Salonist system
 * @param {Object} orderData - The order data including domainId, date, serviceId, staffId, etc.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */

export async function createSalonistOrder(orderData) {
  try {
    const data = new FormData();
    data.append('domainId', orderData.domainId);
    data.append('date', orderData.date);
    data.append('serviceId', orderData.serviceId);
    data.append('staff', orderData.staffId);
    
    // data.append('customerId', orderData.customerId);
    // data.append('paymentMethod', orderData.paymentMethod);

    const url = API_ORDER_CREATE;

    const response = await axios.post(url, data);

    if (response.data?.status === 'error') {
      return {
        success: false,
        error: response.data.message || "Failed to create order",
      };
    }

    return {
      success: true,
      data: response.data || [],
    };
  } catch (error) {
    console.error("Salonist Order creation error:", error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Something went wrong",
    };
  }
}

