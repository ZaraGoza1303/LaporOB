import fs from 'fs/promises';
import path from 'path';
import type { IStorageService } from './storage_service.interface.js';

export class LocalStorageService implements IStorageService {
    private uploadDir = 'uploads';

    constructor() {
        this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (err) {
            console.error("Failed to create uploads directory:", err);
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        const filePath = path.join(this.uploadDir, filename);
        await fs.writeFile(filePath, file.buffer);

        // Return url
        const baseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${process.env.APP_PORT || 8000}`;
        return `${baseUrl}/uploads/${filename}`;
    }

    async deleteFile(fileUrlOrKey: string): Promise<void> {
        try {
            // Extract filename from URL
            const parts = fileUrlOrKey.split('/uploads/');
            if (parts.length > 1) {
                const filename = parts[1];
                if (filename) {
                    const filePath = path.join(this.uploadDir, filename);
                    await fs.unlink(filePath);
                }
            }
        } catch (err: any) {
            console.error(`Failed to delete local file ${fileUrlOrKey}:`, err.message);
        }
    }
}
