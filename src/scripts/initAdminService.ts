import dotenv from 'dotenv';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { hashApiKey } from '../utils/apiKey';

dotenv.config();

async function initAdminService() {
    const serviceRepository = new ServiceRepository();

    try {
        // Check if admin service already exists
        const existing = await serviceRepository.findByName('admin-service');
        if (existing) {
            console.log('Admin service already exists');
            return;
        }

        // Create admin service with full permissions
        const apiKeyHash = await hashApiKey(process.env.ADMIN_SERVICE_API_KEY!);
        await serviceRepository.create({
            name: process.env.ADMIN_SERVICE_NAME!,
            apiKeyHash,
            allowedServices: [] // Admin service has implicit access to everything
        });

        console.log('Admin service created successfully');
    } catch (error) {
        console.error('Failed to initialize admin service:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    initAdminService();
} 