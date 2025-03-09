import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Generates a random API key
 */
export function generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes an API key for storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, 10);
}

/**
 * Verifies an API key against its hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
    return bcrypt.compare(apiKey, hash);
} 