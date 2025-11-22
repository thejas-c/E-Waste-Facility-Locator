// Credits Module - Device Credits Calculator and Recycling History
class CreditsModule {
    constructor() {
        this.devices = [];
        this.recyclingHistory = [];
        this.currentEstimate = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Device search
        document.getElementById('search-device-btn')?.addEventListener('click', () => {
            this.searchDevices();
        });

        document.getElementById('device-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchDevices();
            }
        });

        // Device search input with debounce
        let searchTimeout;
        document.getElementById('device-search')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.trim().length >= 2) {
                    this.searchDevices();
                }
            }, 300);
        });
    }

    async loadPopularDevices() {
        try {
            const response = await window.api.getDevices();
            this.devices = response.devices;
            
            // Show first 8 devices as "popular"
            const popularDevices = this.devices.slice(0, 8);
            this.displayPopularDevices(popularDevices);
            
            console.log(`Loaded ${this.devices.length} devices`);
        } catch (error) {
            console.error('Error loading devices:', error);
            if (window.app) {
                window.app.showNotification('Failed to load devices', 'error');
            }
        }
    }

    displayPopularDevices(devices) {
        const container = document.getElementById('popular-devices-grid');
        if (!container || !devices) return;

        if (devices.length === 0) {
            container.innerHTML = '<div class="loading">No devices available</div>';
            return;
        }

        const devicesHTML = devices.map(device => `
            <div class="device-card" data-device-id="${device.device_id}" onclick="credits.selectDevice('${device.model_name}')">
                <h4>${device.model_name}</h4>
                <div class="category">${device.category}</div>
                <div class="credits">${device.credits_value} credits</div>
                <div class="materials">
                    ${device.gold > 0 ? `<span>Gold: ${device.gold}g</span>` : ''}
                    ${device.silver > 0 ? `<span>Silver: ${device.silver}g</span>` : ''}
                    ${device.copper > 0 ? `<span>Copper: ${device.copper}g</span>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = devicesHTML;
    }

    async searchDevices() {
        const searchInput = document.getElementById('device-search');
        const query = searchInput.value.trim();
        
        if (!query) {
            this.clearResults();
            return;
        }

        const button = document.getElementById('search-device-btn');
        const originalText = button.textContent;
        
        try {
            button.disabled = true;
            button.textContent = 'Searching...';

            const response = await window.api.searchDevices(query);
            this.displaySearchResults(response.devices, query);
            
        } catch (error) {
            console.error('Error searching devices:', error);
            if (window.app) {
                window.app.showNotification('Device search failed', 'error');
            }
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    displaySearchResults(devices, query) {
        const container = document.getElementById('device-results');
        if (!container) return;

        if (devices.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No devices found for "${query}"</p>
                    <p>Try searching with a different model name or check the spelling.</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        const resultsHTML = devices.map(device => `
            <div class="device-card" data-device-id="${device.device_id}" onclick="credits.selectDevice('${device.model_name}')">
                <h4>${device.model_name}</h4>
                <div class="category">${device.category}</div>
                <div class="credits">${device.credits_value} credits</div>
                <button class="btn btn-primary btn-sm" onclick="credits.estimateCredits('${device.model_name}', event)">
                    Get Estimate
                </button>
            </div>
        `).join('');

        container.innerHTML = resultsHTML;
        container.style.display = 'block';
    }

    selectDevice(modelName) {
        document.getElementById('device-search').value = modelName;
        this.estimateCredits(modelName);
    }

    async estimateCredits(modelName, event = null) {
        if (event) {
            event.stopPropagation();
        }

        try {
            const response = await window.api.estimateDeviceCredits(modelName, 1);
            this.currentEstimate = response.estimate;
            this.displayCreditEstimate();
            
        } catch (error) {
            console.error('Error estimating credits:', error);
            if (window.app) {
                window.app.showNotification(error.message || 'Failed to estimate credits', 'error');
            }
        }
    }

    displayCreditEstimate() {
        const container = document.getElementById('credit-estimate');
        if (!container || !this.currentEstimate) return;

        const estimate = this.currentEstimate;
        
        container.innerHTML = `
            <h3>Credit Estimate for ${estimate.model_name}</h3>
            <div class="estimate-value">${estimate.total_credits}</div>
            <div class="estimate-label">Credits</div>
            
            <div class="materials">
                <div class="material">
                    <span class="material-value">${estimate.materials.gold.toFixed(4)}g</span>
                    <span class="material-label">Gold</span>
                </div>
                <div class="material">
                    <span class="material-value">${estimate.materials.silver.toFixed(3)}g</span>
                    <span class="material-label">Silver</span>
                </div>
                <div class="material">
                    <span class="material-value">${estimate.materials.copper.toFixed(1)}g</span>
                    <span class="material-label">Copper</span>
                </div>
            </div>
            
            <div class="estimate-actions">
                ${window.app && window.app.currentUser ? `
                    <button class="btn btn-primary" onclick="credits.showRecycleModal()">
                        Recycle This Device
                    </button>
                ` : `
                    <button class="btn btn-outline" onclick="window.auth.showModal('login-modal')">
                        Login to Recycle
                    </button>
                `}
            </div>
        `;

        container.style.display = 'block';
    }

    showRecycleModal() {
        if (!this.currentEstimate) return;
        
        if (!window.auth.isAuthenticated()) {
            window.auth.showModal('login-modal');
            return;
        }

        // Create modal for recycling device
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Recycle ${this.currentEstimate.model_name}</h2>
                <div class="recycle-estimate">
                    <p>You will earn <strong>${this.currentEstimate.total_credits} credits</strong> for this device.</p>
                </div>
                <form id="recycle-form">
                    <div class="form-group">
                        <label for="facility-select">Select Recycling Facility:</label>
                        <select id="facility-select" required>
                            <option value="">Loading facilities...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="device-quantity">Quantity:</label>
                        <input type="number" id="device-quantity" value="1" min="1" max="10">
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Confirm Recycling</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Load facilities
        this.loadFacilitiesForModal();

        // Form submission
        modal.querySelector('#recycle-form').addEventListener('submit', (e) => {
            this.handleRecycleSubmission(e, modal);
        });

        // Close modal handlers
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

    async loadFacilitiesForModal() {
        try {
            const response = await window.api.getFacilities();
            const select = document.getElementById('facility-select');
            
            if (response.facilities.length === 0) {
                select.innerHTML = '<option value="">No facilities available</option>';
                return;
            }

            const optionsHTML = response.facilities.map(facility => 
                `<option value="${facility.facility_id}">${facility.name} - ${facility.address}</option>`
            ).join('');
            
            select.innerHTML = '<option value="">Select a facility</option>' + optionsHTML;
            
        } catch (error) {
            console.error('Error loading facilities:', error);
            const select = document.getElementById('facility-select');
            select.innerHTML = '<option value="">Error loading facilities</option>';
        }
    }

    async handleRecycleSubmission(e, modal) {
        e.preventDefault();
        
        const facilityId = document.getElementById('facility-select').value;
        const quantity = parseInt(document.getElementById('device-quantity').value) || 1;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!facilityId) {
            if (window.app) {
                window.app.showNotification('Please select a recycling facility', 'error');
            }
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            const response = await window.api.recycleDevice(
                this.currentEstimate.device_id,
                parseInt(facilityId),
                quantity
            );

            if (window.app) {
                window.app.showNotification(
                    `Recycling request submitted for ${response.request.device_name}! Your request is pending admin approval.`
                );
            }

            // Close modal and refresh history
            document.body.removeChild(modal);
            this.clearResults();

        } catch (error) {
            console.error('Error submitting recycling request:', error);
            if (window.app) {
                window.app.showNotification(error.message || 'Failed to submit recycling request', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    }

    async loadRecyclingHistory() {
        if (!window.auth.isAuthenticated()) {
            document.getElementById('recycling-history').style.display = 'none';
            return;
        }

        try {
            const response = await window.api.getMyRecyclingHistory();
            this.recyclingHistory = response.recycling_history;
            this.displayRecyclingHistory(response.summary);
            
        } catch (error) {
            console.error('Error loading recycling history:', error);
        }
    }

    displayRecyclingHistory(summary) {
        const container = document.getElementById('recycling-history');
        const content = document.getElementById('history-content');
        
        if (!container || !content) return;

        container.style.display = 'block';

        if (this.recyclingHistory.length === 0) {
            content.innerHTML = `
                <div class="no-history">
                    <p>You haven't recycled any devices yet.</p>
                    <p>Start by searching for your device above!</p>
                </div>
            `;
            return;
        }

        const historyHTML = `
            <div class="history-summary">
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-number">${summary.total_devices_recycled}</span>
                        <span class="stat-label">Devices Recycled</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${summary.total_credits_earned}</span>
                        <span class="stat-label">Total Credits Earned</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${summary.current_credits}</span>
                        <span class="stat-label">Current Balance</span>
                    </div>
                </div>
            </div>
            
            <div class="history-list">
                ${this.recyclingHistory.map(record => `
                    <div class="history-item">
                        <div class="history-main">
                            <h4>${record.model_name}</h4>
                            <div class="history-meta">
                                <span class="category">${record.category}</span>
                                <span class="date">${window.app.formatDate(record.recycled_at)}</span>
                            </div>
                        </div>
                        <div class="history-details">
                            <div class="facility">${record.facility_name}</div>
                            <div class="credits-earned">+${record.credits_earned} credits</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        content.innerHTML = historyHTML;
    }

    clearResults() {
        const resultsContainer = document.getElementById('device-results');
        const estimateContainer = document.getElementById('credit-estimate');
        
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
        }
        
        if (estimateContainer) {
            estimateContainer.style.display = 'none';
            estimateContainer.innerHTML = '';
        }
        
        this.currentEstimate = null;
    }

    // Utility method to get device by ID
    getDeviceById(deviceId) {
        return this.devices.find(device => device.device_id === deviceId);
    }

    // Method to calculate total environmental impact
    calculateTotalImpact() {
        if (this.recyclingHistory.length === 0) return null;

        const totalDevices = this.recyclingHistory.length;
        return {
            devices_recycled: totalDevices,
            co2_prevented: totalDevices * 1.2, // kg CO2
            water_saved: totalDevices * 25, // liters
            energy_saved: totalDevices * 15, // kWh
            materials_recovered: {
                gold: totalDevices * 0.03, // grams
                silver: totalDevices * 0.25, // grams
                copper: totalDevices * 15 // grams
            }
        };
    }
}

// Export for global use
window.CreditsModule = CreditsModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreditsModule;
}