// Marketplace Module - Buy/Sell Refurbished Electronics
class MarketplaceModule {
    constructor() {
        this.listings = [];
        this.userListings = [];
        this.currentFilters = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create listing button
        document.getElementById('create-listing-btn')?.addEventListener('click', () => {
            this.showCreateListingModal();
        });

        // Filter listings
        document.getElementById('filter-listings-btn')?.addEventListener('click', () => {
            this.filterListings();
        });

        // Search with Enter key
        document.getElementById('marketplace-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filterListings();
            }
        });

        // Create listing form submission
        document.getElementById('create-listing-form')?.addEventListener('submit', (e) => {
            this.handleCreateListing(e);
        });

        // Real-time search
        let searchTimeout;
        document.getElementById('marketplace-search')?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterListings();
            }, 500);
        });
    }

    async loadMarketplaceListings() {
        try {
            const response = await window.api.getMarketplaceListings();
            this.listings = response.listings;
            this.displayMarketplaceListings();
            console.log(`Loaded ${this.listings.length} marketplace listings`);
        } catch (error) {
            console.error('Error loading marketplace listings:', error);
            if (window.app) {
                window.app.showNotification('Failed to load marketplace listings', 'error');
            }
        }
    }

    displayMarketplaceListings(listings = null) {
        const container = document.getElementById('marketplace-listings');
        if (!container) return;

        const listingsToShow = listings || this.listings;

        if (listingsToShow.length === 0) {
            container.innerHTML = `
                <div class="no-listings">
                    <h3>No listings found</h3>
                    <p>Be the first to list a device for sale!</p>
                    ${window.auth && window.auth.isAuthenticated() ? 
                        '<button class="btn btn-primary" onclick="marketplace.showCreateListingModal()">Create Listing</button>' :
                        '<button class="btn btn-outline" onclick="window.auth.showModal(\'login-modal\')">Login to Create Listing</button>'
                    }
                </div>
            `;
            return;
        }

        const listingsHTML = listingsToShow.map(listing => `
            <div class="listing-card" data-listing-id="${listing.listing_id}">
                <div class="listing-image">
                    ${listing.image_url ? 
                        `<img src="${listing.image_url}" alt="${listing.device_name}" onerror="this.parentNode.innerHTML='<i class=\\'fas fa-mobile-alt\\'></i>'">` :
                        '<i class="fas fa-mobile-alt"></i>'
                    }
                </div>
                <div class="listing-content">
                    <h3>${listing.device_name}</h3>
                    <div class="listing-price">$${listing.price}</div>
                    <div class="listing-condition condition-${listing.condition_type}">
                        ${listing.condition_type.charAt(0).toUpperCase() + listing.condition_type.slice(1)} Condition
                    </div>
                    ${listing.description ? `<div class="listing-description">${this.truncateText(listing.description, 100)}</div>` : ''}
                    <div class="listing-seller">
                        <i class="fas fa-user"></i> ${listing.seller_name}
                        <span class="listing-date">${this.formatListingDate(listing.created_at)}</span>
                    </div>
                    <div class="listing-actions">
                        <button class="btn btn-primary btn-sm" onclick="marketplace.showListingDetails(${listing.listing_id})">
                            View Details
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="marketplace.contactSeller(${listing.listing_id})">
                            Contact Seller
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = listingsHTML;
    }

    async filterListings() {
        const search = document.getElementById('marketplace-search')?.value.trim() || '';
        const condition = document.getElementById('condition-filter')?.value || '';
        const maxPrice = document.getElementById('max-price-filter')?.value || '';

        this.currentFilters = { search, condition, max_price: maxPrice };

        try {
            const response = await window.api.getMarketplaceListings(this.currentFilters);
            this.displayMarketplaceListings(response.listings);
        } catch (error) {
            console.error('Error filtering listings:', error);
            if (window.app) {
                window.app.showNotification('Failed to filter listings', 'error');
            }
        }
    }

    showCreateListingModal() {
        if (!window.auth.isAuthenticated()) {
            window.auth.requireAuth(() => {
                this.showCreateListingModal();
            }, 'Please login to create a listing');
            return;
        }

        const modal = document.getElementById('create-listing-modal');
        if (modal) {
            modal.style.display = 'block';
            // Clear form
            document.getElementById('create-listing-form')?.reset();
        }
    }

    async handleCreateListing(e) {
        e.preventDefault();
        
        const formData = {
            device_name: document.getElementById('listing-device-name').value,
            condition_type: document.getElementById('listing-condition').value,
            price: parseFloat(document.getElementById('listing-price').value),
            description: document.getElementById('listing-description').value,
            image_url: document.getElementById('listing-image-url').value
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            const response = await window.api.createMarketplaceListing(formData);

            if (window.app) {
                window.app.showNotification('Listing created successfully!');
            }

            // Hide modal and refresh listings
            document.getElementById('create-listing-modal').style.display = 'none';
            this.loadMarketplaceListings();
            this.loadUserListings();

        } catch (error) {
            console.error('Error creating listing:', error);
            if (window.app) {
                window.app.showNotification(error.message || 'Failed to create listing', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Listing';
        }
    }

    async showListingDetails(listingId) {
        try {
            const response = await window.api.getMarketplaceListing(listingId);
            const listing = response.listing;

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>${listing.device_name}</h2>
                    ${listing.image_url ? 
                        `<img src="${listing.image_url}" alt="${listing.device_name}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" onerror="this.style.display='none'">` :
                        ''
                    }
                    <div class="listing-details">
                        <div class="price-condition">
                            <span class="price">$${listing.price}</span>
                            <span class="condition condition-${listing.condition_type}">
                                ${listing.condition_type.charAt(0).toUpperCase() + listing.condition_type.slice(1)} Condition
                            </span>
                        </div>
                        <div class="seller-info">
                            <h3>Seller Information</h3>
                            <p><strong>Name:</strong> ${listing.seller_name}</p>
                            <p><strong>Listed:</strong> ${window.app.formatDate(listing.created_at)}</p>
                        </div>
                        ${listing.description ? `
                            <div class="description">
                                <h3>Description</h3>
                                <p>${listing.description}</p>
                            </div>
                        ` : ''}
                        <div class="listing-actions">
                            <button class="btn btn-primary" onclick="marketplace.contactSeller(${listing.listing_id})">
                                Contact Seller
                            </button>
                            <button class="btn btn-outline" onclick="marketplace.reportListing(${listing.listing_id})">
                                Report Listing
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';

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

        } catch (error) {
            console.error('Error loading listing details:', error);
            if (window.app) {
                window.app.showNotification('Failed to load listing details', 'error');
            }
        }
    }

    contactSeller(listingId) {
        const listing = this.listings.find(l => l.listing_id === listingId);
        if (!listing) return;

        // In a real app, this would open a messaging system
        // For now, we'll show a simple notification
        if (window.app) {
            window.app.showNotification(
                `Contact ${listing.seller_name} about "${listing.device_name}". In a real app, this would open a messaging system.`,
                'info'
            );
        }
    }

    reportListing(listingId) {
        if (window.app) {
            window.app.showNotification('Listing reported. Our team will review it shortly.', 'info');
        }
    }

    async loadUserListings() {
        if (!window.auth.isAuthenticated()) {
            document.getElementById('user-listings').style.display = 'none';
            return;
        }

        try {
            const response = await window.api.getUserListings();
            this.userListings = response.listings;
            this.displayUserListings();
        } catch (error) {
            console.error('Error loading user listings:', error);
        }
    }

    displayUserListings() {
        const container = document.getElementById('user-listings');
        const content = document.getElementById('user-listings-content');
        
        if (!container || !content) return;

        container.style.display = 'block';

        if (this.userListings.length === 0) {
            content.innerHTML = `
                <div class="no-listings">
                    <p>You don't have any active listings.</p>
                    <button class="btn btn-primary" onclick="marketplace.showCreateListingModal()">
                        Create Your First Listing
                    </button>
                </div>
            `;
            return;
        }

        const listingsHTML = this.userListings.map(listing => `
            <div class="user-listing-item">
                <div class="listing-info">
                    <h4>${listing.device_name}</h4>
                    <div class="listing-meta">
                        <span class="price">$${listing.price}</span>
                        <span class="condition">${listing.condition_type}</span>
                        <span class="status status-${listing.status}">${listing.status}</span>
                    </div>
                    <div class="listing-date">Listed: ${this.formatListingDate(listing.created_at)}</div>
                </div>
                <div class="listing-actions">
                    <button class="btn btn-outline btn-sm" onclick="marketplace.editListing(${listing.listing_id})">
                        Edit
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="marketplace.deleteListing(${listing.listing_id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        content.innerHTML = listingsHTML;
    }

    editListing(listingId) {
        const listing = this.userListings.find(l => l.listing_id === listingId);
        if (!listing) return;

        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Listing</h2>
                <form id="edit-listing-form">
                    <div class="form-group">
                        <label for="edit-device-name">Device Name:</label>
                        <input type="text" id="edit-device-name" value="${listing.device_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-condition">Condition:</label>
                        <select id="edit-condition" required>
                            <option value="excellent" ${listing.condition_type === 'excellent' ? 'selected' : ''}>Excellent</option>
                            <option value="good" ${listing.condition_type === 'good' ? 'selected' : ''}>Good</option>
                            <option value="fair" ${listing.condition_type === 'fair' ? 'selected' : ''}>Fair</option>
                            <option value="poor" ${listing.condition_type === 'poor' ? 'selected' : ''}>Poor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-price">Price ($):</label>
                        <input type="number" id="edit-price" value="${listing.price}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-description">Description:</label>
                        <textarea id="edit-description" rows="4">${listing.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-image-url">Image URL:</label>
                        <input type="url" id="edit-image-url" value="${listing.image_url || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-status">Status:</label>
                        <select id="edit-status">
                            <option value="active" ${listing.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="sold" ${listing.status === 'sold' ? 'selected' : ''}>Sold</option>
                            <option value="removed" ${listing.status === 'removed' ? 'selected' : ''}>Removed</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Update Listing</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Form submission
        modal.querySelector('#edit-listing-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                device_name: document.getElementById('edit-device-name').value,
                condition_type: document.getElementById('edit-condition').value,
                price: parseFloat(document.getElementById('edit-price').value),
                description: document.getElementById('edit-description').value,
                image_url: document.getElementById('edit-image-url').value,
                status: document.getElementById('edit-status').value
            };

            try {
                await window.api.updateMarketplaceListing(listingId, formData);
                if (window.app) {
                    window.app.showNotification('Listing updated successfully!');
                }
                document.body.removeChild(modal);
                this.loadUserListings();
                this.loadMarketplaceListings();
            } catch (error) {
                console.error('Error updating listing:', error);
                if (window.app) {
                    window.app.showNotification('Failed to update listing', 'error');
                }
            }
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

    async deleteListing(listingId) {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        try {
            await window.api.deleteMarketplaceListing(listingId);
            if (window.app) {
                window.app.showNotification('Listing deleted successfully!');
            }
            this.loadUserListings();
            this.loadMarketplaceListings();
        } catch (error) {
            console.error('Error deleting listing:', error);
            if (window.app) {
                window.app.showNotification('Failed to delete listing', 'error');
            }
        }
    }

    // Utility methods
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatListingDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    }

    // Filter by condition
    filterByCondition(condition) {
        document.getElementById('condition-filter').value = condition;
        this.filterListings();
    }

    // Sort listings
    sortListings(criteria) {
        let sortedListings = [...this.listings];
        
        switch (criteria) {
            case 'price-low':
                sortedListings.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedListings.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                sortedListings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                sortedListings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
        }
        
        this.displayMarketplaceListings(sortedListings);
    }
}

// Export for global use
window.MarketplaceModule = MarketplaceModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceModule;
}