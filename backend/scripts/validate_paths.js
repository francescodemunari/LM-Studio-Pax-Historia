const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    const viewBox = mapData.viewBox.split(' ').map(Number);
    const svgH = viewBox[3];

    console.log(`Checking ${mapData.regions.length} regions for parsing errors...`);

    let errorCount = 0;

    mapData.regions.forEach((region, index) => {
        const d = region.path;
        const commands = d.match(/[a-df-z][^a-df-z]*/ig);

        if (!commands) {
            console.log(`Region ${region.id} (${index}) has no commands.`);
            return;
        }

        commands.forEach(cmd => {
            const type = cmd[0];
            // Improved parsing: match all valid numbers including float and negative
            const args = cmd.slice(1).match(/[+-]?(\d*\.\d+|\d+)/g)?.map(Number) || [];

            // Check for NaN in args
            if (args.some(isNaN)) {
                console.error(`Region ${region.id} (${index}) has NaN values in command '${type}': ${cmd}`);
                errorCount++;
            }
        });
    });

    if (errorCount === 0) {
        console.log('No parsing errors found with simple regex logic.');
    } else {
        console.log(`Found ${errorCount} parsing errors.`);
    }

} catch (err) {
    console.error('Error reading map data:', err);
}
