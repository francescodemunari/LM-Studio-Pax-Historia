/**
 * City Manager
 * Handles visualization of cities on the map
 */

class CityManager {
    constructor(map) {
        this.map = map;
        this.cities = [];
        this.cityMarkers = [];

        // Create a dedicated pane for cities to stay above regions but below units
        if (!this.map.getPane('citiesPane')) {
            const pane = this.map.createPane('citiesPane');
            pane.style.zIndex = 500;
        }
    }

    /**
     * Load cities from API
     */
    async loadCities() {
        try {
            const response = await fetch('/api/map/cities');
            if (!response.ok) throw new Error('Failed to fetch cities');
            this.cities = await response.json();
            console.log(`Loaded ${this.cities.length} cities`);
            this.displayCities();
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }

    /**
     * Display cities on map
     */
    displayCities() {
        this.clearMarkers();

        this.cities.forEach(city => {
            if (!city.coords || !Array.isArray(city.coords) || city.coords.length < 2) {
                console.warn(`Skipping invalid city: ${city.name}`, city);
                return;
            }

            const icon = L.divIcon({
                className: 'city-marker',
                html: this.createCityHTML(city),
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            // Get map dimensions and scale factor
            // Default to 1400x600 scale 1.0 if not yet initialized
            const svgW = this.map.options.maxBounds ? this.map.options.maxBounds[1][1] : 600;
            const svgH = this.map.options.maxBounds ? this.map.options.maxBounds[1][0] : 1400; // Leaflet bounds are [y, x] so [1][0] is H
            const scale = gameMap.scaleFactor || 1.0;

            // Apply Manual Offsets for Visual Alignment (Estimated)
            const OFFSET_X = 35;
            const OFFSET_Y = -35;

            // Apply Scaling first (to match SVG resolution)
            const scaledX = (city.coords[0] + OFFSET_X) * scale;
            const scaledY = (city.coords[1] + OFFSET_Y) * scale;

            // Then Apply Transform: Lat = Height - Y, Lng = X
            const mapHeight = this.map.options.maxBounds ? this.map.options.maxBounds[1][0] : 600;
            const position = [mapHeight - scaledY, scaledX];

            const marker = L.marker(position, {
                icon: icon,
                pane: 'citiesPane',
                interactive: true
            });

            marker.bindTooltip(city.name, {
                permanent: true,
                direction: 'bottom',
                className: 'city-label',
                offset: [0, 8]
            });

            marker.addTo(this.map);
            console.log(`City ${city.name}: Base[${city.coords}] -> Offset[${OFFSET_X},${OFFSET_Y}] -> Scaled[${scaledX},${scaledY}] -> Leaflet[${position}]`);
            this.cityMarkers.push(marker);
        });
    }

    /**
     * Create HTML for city icon
     */
    createCityHTML(city) {
        const typeClass = city.type === 'capital' ? 'city-capital' : 'city-major';
        return `<div class="${typeClass}" title="${city.name}"></div>`;
    }

    /**
     * Clear all city markers
     */
    clearMarkers() {
        this.cityMarkers.forEach(marker => this.map.removeLayer(marker));
        this.cityMarkers = [];
    }

    /**
     * Update visibility of city labels based on zoom level
     */
    updateVisibility(zoom) {
        const labels = document.querySelectorAll('.city-label');

        // Show labels only if zoom is high enough (e.g., > 4)
        // Adjust threshold as needed based on map scale
        const showLabels = zoom >= 2;

        labels.forEach(label => {
            if (showLabels) {
                label.style.display = 'block';
                label.style.opacity = '1';
            } else {
                label.style.display = 'none';
                label.style.opacity = '0';
            }
        });

        // Also scale markers slightly based on zoom?
        // Optional polish
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CityManager;
}
