import type { IStorageService } from './storage_service.interface.js';

export class CloudStorageService implements IStorageService {
    async uploadFile(file: Express.Multer.File): Promise<string> {
        try {
            // 1. OPSI A: Jika PM menyiapkan server upload REST API kustom
            // Kita bisa kirim file buffer via POST request dengan FormData
            const targetUrl = process.env.CLOUD_UPLOAD_URL;
            const apiKey = process.env.CLOUD_UPLOAD_API_KEY;

            if (targetUrl) {
                const formData = new FormData();
                const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
                formData.append('file', blob, file.originalname);

                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new AppError(`Cloud server upload failed with status ${response.status}`, 500);
                }

                const data: any = await response.json();
                // Anda tinggal sesuaikan path response JSON dari server PM Anda
                return data.url || data.secure_url || data.filePath;
            }

            // 2. OPSI B: Jika menggunakan SDK Cloudinary (Nanti perlu: npm install cloudinary)
            /*
            import { v2 as cloudinary } from 'cloudinary';
            cloudinary.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET
            });
            return new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream({ folder: 'lapor_ob' }, (error, result) => {
                if (error) return reject(error);
                resolve(result!.secure_url);
              }).end(file.buffer);
            });
            */

            // 3. OPSI C: Jika menggunakan AWS S3 / R2 (Nanti perlu: npm install @aws-sdk/client-s3)
            /*
            import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from '../utils/error';
            const s3 = new S3Client({ region: process.env.AWS_REGION });
            const filename = `${Date.now()}-${file.originalname}`;
            await s3.send(new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: filename,
              Body: file.buffer,
              ContentType: file.mimetype
            }));
            return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${filename}`;
            */

            // Fallback fallback / mock url jika env belum diset lengkap
            console.warn("CLOUD_UPLOAD_URL tidak di-set di .env, mengembalikan mock URL.");
            return `https://cloud-storage.mock/uploads/${Date.now()}-${file.originalname}`;
        } catch (err: any) {
            console.error("Cloud storage upload error:", err.message);
            throw new AppError(`Cloud storage upload failed: ${err.message}`, 500);
        }
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
            console.log(`Menghapus file dari cloud: ${fileUrlOrKey}`);
            // Lakukan panggilan API untuk menghapus file di server PM / Cloudinary / S3
            // Contoh untuk kustom API:
            /*
            if (process.env.CLOUD_DELETE_URL) {
              await fetch(`${process.env.CLOUD_DELETE_URL}?url=${encodeURIComponent(fileUrlOrKey)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${process.env.CLOUD_UPLOAD_API_KEY}` }
              });
            }
            */
        } catch (err: any) {
            console.error(`Gagal menghapus file dari cloud: ${fileUrlOrKey}`, err.message);
        }
    }
}
