import { fileTypeFromBuffer } from "file-type";

const ALLOWED_EXT = ['jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1mb

export async function validateImageFile(file: Express.Multer.File) {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, message: "Ukuran gambar maksimal adalah 1MB" };
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || !ALLOWED_EXT.includes(detectedType.ext)) {
    return { ok: false, message: "Format gambar harus JPEG, JPG, atau PNG asli!" };
  }

  return { ok: true, ext: detectedType.ext };
}
