import { Request, Response, NextFunction } from 'express';
import { ServiceRepository } from '../repositories/ServiceRepository';

export interface AuthenticatedRequest extends Request {
    service?: {
        id: string;
        name: string;
        allowedServices: string[];
    };
}

export const serviceAuth = (serviceRepository: ServiceRepository) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const apiKey = req.get('X-API-Key');
        const serviceName = req.get('X-Service-Name');

        if (!apiKey || !serviceName) {
            res.status(401).json({ error: 'Missing authentication credentials' });
            return;
        }

        try {
            const service = await serviceRepository.validateApiKey(serviceName, apiKey);

            if (!service) {
                res.status(401).json({ error: 'Invalid authentication credentials' });
                return;
            }

            // If accessing another service, check permissions
            const targetService = req.get('X-Target-Service');
            if (targetService) {
                const hasAccess = await serviceRepository.canAccessService(service.id, targetService);
                if (!hasAccess) {
                    res.status(403).json({ error: 'Service does not have permission to access target service' });
                    return;
                }
            }

            (req as AuthenticatedRequest).service = {
                id: service.id,
                name: service.name,
                allowedServices: service.allowedServices
            };

            next();
        } catch (error) {
            console.error('Service authentication error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    };
};