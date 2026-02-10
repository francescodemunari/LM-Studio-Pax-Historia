const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'paxhistoria',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

async function restore() {
    try {
        console.log('Restoring nations table...');
        await pool.query('DROP TABLE IF EXISTS game_saves CASCADE');
        await pool.query('DROP TABLE IF EXISTS nations CASCADE');

        await pool.query(`
            CREATE TABLE nations (
                id SERIAL PRIMARY KEY,
                code VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(20),
                leader_name VARCHAR(100),
                leader_title VARCHAR(50),
                ideology VARCHAR(50),
                is_major_power BOOLEAN DEFAULT false
            )
        `);

        console.log('Restoring game_saves table...');
        await pool.query(`
            CREATE TABLE game_saves (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                player_nation_id INTEGER REFERENCES nations(id),
                "current_date" VARCHAR(20),
                turn_number INTEGER DEFAULT 1
            )
        `);

        const nationsSeed = [
            { code: 'ITA', name: 'Italia', color: '#ff4d4d', leader: 'Benito Mussolini', title: 'Duce', ideology: 'fascist', major: true },
            { code: 'GER', name: 'Germania', color: '#4d4d4d', leader: 'Adolf Hitler', title: 'Führer', ideology: 'fascist', major: true },
            { code: 'SOV', name: 'Unione Sovietica', color: '#cc0000', leader: 'Iosif Stalin', title: 'Segretario Generale', ideology: 'communist', major: true },
            { code: 'GBR', name: 'Regno Unito', color: '#ff9900', leader: 'Stanley Baldwin', title: 'Primo Ministro', ideology: 'democratic', major: true },
            { code: 'FRA', name: 'Francia', color: '#33ccff', leader: 'Albert Lebrun', title: 'Presidente', ideology: 'democratic', major: true },
            { code: 'USA', name: 'Stati Uniti', color: '#3333ff', leader: 'Franklin D. Roosevelt', title: 'Presidente', ideology: 'democratic', major: true },
            { code: 'JAP', name: 'Giappone', color: '#ffffff', leader: 'Hirohito', title: 'Imperatore', ideology: 'fascist', major: true }
        ];

        console.log('Seeding nations...');
        for (const n of nationsSeed) {
            await pool.query(
                `INSERT INTO nations (code, name, color, leader_name, leader_title, ideology, is_major_power)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [n.code, n.name, n.color, n.leader, n.title, n.ideology, n.major]
            );
        }

        console.log('Database restoration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error during restoration:', err);
        process.exit(1);
    }
}

restore();
