// Pickup Requests Module - Device Pickup Request and Tracking
class PickupsModule {
    constructor() {
        this.devices = [];
        this.userPickups = [];
        this.socket = null;
        this.pollingInterval = null;
        this.lastUpdatedTimes = new Map(); // Track last updated times for polling
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeRealTimeUpdates();
    }

    initializeRealTimeUpdates() {
        // Try to initialize Socket.io for real-time updates
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.setupSocketListeners();
            console.log('🔌 Socket.io initialized for real-time pickup tracking');
        } else {
            console.log('📡 Socket.io not available, using polling fallback');
            this.setupPolling();
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('🔌 Connected to pickup tracking server');
            
            // Join user-specific room if authenticated
            if (window.auth && window.auth.isAuthenticated()) {
                const user = window.auth.getCurrentUser();
                if (user) {
                    this.socket.emit('join-user-room', user.id);
                }
            }
        });

        this.socket.on('pickup:update', (data) => {
            console.log('📦 Received pickup update:', data);
            this.handlePickupUpdate(data);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from pickup tracking server');
        });
    }

    setupPolling() {
        // Fallback polling every 15 seconds when user is on pickup page
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(() => {
            if (window.app && window.app.currentSection === 'pickups' && window.auth.isAuthenticated()) {
                this.pollForUpdates();
            }
        }, 15000); // Poll every 15 seconds
    }

    async pollForUpdates() {
        try {
            const user = window.auth.getCurrentUser();
            if (!user) return;

            const response = await window.api.getUserPickupRequests(user.id);
            const updatedPickups = response.pickups;

            // Check for updates by comparing updated_at timestamps
            updatedPickups.forEach(pickup => {
                const lastUpdated = this.lastUpdatedTimes.get(pickup.pickup_id);
                const currentUpdated = new Date(pickup.updated_at).getTime();

                if (!lastUpdated || currentUpdated > lastUpdated) {
                    this.handlePickupUpdate({
                        pickup_id: pickup.pickup_id,
                        status: pickup.status,
                        tracking_note: pickup.tracking_note,
                        updated_at: pickup.updated_at,
                        device_name: pickup.device_name
                    });
                    this.lastUpdatedTimes.set(pickup.pickup_id, currentUpdated);
                }
            });

        } catch (error) {
            console.error('Error polling for pickup updates:', error);
        }
    }

    handlePickupUpdate(data) {
        // Update the specific pickup in the DOM
        const pickupElement = document.querySelector(`[data-pickup-id="${data.pickup_id}"]`);
        if (pickupElement) {
            // Update status badge
            const statusBadge = pickupElement.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = `status-badge status-${data.status}`;
                statusBadge.textContent = this.formatStatus(data.status);
            }

            // Update tracking note
            const trackingNote = pickupElement.querySelector('.pickup-tracking');
            if (trackingNote && data.tracking_note) {
                trackingNote.innerHTML = `<strong>Status:</strong> <span class="status-badge status-${data.status}">${this.formatStatus(data.status)}</span>`;
            }

            // Update tracking note box
            const noteBox = pickupElement.querySelector('.pickup-note');
            if (noteBox && data.tracking_note) {
                noteBox.innerHTML = `<strong>Tracking Note:</strong> ${data.tracking_note}`;
                noteBox.style.display = 'block';
            } else if (data.tracking_note) {
                // Create tracking note box if it doesn't exist
                const noteBox = document.createElement('div');
                noteBox.className = 'pickup-note';
                noteBox.innerHTML = `<strong>Tracking Note:</strong> ${data.tracking_note}`;
                pickupElement.querySelector('.pickup-info').appendChild(noteBox);
            }

            // Show completion banner for completed pickups
            if (data.status === 'completed' && data.credits_awarded > 0) {
                this.showCompletionBanner(data.device_name, data.credits_awarded);
            } else if (data.status === 'picked_up') {
                this.showPickupBanner(data.device_name);
            }

            // Add visual highlight for updated pickup
            pickupElement.style.backgroundColor = '#f0f9ff';
            pickupElement.style.border = '2px solid var(--primary-color)';
            
            setTimeout(() => {
                pickupElement.style.backgroundColor = '';
                pickupElement.style.border = '';
            }, 3000);
        }

        // Show notification
        if (window.app) {
            const statusText = this.formatStatus(data.status);
            window.app.showNotification(`Pickup status updated: ${statusText}`, 'info');
        }
    }

    showCompletionBanner(deviceName, creditsAwarded) {
        const banner = document.createElement('div');
        banner.className = 'pickup-completion-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Pickup Completed!</h4>
                    <p>${deviceName} pickup completed - ${creditsAwarded} credits awarded to your account</p>
                </div>
                <button class="banner-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        const container = document.querySelector('.pickups-history');
        if (container) {
            container.insertBefore(banner, container.firstChild);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.remove();
                }
            }, 10000);
        }
    }

    showPickupBanner(deviceName) {
        const banner = document.createElement('div');
        banner.className = 'pickup-progress-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <i class="fas fa-truck"></i>
                <div>
                    <h4>Device Picked Up!</h4>
                    <p>${deviceName} has been picked up and is being processed</p>
                </div>
                <button class="banner-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        const container = document.querySelector('.pickups-history');
        if (container) {
            container.insertBefore(banner, container.firstChild);
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.remove();
                }
            }, 8000);
        }
    }

    setupEventListeners() {
        // Pickup request form submission
        document.getElementById('pickup-request-form')?.addEventListener('submit', (e) => {
            this.handlePickupSubmission(e);
        });

        // Device selection change
        document.getElementById('pickup-device-select')?.addEventListener('change', (e) => {
            this.handleDeviceSelection(e.target.value);

            // Hide estimation box when user changes device
            const box = document.getElementById("pickup-estimated-box");
            if (box) box.style.display = "none";
        });
    }


    async loadDevices() {
        try {
            const response = await window.api.getDevices();
            this.devices = response.devices;
            this.populateDeviceSelect();
            console.log(`Loaded ${this.devices.length} devices for pickup requests`);
        } catch (error) {
            console.error('Error loading devices:', error);
            if (window.app) {
                window.app.showNotification('Failed to load devices', 'error');
            }
        }
    }

    populateDeviceSelect() {
        const select = document.getElementById('pickup-device-select');
        if (!select || !this.devices) return;

        const optionsHTML = this.devices.map(device =>
            `<option value="${device.device_id}">
                ${device.model_name} (${device.category}) - ${device.credits_value} credits
            </option>`
        ).join('');

        select.innerHTML = '<option value="">Select a device for pickup</option>' + optionsHTML;
    }


    handleDeviceSelection(deviceId) {
        if (!deviceId) {
            document.getElementById('pickup-device-info').style.display = 'none';
            return;
        }

        const selectedDevice = this.devices.find(device => device.device_id == deviceId);
        if (selectedDevice) {
            this.displayDeviceInfo(selectedDevice);
        }
    }

    displayDeviceInfo(device) {
        const container = document.getElementById('pickup-device-info');
        const details = document.getElementById('pickup-device-details');

        if (!container || !details) return;

        details.innerHTML = `
            <div class="device-details">
                <div class="device-detail">
                    <span class="device-detail-value">${device.credits_value}</span>
                    <span class="device-detail-label">Credits</span>
                </div>
                <div class="device-detail">
                    <span class="device-detail-value">${device.gold.toFixed(4)}g</span>
                    <span class="device-detail-label">Gold</span>
                </div>
                <div class="device-detail">
                    <span class="device-detail-value">${device.silver.toFixed(3)}g</span>
                    <span class="device-detail-label">Silver</span>
                </div>
                <div class="device-detail">
                    <span class="device-detail-value">${device.copper.toFixed(1)}g</span>
                    <span class="device-detail-label">Copper</span>
                </div>
            </div>
        `;

        container.style.display = 'block';
    }

    async handlePickupSubmission(e) {
        e.preventDefault();

        if (!window.auth.isAuthenticated()) {
            window.auth.requireAuth(() => {
                this.handlePickupSubmission(e);
            }, 'Please login to request a pickup');
            return;
        }

        const deviceId = document.getElementById('pickup-device-select').value;
        const address = document.getElementById('pickup-address').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!deviceId || !address) {
            window.app?.showNotification('Please provide all required details', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const response = await window.api.createPickupRequest({
                device_id: parseInt(deviceId),
                address: address
            });

            window.app?.showNotification('Pickup request submitted successfully!');

            // === Show estimated pickup details from backend ===
            if (response.estimated_pickup) {
                const box = document.getElementById("pickup-estimated-box");
                if (box) {
                    box.style.display = "block";
                    document.getElementById("est-pickup-date").innerText =
                        response.estimated_pickup.pickup_date;

                    document.getElementById("est-pickup-time").innerText =
                        response.estimated_pickup.pickup_time;

                    document.getElementById("est-pickup-pos").innerText =
                        response.estimated_pickup.position_in_queue;
                }
            }

            // Reset form
            e.target.reset();
            document.getElementById('pickup-device-info').style.display = 'none';

            // Reload user's pickup list
            this.loadUserPickups();

        } catch (error) {
            console.error('Pickup submit error:', error);
            window.app?.showNotification(error.message || 'Failed to submit pickup request', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Request Pickup';
        }
    }


    async loadUserPickups() {
        if (!window.auth.isAuthenticated()) {
            document.getElementById('user-pickups-list').innerHTML = 
                '<div class="loading">Please login to view your pickup requests</div>';
            return;
        }

        try {
            const user = window.auth.getCurrentUser();
            const response = await window.api.getUserPickupRequests(user.id);
            this.userPickups = response.pickups;
            this.displayUserPickups();
        } catch (error) {
            console.error('Error loading user pickups:', error);
            document.getElementById('user-pickups-list').innerHTML = 
                '<div class="loading">Failed to load pickup requests</div>';
        }
    }

    displayUserPickups() {
        const container = document.getElementById('user-pickups-list');
        if (!container) return;

        if (this.userPickups.length === 0) {
            container.innerHTML = `
                <div class="no-pickups">
                    <p>You haven't requested any pickups yet.</p>
                    <p>Use the form above to schedule your first pickup!</p>
                </div>
            `;
            return;
        }

        const pickupsHTML = this.userPickups.map(pickup => `
            <div class="pickup-item" data-pickup-id="${pickup.pickup_id}">
                <div class="pickup-info">
                    <h4>${pickup.device_name}</h4>
                    <div class="pickup-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${pickup.address}</span>
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(pickup.scheduled_date)}</span>
                        <span><i class="fas fa-clock"></i> ${pickup.scheduled_time}</span>
                        <span><i class="fas fa-coins"></i> ${pickup.credits_value} credits</span>
                    </div>
                    <div class="pickup-tracking">
                        <strong>Status:</strong> <span class="status-badge status-${pickup.status}">${this.formatStatus(pickup.status)}</span>
                    </div>
                    ${pickup.tracking_note ? `
                        <div class="pickup-note">
                            <strong>Tracking Note:</strong> ${pickup.tracking_note}
                        </div>
                    ` : ''}
                    <div class="pickup-timestamps">
                        <div class="pickup-date">Requested: ${this.formatDateTime(pickup.created_at)}</div>
                        ${pickup.updated_at && pickup.updated_at !== pickup.created_at ? `
                            <div class="pickup-updated">Last Updated: ${this.formatDateTime(pickup.updated_at)}</div>
                        ` : ''}
                    </div>
                </div>
                <div class="pickup-actions">
                    ${pickup.status === 'pending' ? `
                        <button class="btn btn-danger btn-sm" id="cancel-btn-${pickup.pickup_id}" onclick="pickups.cancelPickup(${pickup.pickup_id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = pickupsHTML;

        // Store updated times for polling comparison
        this.userPickups.forEach(pickup => {
            if (pickup.updated_at) {
                this.lastUpdatedTimes.set(pickup.pickup_id, new Date(pickup.updated_at).getTime());
            }
        });
    }

    async cancelPickup(pickupId) {
        if (!confirm('Are you sure you want to cancel this pickup request?')) return;

        // Disable cancel button to prevent double-clicks
        const cancelBtn = document.getElementById(`cancel-btn-${pickupId}`);
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
        }

        try {
            await window.api.cancelPickupRequest(pickupId);
            if (window.app) {
                window.app.showNotification('Pickup request cancelled successfully');
            }
            this.loadUserPickups();
        } catch (error) {
            console.error('Error cancelling pickup:', error);
            if (window.app) {
                window.app.showNotification(error.message || 'Failed to cancel pickup request', 'error');
            }
            
            // Re-enable cancel button on error
            if (cancelBtn) {
                cancelBtn.disabled = false;
                cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
            }
        }
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'scheduled': 'Scheduled',
            'picked_up': 'Picked Up',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(dateString));
    }

    formatDateTime(dateString) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    }


    // Cleanup method
    destroy() {
        if (this.socket) {
            this.socket.disconnect();
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }
}

// Export for global use
window.PickupsModule = PickupsModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PickupsModule;
}