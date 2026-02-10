const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

    // Find regions where nation_code starts with '#' (unmapped) or is missing
    const unmapped = mapData.regions.filter(r =>
        !r.nation_code || r.nation_code.startsWith('#')
    );

    console.log(`Found ${unmapped.length} unmapped regions.`);

    // Group by color to see if we can map whole chunks
    const byColor = {};
    unmapped.forEach(r => {
        const color = r.fill || 'NONE';
        if (!byColor[color]) byColor[color] = [];
        byColor[color].push(r.name || r.id);
    });

    Object.entries(byColor).forEach(([color, regions]) => {
        console.log(`\nColor ${color} (${regions.length} regions):`);
        // Show first 10
        console.log(regions.slice(0, 10).join(', ') + (regions.length > 10 ? '...' : ''));
    });

} catch (err) {
    console.error('Error:', err);
}
