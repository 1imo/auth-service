/**
 * Represents a user in the system
 */
export interface User {
    /** Unique identifier for the user */
    id: string;
    /** User's email address */
    email: string;
    /** User's hashed password */
    passwordHash: string;
    /** User's role (admin, company_user, etc) */
    role: 'admin' | 'company_user';
    /** ID of the company this user belongs to (if company_user) */
    companyId?: string;
    /** Whether the user is active */
    isActive: boolean;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
} 