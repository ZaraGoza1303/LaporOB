import './src/utils/load_env.js';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import connectDB from './src/database/db.js';
import userRouter from './src/routes/user.js';
import authRouter from './src/routes/auth.js';
import obRouter from './src/routes/ob.js';
import adminRouter from './src/routes/admin.js';
import karyawanRouter from './src/routes/karyawan.js';
import lokasiRouter from './src/routes/lokasi.js';
import checklistHarianRouter from './src/routes/checklistHarian.js';
import lantaiRouter from './src/routes/lantai.js';
import ruanganRouter from './src/routes/ruangan.js';
import kategoriRouter from './src/routes/kategori.js';
import tugasRouter from './src/routes/tugas.js';
import notifikasiRouter from './src/routes/notifikasi.js';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import YAML from 'yamljs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { initWebSocket } from './src/services/websocket_service';
import { setBaseUrlMiddleware } from './src/middleware/setBaseUrl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

const app = express();
const server = createServer(app);
initWebSocket(server)

const upload = multer();
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Origin'
    ],
    credentials: true,
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(setBaseUrlMiddleware);

app.use('/uploads', express.static('uploads'));
app.use(upload.any());

const initRouter = () => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.use('/api/user', userRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/ob', obRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/karyawan', karyawanRouter);
    app.use('/api/lokasi', lokasiRouter);
    app.use('/api/checklist-harian', checklistHarianRouter);
    app.use('/api/lantai', lantaiRouter);
    app.use('/api/ruangan', ruanganRouter);
    app.use('/api/kategori', kategoriRouter);
    app.use('/api/tugas', tugasRouter);
    app.use('/api/notifikasi', notifikasiRouter);
}

const startApp = async () => {
    await connectDB();
    initRouter();
    server.listen(process.env.APP_PORT, () => { console.log("Server Nyala cik") })
}

startApp();
