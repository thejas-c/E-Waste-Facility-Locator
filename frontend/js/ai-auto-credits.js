// frontend/js/ai-auto-credits.js

class AIAutoCreditsModule {
    constructor() {
        this.form = document.getElementById('ai-credit-form');
        this.fileInput = document.getElementById('device-image');
        this.previewContainer = document.getElementById('ai-image-preview');
        this.previewImage = document.getElementById('ai-image-preview-img');
        this.deviceDetailsEl = document.getElementById('ai-device-details');
        this.creditResultEl = document.getElementById('ai-credit-result');
        this.loadingTextEl = document.getElementById('ai-loading-text');

        this.init();
    }

    init() {
        if (!this.form) return;

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.fileInput?.addEventListener('change', () => this.updatePreview());
    }

    onSectionShown() {
        // Optional hook when section is shown.
        // For now we just clear previous results.
        this.resetUI(false);
    }

    resetUI(clearImage = false) {
        if (clearImage && this.previewImage) {
            this.previewImage.src = '';
            this.previewContainer.style.display = 'none';
        }
        if (this.deviceDetailsEl) {
            this.deviceDetailsEl.style.display = 'none';
            this.deviceDetailsEl.innerHTML = '';
        }
        if (this.creditResultEl) {
            this.creditResultEl.style.display = 'none';
            this.creditResultEl.innerHTML = '';
        }
        if (this.loadingTextEl) {
            this.loadingTextEl.style.display = 'none';
        }
    }

    updatePreview() {
        const file = this.fileInput?.files?.[0];
        if (!file || !this.previewImage || !this.previewContainer) {
            if (this.previewContainer) this.previewContainer.style.display = 'none';
            return;
        }

        const url = URL.createObjectURL(file);
        this.previewImage.src = url;
        this.previewContainer.style.display = 'block';
    }

    setLoading(isLoading) {
        const submitBtn = this.form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Analyzing...' : 'Analyze Device';
        }
        if (this.loadingTextEl) {
            this.loadingTextEl.style.display = isLoading ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const file = this.fileInput?.files?.[0];
        if (!file) {
            this.showNotification('Please select an image of your device first.', 'error');
            return;
        }

        this.setLoading(true);
        this.resetUI(false);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const headers = {};
            // Attach auth token if available (not required, just in case)
            if (window.api && window.api.token) {
                headers['Authorization'] = `Bearer ${window.api.token}`;
            }

            const response = await fetch('/api/ai/device-from-image', {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to analyze device image');
            }

            this.displayDeviceInfo(data.deviceInfo || {});
            this.displayEstimate(data.estimate, data.message);
        } catch (err) {
            console.error('AI auto credit error:', err);
            this.showNotification(err.message || 'Failed to analyze device image', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    displayDeviceInfo(info) {
        if (!this.deviceDetailsEl) return;

        const safe = (v, fallback = 'Not detected') => (v && String(v).trim()) || fallback;

        this.deviceDetailsEl.innerHTML = `
            <h3>Detected Device Details</h3>
            <div class="ai-details-grid">
                <div class="ai-details-item">
                    <span class="label">Name</span>
                    <span class="value">${safe(info.name)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">Brand</span>
                    <span class="value">${safe(info.brand)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">Model</span>
                    <span class="value">${safe(info.model)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">Category</span>
                    <span class="value">${safe(info.category)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">RAM</span>
                    <span class="value">${safe(info.ram)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">Storage</span>
                    <span class="value">${safe(info.storage)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">OS</span>
                    <span class="value">${safe(info.os)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">Processor</span>
                    <span class="value">${safe(info.processor)}</span>
                </div>
                <div class="ai-details-item">
                    <span class="label">Release Year</span>
                    <span class="value">${safe(info.year)}</span>
                </div>
            </div>
            ${info.notes ? `<p class="ai-notes"><strong>Notes:</strong> ${info.notes}</p>` : ''}
        `;

        this.deviceDetailsEl.style.display = 'block';
    }

    displayEstimate(estimate, message) {
        if (!this.creditResultEl) return;

        if (!estimate) {
            this.creditResultEl.innerHTML = `
                <h3>Credits from Database</h3>
                <div class="ai-credit-box ai-credit-box-empty">
                    <p>${message || 'No matching device found in database for credit calculation.'}</p>
                </div>
            `;
            this.creditResultEl.style.display = 'block';
            return;
        }

        this.creditResultEl.innerHTML = `
            <h3>Credits</h3>
            <div class="ai-credit-box">
                <div class="ai-credit-main">
                    <div>
                        <div class="ai-credit-label">Matched Device</div>
                        <div class="ai-credit-device">${estimate.model_name}</div>
                        <div class="ai-credit-category">${estimate.category}</div>
                    </div>
                    <div class="ai-credit-value">
                        <span class="value">${estimate.total_credits}</span>
                        <span class="unit">credits</span>
                    </div>
                </div>
                <div class="ai-credit-meta">
                    <span>Credits per unit: <strong>${estimate.credits_per_unit}</strong></span>
                    <span>Quantity: <strong>${estimate.quantity}</strong></span>
                </div>
                <div class="ai-credit-materials">
                    ${estimate.gold ? `<span>Gold: ${estimate.gold}g</span>` : ''}
                    ${estimate.silver ? `<span>Silver: ${estimate.silver}g</span>` : ''}
                    ${estimate.copper ? `<span>Copper: ${estimate.copper}g</span>` : ''}
                </div>
            </div>
        `;

        this.creditResultEl.style.display = 'block';
    }
}

// Export for global use
window.AIAutoCreditsModule = AIAutoCreditsModule;

// For CommonJS (tests, etc.)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAutoCreditsModule;
}