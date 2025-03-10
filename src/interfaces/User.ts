/**
 * Represents a user in the system
 */
export interface User {
    /** Unique identifier for the user */
    id: string;
    /** User's email address */
    email: string;
    /** User's first name */
    first_name: string;
    /** User's last name */
    last_name: string;
    /** User's hashed password */
    password_hash: string;
    /** User's role (admin, company_user, etc) */
    role: 'admin' | 'company_user';
    /** ID of the company this user belongs to (if company_user) */
    companyId?: string;
    /** Whether the user is active */
    is_active: boolean;
    /** Creation timestamp */
    created_at: Date;
    /** Last update timestamp */
    updated_at: Date;
} 