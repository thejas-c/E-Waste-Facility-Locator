// Admin Dashboard Application
class AdminApp {
    constructor() {
        this.currentAdmin = null;
        this.currentTab = 'overview';
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Admin Dashboard');
        
        this.setupEventListeners();
        this.checkAuthStatus();
        
        console.log('✅ Admin Dashboard initialized');
    }

    setupEventListeners() {
        // Admin login form
        document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Admin logout
        document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        // Add facility button
        document.getElementById('add-facility-btn')?.addEventListener('click', () => {
            this.showAddFacilityModal();
        });

        // Add facility form
        document.getElementById('add-facility-form')?.addEventListener('submit', (e) => {
            this.handleAddFacility(e);
        });

        // Update pickup form
        document.getElementById('update-pickup-form')?.addEventListener('submit', (e) => {
            this.handleUpdatePickup(e);
        });

        // Filter controls
        document.getElementById('request-status-filter')?.addEventListener('change', () => {
            this.loadRequests();
        });

        document.getElementById('listing-status-filter')?.addEventListener('change', () => {
            this.loadMarketplaceListings();
        });

        // Pickup filter controls
        document.getElementById('pickup-status-filter')?.addEventListener('change', () => {
            this.loadPickupRequests();
        });

        document.getElementById('pickup-date-filter')?.addEventListener('change', () => {
            this.loadPickupRequests();
        });

        // Refresh buttons
        document.getElementById('refresh-requests-btn')?.addEventListener('click', () => {
            this.loadRequests();
        });

        document.getElementById('refresh-pickups-btn')?.addEventListener('click', () => {
            this.loadPickupRequests();
        });

        document.getElementById('refresh-listings-btn')?.addEventListener('click', () => {
            this.loadMarketplaceListings();
        });

        // User search
        document.getElementById('search-users-btn')?.addEventListener('click', () => {
            this.searchUsers();
        });

        document.getElementById('user-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });

        // Modal close handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                if (modalId) {
                    this.hideModal(modalId);
                }
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('admin_token');
        if (token) {
            try {
                const response = await window.adminApi.getAdminProfile();
                if (response.user.role === 'admin') {
                    this.setCurrentAdmin(response.user);
                } else {
                    localStorage.removeItem('admin_token');
                    this.showLoginSection();
                }
            } catch (error) {
                console.error('Admin auth check failed:', error);
                localStorage.removeItem('admin_token');
                this.showLoginSection();
            }
        } else {
            this.showLoginSection();
        }
    }

    setCurrentAdmin(admin) {
        this.currentAdmin = admin;
        this.showDashboardSection();
        this.updateAdminUI();
        this.loadOverviewData();
        console.log('Admin authenticated:', admin.name);
    }

    updateAdminUI() {
        const adminName = document.getElementById('admin-name');
        if (adminName && this.currentAdmin) {
            adminName.textContent = this.currentAdmin.name;
        }
    }

    showLoginSection() {
        document.getElementById('admin-login-section').style.display = 'flex';
        document.getElementById('admin-dashboard-section').style.display = 'none';
    }

    showDashboardSection() {
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-dashboard-section').style.display = 'flex';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            const response = await window.adminApi.adminLogin(email, password);
            this.setCurrentAdmin(response.user);
            this.showNotification('Admin login successful!');
            
        } catch (error) {
            console.error('Admin login error:', error);
            this.showNotification(error.message || 'Admin login failed', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
        }
    }

