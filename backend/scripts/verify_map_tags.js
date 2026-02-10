const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

const targets = [
    'Lazio', 'Abruzzo', 'Tripoli', 'Sardegna',
    'Serbia', 'Croatia', 'Montenegro',
    'Ile_de_France', 'Midi Pyrenees', 'Algiers',
    'Kanto', 'Okinawa', 'Greater_London_Area',
    'Shaanbei', 'Yulin', 'North Yemen', 'Panama', 'Amazonas'
];

try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    console.log('Verification Results:');

    targets.forEach(targetId => {
        const region = mapData.regions.find(r => r.id === targetId || r.name === targetId);
        if (region) {
            console.log(`${targetId}: ${region.nation_code} (Color: ${region.fill})`);
        } else {
            console.log(`${targetId}: NOT FOUND`);
        }
    });

} catch (err) {
    console.error('Error reading map data:', err);
}
