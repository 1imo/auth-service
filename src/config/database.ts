import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables first!
dotenv.config();

// Log the actual env variables we're using
console.log('Database configuration:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    database: 'auth'
});

// Create the pool with proper credentials
export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'papstorea', // Use env var with fallback
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'auth'
});

// Add error handler
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Function to list all databases
export async function listDatabases() {
    try {
        const result = await pool.query(`
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false
            ORDER BY datname;
        `);
        console.log('Available databases:', result.rows.map(row => row.datname));
    } catch (error) {
        console.error('Error listing databases:', error);
    }
}

// Simple connection test
pool.query('SELECT NOW()')
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection failed:', err)); 