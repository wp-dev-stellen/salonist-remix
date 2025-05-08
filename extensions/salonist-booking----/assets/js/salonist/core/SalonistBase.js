class SalonistBase {
    constructor(config = {}) {
        this.config = {
            apiBase: 'https://api.example.com',
            debug: false,
            ...config
        };
        this.modules = {};
        this.state = {};
        this.events = this.createEventBus();
    }

    createEventBus() {
        const listeners = {};
        return {
            on: (event, callback) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(callback);
            },
            emit: (event, data) => {
                if (listeners[event]) {
                    listeners[event].forEach(cb => cb(data));
                }
            }
        };
    }

    registerModule(name, moduleClass) {
        this.modules[name] = new moduleClass(this);
    }

    log(message, data) {
        if (this.config.debug) {
            console.log(`[Salonist] ${message}`, data || '');
        }
    }
}