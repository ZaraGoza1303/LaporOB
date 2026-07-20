import type { PrismaClient, Prisma } from "../generated/prisma/client.js";
import { HARI } from "../utils/constants.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";
import type { JadwalChecklistUncheckedCreateInput, JadwalChecklistUncheckedUpdateInput } from "../generated/prisma/models.js";
import type { IJadwalChecklistRepository } from "./jadwalChecklist_repository.interface.js";

export class JadwalChecklistRepository implements IJadwalChecklistRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        return this.db.$transaction(fn);
    }

    async insert(req: JadwalChecklistUncheckedCreateInput): Promise<JadwalChecklist> {
        return this.db.jadwalChecklist.create({ data: req });
    }

    async getByID(jadwalId: string): Promise<JadwalChecklist | null> {
        return this.db.jadwalChecklist.findFirst({
            where: { id: jadwalId },
            include: { kategori: true, lantai: { include: { lokasi: true } }, ob: true },
        });
    }

    async getAll(): Promise<JadwalChecklist[]> {
        return this.db.jadwalChecklist.findMany({
            orderBy: { created_at: 'desc' },
            include: { kategori: true, lantai: { include: { lokasi: true } }, ob: true },
        });
    }

    async update(jadwalId: string, req: JadwalChecklistUncheckedUpdateInput): Promise<void> {
        await this.db.jadwalChecklist.update({
            where: { id: jadwalId },
            data: req,
        });
    }

    async delete(jadwalId: string): Promise<void> {
        await this.db.jadwalChecklist.delete({
            where: { id: jadwalId },
        });
    }

    async getMatchingToday(today: Date): Promise<JadwalChecklist[]> {
        const todayName = HARI[today.getDay()] ?? '';
        const todayDateNum = today.getDate();

        const templates = await this.db.jadwalChecklist.findMany({
            where: {
                tanggal_mulai: { lte: today },
                tanggal_selesai: { gte: today },
            },
        });

        return templates.filter(t => {
            const hasHari = t.hari.length > 0;
            const hasUlang = t.tanggal_ulang !== null;
            const hasSpesifik = t.tanggal_spesifik.length > 0;

            if (!hasHari && !hasUlang && !hasSpesifik) return true;

            const hariOk = hasHari && t.hari.includes(todayName);
            const ulangOk = hasUlang && t.tanggal_ulang === todayDateNum;
            const spesifikOk = hasSpesifik && t.tanggal_spesifik.some(d =>
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate()
            );

            return hariOk || ulangOk || spesifikOk;
        });
    }

    async getExistingInstanceKeys(today: Date): Promise<Array<{ nama_tugas: string; lantai_id: string; ob_id: string | null }>> {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        return this.db.checklist_harian.findMany({
            where: { tanggal: { gte: startOfDay, lte: endOfDay } },
            select: { nama_tugas: true, lantai_id: true, ob_id: true },
        });
    }
}
