const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '../../');
const countryTagsPath = path.join(projectRoot, 'country_tags/00_countries.txt');
const countriesDataDir = path.join(projectRoot, 'countries');
const outputPath = path.join(projectRoot, 'data/nations_v2.json');

function parseHOI4Data() {
    try {
        console.log('Parsing country tags...');
        const tagsContent = fs.readFileSync(countryTagsPath, 'utf8');
        const tagRegex = /^([A-Z0-9]{3})\s*=\s*"([^"]+)"/gm;
        let match;
        const nations = {};

        while ((match = tagRegex.exec(tagsContent)) !== null) {
            const tag = match[1];
            const countryFile = match[2];
            nations[tag] = {
                code: tag,
                filePath: path.join(projectRoot, countryFile),
                name: path.basename(countryFile, '.txt'),
                color: '#cccccc', // Default
                leader_name: 'Unknown Leader',
                leader_title: 'Leader',
                ideology: 'neutral',
                is_major_power: ['GER', 'ENG', 'SOV', 'FRA', 'ITA', 'USA', 'JAP'].includes(tag)
            };
        }

        console.log(`Found ${Object.keys(nations).length} nations. Parsing individual country files...`);

        // Parse individual country files for colors
        Object.values(nations).forEach(nation => {
            if (fs.existsSync(nation.filePath)) {
                const content = fs.readFileSync(nation.filePath, 'utf8');

                // Color parsing: color = { 67 127 63 }
                const colorMatch = content.match(/color\s*=\s*{\s*(\d+)\s+(\d+)\s+(\d+)\s*}/);
                if (colorMatch) {
                    const r = parseInt(colorMatch[1]);
                    const g = parseInt(colorMatch[2]);
                    const b = parseInt(colorMatch[3]);
                    nation.color = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                }
            }
        });

        // Save to JSON
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(nations, null, 2));
        console.log(`Successfully generated ${outputPath}`);

    } catch (error) {
        console.error('Error parsing HOI4 data:', error);
    }
}

parseHOI4Data();
