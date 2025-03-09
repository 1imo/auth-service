import { Pool } from 'pg';

interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    port?: number;
}

const dbConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432')
};

export const pools = {
    auth: new Pool({
        ...dbConfig,
        database: 'auth'
    })
}; 