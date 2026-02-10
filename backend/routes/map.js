const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const GameEngine = require('../services/game-engine');

const engine = new GameEngine();
const nationsPath = path.join(__dirname, '../../data/nations_v2.json');

function getNations() {
    if (fs.existsSync(nationsPath)) {
        return JSON.parse(fs.readFileSync(nationsPath, 'utf-8'));
    }
    return {};
}

// Get map data (HOI4 States from SVG)
router.get('/geojson', async (req, res) => {
    try {
        const mapPath = path.join(__dirname, '../../data/hoi4_map.json');

        if (fs.existsSync(mapPath)) {
            const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
            res.json(mapData);
        } else {
            res.status(404).json({ error: 'Map data not found', path: mapPath });
        }
    } catch (error) {
        console.error('Error loading map data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get map colors for nations
router.get('/colors', async (req, res) => {
    try {
        const nations = getNations();

        // Create a map of nation code to color
        const colors = {};
        for (const code in nations) {
            if (nations.hasOwnProperty(code)) {
                const nation = nations[code];
                colors[code] = {
                    color: nation.color,
                    name: nation.name
                };
            }
        }

        res.json(colors);
    } catch (error) {
        console.error('Error fetching nation colors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search map features
router.get('/search/:query', async (req, res) => {
    try {
        const searchTerm = req.params.query.toLowerCase();
        const nationsData = getNations();
        const results = [];

        // Search nations
        for (const code in nationsData) {
            if (nationsData.hasOwnProperty(code)) {
                const nation = nationsData[code];
                if (nation.name.toLowerCase().includes(searchTerm) ||
                    (nation.name_local && nation.name_local.toLowerCase().includes(searchTerm)) ||
                    code.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'nation',
                        id: code,
                        name: nation.name,
                        detail: nation.capital, // Assuming capital is a property in nations_v2.json
                        color: nation.color,
                        category: 'Nations'
                    });
                }
            }
        }

        // Limit results to 10 for now, similar to original SQL LIMIT
        res.json(results.slice(0, 10));
    } catch (error) {
        console.error('Error searching map:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get nation info for map popup
router.get('/nation/:code', async (req, res) => {
    try {
        const nations = getNations();
        const nation = nations[req.params.code.toUpperCase()];

        if (!nation) {
            return res.status(404).json({ error: 'Nation not found' });
        }

        res.json(nation);
    } catch (error) {
        console.error('Error fetching nation info:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get nation info with game state
router.get('/nation/:code/state/:saveId', async (req, res) => {
    try {
        const gameState = await engine.loadGame(req.params.saveId);
        const nations = getNations();
        const nation = nations[req.params.code.toUpperCase()];
        const nationState = gameState.nations[req.params.code.toUpperCase()] || {};

        if (!nation) {
            return res.status(404).json({ error: 'Nation not found' });
        }

        res.json({
            ...nation,
            ...nationState
        });
    } catch (error) {
        console.error('Error fetching nation state:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get cities data
router.get('/cities', async (req, res) => {
    try {
        const citiesPath = path.join(__dirname, '../../data/cities.json');
        if (fs.existsSync(citiesPath)) {
            const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
            res.json(cities);
        } else {
            res.json([]); // Return empty list if no cities defined
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
