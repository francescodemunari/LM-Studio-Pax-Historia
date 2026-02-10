const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const svgPath = path.join(__dirname, '../../1936.svg');
const outputPath = path.join(__dirname, '../../data/hoi4_map.json');

async function parseSVG() {
    try {
        console.log('Reading 1936.svg...');
        const svgContent = fs.readFileSync(svgPath, 'utf8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(svgContent);

        // MapChart SVGs usually have a structure like:
        // svg -> g#map-group -> svg#map -> path[]
        const mapGroup = result.svg.g.find(g => g.$ && g.$.id === 'map-group');
        const innerSvg = mapGroup.svg[0];
        const paths = innerSvg.path;

        console.log(`Found ${paths.length} paths in SVG.`);

        const regions = [];
        const colorNations = {}; // Mapping of hex colors to generic nation names or codes

        paths.forEach((p, index) => {
            const id = p.$.id || `region_${index}`;
            const d = p.$.d;
            const fill = p.$.fill || '#ffffff';

            regions.push({
                id,
                name: id.replace(/_/g, ' '),
                path: d,
                fill: fill,
                nation_code: fill.toUpperCase() // Temporarily use color as nation link
            });
        });

        const mapData = {
            viewBox: innerSvg.$.viewBox,
            width: innerSvg.$.width,
            height: innerSvg.$.height,
            regions
        };

        fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));
        console.log(`Successfully generated ${outputPath}`);
        console.log(`Unique colors found: ${new Set(regions.map(r => r.fill)).size}`);

    } catch (error) {
        console.error('Error parsing SVG:', error);
    }
}

parseSVG();
