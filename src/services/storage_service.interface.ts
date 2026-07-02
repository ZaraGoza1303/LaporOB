export interface IStorageService {
    uploadFile(file: Express.Multer.File): Promise<string>;
    deleteFile(fileUrlOrKey: string): Promise<void>;
}
