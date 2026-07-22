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

        const templates = await this.db.jadwalChecklist.findMany();

        return templates.filter(t => {
            if (t.hari.length === 0) return true;
            return t.hari.includes(todayName);
        });
    }
}
