document.addEventListener('DOMContentLoaded', () => {
    // Initialize Salonist Core
    const salonist = new SalonistBase({
        apiBase: 'https://api.salonist.com/v1',
        debug: true
    });

    // Register Modules
    salonist.registerModule('form', FormManager);
    salonist.registerModule('modal', ModalManager);
    salonist.registerModule('api', ApiManager);
    salonist.registerModule('ui', UIManager);

    // Initialize Form
    salonist.modules.form.initializeForm('#formContainer', {
        stepsEndpoint: '/booking-steps'
    });

    // Event Listeners
    document.getElementById('salonist-open').addEventListener('click', () => {
        salonist.modules.modal.open('#mainModal');
    });

    salonist.events.on('form-submitted', (data) => {
        salonist.modules.ui.showToast('Booking created successfully!');
        salonist.modules.modal.close('#mainModal');
    });
});