class SalonistBooking {
    constructor(config) {
      this.apiBase = config.apiBase || null;
      this.apiSteps = config.apiSteps || null; // Optional now
      this.popup = document.getElementById(config.popupId || 'salonist-popup');
      this.form = document.getElementById(config.formId || 'salonist-form');
      this.openBtn = document.getElementById(config.openBtnId || 'salonist-open');
      this.closeBtn = document.getElementById(config.closeBtnId || 'salonist-close');
      this.steps = [];
      this.currentStep = 0;
  
      this.init();
    }
  
    async init() {
      if (!this.popup || !this.form || !this.openBtn || !this.closeBtn) {
        console.warn('Salonist Booking: Required elements not found.');
        return;
      }
  
      this.openBtn.addEventListener('click', () => this.openPopup());
      this.closeBtn.addEventListener('click', () => this.closePopup());
      this.form.addEventListener('click', (e) => this.handleNavClick(e));
  
      // Load from API if provided, otherwise from DOM
      if (this.apiBase && this.apiSteps) {
        await this.loadStepsFromAPI();
      } else {
        this.steps = Array.from(this.form.querySelectorAll('.salonist-step'));
        this.showStep(0);
      }
    }
  
    async loadStepsFromAPI() {
      for (let i = 0; i < this.apiSteps.length; i++) {
        const stepKey = this.apiSteps[i];
        try {
          const res = await fetch(`${this.apiBase}/${stepKey}`);
          const data = await res.json();
          const stepDiv = this.renderStep(stepKey, data, i);
          this.form.appendChild(stepDiv);
          this.steps.push(stepDiv);
        } catch (error) {
          console.error(`Salonist Booking: Failed to fetch ${stepKey}`, error);
        }
      }
      this.showStep(0);
    }
  
    renderStep(stepKey, data, index) {
      const step = document.createElement('div');
      step.classList.add('salonist-step');
      step.classList.add(index === 0 ? 'salonist-active' : 'salonist-hidden');
  
      step.innerHTML = `
        <h3>${stepKey.replace(/-/g, ' ')}</h3>
        ${data.map(item => `
          <label>
            <input type="radio" name="salonist-${stepKey}" value="${item.id}" />
            ${item.name}
          </label>
        `).join('')}
        <div class="salonist-nav">
          ${index > 0 ? '<button type="button" class="salonist-prev">Previous</button>' : ''}
          ${index < this.apiSteps.length - 1 ? '<button type="button" class="salonist-next">Next</button>' : ''}
          ${index === this.apiSteps.length - 1 ? '<button type="submit" class="salonist-submit">Book Now</button>' : ''}
        </div>
      `;
      return step;
    }
  
    openPopup() {
      this.popup.classList.remove('salonist-hidden');
      this.currentStep = 0;
      this.showStep(this.currentStep);
      document.querySelector('.product-form__submit')?.classList.add('salonist-hidden');
    }
  
    closePopup() {
      this.popup.classList.add('salonist-hidden');
      this.currentStep = 0;
      document.querySelector('.product-form__submit')?.classList.remove('salonist-hidden');
    }
  
    showStep(index) {
      this.steps.forEach((step, i) => {
        step.classList.toggle('salonist-active', i === index);
        step.classList.toggle('salonist-hidden', i !== index);
      });
    }
  
    handleNavClick(e) {
      const target = e.target;
  
      if (target.classList.contains('salonist-next')) {
        const input = this.steps[this.currentStep].querySelector('input:checked');
        if (!input) {
          alert('Please select an option');
          return;
        }
        if (this.currentStep < this.steps.length - 1) {
          this.currentStep++;
          this.showStep(this.currentStep);
        }
      }
  
      if (target.classList.contains('salonist-prev')) {
        if (this.currentStep > 0) {
          this.currentStep--;
          this.showStep(this.currentStep);
        }
      }
  
      if (target.classList.contains('salonist-submit')) {
        e.preventDefault();
        this.handleSubmit();
      }
    }
  
    handleSubmit() {
      const selected = this.steps.map(step =>
        step.querySelector('input:checked')?.value || null
      );
  
      console.log('Booking data:', selected);
  
      // TODO: Send to server or Shopify metafield API
      alert('Booking submitted! 🎉');
      this.closePopup();
    }
  }
  
  new SalonistBooking({
    popupId: 'salonist-popup',
    formId: 'salonist-form',
    openBtnId: 'salonist-open',
    closeBtnId: 'salonist-close'
  });