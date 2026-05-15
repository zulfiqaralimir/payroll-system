import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Ensure search_path is set on every new connection (required for Neon pooler)
pool.on('connect', (client) => {
  client.query('SET search_path TO public').catch(() => {});
});

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err.message);
});

// Auto-migrate: add new columns if they don't exist yet
pool.query(`
  ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS religion TEXT,
    ADD COLUMN IF NOT EXISTS rig_bonus_eligible BOOLEAN NOT NULL DEFAULT TRUE
`).catch(err => console.error('Migration error:', err.message));

export default pool;
