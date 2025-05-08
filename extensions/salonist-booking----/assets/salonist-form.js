class SalonistBooking {
  constructor(popupId = "salonistPopup") {
    this.popup = document.getElementById(popupId);
    this.productInfo = null;
    this.currentStep = 1;
    this.appurl = 'https://developing-surfaces-intro-sb.trycloudflare.com/api/'; 
    this.shop = window.location?.hostname || window.location.host;
    this.domainId = null;
    this.productid = null;
    this.serviceid = null;
    this.variantid = null;
    this.steps = [];
    this.apiData = {};
    this.isLoading = false; // Track loading state

    if (!this.popup) {
      console.error(`Element with ID '${popupId}' not found.`);
      return;
    }

    this.steps = this.popup.querySelectorAll(".step");

    window.addEventListener("click", (event) => {
      if (event.target === this.popup) {
        this.close();
      }
    });
  }

  // Show the specific step
  showStep(step) {
    this.steps.forEach((el) => {
      el.style.display = el.dataset.step == step ? "block" : "none";
    });
    this.currentStep = step;
    this.loadStepData(step); 
  }

  async loadStepData(step) {
    const stepEl = this.popup.querySelector(`.step[data-step="${step}"]`);
    if (!stepEl) return;

    if (this.isLoading) return; 
    this.isLoading = true;
    stepEl.innerHTML = "<div class='loader'>Loading...</div>"; 

    const headers = {
      "Content-Type": "application/json",
      "shop": this.shop,
      "domainId": this.domainId, 
      "Access-Control-Allow-Origin": "*", 
    };

    let body = {};

    switch (step) {
      case 1:
        body = {
          salonistid: this.productInfo.salonistid,
          domainId: this.productInfo.domainId,
          shop: this.shop,
        };
        break;
      case 2:
        body = {
          salonistid: this.productInfo.salonistid,
        };
        break;
      case 3:
        body = {
          productid: this.productInfo.productid,
          action: "getConfirmation",
        };
        break;
      default:
        stepEl.innerHTML = "<p>Invalid step</p>";
        return;
    }
    
    try {
      let data;
      if (step === 1) {
        data = await this.apiFetch('branches', 'POST', headers, body);
      } else if (step === 2) {
        data = await this.apiFetch('services', 'POST', headers, body);
      } else if (step === 3) {
        data = await this.apiFetch('confirmation', 'POST', headers, body);
      }
      stepEl.innerHTML = this.renderStepContent(step, data); 
    } catch (error) {
      stepEl.innerHTML = `<p class="error">Failed to load data: ${error.message}</p>`;
      console.error("API POST error:", error);
    } finally {
      this.isLoading = false;
    }
  }

  // Fetch data from the API
  async apiFetch(endpoint, method = 'GET', headers = {}, body = {}) {
    console.log('Headers:', headers); 
    console.log('Method:', method);
    console.log('Endpoint:', endpoint);
    try {
      const response = await fetch(`${this.appurl}${endpoint}`, {
        method: method,
        headers: headers,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : null,
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const responsJson =    await response.json();

       return responsJson.data?.locations || false;

    } catch (error) {
      console.error("Fetch error:", error);
      throw new Error(error.message);
    }
  }

  // Render step content dynamically based on the step
  renderStepContent(step, data) {
 
    switch (step) {
      case 1:
        return `
          <h3>Select Your Branch</h3>
          <select name="branch" id="branch" required>
          ${data.map(location => 
            `<option value="${location.Domain.id}" 
                     data-branch='${JSON.stringify(location)}'>
                     ${location.Detail.extra_name}
            </option>`
          ).join('')}
          </select>
        <button type="button" onclick="bookingPopup.nextStep()">Next</button>
        `;
      case 2:
        return `
          <h3>Select Service</h3>
          <select name="service" id="service" required>
            ${data.services?.map(service => `<option value="${service.id}"  >${service.name}</option>`).join('')}
          </select>
        `;
      case 3:
        return `
          <h3>Confirm Booking</h3>
          <p>Booking for: ${this.productInfo.productid}</p>
          <button type="submit">Submit</button>
        `;
      default:
        return `<p>Unknown step</p>`;
    }
  }

  nextStep() {
    const currentForm = this.popup.querySelector(`.step[data-step="${this.currentStep}"]`);
    const inputs = currentForm.querySelectorAll("input, select");
    for (let input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
    }

    if (this.currentStep < this.steps.length) {
      this.showStep(this.currentStep + 1);
    }
  }

  // Go to the previous step
  prevStep() {
    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  }

  // Reset the steps to the first step
  resetSteps() {
    this.showStep(1);
  }

  // Open the popup with product data
  openWithData(data) {
    if (this.popup) {
      this.productInfo = data;
      this.domainId = data.domainid;
      const infoBox = this.popup.querySelector(".product-info");
      if (infoBox) {
        infoBox.innerText = `Salonist ID: ${data.salonistid}, Product ID: ${data.productid}`;
      }

      this.resetSteps();
      this.popup.style.display = "block";
    }
  }

  // Open the popup
  open() {
    if (this.popup) {
      this.resetSteps();
      this.popup.style.display = "block";
    }
  }

  // Close the popup
  close() {
    if (this.popup) {
      this.popup.style.display = "none";
    }
  }
}

// Initialize and bind
const bookingPopup = new SalonistBooking();

// Open the booking popup from a button click
function salonistBookingOpenFromButton(element) {
  const productInfoAttr = element.getAttribute("data-product-info");

  try {
    const productInfo = JSON.parse(productInfoAttr);
    bookingPopup.openWithData(productInfo);
  } catch (error) {
    console.error("Invalid JSON in data-product-info:", error);
    bookingPopup.open();
  }
}

// Close the booking popup
function salonistBookingClose() {
  bookingPopup.close();
}
