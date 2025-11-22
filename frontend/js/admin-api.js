// Admin API Client for E-Waste Facility Locator
class AdminAPIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('admin_token');
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
            localStorage.setItem('admin_token', token);
        } else {
            localStorage.removeItem('admin_token');
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
            console.error('Admin API Request failed:', error);
            
            // If unauthorized, clear token
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.setToken(null);
                if (window.adminApp) {
                    window.adminApp.logout();
                }
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
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

    // Admin Authentication
    async adminLogin(email, password) {
        const response = await this.post('/api/auth/login', { email, password });
        
        // Verify admin role
        if (response.user.role !== 'admin') {
            throw new Error('Admin access required');
        }
        
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    async getAdminProfile() {
        return this.get('/api/auth/profile');
    }

    // Admin Facilities Management
    async createFacility(facilityData) {
        return this.post('/api/admin/facilities', facilityData);
    }

    async getAllFacilities() {
        return this.get('/api/facilities');
    }

    async updateFacility(id, facilityData) {
        return this.put(`/api/facilities/${id}`, facilityData);
    }

    
    async deleteFacility(facilityId) {
        const resp = await this.request(`/api/facilities/${facilityId}`, {
            method: 'DELETE'
        });
        return resp;
    }


    // Admin Recycling Requests Management
    async getAllRequests(status = 'all') {
        const statusParam = status !== 'all' ? `?status=${status}` : '';
        return this.get(`/api/admin/requests${statusParam}`);
    }

    async getAllRecyclingRequests(status = 'all') {
        const statusParam = status !== 'all' ? `?status=${status}` : '';
        return this.get(`/api/admin/recycling-requests${statusParam}`);
    }

    async approveRequest(requestId) {
        return this.put(`/api/admin/requests/${requestId}/approve`);
    }

    async approveRecyclingRequest(requestId) {
        return this.put(`/api/admin/recycling-requests/${requestId}/approve`);
    }

    async rejectRequest(requestId) {
        return this.put(`/api/admin/requests/${requestId}/reject`);
    }

    async rejectRecyclingRequest(requestId) {
        return this.put(`/api/admin/recycling-requests/${requestId}/reject`);
    }

    // Admin Users Management
    async getAllUsers() {
        return this.get('/api/admin/users');
    }

    async searchUsers(query) {
        return this.get(`/api/admin/users?search=${encodeURIComponent(query)}`);
    }

    async getUserRecyclingHistory(userId) {
        return this.get(`/api/history/user/${userId}`);
    }

    // Admin Marketplace Management
    async getAllMarketplaceListings(status = 'all') {
        const statusParam = status !== 'all' ? `?status=${status}` : '';
        return this.get(`/api/admin/marketplace${statusParam}`);
    }

    async approveMarketplaceListing(listingId) {
        return this.put(`/api/admin/marketplace/${listingId}/approve`);
    }

    async removeMarketplaceListing(listingId) {
        return this.delete(`/api/admin/marketplace/${listingId}`);
    }

    // Admin Statistics
    async getOverviewStats() {
        return this.get('/api/admin/stats/overview');
    }

    async getRecentActivity() {
        return this.get('/api/admin/stats/activity');
    }

    // Admin Pickup Requests Management
    async getAllPickupRequests(status = 'all', date = '') {
        let params = [];
        if (status !== 'all') params.push(`status=${status}`);
        if (date) params.push(`date=${date}`);
        
        const queryString = params.length > 0 ? '?' + params.join('&') : '';
        return this.get(`/api/admin/pickups${queryString}`);
    }

    async updatePickupStatus(pickupId, status, trackingNote = '') {
        return this.put(`/api/admin/pickups/${pickupId}/status`, {
            status,
            tracking_note: trackingNote
        });
    }
}

// Create global admin API client instance
window.adminApi = new AdminAPIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAPIClient;
}