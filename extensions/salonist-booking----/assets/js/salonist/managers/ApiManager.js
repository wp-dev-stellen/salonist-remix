class ApiManager {
    constructor(salonist) {
      this.salonist = salonist;
      this.cache = new Map();
      this.interceptors = {
        request: [],
        response: []
      };
    }
  
    async request(endpoint, options = {}) {
      try {
        const url = new URL(endpoint, this.salonist.config.apiBase);
        const cacheKey = `${options.method || 'GET'}:${url}`;
        
        // Run request interceptors
        const processedRequest = await this.runInterceptors('request', { url, options });
        
        if (options.cache && this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }
  
        const response = await fetch(processedRequest.url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...processedRequest.options
        });
  
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
        const data = await response.json();
        
        // Run response interceptors
        const processedResponse = await this.runInterceptors('response', data);
        
        if (options.cache) {
          this.cache.set(cacheKey, processedResponse);
        }
  
        return processedResponse;
      } catch (error) {
        this.salonist.events.emit('api-error', error);
        throw error;
      }
    }
  
    addInterceptor(type, interceptor) {
      if (this.interceptors[type]) {
        this.interceptors[type].push(interceptor);
      }
    }
  
    async runInterceptors(type, data) {
      let processedData = data;
      for (const interceptor of this.interceptors[type]) {
        processedData = await interceptor(processedData);
      }
      return processedData;
    }
  }