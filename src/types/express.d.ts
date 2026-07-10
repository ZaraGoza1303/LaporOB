import { Readable } from "stream";

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        stream: Readable;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}
