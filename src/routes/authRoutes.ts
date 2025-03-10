import { Router, Response, NextFunction, RequestHandler } from 'express';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { verifyLimiter } from '../middleware/rateLimiter';
import { AuthenticatedRequest } from '../middleware/serviceAuth';

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
 * Verify service credentials and permissions
 * @route POST /api/auth/verify
 */
router.post('/verify',
    verifyLimiter,
    createHandler(async (req, res) => {
        // Log the full request details
        console.log('Auth Verification Request:', {
            headers: {
                apiKey: req.get('X-API-Key'),
                serviceName: req.get('X-Service-Name'),
                targetService: req.get('X-Target-Service')
            },
            body: req.body,
            method: req.method,
            path: req.path
        });

        const apiKey = req.get('X-API-Key');
        const serviceName = req.get('X-Service-Name');
        const targetService = req.get('X-Target-Service');

        if (!apiKey || !serviceName) {
            console.log('Missing credentials:', { apiKey, serviceName });
            res.status(401).json({ error: 'Missing authentication credentials' });
            return;
        }

        // Validate service credentials
        const service = await serviceRepository.validateApiKey(serviceName, apiKey);
        console.log('Service validation result:', {
            serviceName,
            found: !!service,
            serviceDetails: service
        });

        if (!service) {
            res.status(401).json({ error: 'Invalid authentication credentials' });
            return;
        }

        // If accessing another service, check permissions
        if (targetService) {
            const hasAccess = await serviceRepository.canAccessService(service.id, targetService);
            console.log('Service access check:', {
                serviceId: service.id,
                targetService,
                hasAccess
            });

            if (!hasAccess) {
                res.status(403).json({ error: `Service does not have permission to access ${targetService}` });
                return;
            }
        }

        // Return service details
        res.json({
            id: service.id,
            name: service.name,
            allowedServices: service.allowedServices
        });
    })
);

export default router; 