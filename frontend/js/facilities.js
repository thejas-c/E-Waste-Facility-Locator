// Facilities Module - Map and List View for E-waste Facilities
class FacilitiesModule {
    constructor() {
        this.map = null;
        this.markers = [];
        this.facilities = [];
        this.userLocation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeMap();
    }

    setupEventListeners() {
        // View toggle buttons
        document.getElementById('map-view-btn')?.addEventListener('click', () => {
            this.showMapView();
        });

        document.getElementById('list-view-btn')?.addEventListener('click', () => {
            this.showListView();
        });

        // Location search
        document.getElementById('use-location-btn')?.addEventListener('click', () => {
            this.useCurrentLocation();
        });

        document.getElementById('location-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation();
            }
        });
    }

    initializeMap() {
    try {
        this.map = L.map('map', {
            center: [20.5937, 78.9629],
            zoom: 5,
            minZoom: 3,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: true,
            doubleClickZoom: true,
            boxZoom: true,
            touchZoom: true,
            scrollWheelZoom: false,
            dragging: true,
            inertia: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Try to create a marker cluster group; fallback to plain layerGroup if unavailable
        if (typeof L.markerClusterGroup === 'function') {
            this.markerGroup = L.markerClusterGroup({
                chunkedLoading: true,
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: true
            });
            console.log('✅ MarkerCluster available - using cluster group');
        } else {
            this.markerGroup = L.layerGroup();
            console.warn('⚠️ MarkerCluster not available - using plain layerGroup');
        }

        // add marker group to map
        if (this.markerGroup) this.markerGroup.addTo(this.map);

        // enable scroll zoom after intentional click, disable on mouseout
        this.map.once('click', () => {
            try { this.map.scrollWheelZoom.enable(); } catch(e){}
        });
        this.map.on('mouseout', () => {
            try { this.map.scrollWheelZoom.disable(); } catch(e){}
        });

        console.log('✅ Map initialized successfully');
    } catch (error) {
        console.error('❌ Map initialization failed:', error);
    }
}


    async loadFacilities() {
         try {
            const response = await window.api.getFacilities();
            console.log('getFacilities response:', response);
            this.facilities = response.facilities;
            this.displayFacilities();
            console.log(`Loaded ${this.facilities.length} facilities`);
        } catch (error) {
            console.error('Error loading facilities:', error);
            if (window.app) {
                window.app.showNotification('Failed to load facilities', 'error');
            }
        }
    }

   displayFacilities() {
    // clear old markers
    this.clearMarkers();

    if (!this.facilities || this.facilities.length === 0) {
        this.updateFacilitiesList();
        return;
    }

    // Add markers (cluster group or layerGroup will accept addLayer)
    this.facilities.forEach(facility => {
        if (!isFinite(Number(facility.latitude)) || !isFinite(Number(facility.longitude))) return;

        const lat = Number(facility.latitude);
        const lng = Number(facility.longitude);

        const marker = L.marker([lat, lng], { title: facility.name, riseOnHover: true });
        marker.bindPopup(this.createFacilityPopup(facility), { maxWidth: 320 });
        // attach id for lookups
        marker.facility_id = facility.facility_id;

        // add to markerGroup safely
        if (this.markerGroup && typeof this.markerGroup.addLayer === 'function') {
            this.markerGroup.addLayer(marker);
        } else if (this.map) {
            marker.addTo(this.map);
        }
    });

    // Fit map to markers if bounds valid
    try {
        if (this.markerGroup && typeof this.markerGroup.getBounds === 'function') {
            const bounds = this.markerGroup.getBounds();
            if (bounds && bounds.isValid && bounds.isValid()) {
                this.map.fitBounds(bounds.pad(0.12), { maxZoom: 14, animate: true });
            } else if (this.userLocation) {
                this.map.setView([this.userLocation.lat, this.userLocation.lng], 10);
            }
        } else if (this.userLocation) {
            this.map.setView([this.userLocation.lat, this.userLocation.lng], 10);
        }
    } catch (err) {
        console.warn('FitBounds failed (safe to ignore):', err);
    }

    this.updateFacilitiesList();
}

    addFacilityMarker(facility) {
        const marker = L.marker([facility.latitude, facility.longitude])
            .addTo(this.map)
            .bindPopup(this.createFacilityPopup(facility));

        this.markers.push(marker);
        return marker;
    }

    createFacilityPopup(facility) {
        return `
            <div class="facility-popup">
                <h3>${facility.name}</h3>
                <p><strong>Address:</strong><br>${facility.address}</p>
                ${facility.contact ? `<p><strong>Contact:</strong> ${facility.contact}</p>` : ''}
                ${facility.operating_hours ? `<p><strong>Hours:</strong><br>${facility.operating_hours}</p>` : ''}
                ${facility.website ? `<p><a href="${facility.website}" target="_blank">Visit Website</a></p>` : ''}
            </div>
        `;
    }

    updateFacilitiesList() {
        const container = document.getElementById('facilities-list');
        if (!container) return;

        if (this.facilities.length === 0) {
            container.innerHTML = '<div class="loading">No facilities found</div>';
            return;
        }

        const facilitiesHTML = this.facilities.map(facility => {
            const distance = this.userLocation ? 
                window.app.calculateDistance(
                    this.userLocation.lat, 
                    this.userLocation.lng, 
                    facility.latitude, 
                    facility.longitude
                ).toFixed(1) : null;

            return `
                <div class="facility-card" data-facility-id="${facility.facility_id}">
                    <div class="facility-header">
                        <h3>${facility.name}</h3>
                        ${distance ? `<span class="distance">${distance} miles</span>` : ''}
                    </div>
                    <div class="address">${facility.address}</div>
                    ${facility.contact ? `<div class="contact">📞 ${facility.contact}</div>` : ''}
                    ${facility.operating_hours ? `<div class="hours">🕒 ${facility.operating_hours}</div>` : ''}
                    ${facility.website ? `<div class="website"><a href="${facility.website}" target="_blank">🌐 Visit Website</a></div>` : ''}
                    <div class="facility-actions">
                        <button class="btn btn-secondary btn-sm" onclick="facilities.showFacilityOnMap(${facility.facility_id})">
                            Show on Map
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="facilities.getDirections(${facility.latitude}, ${facility.longitude})">
                            Get Directions
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = facilitiesHTML;
    }

    showFacilityOnMap(facilityId) {
        const facility = this.facilities.find(f => f.facility_id === facilityId);
        if (facility) {
            this.showMapView();
            this.map.setView([facility.latitude, facility.longitude], 15);
            
            // Open popup for this facility
            const marker = this.markers.find(m => 
                m.getLatLng().lat === facility.latitude && 
                m.getLatLng().lng === facility.longitude
            );
            if (marker) {
                marker.openPopup();
            }
        }
    }

    getDirections(lat, lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    }

    showMapView() {
        document.getElementById('map-container').style.display = 'block';
        document.getElementById('facilities-list').style.display = 'none';
        
        // Update button states
        document.getElementById('map-view-btn').classList.add('active');
        document.getElementById('list-view-btn').classList.remove('active');

        // Resize map
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 100);
    }

    showListView() {
        document.getElementById('map-container').style.display = 'none';
        document.getElementById('facilities-list').style.display = 'block';
        
        // Update button states
        document.getElementById('map-view-btn').classList.remove('active');
        document.getElementById('list-view-btn').classList.add('active');
    }

    useCurrentLocation() {
        if (!navigator.geolocation) {
            if (window.app) {
                window.app.showNotification('Geolocation is not supported by this browser', 'error');
            }
            return;
        }

        const button = document.getElementById('use-location-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
        button.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                this.loadNearbyFacilities();
                
                button.innerHTML = originalText;
                button.disabled = false;
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Failed to get your location';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }

                if (window.app) {
                    window.app.showNotification(message, 'error');
                }
                
                button.innerHTML = originalText;
                button.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    async loadNearbyFacilities() {
    if (!this.userLocation) return;

    try {
        // Use kilometers. If you want miles, convert here: miles * 1.60934
        const radiusKm = 50; // 50 km search radius (adjust if you want wider)
        console.log('mass-collection: starting loadNearbyFacilities', this.userLocation, 'radiusKm', radiusKm);

        const response = await window.api.getNearbyFacilities(
            this.userLocation.lat,
            this.userLocation.lng,
            radiusKm
        );

        console.log('mass-collection: /api/facilities/nearby response', response);

        // Defensive: ensure data shape
        if (!response || !Array.isArray(response.facilities)) {
            console.warn('Nearby API returned unexpected shape', response);
            if (window.app) window.app.showNotification('Unexpected response from facilities API', 'error');
            return;
        }

        this.facilities = response.facilities.map(f => {
            // convert latitude/longitude strings to numbers if necessary
            return {
                ...f,
                latitude: Number(f.latitude),
                longitude: Number(f.longitude),
                distance_km: f.distance_km !== undefined ? Number(f.distance_km) : null
            };
        });

        this.displayFacilities();

        // Center map on user location
        this.map.setView([this.userLocation.lat, this.userLocation.lng], 10);

        // Add user location marker (reuse an existing marker if you want)
        L.marker([this.userLocation.lat, this.userLocation.lng], {
            icon: L.icon({
                iconUrl: 'marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(this.map).bindPopup('Your Location').openPopup();

        if (window.app) {
            window.app.showNotification(`Found ${this.facilities.length} facilities near you`);
        }

        if (this.facilities.length === 0) {
            // show search params so we can debug in console + UI hint
            console.info('Nearby search returned 0 items. Search params:', response.searchParams);
            const container = document.getElementById('facilities-list');
            if (container) {
                container.innerHTML = `<div class="info">No facilities found within ${radiusKm} km. Try increasing the radius or use a nearby city name.</div>`;
            }
        }
    } catch (error) {
        console.error('Error loading nearby facilities:', error);
        if (window.app) {
            window.app.showNotification('Failed to load nearby facilities', 'error');
        }
    }
}


    searchLocation() {
        const locationInput = document.getElementById('location-input');
        const query = locationInput.value.trim();
        
        if (!query) return;

        // Simple geocoding using Nominatim (OpenStreetMap)
        this.geocodeLocation(query);
    }

    async geocodeLocation(query) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const results = await response.json();
            
            if (results.length > 0) {
                const location = results[0];
                this.userLocation = {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lon)
                };
                
                this.loadNearbyFacilities();
            } else {
                if (window.app) {
                    window.app.showNotification('Location not found', 'error');
                }
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            if (window.app) {
                window.app.showNotification('Failed to search location', 'error');
            }
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }
}

// Export for global use
window.FacilitiesModule = FacilitiesModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacilitiesModule;
}