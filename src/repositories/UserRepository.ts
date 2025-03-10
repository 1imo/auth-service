import { Pool } from 'pg';
import { User } from '../interfaces/User';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';

export class UserRepository {
    private readonly db: Pool;

    constructor() {
        this.db = pool;
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    async create(user: { email: string; passwordHash: string; firstName: string; lastName: string; role: string }): Promise<User> {
        const result = await this.db.query(
            `INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                role, 
                is_active
            ) VALUES ($1, $2, $3, $4, $5, true) 
            RETURNING *`,
            [user.email, user.passwordHash, user.firstName, user.lastName, user.role]
        );
        return result.rows[0];
    }
} 