    logout() {
        localStorage.removeItem('admin_token');
        this.currentAdmin = null;
        this.showLoginSection();
        this.showNotification('Logged out successfully');
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show target tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTab = tabName;
            
            // Load tab-specific data
            this.loadTabData(tabName);
        }

        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            }
        });
    }

    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'overview':
                    await this.loadOverviewData();
                    break;
                case 'facilities':
                    await this.loadFacilities();
                    break;
                case 'requests':
                    await this.loadRequests();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
                case 'pickups':
                    await this.loadPickupRequests();
                    break;
                case 'marketplace':
                    await this.loadMarketplaceListings();
                    break;
                case 'mass-collection':
                    if (window.adminMassCollection) await window.adminMassCollection.loadMassCollections();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName} data:`, error);
            this.showNotification(`Failed to load ${tabName} data`, 'error');
        }
    }

    async loadOverviewData() {
        try {
            const [statsResponse, activityResponse] = await Promise.all([
                window.adminApi.getOverviewStats(),
                window.adminApi.getRecentActivity()
            ]);

            // Update stats
            document.getElementById('total-users').textContent = statsResponse.stats.total_users || 0;
            document.getElementById('total-facilities').textContent = statsResponse.stats.total_facilities || 0;
            document.getElementById('pending-requests').textContent = statsResponse.stats.pending_requests || 0;
            document.getElementById('active-listings').textContent = statsResponse.stats.active_listings || 0;

            // Update recent activity
            this.displayRecentActivity(activityResponse.activities || []);

        } catch (error) {
            console.error('Error loading overview data:', error);
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<p>No recent activity</p>';
            return;
        }

        const activitiesHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background-color: ${this.getActivityColor(activity.type)}">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-info">
                    <h4>${activity.description}</h4>
                    <p>${this.formatDate(activity.timestamp)}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = activitiesHTML;
    }

    getActivityColor(type) {
        const colors = {
            'user_registered': 'var(--admin-primary)',
            'request_submitted': 'var(--admin-warning)',
            'request_approved': 'var(--admin-success)',
            'listing_created': 'var(--admin-secondary)',
            'facility_added': 'var(--admin-primary)'
        };
        return colors[type] || 'var(--admin-text-muted)';
    }

    getActivityIcon(type) {
        const icons = {
            'user_registered': 'fas fa-user-plus',
            'request_submitted': 'fas fa-clipboard-list',
            'request_approved': 'fas fa-check-circle',
            'pickup_requested': 'fas fa-truck',
            'listing_created': 'fas fa-store',
            'facility_added': 'fas fa-map-marker-alt'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    async loadFacilities() {
        try {
            const response = await window.adminApi.getAllFacilities();
            this.displayFacilities(response.facilities);
        } catch (error) {
            console.error('Error loading facilities:', error);
            this.showNotification('Failed to load facilities', 'error');
        }
    }

    displayFacilities(facilities) {
        const container = document.getElementById('facilities-list');
        if (!container) return;

        if (facilities.length === 0) {
            container.innerHTML = '<div class="loading">No facilities found</div>';
            return;
        }

        const facilitiesHTML = facilities.map(facility => `
            <div class="table-row">
                <div class="row-info">
                    <h4>${facility.name}</h4>
                    <p>${facility.address}</p>
                    <p><strong>Contact:</strong> ${facility.contact || 'N/A'}</p>
                    <p><strong>Hours:</strong> ${facility.operating_hours || 'N/A'}</p>
                </div>
                <div class="row-actions">
                    <button class="btn btn-outline btn-sm" onclick="adminApp.editFacility(${facility.facility_id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminApp.deleteFacility(${facility.facility_id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = facilitiesHTML;
    }
    // Add inside AdminApp class
