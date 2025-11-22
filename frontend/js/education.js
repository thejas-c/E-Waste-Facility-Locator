// Education Module - Educational Content about E-waste
class EducationModule {
    constructor() {
        this.currentCategory = 'all';
        this.educationalContent = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Category filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.filterContent(category);
            });
        });

        // New fact button
        document.getElementById('new-fact-btn')?.addEventListener('click', () => {
            this.loadRandomFact();
        });
    }

    async loadEducationalContent() {
        try {
            const response = await window.api.getEducationalContent();
            this.educationalContent = response.content;
            this.displayContent();
            console.log(`Loaded ${this.educationalContent.length} educational items`);
        } catch (error) {
            console.error('Error loading educational content:', error);
            if (window.app) {
                window.app.showNotification('Failed to load educational content', 'error');
            }
        }
    }

    displayContent(category = 'all') {
        const container = document.getElementById('education-content');
        if (!container) return;

        let contentToShow = this.educationalContent;
        
        if (category !== 'all') {
            contentToShow = this.educationalContent.filter(item => item.category === category);
        }

        if (contentToShow.length === 0) {
            container.innerHTML = '<div class="loading">No content found for this category</div>';
            return;
        }

        const contentHTML = contentToShow.map(item => `
            <div class="education-card" data-content-id="${item.content_id}">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'">` : ''}
                <div class="education-card-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <span class="education-category">${item.category}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = contentHTML;
    }

    filterContent(category) {
        this.currentCategory = category;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            }
        });

        this.displayContent(category);
    }

    async loadRandomFact() {
        const container = document.getElementById('fact-content');
        const button = document.getElementById('new-fact-btn');
        
        if (!container || !button) return;

        try {
            button.disabled = true;
            button.textContent = 'Loading...';
            container.innerHTML = '<div class="loading">Loading new fact...</div>';

            const response = await window.api.getRandomFact();
            const fact = response.fact;

            container.innerHTML = `
                <div class="fact-text">${fact.description}</div>
                <div class="fact-category">${fact.category}</div>
            `;

        } catch (error) {
            console.error('Error loading random fact:', error);
            container.innerHTML = '<div class="loading">Failed to load fact</div>';
            if (window.app) {
                window.app.showNotification('Failed to load new fact', 'error');
            }
        } finally {
            button.disabled = false;
            button.textContent = 'Get New Fact';
        }
    }

    async loadCategories() {
        try {
            const response = await window.api.getEducationCategories();
            this.setupCategoryFilters(response.categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    setupCategoryFilters(categories) {
        const filtersContainer = document.querySelector('.education-filters');
        if (!filtersContainer || !categories) return;

        const filtersHTML = [
            '<button class="filter-btn active" data-category="all">All Topics</button>'
        ];

        categories.forEach(cat => {
            filtersHTML.push(`
                <button class="filter-btn" data-category="${cat.category}">
                    ${cat.category} (${cat.count})
                </button>
            `);
        });

        filtersContainer.innerHTML = filtersHTML.join('');
        
        // Re-attach event listeners
        this.setupEventListeners();
    }

    // Show educational popup with detailed information
    showEducationalPopup(contentId) {
        const content = this.educationalContent.find(item => item.content_id === contentId);
        if (!content) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>${content.title}</h2>
                ${content.image_url ? `<img src="${content.image_url}" alt="${content.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : ''}
                <div class="education-category">${content.category}</div>
                <p style="font-size: 1.1rem; line-height: 1.8;">${content.description}</p>
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
    }

    // Get content by ID
    async getContentById(contentId) {
        try {
            const response = await window.api.getEducationalContentById(contentId);
            return response.content;
        } catch (error) {
            console.error('Error getting content by ID:', error);
            return null;
        }
    }

    // Search educational content
    searchContent(query) {
        if (!query.trim()) {
            this.displayContent(this.currentCategory);
            return;
        }

        const searchResults = this.educationalContent.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

        this.displayFilteredContent(searchResults, `Search results for "${query}"`);
    }

    displayFilteredContent(content, title) {
        const container = document.getElementById('education-content');
        if (!container) return;

        if (content.length === 0) {
            container.innerHTML = `<div class="loading">No results found</div>`;
            return;
        }

        const contentHTML = content.map(item => `
            <div class="education-card" data-content-id="${item.content_id}">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'">` : ''}
                <div class="education-card-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <span class="education-category">${item.category}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = contentHTML;
    }

    // Environmental impact calculator
    calculateEwasteImpact(deviceCount = 1) {
        // Average e-waste environmental impact data
        const impacts = {
            co2_saved: deviceCount * 1.2, // kg CO2
            water_saved: deviceCount * 25, // liters
            energy_saved: deviceCount * 15, // kWh
            toxic_materials_prevented: deviceCount * 0.5 // kg
        };

        return impacts;
    }

    // Show impact calculator
    showImpactCalculator() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Environmental Impact Calculator</h2>
                <div class="form-group">
                    <label for="device-count">Number of devices recycled:</label>
                    <input type="number" id="device-count" value="1" min="1" max="1000">
                </div>
                <div id="impact-results"></div>
                <button id="calculate-impact" class="btn btn-primary">Calculate Impact</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        const calculateBtn = modal.querySelector('#calculate-impact');
        const deviceCountInput = modal.querySelector('#device-count');
        const resultsDiv = modal.querySelector('#impact-results');

        const calculate = () => {
            const count = parseInt(deviceCountInput.value) || 1;
            const impact = this.calculateEwasteImpact(count);
            
            resultsDiv.innerHTML = `
                <div class="impact-results">
                    <h3>Environmental Benefits</h3>
                    <div class="impact-item">
                        <span class="impact-value">${impact.co2_saved.toFixed(1)} kg</span>
                        <span class="impact-label">CO₂ Emissions Prevented</span>
                    </div>
                    <div class="impact-item">
                        <span class="impact-value">${impact.water_saved.toFixed(0)} liters</span>
                        <span class="impact-label">Water Saved</span>
                    </div>
                    <div class="impact-item">
                        <span class="impact-value">${impact.energy_saved.toFixed(1)} kWh</span>
                        <span class="impact-label">Energy Saved</span>
                    </div>
                    <div class="impact-item">
                        <span class="impact-value">${impact.toxic_materials_prevented.toFixed(1)} kg</span>
                        <span class="impact-label">Toxic Materials Diverted</span>
                    </div>
                </div>
            `;
        };

        calculateBtn.addEventListener('click', calculate);
        deviceCountInput.addEventListener('input', calculate);

        // Initial calculation
        calculate();

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
}

// Export for global use
window.EducationModule = EducationModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EducationModule;
}