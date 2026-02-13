import { Router, Response, NextFunction, RequestHandler } from 'express';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { serviceAuth, AuthenticatedRequest } from '../middleware/serviceAuth';
import { generateApiKey, hashApiKey } from '../utils/apiKey';
import { createServiceLimiter, adminOperationLimiter, keyRotationLimiter } from '../middleware/rateLimiter';

const router = Router();
const serviceRepository = new ServiceRepository();

// Create a handler factory to reduce boilerplate
const createHandler = (
    handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
): RequestHandler => {
    return (req, res, next) => {
        handler(req as AuthenticatedRequest, res).catch(next);
    };
};

/**
 * Register a new service
 * Protected: Only admin services can register new services
 */
router.post('/',
    createServiceLimiter,
    adminOperationLimiter,
    serviceAuth(serviceRepository),
    createHandler(async (req, res) => {
        const { name, allowedServices } = req.body;

        // Check if requester is admin
        if (req.service?.name !== 'admin-service') {
            res.status(403).json({ error: 'Only admin service can register new services' });
            return;
        }

        // Generate API key
        const apiKey = generateApiKey();
        const apiKeyHash = await hashApiKey(apiKey);

        // Create service
        const service = await serviceRepository.create({
            name,
            apiKeyHash,
            allowedServices: allowedServices || []
        });

        // Return service details with plain API key
        res.status(201).json({
            ...service,
            apiKey // Only time the plain API key is sent
        });
    }));

/**
 * Update service permissions
 * Protected: Only admin services can update permissions
 */
router.put('/:id/permissions',
    createServiceLimiter,
    adminOperationLimiter,
    serviceAuth(serviceRepository),
    createHandler(async (req, res) => {
        const id = String(req.params.id);
        const { allowedServices } = req.body;

        // Check if requester is admin
        if (req.service?.name !== 'admin-service') {
            res.status(403).json({ error: 'Only admin service can update permissions' });
            return;
        }

        const service = await serviceRepository.updatePermissions(id, allowedServices);
        res.json(service);
    }));

/**
 * Rotate service API key
 * Protected: Only admin services can rotate API keys
 */
router.post('/:id/rotate-key',
    createServiceLimiter,
    keyRotationLimiter,
    serviceAuth(serviceRepository),
    createHandler(async (req, res) => {
        const id = String(req.params.id);

        // Check if requester is admin
        if (req.service?.name !== 'admin-service') {
            res.status(403).json({ error: 'Only admin service can rotate API keys' });
            return;
        }

        // Generate new API key
        const apiKey = generateApiKey();
        const apiKeyHash = await hashApiKey(apiKey);

        // Update service
        const service = await serviceRepository.updateApiKey(id, apiKeyHash);

        // Return service details with plain API key
        res.json({
            ...service,
            apiKey // Only time the plain API key is sent
        });
    }));

export default router;