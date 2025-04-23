import axios from 'axios';
import { upsertCrmCredentials } from './crm-credentials'; // Assuming you are using a named export

const API_LOGIN = 'https://salonist.io/secureweb/login';

/**
 * Logs into Salonist using email and password
 * @param {string} email
 * @param {string} password
 * @param {string} shop
 * @returns {Promise<object>} Salonist login result
 */
export default async function salonistLogin(email, password, shop) {
  console.log(shop,'api')
  try {
    const data = JSON.stringify({ email, password });

    // Make the login request
    const response = await axios.post(API_LOGIN, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("API response -", response.data);

    // Check if login failed based on Salonist's response
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
