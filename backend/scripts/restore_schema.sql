-- Pax Historia: Fresh Start Schema Restoration
-- This script recovers the essential tables needed for the application to run with the new HOI4 map system.

-- Nations Table: Stores metadata about countries
CREATE TABLE IF NOT EXISTS nations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_local VARCHAR(100),
    color VARCHAR(20) DEFAULT '#cccccc',
    leader_name VARCHAR(100),
    leader_title VARCHAR(50) DEFAULT 'Leader',
    ideology VARCHAR(50) DEFAULT 'neutral',
    government_type VARCHAR(50) DEFAULT 'Republic',
    capital VARCHAR(100),
    population BIGINT DEFAULT 0,
    military_strength INT DEFAULT 10,
    is_major_power BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game Saves Table: Stores overall game session info
CREATE TABLE IF NOT EXISTS game_saves (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    player_nation_id INTEGER REFERENCES nations(id),
    current_date DATE DEFAULT '1936-01-01',
    turn_number INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: Units and Regions are currently handled via JSON or will be added later.
