import './utils/load_env.js';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import connectDB from './database/db.js';
import profileRouter from './routes/profile.js';
import authRouter from './routes/auth.js';
import obRouter from './routes/ob.js';
import obLaporanRouter from './routes/obLaporan.js';
import obTugasRouter from './routes/obTugas.js';
import adminUserManagementRouter from './routes/userManagement.js';
import adminRouter from './routes/admin.js';
import karyawanRouter from './routes/karyawan.js';
import lokasiRouter from './routes/lokasi.js';
import checklistHarianRouter from './routes/checklistHarian.js';
import jadwalChecklistRouter from './routes/jadwalChecklist.js';
import constantsRouter from './routes/constants.js';
import skillRouter from './routes/skill.js';
import achievementRouter from './routes/achievement.js';
import lantaiRouter from './routes/lantai.js';
import ruanganRouter from './routes/ruangan.js';
import kategoriRouter from './routes/kategori.js';
import tugasRouter from './routes/tugas.js';
import notifikasiRouter from './routes/notifikasi.js';
import obKolaborasiRouter from './routes/obKolaborasi.js';
import settingRouter from './routes/setting.js';
import publicSettingRouter from './routes/publicSetting.js';
import hrUsersRouter from './routes/hrUsers.js';
import hrPerformanceRouter from './routes/hrPerformance.js';
import hrLaporanRouter from './routes/hrLaporan.js';
import hrTugasRouter from './routes/hrTugas.js';
import hrChecklistRouter from './routes/hrChecklist.js';
import exportRouter from './routes/export.js';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import YAML from 'yamljs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { initWebSocket } from './services/websocket_service.js';
import { setBaseUrlMiddleware } from './middleware/setBaseUrl.js';
import { sendErrorResponse } from './utils/response.js';
import { initCron } from './cron/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

const app = express();
const server = createServer(app);
initWebSocket(server)

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } });
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8000',
    /\.ngrok-free\.dev$/,
    /\.ngrok\.io$/,
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        const allowed = ALLOWED_ORIGINS.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        if (allowed) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Origin',
        'Access-Control-Request-Private-Network',
    ],
    exposedHeaders: ['Access-Control-Allow-Private-Network'],
    credentials: true,
}

app.use(cors(corsOptions));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
});

app.use(express.json({ limit: '5mb' }));

app.use(setBaseUrlMiddleware);
app.set('trust proxy', 1);

app.use('/uploads', express.static('uploads'));
app.use(upload.any());

const initRouter = () => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        swaggerOptions: {
            persistAuthorization: true,
            tryItOutEnabled: true,
            requestInterceptor: (request: Record<string, unknown>) => {
                request['credentials'] = 'include';
                return request;
            },
        },
    }));
    app.use('/api/admin', adminUserManagementRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/user', profileRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/ob', obRouter);
    app.use('/api/ob', obKolaborasiRouter);
    app.use('/api/ob/laporan', obLaporanRouter);
    app.use('/api/ob/tugas', obTugasRouter);
    app.use('/api/karyawan', karyawanRouter);
    app.use('/api/lokasi', lokasiRouter);
    app.use('/api/checklist-harian', checklistHarianRouter);
    app.use('/api/lantai', lantaiRouter);
    app.use('/api/ruangan', ruanganRouter);
    app.use('/api/kategori', kategoriRouter);
    app.use('/api/tugas', tugasRouter);
    app.use('/api/notifikasi', notifikasiRouter);
    app.use('/api/jadwal-checklist', jadwalChecklistRouter);
    app.use('/api/constants', constantsRouter);
    app.use('/api/skill', skillRouter);
    app.use('/api/achievement', achievementRouter);
    app.use('/api/admin/settings', settingRouter);
    app.use('/api/settings', publicSettingRouter);
    app.use('/api/hr', hrUsersRouter);
    app.use('/api/hr', hrPerformanceRouter);
    app.use('/api/hr', hrLaporanRouter);
    app.use('/api/hr', hrTugasRouter);
    app.use('/api/hr', hrChecklistRouter);
    app.use('/api/export', exportRouter);

    app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json(sendErrorResponse("Ukuran file terlalu besar (maksimal 15MB)"));
            }
            return res.status(400).json(sendErrorResponse("Gagal mengunggah file"));
        }
        return next(err);
    });
}

const startApp = async () => {
    await connectDB();
    initRouter();
    initCron();

    server.listen(process.env.APP_PORT, () => { console.log("Server Nyala cik") })
}

startApp();
