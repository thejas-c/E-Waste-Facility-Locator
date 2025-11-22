// Authentication Module
class Auth {
    constructor() {
        this.setupEventListeners();
        this.setupModals();
    }

    setupEventListeners() {
        // Login button
        document.getElementById('login-btn')?.addEventListener('click', () => {
            this.showModal('login-modal');
        });

        // Register button
        document.getElementById('register-btn')?.addEventListener('click', () => {
            this.showModal('register-modal');
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        // Form submissions
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            this.handleRegister(e);
        });

        // Modal switching
        document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login-modal');
            this.showModal('register-modal');
        });

        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('register-modal');
            this.showModal('login-modal');
        });
    }

    setupModals() {
        // Close button handlers
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

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            // Clear form if it exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        const response = await window.api.login(email, password);

        // ✅ Extract token and user safely
        const token = response?.token || response?.data?.token || null;
        const user = response?.user || response?.data?.user || null;

        // ✅ Store token immediately (important for follow-up requests)
        if (token) {
            localStorage.setItem('token', token);
            console.log('🔐 Token stored in localStorage');
        } else {
            console.warn('⚠️ No token found in login response');
        }

        // ✅ Update global app state
        if (window.app) {
            if (user) window.app.setCurrentUser(user);
            else if (response?.user) window.app.setCurrentUser(response.user);

            // ✅ Now safely load user’s Mass Collection requests
            setTimeout(async () => {
                try {
                    console.log("🔄 Loading Mass Collection after login...");
                    const result = await loadMassCollectionRequests();
                    console.log("✅ Mass Collection loaded successfully:", result?.length || 0, "requests");
                } catch (err) {
                    console.error("❌ Failed to load mass collection after login:", err);
                }
            }, 300);

            window.app.showNotification('Login successful!');
        }

        // ✅ Hide the login modal
        this.hideModal('login-modal');

    } catch (error) {
        console.error('Login error:', error);
        if (window.app) {
            window.app.showNotification(error.message || 'Login failed', 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}


    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Basic validation
        if (password.length < 6) {
            if (window.app) {
                window.app.showNotification('Password must be at least 6 characters long', 'error');
            }
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            const response = await window.api.register(name, email, password);
            
            // Update app state
            if (window.app) {
                window.app.setCurrentUser(response.user);
                window.app.showNotification('Account created successfully!');
            }

            this.hideModal('register-modal');
            
        } catch (error) {
            console.error('Registration error:', error);
            if (window.app) {
                window.app.showNotification(error.message || 'Registration failed', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    }

    logout() {
        if (window.app) {
            window.app.logout();
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token') && !!window.app?.currentUser;
    }

    // Get current user
    getCurrentUser() {
        return window.app?.currentUser || null;
    }

    // Require authentication for an action
    requireAuth(callback, message = 'Please login to continue') {
        if (this.isAuthenticated()) {
            callback();
        } else {
            if (window.app) {
                window.app.showNotification(message, 'warning');
            }
            this.showModal('login-modal');
        }
    }
}

// Export for global use
window.Auth = Auth;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}