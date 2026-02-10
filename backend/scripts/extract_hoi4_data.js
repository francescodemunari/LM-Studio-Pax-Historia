const fs = require('fs');
const path = require('path');

// Paths
const baseDir = path.join(__dirname, '..', '..');
const rawDataDir = path.join(baseDir, 'raw_data');
const countriesDir = path.join(rawDataDir, 'countries');
const tagsPath = path.join(rawDataDir, 'country_tags', '00_countries.txt');
const outputPath = path.join(baseDir, 'data', 'nations_v2.json');

/**
 * Simple parser for HOI4 .txt files
 */
function parseHoi4File(content) {
    const data = {};

    // Extract color
    const colorMatch = content.match(/color\s*=\s*{\s*(\d+)\s+(\d+)\s+(\d+)\s*}/);
    if (colorMatch) {
        const r = parseInt(colorMatch[1]);
        const g = parseInt(colorMatch[2]);
        const b = parseInt(colorMatch[3]);
        data.color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    return data;
}

async function extractData() {
    console.log('Starting data extraction from HOI4 files...');

    if (!fs.existsSync(tagsPath)) {
        console.error('Tags file not found:', tagsPath);
        return;
    }

    const tagsContent = fs.readFileSync(tagsPath, 'utf-8');
    const tagsLines = tagsContent.split('\n');
    const nations = {};

    for (const line of tagsLines) {
        // Match TAG = "countries/Filename.txt"
        const match = line.match(/^([A-Z0-9]{3})\s*=\s*"([^"]+)"/);
        if (match) {
            const tag = match[1];
            const countryFileRel = match[2];
            const countryFilePath = path.join(baseDir, countryFileRel);

            const name = path.basename(countryFileRel, '.txt');

            nations[tag] = {
                code: tag,
                name: name,
                filePath: countryFilePath,
                leader_name: "Unknown Leader",
                leader_title: "Leader",
                ideology: "neutral",
                is_major_power: ['GER', 'ENG', 'SOV', 'USA', 'FRA', 'ITA', 'JAP'].includes(tag)
            };

            if (fs.existsSync(countryFilePath)) {
                const countryContent = fs.readFileSync(countryFilePath, 'utf-8');
                const extracted = parseHoi4File(countryContent);
                if (extracted.color) {
                    nations[tag].color = extracted.color;
                }
            } else {
                console.warn(`File not found for ${tag}: ${countryFilePath}`);
                nations[tag].color = "#cccccc"; // Default
            }
        }
    }

    // Save to JSON
    fs.writeFileSync(outputPath, JSON.stringify(nations, null, 2));
    console.log(`Successfully extracted ${Object.keys(nations).length} nations to ${outputPath}`);
}

extractData().catch(console.error);
