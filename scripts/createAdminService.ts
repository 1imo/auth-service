import dotenv from 'dotenv';
import { Pool } from 'pg';
import { hashApiKey } from '../src/utils/apiKey';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function createAdminService() {
    try {
        // Get credentials from environment variables
        const adminServiceName = process.env.ADMIN_SERVICE_NAME;
        const adminServiceApiKey = process.env.ADMIN_SERVICE_API_KEY;

        if (!adminServiceName || !adminServiceApiKey) {
            throw new Error('Admin service credentials not found in environment variables');
        }

        // Hash the API key
        const apiKeyHash = await hashApiKey(adminServiceApiKey);

        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert admin service
            const serviceResult = await client.query(
                `INSERT INTO services (name, api_key_hash, is_active, created_at, updated_at)
                 VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT (name) DO UPDATE
                 SET api_key_hash = $2, updated_at = CURRENT_TIMESTAMP
                 RETURNING id`,
                [adminServiceName, apiKeyHash]
            );

            const adminServiceId = serviceResult.rows[0].id;

            // Give admin service permission to access all other services
            await client.query(
                `INSERT INTO service_permissions (service_id, allowed_service_id)
                 SELECT $1, id FROM services WHERE name != $2
                 ON CONFLICT DO NOTHING`,
                [adminServiceId, adminServiceName]
            );

            await client.query('COMMIT');
            console.log('Admin service created successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating admin service:', error);
    } finally {
        await pool.end();
    }
}

createAdminService().catch(console.error); 