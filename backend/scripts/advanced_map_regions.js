const fs = require('fs');
const path = require('path');

const nationsPath = path.join(__dirname, '..', '..', 'data', 'nations_v2.json');
const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

// Priority list: High priority tags override low priority ones for the same color
const TAG_PRIORITY = [
    'SOV', 'GER', 'ITA', 'JAP', 'USA', 'ENG', 'FRA', 'CHI', 'YUG', 'POL', 'CZE',
    'ROM', 'HUN', 'BUL', 'GRE', 'TUR', 'SPA', 'SPR', 'POR', 'SWE', 'NOR', 'DEN',
    'FIN', 'EST', 'LAT', 'LIT', 'ETH', 'AFG', 'IRA', 'SAU', 'YUN', 'GXC', 'SHX', 'XSM', 'SIK',
    'AST', 'NZL', 'MAN', 'MEN', 'PRC', 'SIA', 'INS', 'RAJ', 'SAF', 'CAN',
    'TIB', 'URG', 'BRA', 'ARG', 'CHL', 'COL', 'VEN', 'PER', 'ECU', 'BOL', 'PAR', 'PAN', 'YEM'
];

function getPriority(tag) {
    const index = TAG_PRIORITY.indexOf(tag);
    // If found, return index (lower is better, so we invert or just compare)
    // Let's say higher score = better.
    // If in list: score = list.length - index
    // If not in list: score = -1
    return index !== -1 ? TAG_PRIORITY.length - index : -1;
}

