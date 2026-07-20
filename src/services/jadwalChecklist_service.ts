import type { CreateJadwalChecklistReq, UpdateJadwalChecklistReq } from "../dto/jadwal_checklist.js";
import type { IJadwalChecklistRepository } from "../repositories/jadwalChecklist_repository.interface.js";
import type { IChecklistHarianRepository } from "../repositories/checklistHarian_repository.interface.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";
import type { JadwalChecklistUncheckedCreateInput, JadwalChecklistUncheckedUpdateInput } from "../generated/prisma/models.js";
import { handlePrismaError } from "../utils/error.js";
import type { IJadwalChecklistService } from "./jadwalChecklist_service.interface.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import { CHECKLIST_STATUS, NOTIFICATION_TITLE, NOTIFICATION_TYPE, NOTIFICATION_MESSAGE, REF_TIPE, USER_ROLE, HARI } from "../utils/constants.js";
import type { BulkNotificationData } from "../dto/notification.js";

export class JadwalChecklistService implements IJadwalChecklistService {
    private jadwalRepo: IJadwalChecklistRepository;
    private checklistRepo: IChecklistHarianRepository;
    private notificationService: INotificationService;
    private usersService: IUsersService;

    constructor(
        jadwalRepo: IJadwalChecklistRepository,
        checklistRepo: IChecklistHarianRepository,
        notificationService: INotificationService,
        usersService: IUsersService,
    ) {
        this.jadwalRepo = jadwalRepo;
        this.checklistRepo = checklistRepo;
        this.notificationService = notificationService;
        this.usersService = usersService;
    }

    async create(userId: string, req: CreateJadwalChecklistReq): Promise<void> {
        try {
            const dataToInsert: JadwalChecklistUncheckedCreateInput = {
                nama_tugas: req.nama_tugas,
                kategori_id: req.kategori_id,
                lantai_id: req.lantai_id,
                ob_id: req.ob_id ?? null,
                hari: req.hari ?? [],
                tanggal_ulang: req.tanggal_ulang ?? null,
                tanggal_spesifik: req.tanggal_spesifik ?? [],
                tanggal_mulai: new Date(req.tanggal_mulai),
                tanggal_selesai: new Date(req.tanggal_selesai),
            };

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tanggalMulai: Date = new Date(req.tanggal_mulai);
            const tanggalSelesai: Date = new Date(req.tanggal_selesai);
            const hari: string[] = req.hari ?? [];
            const tanggalSpesifik: Date[] = (req.tanggal_spesifik ?? []).map(d => new Date(d));
            const matching = await this.getMatchingTodayForJadwal(
                tanggalMulai,
                tanggalSelesai,
                hari,
                tanggalSpesifik,
                req.tanggal_ulang ?? null,
                today,
            );

            await this.jadwalRepo.transaction(async (tx) => {
                await tx.jadwalChecklist.create({ data: dataToInsert });

                if (matching) {
                    await tx.checklist_harian.create({
                        data: {
                            tanggal: today,
                            nama_tugas: dataToInsert.nama_tugas,
                            ob_id: dataToInsert.ob_id ?? null,
                            lantai_id: dataToInsert.lantai_id,
                            kategori_id: dataToInsert.kategori_id,
                            status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
                            catatan: null,
                        },
                    });
                }
            });

            if (matching) {
                await this.sendNotificationToAllOb(userId);
            }
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getByID(jadwalId: string): Promise<JadwalChecklist | null> {
        try {
            return await this.jadwalRepo.getByID(jadwalId);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getAll(): Promise<JadwalChecklist[]> {
        try {
            return await this.jadwalRepo.getAll();
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async update(jadwalId: string, req: UpdateJadwalChecklistReq): Promise<void> {
        try {
            const dataToUpdate: JadwalChecklistUncheckedUpdateInput = {};
            if (req.nama_tugas !== undefined) dataToUpdate.nama_tugas = req.nama_tugas;
            if (req.kategori_id !== undefined) dataToUpdate.kategori_id = req.kategori_id;
            if (req.lantai_id !== undefined) dataToUpdate.lantai_id = req.lantai_id;
            if (req.ob_id !== undefined) dataToUpdate.ob_id = req.ob_id ?? null;
            if (req.hari !== undefined) dataToUpdate.hari = req.hari;
            if (req.tanggal_ulang !== undefined) dataToUpdate.tanggal_ulang = req.tanggal_ulang ?? null;
            if (req.tanggal_spesifik !== undefined) dataToUpdate.tanggal_spesifik = req.tanggal_spesifik;
            if (req.tanggal_mulai !== undefined) dataToUpdate.tanggal_mulai = new Date(req.tanggal_mulai);
            if (req.tanggal_selesai !== undefined) dataToUpdate.tanggal_selesai = new Date(req.tanggal_selesai);

            await this.jadwalRepo.update(jadwalId, dataToUpdate);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async delete(jadwalId: string): Promise<void> {
        try {
            await this.jadwalRepo.delete(jadwalId);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async generateToday(): Promise<number> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const matching = await this.jadwalRepo.getMatchingToday(today);
            if (matching.length === 0) return 0;

            const existing = await this.checklistRepo.getExistingInstanceKeys(today);
            const toCreate = matching.filter(j =>
                !existing.some(e =>
                    e.nama_tugas === j.nama_tugas &&
                    e.lantai_id === j.lantai_id &&
                    e.ob_id === j.ob_id
                )
            );

            if (toCreate.length === 0) return 0;

            for (const jadwal of toCreate) {
                await this.checklistRepo.insertFromJadwal(jadwal);
            }

            await this.sendNotificationToAllOb("system");
            return toCreate.length;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    private async getMatchingTodayForJadwal(
        tanggalMulai: Date,
        tanggalSelesai: Date,
        hari: string[],
        tanggalSpesifik: Date[],
        tanggalUlang: number | null,
        today: Date,
    ): Promise<boolean> {
        if (tanggalMulai > today) return false;
        if (tanggalSelesai < today) return false;

        const todayName = HARI[today.getDay()] ?? '';
        const todayDateNum = today.getDate();

        const hasHari = hari.length > 0;
        const hasUlang = tanggalUlang !== null && tanggalUlang !== undefined;
        const hasSpesifik = tanggalSpesifik.length > 0;

        if (!hasHari && !hasUlang && !hasSpesifik) return true;

        const hariOk = hasHari && hari.includes(todayName);
        const ulangOk = hasUlang && tanggalUlang === todayDateNum;
        const spesifikOk = hasSpesifik && tanggalSpesifik.some(d =>
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );

        return hariOk || ulangOk || spesifikOk;
    }

    private async sendNotificationToAllOb(pengirimId: string): Promise<void> {
        const allOb = await this.usersService.getByRole(USER_ROLE.OB);
        const notifData: BulkNotificationData = {
            penerima_ids: allOb.map(ob => ob.id),
            pengirim_id: pengirimId,
            tipe: NOTIFICATION_TYPE.PENUGASAN_CHECKLIST,
            judul: NOTIFICATION_TITLE.PENUGASAN_CHECKLIST,
            pesan: NOTIFICATION_MESSAGE.ADMIN_MENUGASKAN_OB,
            ref_tipe: REF_TIPE.CHECKLIST,
        };

        await this.notificationService.sendBulkNotification(notifData);
    }
}
