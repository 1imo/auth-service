import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serviceRoutes from './routes/serviceRoutes';
import authRoutes from './routes/authRoutes';
import { pool, listDatabases } from './config/database';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database connection
async function initializeApp() {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');

        // List available databases
        await listDatabases();

        app.listen(port, () => {
            console.log(`Auth service listening on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize app:', error);
        process.exit(1);
    }
}

// Start the application
initializeApp();

export default app; 