import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { COMPRESS_THRESHOLD, MAX_UPLOAD_FILE_SIZE, formatFileSize } from "./upload.js";

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];

export async function validateImageFile(file: Express.Multer.File) {
  // Batas ini sama dengan limit Multer, sehingga tidak ada lagi dua angka berbeda.
  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return { ok: false, message: `Ukuran gambar maksimal adalah ${formatFileSize(MAX_UPLOAD_FILE_SIZE)}` };
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || !ALLOWED_EXT.includes(detectedType.ext)) {
    return { ok: false, message: "Format gambar harus JPEG, JPG, WEBP, atau PNG asli" };
  }

  return { ok: true, ext: detectedType.ext };
}

export async function compressImageIfNeeded(file: Express.Multer.File) {
    if (file.size <= COMPRESS_THRESHOLD) {
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
