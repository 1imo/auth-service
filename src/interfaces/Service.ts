/**
 * Represents a microservice in the system
 */
export interface Service {
    /** Unique identifier for the service */
    id: string;
    /** Service name (e.g., 'invoice-service', 'ordering-service') */
    name: string;
    /** Service API key (hashed) */
    apiKeyHash: string;
    /** Whether the service is active */
    isActive: boolean;
    /** List of other services this service can access */
    allowedServices: string[];
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
} 