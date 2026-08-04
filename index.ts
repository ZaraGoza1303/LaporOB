import './src/utils/load_env.js';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import connectDB from './src/database/db.js';
import profileRouter from './src/routes/profile.js';
import authRouter from './src/routes/auth.js';
import obRouter from './src/routes/ob.js';
import obLaporanRouter from './src/routes/obLaporan.js';
import obTugasRouter from './src/routes/obTugas.js';
import adminUserManagementRouter from './src/routes/userManagement.js';
import adminRouter from './src/routes/admin.js';
import karyawanRouter from './src/routes/karyawan.js';
import lokasiRouter from './src/routes/lokasi.js';
import checklistHarianRouter from './src/routes/checklistHarian.js';
import jadwalChecklistRouter from './src/routes/jadwalChecklist.js';
import constantsRouter from './src/routes/constants.js';
import skillRouter from './src/routes/skill.js';
import achievementRouter from './src/routes/achievement.js';
import lantaiRouter from './src/routes/lantai.js';
import ruanganRouter from './src/routes/ruangan.js';
import kategoriRouter from './src/routes/kategori.js';
import tugasRouter from './src/routes/tugas.js';
import notifikasiRouter from './src/routes/notifikasi.js';
import obKolaborasiRouter from './src/routes/obKolaborasi.js';
import settingRouter from './src/routes/setting.js';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import YAML from 'yamljs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { initWebSocket } from './src/services/websocket_service.js';
import { setBaseUrlMiddleware } from './src/middleware/setBaseUrl.js';
import { checklistHarianService, jadwalChecklistService, skillService, achievementService } from './src/container.js';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

const app = express();
const server = createServer(app);
initWebSocket(server)

const upload = multer();
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
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
app.set('trust proxy', 1);

app.use('/uploads', express.static('uploads'));
app.use(upload.any());

const initRouter = () => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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
}

const startApp = async () => {
    await connectDB();
    initRouter();

    cron.schedule('0 0 * * *', async () => {
        try {
            const count = await jadwalChecklistService.generateToday();
            if (count > 0) console.log(`[CRON] Generated ${count} daily checklists`);
        } catch (err) {
            console.error('[CRON] Gagal generate checklist harian:', err);
        }
    });

    cron.schedule('0 1 * * *', async () => {
        const skillCount = await skillService.prosesSkillOtomatis();
        if (skillCount > 0) console.log(`[CRON] Unlocked ${skillCount} new OB skills`);
        const achievementCount = await achievementService.prosesOtomatis();
        if (achievementCount > 0) console.log(`[CRON] Unlocked ${achievementCount} new OB achievements`);
    });

    server.listen(process.env.APP_PORT, () => { console.log("Server Nyala cik") })
}

startApp();
