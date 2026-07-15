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

        // Return relative path
        return `uploads/${filename}`;
    }

    async updateFile(newFile: Express.Multer.File, oldFileUrlOrKey: string): Promise<string> {
        const newPath = await this.uploadFile(newFile);

        if (oldFileUrlOrKey) {
            await this.deleteFile(oldFileUrlOrKey);
        }

        return newPath;
    }

    async deleteFile(fileUrlOrKey: string): Promise<void> {
        try {
            let filename: string | undefined;

            if (fileUrlOrKey.includes('/uploads/')) {
                // Format full URL: "http://localhost:8000/uploads/filename.jpg"
                filename = fileUrlOrKey.split('/uploads/')[1];
            } else if (fileUrlOrKey.startsWith('uploads/')) {
                // Format relative path: "uploads/filename.jpg"
                filename = fileUrlOrKey.replace('uploads/', '');
            }

            if (filename) {
                const filePath = path.join(this.uploadDir, filename);
                await fs.unlink(filePath);
            }
        } catch (err: unknown) {
            console.error(`Failed to delete local file ${fileUrlOrKey}:`);
        }
    }
}
