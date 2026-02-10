const fs = require('fs');
const path = require('path');

const NATIONS_PATH = path.join(__dirname, '../../data/nations_v2.json');
const LEADERS_TEXT_PATH = path.join(__dirname, '../../country_leaders.txt');

// Predefined leaders for major powers and well-known nations
const LEADER_SEEDS = {
    'ITA': { name: 'Benito Mussolini', title: 'Duce' },
    'GER': { name: 'Adolf Hitler', title: 'Führer' },
    'SOV': { name: 'Iosif Stalin', title: 'Segretario Generale' },
    'ENG': { name: 'Stanley Baldwin', title: 'Primo Ministro' },
    'FRA': { name: 'Albert Lebrun', title: 'Presidente' },
    'USA': { name: 'Franklin D. Roosevelt', title: 'Presidente' },
    'JAP': { name: 'Hirohito', title: 'Imperatore' },
    'CHI': { name: 'Chiang Kai-shek', title: 'Generalissimo' },
    'ETH': { name: 'Haile Selassie I', title: 'Imperatore' },
    'AUS': { name: 'Kurt Schuschnigg', title: 'Cancelliere' },
    'HUN': { name: 'Miklós Horthy', title: 'Reggente' },
    'POL': { name: 'Ignacy Mościcki', title: 'Presidente' },
    'ESP': { name: 'Manuel Azaña', title: 'Presidente' },
    'SPR': { name: 'Manuel Azaña', title: 'Presidente' },
    'TUR': { name: 'Mustafa Kemal Atatürk', title: 'Presidente' },
    'GRE': { name: 'Giorgio II', title: 'Re' },
    'YUG': { name: 'Pietro II', title: 'Re' },
    'ROM': { name: 'Carlo II', title: 'Re' },
    'BUL': { name: 'Boris III', title: 'Zar' },
    'BEL': { name: 'Leopoldo III', title: 'Re' },
    'HOL': { name: 'Guglielmina', title: 'Regina' },
    'NOR': { name: 'Haakon VII', title: 'Re' },
    'SWE': { name: 'Gustavo V', title: 'Re' },
    'DEN': { name: 'Cristiano X', title: 'Re' },
    'FIN': { name: 'Kyösti Kallio', title: 'Presidente' },
    'BRA': { name: 'Getúlio Vargas', title: 'Presidente' },
    'MEX': { name: 'Lázaro Cárdenas', title: 'Presidente' },
    'CAN': { name: 'W. L. Mackenzie King', title: 'Primo Ministro' },
    'AST': { name: 'Joseph Lyons', title: 'Primo Ministro' },
    'NZL': { name: 'Michael Joseph Savage', title: 'Primo Ministro' },
    'SAF': { name: 'J. B. M. Hertzog', title: 'Primo Ministro' },
    'RAJ': { name: 'Victor Hope', title: 'Viceré' }
};

async function mergeLeaders() {
    console.log('Starting leader data merge...');

    if (!fs.existsSync(NATIONS_PATH)) {
        console.error('Nations file not found:', NATIONS_PATH);
        return;
    }

    const nations = JSON.parse(fs.readFileSync(NATIONS_PATH, 'utf8'));

    // Parse country_leaders.txt (Tag,Nazione,Note)
    if (fs.existsSync(LEADERS_TEXT_PATH)) {
        const text = fs.readFileSync(LEADERS_TEXT_PATH, 'utf8');
        const lines = text.split('\n');

        lines.forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const tag = parts[0].trim();
                const fullName = parts[1].trim();
                const note = parts[2] ? parts[2].trim() : '';

                if (nations[tag]) {
                    // Update name if missing or generic
                    if (nations[tag].name === 'Unknown' || nations[tag].name === nations[tag].code) {
                        nations[tag].name = fullName;
                    }

                    // Apply seed if available
                    if (LEADER_SEEDS[tag]) {
                        nations[tag].leader_name = LEADER_SEEDS[tag].name;
                        nations[tag].leader_title = LEADER_SEEDS[tag].title;
                    } else if (nations[tag].leader_name === 'Unknown Leader') {
                        // Fallback title based on note
                        if (note.includes('Kingdom')) {
                            nations[tag].leader_title = 'Re';
                        } else if (note.includes('Republic')) {
                            nations[tag].leader_title = 'Presidente';
                        } else {
                            nations[tag].leader_title = 'Leader';
                        }
                    }
                }
            }
        });
    }

    // Write back
    fs.writeFileSync(NATIONS_PATH, JSON.stringify(nations, null, 2));
    console.log('Leader data merge complete!');
}

mergeLeaders();
