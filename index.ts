import './src/utils/load_env.js';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import connectDB from './src/database/db.js';
import userRouter from './src/routes/user.js';
import authRouter from './src/routes/auth.js';
import { validateOnlyOneFile } from './src/utils/validate_file.js';

const app = express();
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
app.use('/uploads', express.static('uploads'));
app.use(upload.any());
app.use(validateOnlyOneFile);

const initRouter = () => {
    app.use('/api/user', userRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/kategori', kategoriRouter);
}

const startApp = async () => {
    await connectDB();
    initRouter();
    app.listen(process.env.APP_PORT, () => { console.log("Server Nyala cik") })
}

startApp();
