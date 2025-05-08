class UIManager {
    constructor(salonist) {
      this.salonist = salonist;
      this.loaderVisible = false;
      this.initializeGlobalLoader();
    }
  
    initializeGlobalLoader() {
      this.loader = document.createElement('div');
      this.loader.id = 'global-loader';
      this.loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">Loading...</div>
      `;
      document.body.appendChild(this.loader);
    }
  
    showLoader() {
      this.loaderVisible = true;
      this.loader.style.display = 'flex';
      this.salonist.events.emit('loader-shown');
    }
  
    hideLoader() {
      this.loaderVisible = false;
      this.loader.style.display = 'none';
      this.salonist.events.emit('loader-hidden');
    }
  
    showToast(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), duration);
    }
  
    updateProgress(percentage) {
      this.salonist.events.emit('progress-updated', percentage);
      const progressBar = document.querySelector('#global-loader .progress-bar');
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
    }
  
    showError(message, details) {
      const errorModal = document.createElement('div');
      errorModal.className = 'error-modal';
      errorModal.innerHTML = `
        <div class="error-header">
          <h3>Error</h3>
          <button class="close-error">&times;</button>
        </div>
        <div class="error-content">
          <p>${message}</p>
          ${details ? `<pre>${JSON.stringify(details, null, 2)}</pre>` : ''}
        </div>
      `;
      
      errorModal.querySelector('.close-error').addEventListener('click', () => {
        errorModal.remove();
      });
      
      document.body.appendChild(errorModal);
    }
  }