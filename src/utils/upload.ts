export const MB = 1024 * 1024;

/**
 * Batas ukuran file mentah per file yang diterima Multer.
 * Satu-satunya sumber kebenaran untuk batas ukuran upload.
 * Dipakai oleh middleware Multer (src/index.ts) dan validator gambar (src/utils/validate_file.ts).
 */
export const MAX_UPLOAD_FILE_SIZE = 15 * MB;

/**
 * Batas maksimal jumlah file dalam satu request.
 * Menegakkan kontrak `max 5` yang didokumentasikan pada swagger.yaml.
 */
export const MAX_FILES_PER_REQUEST = 5;

/**
 * Ambang kompresi: file di atas ukuran ini akan dikompres sebelum disimpan.
 * Ini bukan batas penolakan, hanya pemicu kompresi.
 */
export const COMPRESS_THRESHOLD = 1 * MB;

export function formatFileSize(bytes: number): string {
    return `${bytes / MB}MB`;
}
