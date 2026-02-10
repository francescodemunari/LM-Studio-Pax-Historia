const express = require('express');
const router = express.Router();
const GameEngine = require('../services/game-engine');

const engine = new GameEngine();

// Create new game
router.post('/new', async (req, res) => {
    try {
        const { nationCode, startDate } = req.body;

        if (!nationCode) {
            return res.status(400).json({ error: 'nationCode is required' });
        }

        const game = await engine.createGame(
            nationCode.toUpperCase(),
            startDate || '1936-01-01'
        );

        res.json(game);
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: error.message });
    }
});

// Load game
router.get('/load/:saveId', async (req, res) => {
    try {
        const game = await engine.loadGame(req.params.saveId);
        res.json(game);
    } catch (error) {
        console.error('Error loading game:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all saves
router.get('/saves', async (req, res) => {
    try {
        const saves = await engine.getSaves();
        res.json(saves);
    } catch (error) {
        console.error('Error fetching saves:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete save
router.delete('/saves/:saveId', async (req, res) => {
    try {
        await engine.deleteSave(req.params.saveId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting save:', error);
        res.status(500).json({ error: error.message });
    }
});

// Advance time
router.post('/advance', async (req, res) => {
    try {
        const { saveId, timeJump } = req.body;

        if (!saveId || !timeJump) {
            return res.status(400).json({ error: 'saveId and timeJump are required' });
        }

        // Broadcast that time advancement is starting
        if (req.app.locals.broadcast) {
            req.app.locals.broadcast({
                type: 'time_advance_start',
                saveId: saveId,
                timeJump: timeJump
            });
        }

        const result = await engine.advanceTime(saveId, timeJump);

        // Broadcast completion (if websocket is available)
        if (req.app.locals.broadcast) {
            req.app.locals.broadcast({
                type: 'time_advance_complete',
                saveId: saveId,
                data: result
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error advancing time:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current game state
router.get('/state/:saveId', async (req, res) => {
    try {
        const context = await engine.getGameContext(req.params.saveId);
        res.json(context);
    } catch (error) {
        console.error('Error fetching game state:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rename save
router.patch('/saves/:saveId', async (req, res) => {
    try {
        const { name } = req.body;

        await engine.renameSave(req.params.saveId, name);

        res.json({ success: true });
    } catch (error) {
        console.error('Error renaming save:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
