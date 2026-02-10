const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

const searchTerms = [
    'Paris', 'London', 'Berlin', 'Rome', 'Lazio', 'Ile', 'Brand', 'Attica', 'Athens', 'Tokyo', 'Kanto'
];

try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    console.log('Search Results:');

    mapData.regions.forEach(region => {
        const name = region.name.toLowerCase();
        const id = region.id.toLowerCase();

        for (const term of searchTerms) {
            const lowerTerm = term.toLowerCase();
            if (name.includes(lowerTerm) || id.includes(lowerTerm)) {
                console.log(`Match for "${term}": ID="${region.id}", Name="${region.name}"`);
            }
        }
    });

} catch (err) {
    console.error('Error reading map data:', err);
}
