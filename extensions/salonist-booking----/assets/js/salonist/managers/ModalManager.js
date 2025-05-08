class ModalManager {
    constructor(salonist) {
      this.salonist = salonist;
      this.modals = new Map();
      this.stack = [];
    }
  
    register(selector, config) {
      const modalElement = document.querySelector(selector);
      if (!modalElement) return;
  
      this.modals.set(selector, {
        element: modalElement,
        content: config.content,
        triggers: config.triggers || [],
        onOpen: config.onOpen || (() => {}),
        onClose: config.onClose || (() => {}),
        isOpen: false
      });
  
      this.initializeTriggers(selector);
      this.initializeCloseHandlers(selector);
    }
  
    initializeTriggers(selector) {
      const modal = this.modals.get(selector);
      modal.triggers.forEach(trigger => {
        document.querySelector(trigger).addEventListener('click', () => this.open(selector));
      });
    }
  
    initializeCloseHandlers(selector) {
      const modal = this.modals.get(selector);
      modal.element.querySelectorAll('[data-dismiss="modal"]').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => this.close(selector));
      });
    }
  
    async open(selector) {
      const modal = this.modals.get(selector);
      if (!modal) return;
  
      this.stack.push(selector);
      modal.element.style.display = 'block';
      modal.isOpen = true;
      
      // Load dynamic content
      if (typeof modal.content === 'function') {
        modal.element.innerHTML = await modal.content();
      }
      
      modal.onOpen();
      this.salonist.events.emit('modal-opened', selector);
    }
  
    close(selector) {
      const modal = this.modals.get(selector);
      if (!modal) return;
  
      modal.element.style.display = 'none';
      modal.isOpen = false;
      this.stack.pop();
      
      modal.onClose();
      this.salonist.events.emit('modal-closed', selector);
    }
  
    closeAll() {
      this.stack.forEach(selector => this.close(selector));
      this.stack = [];
    }
  }