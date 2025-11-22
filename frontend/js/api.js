// API Client for E-Waste Facility Locator
class APIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('token');
    }

    // Get authorization headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Update token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            // If unauthorized, clear token
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.setToken(null);
                if (window.app) {
                    window.app.logout();
                }
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' ,cache: 'no-store' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication API methods
    async login(email, password) {
        const response = await this.post('/api/auth/login', { email, password });
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    async register(name, email, password) {
        const response = await this.post('/api/auth/register', { name, email, password });
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    async getProfile() {
        return this.get('/api/auth/profile');
    }

    // Facilities API methods
    async getFacilities() {
        return this.get('/api/facilities');
    }

    async getNearbyFacilities(lat, lng, radius = 50) {
        return this.get(`/api/facilities/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    }

    async getFacility(id) {
        return this.get(`/api/facilities/${id}`);
    }

    async createFacility(facilityData) {
        return this.post('/api/facilities', facilityData);
    }

    async updateFacility(id, facilityData) {
        return this.put(`/api/facilities/${id}`, facilityData);
    }

    async deleteFacility(id) {
        return this.delete(`/api/facilities/${id}`);
    }

    // Devices API methods
    async getDevices() {
        return this.get('/api/devices', { cache: 'no-store' });
    }

    async searchDevices(query, category = '') {
        const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
        return this.get(`/api/devices/search?q=${encodeURIComponent(query)}${categoryParam}`);
    }

    async estimateDeviceCredits(modelName, quantity = 1) {
        return this.post('/api/devices/estimate', { model_name: modelName, quantity });
    }

    async recycleDevice(deviceId, facilityId, quantity = 1) {
        return this.post('/api/devices/recycle', {
            device_id: deviceId,
            facility_id: facilityId,
            quantity
        });
    }

    // Education API methods
    async getEducationalContent(category = '') {
        const categoryParam = category ? `?category=${encodeURIComponent(category)}` : '';
        return this.get(`/api/education${categoryParam}`);
    }

    async getEducationalContentById(id) {
        return this.get(`/api/education/${id}`);
    }

    async getRandomFact() {
        return this.get('/api/education/random/fact');
    }

    async getEducationCategories() {
        return this.get('/api/education/meta/categories');
    }

    // Marketplace API methods
    async getMarketplaceListings(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.condition) params.append('condition', filters.condition);
        if (filters.max_price) params.append('max_price', filters.max_price);
        if (filters.search) params.append('search', filters.search);
        
        const queryString = params.toString();
        return this.get(`/api/marketplace${queryString ? '?' + queryString : ''}`);
    }

    async getMarketplaceListing(id) {
        return this.get(`/api/marketplace/${id}`);
    }

    async createMarketplaceListing(listingData) {
        return this.post('/api/marketplace', listingData);
    }

    async updateMarketplaceListing(id, listingData) {
        return this.put(`/api/marketplace/${id}`, listingData);
    }

    async deleteMarketplaceListing(id) {
        return this.delete(`/api/marketplace/${id}`);
    }

    async getUserListings() {
        return this.get('/api/marketplace/user/my-listings');
    }

    // Chatbot API methods
    async sendChatbotQuery(question) {
        return this.post('/api/chatbot/query', { question });
    }

    async getChatLogs(userId) {
        return this.get(`/api/chatbot/logs/${userId}`);
    }

    async getAnonymousChatLogs() {
        return this.get('/api/chatbot/logs/anonymous/recent');
    }

    // Recycling Requests API methods
    async submitRecyclingRequest(requestData) {
        return this.post('/api/requests', requestData);
    }

    async getUserRecyclingRequests() {
        return this.get('/api/requests/my-requests');
    }

    // Pickup Requests API methods
    async createPickupRequest(pickupData) {
        return this.post('/api/pickups', pickupData);
    }

    async getUserPickupRequests(userId) {
        return this.get(`/api/pickups/${userId}`);
    }

    async getPickupRequest(pickupId) {
        return this.get(`/api/pickups/single/${pickupId}`);
    }

    async cancelPickupRequest(pickupId) {
        return this.put(`/api/pickups/${pickupId}/cancel`);
    }
    // History API methods
    async getRecyclingHistory(userId) {
        return this.get(`/api/history/user/${userId}`);
    }

    async getMyRecyclingHistory() {
        return this.get('/api/history/my-history');
    }

    async getRecyclingStats() {
        return this.get('/api/history/stats');
    }
}

// Create global API client instance
window.api = new APIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}