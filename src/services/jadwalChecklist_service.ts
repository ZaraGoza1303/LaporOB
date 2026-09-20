import type { CreateJadwalChecklistReq, UpdateJadwalChecklistReq } from "../dto/jadwal_checklist.js";
import type { IJadwalChecklistRepository } from "../repositories/jadwalChecklist_repository.interface.js";
import type { IChecklistHarianService } from "./checklistHarian_service.interface.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, JadwalChecklistUncheckedCreateInput, JadwalChecklistUncheckedUpdateInput } from "../generated/prisma/models.js";
import { handlePrismaError } from "../utils/error.js";
import type { IJadwalChecklistService } from "./jadwalChecklist_service.interface.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import { CHECKLIST_STATUS, NOTIFICATION_TITLE, NOTIFICATION_TYPE, NOTIFICATION_MESSAGE, REF_TIPE, USER_ROLE, HARI } from "../utils/constants.js";
import type { BulkNotificationData } from "../types/notification.js";

export class JadwalChecklistService implements IJadwalChecklistService {
    private jadwalRepo: IJadwalChecklistRepository;
    private checklistHarianService: IChecklistHarianService;
    private notificationService: INotificationService;
    private usersService: IUsersService;

    constructor(
        jadwalRepo: IJadwalChecklistRepository,
        checklistHarianService: IChecklistHarianService,
        notificationService: INotificationService,
        usersService: IUsersService,
    ) {
        this.jadwalRepo = jadwalRepo;
        this.checklistHarianService = checklistHarianService;
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
            };

            const now = new Date();
            // Kolom tanggal bertipe date di Postgres, jadi simpan tengah malam UTC dari tanggal WIB
            const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
            const todayName = HARI[now.getDay()] ?? '';
            const hari: string[] = req.hari ?? [];
            const matching = hari.length === 0 || hari.includes(todayName);

            await this.jadwalRepo.transaction(async (tx) => {
                await tx.jadwalChecklist.create({ data: dataToInsert });

                if (matching) {
                    // skipDuplicates = jadwal yang sama untuk hari yang sama tidak bikin instance dobel
                    await tx.checklist_harian.createMany({
                        data: [{
                            tanggal: today,
                            nama_tugas: dataToInsert.nama_tugas,
                            ob_id: dataToInsert.ob_id ?? null,
                            lantai_id: dataToInsert.lantai_id,
                            kategori_id: dataToInsert.kategori_id,
                            status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
                            catatan: null,
                        }],
                        skipDuplicates: true,
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
            const now = new Date();
            const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

            const matching = await this.jadwalRepo.getMatchingToday(today);
            if (matching.length === 0) return 0;

            // Dedupe dalam batch = unique index DB memperlakukan ob_id NULL sebagai nilai berbeda,
            // jadi jadwal tanpa OB yang isinya sama harus dibuang di sini dulu
            const unik = new Map<string, Checklist_harianUncheckedCreateInput>();
            for (const jadwal of matching) {
                const key = `${jadwal.nama_tugas}|${jadwal.lantai_id}|${jadwal.ob_id ?? ""}`;
                if (unik.has(key)) continue;

                unik.set(key, {
                    tanggal: today,
                    nama_tugas: jadwal.nama_tugas,
                    ob_id: jadwal.ob_id,
                    lantai_id: jadwal.lantai_id,
                    kategori_id: jadwal.kategori_id,
                    status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
                    catatan: null,
                });
            }

            // Insert sehari dalam satu statement yang sudah ada
            const inserted = await this.checklistHarianService.insertMany([...unik.values()]);
            if (inserted === 0) return 0;

            await this.sendNotificationToAllOb(null);
            return inserted;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    private async sendNotificationToAllOb(pengirimId: string | null): Promise<void> {
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
