export interface IStorageService {
    uploadFile(file: Express.Multer.File): Promise<string>;
    deleteFile(fileUrlOrKey: string): Promise<void>;
    updateFile(newFile: Express.Multer.File, oldFileUrlOrKey: string): Promise<string>;
}
