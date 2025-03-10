import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serviceAuth } from '../middleware/serviceAuth';
import { createHandler } from '../utils/routeHandler';
import { verifyLimiter } from '../middleware/rateLimiter';

const router = Router();
const userRepository = new UserRepository();
const serviceRepository = new ServiceRepository();

/**
 * Verify service credentials and permissions
 * @route POST /api/auth/verify
 */
router.post('/verify',
    verifyLimiter,
    createHandler(async (req, res) => {
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

/**
 * Authenticate user credentials
 * @route POST /api/auth/signin
 */
router.post('/signin',
    verifyLimiter,
    serviceAuth(serviceRepository),
    createHandler(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await userRepository.findByEmail(email);

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);


        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    })
);

export default router; 