function advancedMapRegions() {
    console.log('Starting advanced mapping with TWO-PASS propagation and PRIORITY system...');

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

    // Manual mappings for identifying "Anchor" regions
    const anchorMappings = {
        // China
        'Yunnan': 'YUN',
        'Guangxi': 'GXC',
        'Shanxi': 'SHX',
        'Xibei San Ma': 'XSM',
        'Sinkiang': 'SIK',
        'Communist China': 'PRC',
        'China': 'CHI',
        'Manchukuo': 'MAN',
        'Mengkukuo': 'MEN',
        'Beijing': 'CHI',
        'Beiping': 'CHI',
        'Nanjing': 'CHI',
        'Shanghai': 'CHI',
        'Guangzhou': 'GXC',
        'Hankou': 'CHI',
        'Chengdu': 'CHI',
        'Fujian': 'CHI',
        'Zhejiang': 'CHI',
        'Jiangsu': 'CHI',
        'Shandong': 'CHI',
        // Majors
        'Moscow': 'SOV',
        'Leningrad': 'SOV',
        'Stalingrad': 'SOV',
        'Washington': 'USA',
        'Greater_London_Area': 'ENG',
        'Lazio': 'ITA',
        'Latium': 'ITA',
        'Sardegna': 'ITA',
        'Rome': 'ITA', // Keep just in case name matches
        'Tokyo': 'JAP',
        'Kyoto': 'JAP',
        'Kanto': 'JAP',
        'Tohoku': 'JAP',
        'Kansai': 'JAP',
        'Kyushu': 'JAP',
        'Shikoku': 'JAP',
        'Ile_de_France': 'FRA',
        'Paris': 'FRA',
        'Brandenburg': 'GER',
        'Berlin': 'GER',
        'Vienna': 'AUS',
        'Lower Austria': 'AUS',
        'Prague': 'CZE',
        'Bohemia': 'CZE',
        'Warsaw': 'POL',
        'Mazovia': 'POL',
        'Budapest': 'HUN',
        'Bucharest': 'ROM',
        'Sofia': 'BUL',
        'Attica': 'GRE',
        'Athens': 'GRE',
        'Ankara': 'TUR',
        'Istanbul': 'TUR',
        'Helsinki': 'FIN',
        'Uusimaa': 'FIN',
        'Stockholm': 'SWE',
        'Oslo': 'NOR',
        'Copenhagen': 'DEN',
        'Sjaelland': 'DEN',
        'Brussels': 'BEL',
        'Amsterdam': 'HOL',
        'Luxembourg': 'LUX',
        'Bern': 'SWI',
        'Dublin': 'IRE',
        'Cairo': 'EGY',
        'Baghdad': 'IRQ',
        'Tehran': 'PER',
        'Riyadh': 'SAU',
        'Addis Ababa': 'ETH',
        'Manila': 'PHI',
        'Bangkok': 'SIA',
        'Kabul': 'AFG',
        'Ulaanbaatar': 'MON',
        'Singapore': 'ENG',
        'Hong_Kong': 'ENG',
        'Burma': 'ENG',
        'Sumatra': 'INS',
        'Java': 'INS',
        'Borneo': 'INS',
        'Southern Indochina': 'FRA',
        'Indochina': 'FRA',
        'Tunisia': 'FRA',
        'Jehol': 'MAN',
        'Liaoning': 'MAN',
        'Kirin': 'MAN',
        'Heilungkiang': 'MAN',
        'Qinghai': 'XSM',
        'Haixi': 'XSM',
        'Khotan': 'SIK',
        'Taklamakan': 'SIK',
        'Central Australia': 'AST',
        'New South Wales': 'AST',
        'Queensland': 'AST',
        'Victoria': 'AST',
        'Western Australia': 'AST',
        'Northern Territory': 'AST',
        'South Australia': 'AST',
        'Tasmania': 'AST',
        'North Island': 'NZL',
        'South Island': 'NZL',
        'Nagqu': 'TIB',
        'Lhasa': 'TIB',
        'Ningxia': 'XSM',
        'Urumqi': 'SIK',
        'Chahar': 'MEN',
        'Montevideo': 'URG',
        'Amazonas': 'BRA',
        'Rio de Janeiro': 'BRA',
        'Sao Paulo': 'BRA',
        'Santiago': 'CHL',
        'Buenos Aires': 'ARG',
        'Buenos Aires': 'ARG',
        'Lima': 'PER',
        'La Libertad': 'COL',
        'Cundinamarca': 'COL',
        'Zulia': 'VEN',
        'Miranda': 'VEN',
        'Santa Cruz': 'BOL',
        'La Paz': 'BOL',
        'Panama': 'PAN',
        'Sagaing': 'ENG', // Burma
        'Mandalay': 'ENG',
        'North Yemen': 'YEM',
        'Shaanbei': 'PRC',
        'Yulin': 'PRC',
        'Algiers': 'FRA',
        'Morocco': 'FRA',
        'Macau': 'POR',
        'Goa': 'POR',
        'Laos': 'LAO',
        'Cambodia': 'CAM',
        'Vietnam': 'VIN',
        'Belgrade': 'YUG',
        'Serbia': 'YUG' // Force Serbia to be YUG primarily for the 1936 start
    };

    const nameToTag = {};
    Object.entries(nations).forEach(([tag, data]) => {
        nameToTag[data.name.toLowerCase()] = tag;
    });

    const colorToTagsCount = {}; // HEX -> { tag: count }

    // PASS 1: Identify anchor regions and build HEX -> Tag dictionary
    mapData.regions.forEach(region => {
        const id = region.id;
        const name = region.name;
        const fill = region.fill ? region.fill.toUpperCase() : null;

        let tag = null;

        // Try anchor/manual match
        if (anchorMappings[id]) tag = anchorMappings[id];
        else if (anchorMappings[name]) tag = anchorMappings[name];
        // Try exact name match
        else if (nameToTag[name.toLowerCase()]) tag = nameToTag[name.toLowerCase()];
        // Try exact ID match
        else if (nameToTag[id.toLowerCase()]) tag = nameToTag[id.toLowerCase()];

        if (tag && fill && fill !== 'NONE') {
            // Apply straight away for anchors
            if (anchorMappings[id] || anchorMappings[name]) {
                region.nation_code = tag;
            }

            if (!colorToTagsCount[fill]) colorToTagsCount[fill] = {};
            colorToTagsCount[fill][tag] = (colorToTagsCount[fill][tag] || 0) + 1;
        }
    });

    // Determine the winning tag for each color based on PRIORITY then COUNT
    const colorToWinningTag = {};
    Object.entries(colorToTagsCount).forEach(([color, counts]) => {
        let bestTag = null;
        let bestScore = -Infinity; // Combination of Priority and Count

        // We want Priority to be the dominant factor.
        // Let's say Priority adds 1000 * PriorityIndex
        // Count adds 1 * Count

        Object.entries(counts).forEach(([tag, count]) => {
            const priority = getPriority(tag);
            const score = (priority * 10000) + count;

            if (score > bestScore) {
                bestScore = score;
                bestTag = tag;
            }
        });
        colorToWinningTag[color] = bestTag;
    });

    console.log(`Identified ${Object.keys(colorToWinningTag).length} mapping rules from colors.`);

    // PASS 2: Propagate tags to all regions with known colors
    let totalMapped = 0;
    let fallbackHex = 0;

    mapData.regions.forEach(region => {
        const fill = region.fill ? region.fill.toUpperCase() : null;

        // If regions was already hard-set by an anchor in Pass 1, keep it (optional, but safer)
        // Actually, we WANT color propogation to override even some name matches if the name match was weak,
        // BUT anchors are strong.
        // Let's check:
        // If it has a nation_code that is 3 chars long, it was likely an anchor or exact match.
        // But if the "Winning Tag" for this color has high priority, maybe we should enforce it?
        // No, anchors should be absolute.

        if (region.nation_code && region.nation_code.length === 3 && (anchorMappings[region.id] || anchorMappings[region.name])) {
            // Keep it
            totalMapped++;
        } else if (fill && colorToWinningTag[fill]) {
            region.nation_code = colorToWinningTag[fill];
            totalMapped++;
        } else if (region.nation_code && region.nation_code.length === 3) {
            // Matched by name but not color-ruled? Keep it.
            totalMapped++;
        } else {
            fallbackHex++;
        }
    });

    console.log(`Mapping complete:`);
    console.log(`- Total regions tagged: ${totalMapped}`);
    console.log(`- Regions left as HEX/Unknown: ${fallbackHex}`);

    fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2));
    console.log('Updated data/hoi4_map.json saved.');
}

advancedMapRegions();
