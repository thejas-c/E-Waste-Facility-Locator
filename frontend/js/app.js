// Main Application Controller
class App {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'home';
        this.init();
    }

    async init() {
        console.log('🚀 Initializing E-Waste Facility Locator App');
        
        // Initialize components
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupNavigation();
        this.loadHomeData();
        
        // Initialize modules
        if (window.Auth) {
            window.auth = new Auth();
        }
        
        if (window.FacilitiesModule) {
            window.facilities = new FacilitiesModule();
        }
        
        if (window.EducationModule) {
            window.education = new EducationModule();
        }
        
        if (window.CreditsModule) {
            window.credits = new CreditsModule();
        }

        if (window.AIAutoCreditsModule) {
            window.aiAutoCredits = new AIAutoCreditsModule();
        }

        if (window.MarketplaceModule) {
            window.marketplace = new MarketplaceModule();
        }
        
        if (window.ChatbotModule) {
            window.chatbot = new ChatbotModule();
        }
        
        if (window.RequestsModule) {
            window.requests = new RequestsModule();
        }
        
        if (window.PickupsModule) {
            window.pickups = new PickupsModule();
        }
        
        console.log('✅ App initialized successfully');
    }

    setupEventListeners() {
        // Hero action buttons
        document.getElementById('find-facilities-btn')?.addEventListener('click', () => {
            this.showSection('facilities');
        });

        document.getElementById('learn-more-btn')?.addEventListener('click', () => {
            this.showSection('education');
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });
    }

    setupNavigation() {
        // Set up section navigation
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = link.getAttribute('href').substring(1);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                this.showSection(sectionName);
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Load section-specific data
            this.loadSectionData(sectionName);
            
            // Update URL hash
            window.location.hash = sectionName;
        }

        // Update navigation
        this.updateNavigation(sectionName);
    }

    updateNavigation(sectionName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionName}`) {
                link.classList.add('active');
            }
        });
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'facilities':
                    if (window.facilities) {
                        await window.facilities.loadFacilities();
                    }
                    break;
                case 'education':
                    if (window.education) {
                        await window.education.loadEducationalContent();
                        await window.education.loadRandomFact();
                    }
                    break;
                case 'credits':
                    if (window.credits) {
                        await window.credits.loadPopularDevices();
                        if (this.currentUser) {
                            await window.credits.loadRecyclingHistory();
                        }
                    }
                    break;
                case 'ai-auto-credits':
                    if (window.aiAutoCredits && typeof window.aiAutoCredits.onSectionShown === 'function') {
                        window.aiAutoCredits.onSectionShown();
                    }
                    break;
                case 'marketplace':
                    if (window.marketplace) {
                        await window.marketplace.loadMarketplaceListings();
                        if (this.currentUser) {
                            await window.marketplace.loadUserListings();
                        }
                    }
                    break;
                case 'requests':
                    if (window.requests && this.currentUser) {
                        await window.requests.loadUserRequests();
                        await window.requests.loadDevices();
                    }
                    break;
                case 'pickups':
                    if (window.pickups && this.currentUser) {
                        await window.pickups.loadUserPickups();
                        await window.pickups.loadDevices();
                    }
                    break;
                case 'mass-collection':
                    if (typeof loadMassCollectionRequests === 'function') {
                        await loadMassCollectionRequests();
                    } else if (window.massCollection && typeof window.massCollection.loadUserCollections === 'function') {
                        await window.massCollection.loadUserCollections();
                    }
                    break;

            }
        } catch (error) {
            console.error(`Error loading ${sectionName} data:`, error);
            this.showNotification('Error loading page data', 'error');
        }
    }

    async loadHomeData() {
        try {
            // Load initial data for home page
            console.log('Loading home page data...');
        } catch (error) {
            console.error('Error loading home data:', error);
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.setCurrentUser(data.user);
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
            }
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.updateAuthUI();
        
        // Show user-specific content
        this.showUserContent();
        
        console.log('User authenticated:', user.name);
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const userCredits = document.getElementById('user-credits');

        if (this.currentUser) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            userName.textContent = this.currentUser.name;
            userCredits.textContent = `${this.currentUser.credits} credits`;
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }

    showUserContent() {
        // Show content that requires authentication
        const userOnlyElements = document.querySelectorAll('.user-only');
        userOnlyElements.forEach(el => {
            el.style.display = this.currentUser ? 'block' : 'none';
        });

        // Hide guest-only content
        const guestOnlyElements = document.querySelectorAll('.guest-only');
        guestOnlyElements.forEach(el => {
            el.style.display = this.currentUser ? 'none' : 'block';
        });
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUser = null;
        this.updateAuthUI();
        this.showUserContent();
        this.showNotification('Logged out successfully');
        
        // Redirect to home
        this.showSection('home');
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notifications');
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

    // Utility method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Utility method to format date
    formatDate(dateString) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    }

    // Utility method to calculate distance between two points
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }
}

// Global function for section navigation (used by HTML onclick)
function showSection(sectionName) {
    if (window.app) {
        window.app.showSection(sectionName);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash && window.app) {
            window.app.showSection(hash);
        }
    });
    
    // Load initial section from URL hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        setTimeout(() => {
            window.app.showSection(initialHash);
        }, 100);
    }
});