const fs = require('fs');
const path = require('path');

const nationsPath = path.join(__dirname, '..', '..', 'data', 'nations_v2.json');
const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

function mapRegions() {
    console.log('Mapping SVG regions to HOI4 tags...');

    if (!fs.existsSync(nationsPath)) {
        console.error('Nations data not found!');
        return;
    }

    if (!fs.existsSync(mapPath)) {
        console.error('Map data not found!');
        return;
    }

    const nations = JSON.parse(fs.readFileSync(nationsPath, 'utf-8'));
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

    // Create color -> tag mapping
    const colorToTag = {};
    Object.entries(nations).forEach(([tag, data]) => {
        if (data.color) {
            // Store as uppercase for easier matching
            colorToTag[data.color.toUpperCase()] = tag;
        }
    });

    console.log(`Created mapping for ${Object.keys(colorToTag).length} unique nation colors.`);

    let mappedCount = 0;
    let fallbackCount = 0;

    mapData.regions.forEach(region => {
        const hex = region.nation_code ? region.nation_code.toUpperCase() : null;

        if (hex && colorToTag[hex]) {
            region.nation_code = colorToTag[hex];
            mappedCount++;
        } else {
            // Keep the hex if no match, it might be a colony or minor with different color coding
            fallbackCount++;
        }
    });

    console.log(`Mapping complete:`);
    console.log(`- Successfully tagged: ${mappedCount} regions`);
    console.log(`- Remained as HEX: ${fallbackCount} regions`);

    fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2));
    console.log('Updated data/hoi4_map.json saved.');
}

mapRegions();
