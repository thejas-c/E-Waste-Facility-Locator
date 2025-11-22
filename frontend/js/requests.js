// Recycling Requests Module - User Request Management
class RequestsModule {
    constructor() {
        this.devices = [];
        this.userRequests = [];
        this.selectedDevice = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Request form submission
        document.getElementById('recycling-request-form')?.addEventListener('submit', (e) => {
            this.handleRequestSubmission(e);
        });

        // Device selection change
        document.getElementById('device-select')?.addEventListener('change', (e) => {
            this.handleDeviceSelection(e.target.value);
        });
    }

    async loadDevices() {
        try {
            const response = await window.api.getDevices();
            this.devices = response.devices;
            this.populateDeviceSelect();
            console.log(`Loaded ${this.devices.length} devices for requests`);
        } catch (error) {
            console.error('Error loading devices:', error);
            if (window.app) {
                window.app.showNotification('Failed to load devices', 'error');
            }
        }
    }

    populateDeviceSelect() {
        const select = document.getElementById('device-select');
        if (!select || !this.devices) return;

        const optionsHTML = this.devices.map(device => 
            `<option value="${device.device_id}">${device.model_name} (${device.category}) - ${device.credits_value} credits</option>`
        ).join('');

        select.innerHTML = '<option value="">Select a device</option>' + optionsHTML;
    }

    handleDeviceSelection(deviceId) {
        if (!deviceId) {
            document.getElementById('device-info').style.display = 'none';
            this.selectedDevice = null;
            return;
        }

        this.selectedDevice = this.devices.find(device => device.device_id == deviceId);
        if (this.selectedDevice) {
            this.displayDeviceInfo();
        }
    }

    displayDeviceInfo() {
    const device = this.selectedDevice;
    if (!device) return;

    const gold = parseFloat(device.gold) || 0;
    const silver = parseFloat(device.silver) || 0;
    const copper = parseFloat(device.copper) || 0;
    const credits = parseFloat(device.credits_value) || 0;

    document.getElementById('device-info').innerHTML = `
        <p><strong>Gold:</strong> ${gold.toFixed(2)} g</p>
        <p><strong>Silver:</strong> ${silver.toFixed(2)} g</p>
        <p><strong>Copper:</strong> ${copper.toFixed(2)} g</p>
        <p><strong>Credits:</strong> ${credits.toFixed(0)} pts</p>
    `;
}


    async handleRequestSubmission(e) {
        e.preventDefault();

        if (!window.auth.isAuthenticated()) {
            window.auth.requireAuth(() => {
                this.handleRequestSubmission(e);
            }, 'Please login to submit a recycling request');
            return;
        }

        const deviceId = document.getElementById('device-select').value;
        const yearOfPurchase = document.getElementById('year-purchase').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!deviceId || !yearOfPurchase) {
            if (window.app) {
                window.app.showNotification('Please select a device and enter the year of purchase', 'error');
            }
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const response = await window.api.submitRecyclingRequest({
                device_id: parseInt(deviceId),
                year_of_purchase: parseInt(yearOfPurchase)
            });

            if (window.app) {
                window.app.showNotification('Recycling request submitted successfully! It will be reviewed by an admin.');
            }

            // Reset form and reload requests
            e.target.reset();
            document.getElementById('device-info').style.display = 'none';
            this.selectedDevice = null;
            this.loadUserRequests();

        } catch (error) {
            console.error('Error submitting request:', error);
            if (window.app) {
                window.app.showNotification(error.message || 'Failed to submit request', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    }

    async loadUserRequests() {
        if (!window.auth.isAuthenticated()) {
            document.getElementById('user-requests-list').innerHTML = 
                '<div class="loading">Please login to view your requests</div>';
            return;
        }

        try {
            console.log('Loading user requests...');
            const response = await window.api.getUserRecyclingRequests();
            console.log('User requests response:', response);
            this.userRequests = response.requests;
            this.displayUserRequests();
        } catch (error) {
            console.error('Error loading user requests:', error);
            document.getElementById('user-requests-list').innerHTML = 
                `<div class="loading">Failed to load requests: ${error.message}</div>`;
        }
    }

    displayUserRequests() {
        const container = document.getElementById('user-requests-list');
        if (!container) return;

        if (this.userRequests.length === 0) {
            container.innerHTML = `
                <div class="no-requests">
                    <p>You haven't submitted any recycling requests yet.</p>
                    <p>Use the form above to submit your first request!</p>
                </div>
            `;
            return;
        }

        const requestsHTML = this.userRequests.map(request => `
            <div class="request-item">
                <div class="request-info">
                    <h4>${request.device_name}</h4>
                    <div class="request-meta">
                        <span>Category: ${request.category}</span>
                        <span>Year: ${request.year_of_purchase}</span>
                        <span>Credits: ${request.credits_value}</span>
                        <span>Submitted: ${this.formatDate(request.submitted_at)}</span>
                    </div>
                </div>
                <div class="request-status">
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = requestsHTML;
    }

    formatDate(dateString) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    }
}

// Export for global use
window.RequestsModule = RequestsModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RequestsModule;
}