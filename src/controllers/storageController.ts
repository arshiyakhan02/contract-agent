import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save to the configured local storage path
        cb(null, config.LOCAL_STORAGE_PATH);
    },
    filename: (req, file, cb) => {
        // Preserve original name or add timestamp to avoid collisions
        // For this use case, we might want to keep it simple or allow overwriting if same name
        cb(null, file.originalname);
    },
});

export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

export class StorageController {

    /**
     * Endpoint: POST /api/v1/storage/upload
     * Upload a PDF template.
     */
    async uploadFile(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            logger.info(`File uploaded: ${req.file.filename}`);

            return res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    filename: req.file.filename,
                    path: req.file.path,
                    size: req.file.size
                }
            });
        } catch (error: any) {
            logger.error('Error in uploadFile:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export const storageController = new StorageController();
