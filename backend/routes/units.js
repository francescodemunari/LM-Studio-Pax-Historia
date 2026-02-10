const express = require('express');
const router = express.Router();
const GameEngine = require('../services/game-engine');

const engine = new GameEngine();

/**
 * GET /api/units
 * Get all units or filter by nation/region
 */
router.get('/', async (req, res) => {
    try {
        const { saveId, nation_code, region_id } = req.query;
        if (!saveId) return res.status(400).json({ error: 'saveId is required' });

        const gameState = await engine.loadGame(saveId);
        let units = gameState.units || [];

        if (nation_code) {
            units = units.filter(u => u.nation_code === nation_code.toUpperCase());
        }

        if (region_id) {
            units = units.filter(u => u.region_id === region_id);
        }

        res.json(units);
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ error: 'Failed to fetch units' });
    }
});

/**
 * GET /api/units/:id
 * Get a specific unit by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { saveId } = req.query;
        if (!saveId) return res.status(400).json({ error: 'saveId is required' });

        const gameState = await engine.loadGame(saveId);
        const unit = (gameState.units || []).find(u => u.id === req.params.id);

        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        res.json(unit);
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ error: 'Failed to fetch unit' });
    }
});

/**
 * POST /api/units
 * Create a new unit
 */
router.post('/', async (req, res) => {
    try {
        const { saveId, name, unit_type, nation_code, region_id, strength, organization, experience } = req.body;

        if (!saveId || !name || !unit_type || !nation_code || !region_id) {
            return res.status(400).json({
                error: 'saveId, name, unit_type, nation_code, and region_id are required'
            });
        }

        const gameState = await engine.loadGame(saveId);

        const newUnit = {
            id: Date.now().toString(),
            name,
            unit_type,
            nation_code: nation_code.toUpperCase(),
            region_id,
            strength: strength || 100,
            organization: organization || 100,
            experience: experience || 0,
            created_at: new Date().toISOString()
        };

        if (!gameState.units) gameState.units = [];
        gameState.units.push(newUnit);

        engine.saveGame(saveId, gameState);
        res.status(201).json(newUnit);
    } catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

/**
 * PUT /api/units/:id/move
 * Move unit to a different region
 */
router.put('/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { saveId, to_region_id } = req.body;

        if (!saveId || !to_region_id) {
            return res.status(400).json({ error: 'saveId and to_region_id are required' });
        }

        const gameState = await engine.loadGame(saveId);
        const unit = (gameState.units || []).find(u => u.id === id);

        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        const from_region_id = unit.region_id;
        unit.region_id = to_region_id;
        unit.updated_at = new Date().toISOString();

        engine.saveGame(saveId, gameState);

        res.json({
            message: 'Unit moved successfully',
            unit,
            movement: { from_region_id, to_region_id, arrives_at: new Date().toISOString() }
        });
    } catch (error) {
        console.error('Error moving unit:', error);
        res.status(500).json({ error: 'Failed to move unit' });
    }
});

module.exports = router;
