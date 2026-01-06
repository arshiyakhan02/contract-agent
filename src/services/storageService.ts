import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface IStorageService {
    uploadFile(fileBuffer: Buffer, fileName: string): Promise<string>;
    getFile(fileName: string): Promise<Buffer>;
    deleteFile(fileName: string): Promise<void>;
}

class LocalStorageService implements IStorageService {
    private storagePath: string;

    constructor() {
        this.storagePath = config.LOCAL_STORAGE_PATH;
    }

    async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
        const filePath = path.join(this.storagePath, fileName);
        await fs.promises.writeFile(filePath, fileBuffer);
        logger.info(`File stored locally at ${filePath}`);
        return filePath;
    }

    async getFile(fileName: string): Promise<Buffer> {
        const filePath = path.join(this.storagePath, fileName);
        try {
            return await fs.promises.readFile(filePath);
        } catch (error) {
            logger.error(`Error reading file ${fileName}:`, error);
            throw new Error(`File not found: ${fileName}`);
        }
    }

    async deleteFile(fileName: string): Promise<void> {
        const filePath = path.join(this.storagePath, fileName);
        try {
            await fs.promises.unlink(filePath);
            logger.info(`File deleted: ${fileName}`);
        } catch (error) {
            logger.warn(`Failed to delete file ${fileName}`, error);
        }
    }
}

// In a real app, you'd have S3StorageService, GDriveStorageService, etc.
// and a factory to choose based on config.
export const storageService = new LocalStorageService();
