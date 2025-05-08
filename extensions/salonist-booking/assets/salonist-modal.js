class SalonistModal {
    constructor() {
      this.modal = document.getElementById('salonist-booking-modal');
      this.closeBtn = this.modal.querySelector('.salonist-close-btn');
    }
  
    init() {
      this.closeBtn.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }
  
    open() {
      this.modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  
    close() {
      this.modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }