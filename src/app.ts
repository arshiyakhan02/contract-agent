import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import apiRoutes from './routes/api';
import { logger } from './utils/logger';

const app: Express = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
import path from 'path';
app.use(express.static(path.join(__dirname, '../public')));

// Request Logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', env: config.NODE_ENV });
});

// // DocuSign OAuth Redirect URL
// app.get('/return-url', (req: Request, res: Response) => {
//     res.send('DocuSign consent successful. You can close this window.');
// });

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: config.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
