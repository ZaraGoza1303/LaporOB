import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1mb, dicek setelah kompresi

// Cek tipe file dari magic bytes, tanpa batas ukuran supaya foto besar bisa dikompres dulu
export async function validateImageFile(file: Express.Multer.File): Promise<{ ok: true; ext: string } | { ok: false; message: string }> {
  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || !ALLOWED_EXT.includes(detectedType.ext)) {
    return { ok: false, message: "Format gambar harus JPEG, JPG, WEBP, atau PNG asli" };
  }

  return { ok: true, ext: detectedType.ext };
}

export async function compressImageIfNeeded(file: Express.Multer.File) {
  const ONE_MB = 1024 * 1024;

    if (file.size <= ONE_MB) {
        return file;
    }

    let sharpInstance = sharp(file.buffer);
    const metadata = await sharpInstance.metadata();

    if ((metadata.width && metadata.width > 1200) || (metadata.height && metadata.height > 1200)) {
        sharpInstance = sharpInstance.resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
        });
    }

    let compressedBuffer: Buffer;
    if (metadata.format === 'png') {
        // PNG dikompres menggunakan compressionLevel 
        compressedBuffer = await sharpInstance.png({ compressionLevel: 8, quality: 80 }).toBuffer();
    } else {
        // JPEG/JPG/WEBP menggunakan kualitas persen 
        compressedBuffer = await sharpInstance.jpeg({ quality: 75, progressive: true }).toBuffer();
    }

    file.buffer = compressedBuffer;
    file.size = compressedBuffer.length; 

    return file;
}

export type ImageProcessResult = { ok: true } | { ok: false; message: string; status: 400 | 500 };

// Urutan: cek tipe -> kompres -> cek ukuran, supaya foto di atas 1MB dikecilkan dulu baru dinilai
export async function processImageFile(
    file: Express.Multer.File,
    compressErrorMessage = "Gagal memproses gambar",
): Promise<ImageProcessResult> {
    const typeCheck = await validateImageFile(file);
    if (!typeCheck.ok) {
        return { ok: false, message: typeCheck.message, status: 400 };
    }

    try {
        await compressImageIfNeeded(file);
    } catch {
        return { ok: false, message: compressErrorMessage, status: 500 };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { ok: false, message: "Ukuran gambar maksimal adalah 1MB", status: 400 };
    }

    return { ok: true };
}

