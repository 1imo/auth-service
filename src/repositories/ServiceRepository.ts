import { Pool } from 'pg';
import { Service } from '../interfaces/Service';
import { pool } from '../config/database';
import { verifyApiKey } from '../utils/apiKey';

export class ServiceRepository {
    private readonly db: Pool;

    constructor() {
        this.db = pool;
    }

    async findById(id: string): Promise<Service | null> {
        const result = await this.db.query(
            `SELECT s.*, ARRAY_AGG(sp.allowed_service_id) as allowed_services
             FROM services s
             LEFT JOIN service_permissions sp ON sp.service_id = s.id
             WHERE s.id = $1
             GROUP BY s.id`,
            [id]
        );
        return result.rows[0] || null;
    }

    async findByName(name: string): Promise<Service | null> {
        const result = await this.db.query(
            `SELECT s.*, ARRAY_AGG(sp.allowed_service_id) as allowed_services
             FROM services s
             LEFT JOIN service_permissions sp ON sp.service_id = s.id
             WHERE s.name = $1
             GROUP BY s.id`,
            [name]
        );
        return result.rows[0] || null;
    }

    async validateApiKey(serviceName: string, plainApiKey: string): Promise<Service | null> {
        // First get the service by name
        const result = await this.db.query(
            `SELECT s.*, ARRAY_AGG(sp.allowed_service_id) as allowed_services
             FROM services s
             LEFT JOIN service_permissions sp ON sp.service_id = s.id
             WHERE s.name = $1 AND s.is_active = true
             GROUP BY s.id`,
            [serviceName]
        );

        const service = result.rows[0];
        if (!service) return null;

        // Verify the plain API key against the stored hash
        const isValid = await verifyApiKey(plainApiKey, service.api_key_hash);
        if (!isValid) return null;

        return service;
    }

    async canAccessService(sourceServiceId: string, targetServiceName: string): Promise<boolean> {
        const result = await this.db.query(
            `SELECT EXISTS (
                SELECT 1 FROM service_permissions sp
                JOIN services target ON target.id = sp.allowed_service_id
                WHERE sp.service_id = $1 AND target.name = $2
            )`,
            [sourceServiceId, targetServiceName]
        );
        return result.rows[0].exists;
    }

    async create(service: { name: string; apiKeyHash: string; allowedServices: string[] }): Promise<Service> {
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            // Create service
            const serviceResult = await client.query(
                'INSERT INTO services (name, api_key_hash) VALUES ($1, $2) RETURNING *',
                [service.name, service.apiKeyHash]
            );

            // Add permissions
            if (service.allowedServices.length > 0) {
                const allowedServicesResult = await client.query(
                    'SELECT id FROM services WHERE name = ANY($1)',
                    [service.allowedServices]
                );

                for (const allowedService of allowedServicesResult.rows) {
                    await client.query(
                        'INSERT INTO service_permissions (service_id, allowed_service_id) VALUES ($1, $2)',
                        [serviceResult.rows[0].id, allowedService.id]
                    );
                }
            }

            await client.query('COMMIT');

            const createdService = await this.findById(serviceResult.rows[0].id);
            if (!createdService) throw new Error('Failed to create service');
            return createdService;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async updatePermissions(id: string, allowedServices: string[]): Promise<Service> {
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            // Verify service exists
            const service = await this.findById(id);
            if (!service) throw new Error('Service not found');

            // Remove existing permissions
            await client.query(
                'DELETE FROM service_permissions WHERE service_id = $1',
                [id]
            );

            // Add new permissions
            if (allowedServices.length > 0) {
                const allowedServicesResult = await client.query(
                    'SELECT id FROM services WHERE name = ANY($1)',
                    [allowedServices]
                );

                for (const allowedService of allowedServicesResult.rows) {
                    await client.query(
                        'INSERT INTO service_permissions (service_id, allowed_service_id) VALUES ($1, $2)',
                        [id, allowedService.id]
                    );
                }
            }

            await client.query('COMMIT');

            const updatedService = await this.findById(id);
            if (!updatedService) throw new Error('Service not found after update');
            return updatedService;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async updateApiKey(id: string, apiKeyHash: string): Promise<Service> {
        await this.db.query(
            'UPDATE services SET api_key_hash = $1 WHERE id = $2',
            [apiKeyHash, id]
        );

        const service = await this.findById(id);
        if (!service) throw new Error('Service not found after update');
        return service;
    }

    async verifyApiKey(serviceName: string, apiKey: string) {
        const result = await pool.query(
            'SELECT * FROM services WHERE name = $1 AND api_key = $2',
            [serviceName, apiKey]
        );
        return result.rows[0];
    }
} 