import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import fs from 'fs';

// Ensure storage directory exists if using local storage
if (config.STORAGE_TYPE === 'local' && !fs.existsSync(config.LOCAL_STORAGE_PATH)) {
    fs.mkdirSync(config.LOCAL_STORAGE_PATH, { recursive: true });
}

const server = app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    logger.info(`Health check available at http://localhost:${config.PORT}/health`);
});

const shutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Closing server...`);
    server.close(() => {
        logger.info('Server closed cleanly');
        process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
