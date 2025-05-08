class FormManager {
    constructor(salonist) {
      this.salonist = salonist;
      this.forms = new Map();
      this.fieldComponents = {
        text: this.renderTextField,
        email: this.renderEmailField,
        select: this.renderSelectField,
        date: this.renderDateField,
        // Add more field types as needed
      };
    }
  
    async initializeForm(selector, config) {
      const formElement = document.querySelector(selector);
      if (!formElement) return;
  
      const formData = {
        element: formElement,
        steps: await this.fetchSteps(config.stepsConfig),
        currentStep: 0,
        data: {},
        validation: config.validation || {}
      };
  
      this.forms.set(selector, formData);
      this.renderCurrentStep(selector);
      this.setupEventListeners(selector);
    }
  
    async fetchSteps(stepsConfig) {
      if (stepsConfig.url) {
        return this.salonist.modules.api.request(stepsConfig.url);
      }
      return stepsConfig.steps;
    }
  
    renderCurrentStep(selector) {
      const form = this.forms.get(selector);
      form.element.innerHTML = this.buildStepHTML(form.steps[form.currentStep]);
    }
  
    buildStepHTML(step) {
      return `
        <div class="form-step active" data-step="${step.id}">
          <h2>${step.title}</h2>
          ${step.fields.map(field => this.renderField(field)).join('')}
          ${this.buildNavigation(step)}
        </div>
      `;
    }
  
    renderField(field) {
      const renderer = this.fieldComponents[field.type] || this.renderTextField;
      return renderer(field);
    }
  
    renderTextField(field) {
      return `
        <div class="form-field">
          <label>${field.label}</label>
          <input type="text" name="${field.name}" 
                 placeholder="${field.placeholder}" 
                 ${field.required ? 'required' : ''}>
        </div>
      `;
    }
  
    renderSelectField(field) {
      return `
        <div class="form-field">
          <label>${field.label}</label>
          <select name="${field.name}" ${field.required ? 'required' : ''}>
            ${field.options.map(opt => `
              <option value="${opt.value}">${opt.label}</option>
            `).join('')}
          </select>
        </div>
      `;
    }
  
    // Add other field render methods
  
    buildNavigation(step) {
      return `
        <div class="form-navigation">
          ${step.hasPrevious ? '<button type="button" class="btn-prev">Previous</button>' : ''}
          ${step.hasNext ? '<button type="button" class="btn-next">Next</button>' : ''}
          ${step.isLast ? '<button type="submit" class="btn-submit">Submit</button>' : ''}
        </div>
      `;
    }
  
    setupEventListeners(selector) {
      const form = this.forms.get(selector);
      
      form.element.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-next')) this.nextStep(selector);
        if (e.target.classList.contains('btn-prev')) this.prevStep(selector);
      });
  
      form.element.addEventListener('submit', (e) => this.handleSubmit(e, selector));
    }
  
    nextStep(selector) {
      const form = this.forms.get(selector);
      if (this.validateStep(form)) {
        form.currentStep++;
        this.renderCurrentStep(selector);
      }
    }
  
    prevStep(selector) {
      const form = this.forms.get(selector);
      form.currentStep--;
      this.renderCurrentStep(selector);
    }
  
    validateStep(form) {
      const currentStep = form.steps[form.currentStep];
      return currentStep.fields.every(field => {
        const input = form.element.querySelector(`[name="${field.name}"]`);
        return this.validateField(input, field.rules);
      });
    }
  
    validateField(input, rules) {
      // Implement validation logic
      return true; // Simplified for example
    }
  
    async handleSubmit(e, selector) {
      e.preventDefault();
      const form = this.forms.get(selector);
      
      if (this.validateForm(form)) {
        try {
          const response = await this.salonist.modules.api.request(form.config.submitUrl, {
            method: 'POST',
            body: JSON.stringify(form.data)
          });
          
          this.salonist.events.emit('form-submitted', {
            form: selector,
            data: form.data,
            response
          });
          
          this.resetForm(selector);
        } catch (error) {
          this.salonist.modules.ui.showError('Form submission failed', error);
        }
      }
    }
  
    // Additional helper methods
    resetForm(selector) {
      const form = this.forms.get(selector);
      form.element.reset();
      form.currentStep = 0;
      this.renderCurrentStep(selector);
    }
  }