import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Create different rate limiters for different endpoints
export const createServiceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each service to 100 requests per windowMs
    message: { error: 'Too many requests from this service, please try again later' },
    keyGenerator: (req: Request) => req.get('X-Service-Name') ?? req.ip ?? 'unknown', // Always return a string
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limits for sensitive operations
export const adminOperationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit to 50 admin operations per hour
    message: { error: 'Too many admin operations, please try again later' },
    keyGenerator: (req: Request) => req.get('X-Service-Name') ?? req.ip ?? 'unknown',
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict limits for key rotation
export const keyRotationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // Limit to 10 key rotations per day
    message: { error: 'Too many key rotation requests, please try again later' },
    keyGenerator: (req: Request) => req.get('X-Service-Name') ?? req.ip ?? 'unknown',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for verify endpoint
 * 100 requests per 15 minutes
 */
export const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many verification attempts, please try again later' }
}); 