async deleteFacility(facilityId) {
    if (!facilityId) return;
    if (!confirm('Are you sure you want to delete this facility? This action cannot be undone.')) return;

    try {
        // show temporary UI feedback
        this.showNotification('Deleting facility...', 'info');

        // call admin API (ensure adminApi has deleteFacility implemented)
        await window.adminApi.deleteFacility(facilityId);

        // success feedback and refresh
        this.showNotification('Facility deleted successfully');
        // refresh list on the current tab (if facilities tab active)
        if (this.currentTab === 'facilities') {
            await this.loadFacilities();
        } else {
            // if not on facilities tab, still refresh counters / overview
            await this.loadOverviewData();
        }
    } catch (error) {
        console.error('Error deleting facility:', error);
        // Handle expected FK constraint / conflict gracefully
        const msg = (error && error.message) ? error.message : 'Failed to delete facility';
        this.showNotification(msg, 'error');
    }
}


    showAddFacilityModal() {
        this.showModal('add-facility-modal');
    }

    async handleAddFacility(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('facility-name').value,
            address: document.getElementById('facility-address').value,
            latitude: parseFloat(document.getElementById('facility-latitude').value),
            longitude: parseFloat(document.getElementById('facility-longitude').value),
            contact: document.getElementById('facility-contact').value,
            operating_hours: document.getElementById('facility-hours').value,
            website: document.getElementById('facility-website').value
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding Facility...';

            await window.adminApi.createFacility(formData);
            this.showNotification('Facility added successfully!');
            this.hideModal('add-facility-modal');
            this.loadFacilities();
            e.target.reset();

        } catch (error) {
            console.error('Error adding facility:', error);
            this.showNotification(error.message || 'Failed to add facility', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Facility';
        }
    }

    async loadRequests() {
        try {
            console.log('Loading admin requests...');
            const status = document.getElementById('request-status-filter')?.value || 'all';
            const response = await window.adminApi.getAllRecyclingRequests(status);
            console.log('Admin requests response:', response);
            this.displayRequests(response.requests);
        } catch (error) {
            console.error('Error loading requests:', error);
            this.showNotification(`Failed to load requests: ${error.message}`, 'error');
            const container = document.getElementById('requests-list');
            if (container) {
                container.innerHTML = `<div class="loading">Failed to load requests: ${error.message}</div>`;
            }
        }
    }

    displayRequests(requests) {
        const container = document.getElementById('requests-list');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = '<div class="loading">No requests found</div>';
            return;
        }

        const requestsHTML = requests.map(request => `
            <div class="table-row">
                <div class="row-info">
                    <h4>${request.user_name} - ${request.device_name}</h4>
                    <p><strong>Category:</strong> ${request.category}</p>
                    <p><strong>Year of Purchase:</strong> ${request.year_of_purchase}</p>
                    <p><strong>Credits:</strong> ${request.credits_value}</p>
                    <p><strong>Submitted:</strong> ${this.formatDate(request.submitted_at)}</p>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </div>
                <div class="row-actions">
                    ${request.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="adminApp.approveRecyclingRequest(${request.request_id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminApp.rejectRecyclingRequest(${request.request_id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <span class="status-info">
                            ${request.status === 'approved' ? 'Approved' : 'Rejected'} 
                            ${request.processed_at ? `on ${this.formatDate(request.processed_at)}` : ''}
                        </span>
                    `}
                </div>
            </div>
        `).join('');

        container.innerHTML = requestsHTML;
    }

    async approveRecyclingRequest(requestId) {
        if (!confirm('Are you sure you want to approve this recycling request?')) return;

        try {
            await window.adminApi.approveRecyclingRequest(requestId);
            this.showNotification('Request approved successfully! Credits have been added to the user account.');
            this.loadRequests();
            this.loadOverviewData(); // Refresh stats
        } catch (error) {
            console.error('Error approving request:', error);
            this.showNotification(error.message || 'Failed to approve request', 'error');
        }
    }

    async rejectRecyclingRequest(requestId) {
        if (!confirm('Are you sure you want to reject this recycling request?')) return;

        try {
            await window.adminApi.rejectRecyclingRequest(requestId);
            this.showNotification('Request rejected');
            this.loadRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showNotification(error.message || 'Failed to reject request', 'error');
        }
    }

    async approveRequest(requestId) {
        if (!confirm('Are you sure you want to approve this recycling request?')) return;

        try {
            await window.adminApi.approveRequest(requestId);
            this.showNotification('Request approved successfully!');
            this.loadRequests();
            this.loadOverviewData(); // Refresh stats
        } catch (error) {
            console.error('Error approving request:', error);
            this.showNotification(error.message || 'Failed to approve request', 'error');
        }
    }

    async rejectRequest(requestId) {
        if (!confirm('Are you sure you want to reject this recycling request?')) return;

        try {
            await window.adminApi.rejectRequest(requestId);
            this.showNotification('Request rejected');
            this.loadRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showNotification(error.message || 'Failed to reject request', 'error');
        }
    }

    async loadUsers() {
        try {
            const response = await window.adminApi.getAllUsers();
            this.displayUsers(response.users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Failed to load users', 'error');
        }
    }

    async searchUsers() {
        const query = document.getElementById('user-search')?.value.trim();
        if (!query) {
            this.loadUsers();
            return;
        }

        try {
            const response = await window.adminApi.searchUsers(query);
            this.displayUsers(response.users);
        } catch (error) {
            console.error('Error searching users:', error);
            this.showNotification('Failed to search users', 'error');
        }
    }

    displayUsers(users) {
        const container = document.getElementById('users-list');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="loading">No users found</div>';
            return;
        }

        const usersHTML = users.map(user => `
            <div class="table-row">
                <div class="row-info">
                    <h4>${user.name}</h4>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Credits:</strong> ${user.credits}</p>
                    <p><strong>Joined:</strong> ${this.formatDate(user.created_at)}</p>
                    <p><strong>Devices Recycled:</strong> ${user.devices_recycled || 0}</p>
                </div>
                <div class="row-actions">
                    <button class="btn btn-outline btn-sm" onclick="adminApp.viewUserHistory(${user.user_id})">
                        <i class="fas fa-history"></i> View History
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = usersHTML;
    }

    async viewUserHistory(userId) {
        try {
            const response = await window.adminApi.getUserRecyclingHistory(userId);
            this.showUserHistoryModal(response.recycling_history, response.summary);
        } catch (error) {
            console.error('Error loading user history:', error);
            this.showNotification('Failed to load user history', 'error');
        }
    }

    showUserHistoryModal(history, summary) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>User Recycling History</h2>
                <div class="history-summary">
                    <p><strong>Total Devices:</strong> ${summary.total_devices_recycled}</p>
                    <p><strong>Total Credits:</strong> ${summary.total_credits_earned}</p>
                </div>
                <div class="history-list">
                    ${history.map(record => `
                        <div class="history-item">
                            <h4>${record.model_name}</h4>
                            <p><strong>Facility:</strong> ${record.facility_name}</p>
                            <p><strong>Credits:</strong> ${record.credits_earned}</p>
                            <p><strong>Date:</strong> ${this.formatDate(record.recycled_at)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Close handlers
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async loadPickupRequests() {
        try {
            const status = document.getElementById('pickup-status-filter')?.value || 'all';
            const date = document.getElementById('pickup-date-filter')?.value || '';
            const response = await window.adminApi.getAllPickupRequests(status, date);
            this.displayPickupRequests(response.pickups);
        } catch (error) {
            console.error('Error loading pickup requests:', error);
            this.showNotification('Failed to load pickup requests', 'error');
        }
    }

    displayPickupRequests(pickups) {
        const container = document.getElementById('pickups-list');
        if (!container) return;

        if (pickups.length === 0) {
            container.innerHTML = '<div class="loading">No pickup requests found</div>';
            return;
        }

        const pickupsHTML = pickups.map(pickup => `
            <div class="table-row">
                <div class="row-info">
                    <h4>${pickup.user_name} - ${pickup.device_name}</h4>
                    <p><strong>Address:</strong> ${pickup.address}</p>
                    <p><strong>Scheduled:</strong> ${this.formatDate(pickup.scheduled_date)} at ${pickup.scheduled_time}</p>
                    <p><strong>Category:</strong> ${pickup.category}</p>
                    <p><strong>Credits:</strong> ${pickup.credits_value}</p>
                    <p><strong>Requested:</strong> ${this.formatDate(pickup.created_at)}</p>
                    ${pickup.tracking_note ? `<p><strong>Note:</strong> ${pickup.tracking_note}</p>` : ''}
                    <span class="status-badge status-${pickup.status}">${this.formatPickupStatus(pickup.status)}</span>
                </div>
                <div class="row-actions">
                    <button class="btn btn-primary btn-sm" onclick="adminApp.showUpdatePickupModal(${pickup.pickup_id}, '${pickup.status}', '${pickup.tracking_note || ''}')">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = pickupsHTML;
    }

    formatPickupStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'scheduled': 'Scheduled',
            'picked_up': 'Picked Up',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    showUpdatePickupModal(pickupId, currentStatus, currentNote) {
        this.currentPickupId = pickupId;
        
        // Set current values
        document.getElementById('pickup-status-select').value = currentStatus;
        document.getElementById('pickup-tracking-note').value = currentNote || '';
        
        this.showModal('update-pickup-modal');
    }

    async handleUpdatePickup(e) {
        e.preventDefault();
        
        const status = document.getElementById('pickup-status-select').value;
        const trackingNote = document.getElementById('pickup-tracking-note').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!status) {
            this.showNotification('Please select a status', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            const response = await window.adminApi.updatePickupStatus(this.currentPickupId, status, trackingNote);
            
            // Show success message with more details
            let message = 'Pickup status updated successfully!';
            if (response.pickup && response.pickup.status === 'completed') {
                message += ` Credits have been awarded to the user.`;
            }
            
            this.showNotification(message);
            this.hideModal('update-pickup-modal');
            this.loadPickupRequests();
            this.loadOverviewData(); // Refresh stats

        } catch (error) {
            console.error('Error updating pickup status:', error);
            this.showNotification(error.message || 'Failed to update pickup status', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Status';
        }
    }

    async loadMarketplaceListings() {
        try {
            const status = document.getElementById('listing-status-filter')?.value || 'all';
            const response = await window.adminApi.getAllMarketplaceListings(status);
            this.displayMarketplaceListings(response.listings);
        } catch (error) {
            console.error('Error loading marketplace listings:', error);
            this.showNotification('Failed to load marketplace listings', 'error');
        }
    }

    displayMarketplaceListings(listings) {
        const container = document.getElementById('marketplace-list');
        if (!container) return;

        if (listings.length === 0) {
            container.innerHTML = '<div class="loading">No listings found</div>';
            return;
        }

        const listingsHTML = listings.map(listing => `
            <div class="table-row">
                <div class="row-info">
                    <h4>${listing.device_name}</h4>
                    <p><strong>Seller:</strong> ${listing.seller_name}</p>
                    <p><strong>Price:</strong> $${listing.price}</p>
                    <p><strong>Condition:</strong> ${listing.condition_type}</p>
                    <p><strong>Created:</strong> ${this.formatDate(listing.created_at)}</p>
                    <span class="status-badge status-${listing.status}">${listing.status}</span>
                </div>
                <div class="row-actions">
                    ${listing.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="adminApp.approveListing(${listing.listing_id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                    ` : ''}

                    <button class="btn btn-danger btn-sm" onclick="adminApp.removeListing(${listing.listing_id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = listingsHTML;
    }

    async approveListing(listingId) {
        if (!confirm('Are you sure you want to approve this listing?')) return;

        try {
            await window.adminApi.approveMarketplaceListing(listingId);
            this.showNotification('Listing approved successfully!');
            // Force show all listings so approved ones appear instantly
            const filter = document.getElementById('listing-status-filter');
            if (filter) filter.value = 'all';

            await this.loadMarketplaceListings();

        } catch (error) {
            console.error('Error approving listing:', error);
            this.showNotification(error.message || 'Failed to approve listing', 'error');
        }
    }

    async removeListing(listingId) {
        if (!confirm('Are you sure you want to remove this listing?')) return;

        try {
            await window.adminApi.removeMarketplaceListing(listingId);
            this.showNotification('Listing removed successfully!');
            this.loadMarketplaceListings();
        } catch (error) {
            console.error('Error removing listing:', error);
            this.showNotification(error.message || 'Failed to remove listing', 'error');
        }
    }

    // Utility methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('admin-notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${message}</strong>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Click to dismiss
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
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

// Initialize admin app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
    document.addEventListener('DOMContentLoaded', () => {
        window.adminMassCollection = window.adminMassCollection || new AdminMassCollectionModule();
    });
});