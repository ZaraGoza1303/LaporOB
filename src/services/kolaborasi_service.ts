import type { IKolaborasiService } from "./kolaborasi_service.interface.js";
import type { IKolaborasiRepository } from "../repositories/kolaborasi_repository.interface.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { GabungResponse, DaftarGabungItem } from "../dto/kolaborasi.js";
import type { NotificationData } from "../dto/notification.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { NOTIFICATION_TYPE, NOTIFICATION_TITLE, NOTIFICATION_MESSAGE, KOLABORASI_STATUS } from "../utils/constants.js";

export class KolaborasiService implements IKolaborasiService {
    private kolaborasiRepo: IKolaborasiRepository;
    private laporanService: ILaporanService;
    private notificationService: INotificationService;

    constructor(
        kolaborasiRepo: IKolaborasiRepository,
        laporanService: ILaporanService,
        notificationService: INotificationService
    ) {
        this.kolaborasiRepo = kolaborasiRepo;
        this.laporanService = laporanService;
        this.notificationService = notificationService;
    }

    async gabung(laporanId: string, obId: string): Promise<GabungResponse> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (!laporan.ob_id) throw new AppError("Laporan belum diambil oleh OB manapun", 400);
            if (laporan.ob_id === obId) throw new AppError("Anda sudah menjadi OB utama laporan ini", 400);
            if (!laporan.is_kolaborasi_open) throw new AppError("Kolaborasi belum dibuka oleh OB pemilik laporan", 400);

            const existing = await this.kolaborasiRepo.findByLaporanAndOb(laporanId, obId);
            if (existing) {
                if (existing.status === KOLABORASI_STATUS.PENDING) throw new AppError("Permintaan gabung sudah dikirim, tunggu persetujuan", 409);
                if (existing.status === KOLABORASI_STATUS.APPROVED) throw new AppError("Anda sudah tergabung dalam laporan ini", 409);
                if (existing.status === KOLABORASI_STATUS.REJECTED) throw new AppError("Permintaan gabung sebelumnya ditolak", 409);
            }

            const kolaborasi = await this.kolaborasiRepo.create(laporanId, obId);

            const notifData: NotificationData = {
                penerima_id: laporan.ob_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.GABUNG_LAPORAN,
                judul: NOTIFICATION_TITLE.GABUNG_LAPORAN,
                pesan: NOTIFICATION_MESSAGE.GABUNG_LAPORAN,
                ref_id: laporanId,
                ref_tipe: "KOLABORASI",
            };
            await this.notificationService.sendNotification(notifData);

            return {
                id: kolaborasi.id,
                laporan_id: kolaborasi.laporan_id,
                ob_id: kolaborasi.ob_id,
                status: kolaborasi.status,
                created_at: kolaborasi.created_at.toISOString(),
            };
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async setujui(kolaborasiId: string, laporanId: string, primaryObId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== primaryObId) throw new AppError("Hanya OB utama yang bisa menyetujui", 403);

            const kolaborasi = await this.kolaborasiRepo.findById(kolaborasiId);
            if (!kolaborasi) throw new AppError("Permintaan tidak ditemukan", 404);
            if (kolaborasi.laporan_id !== laporanId) throw new AppError("Permintaan tidak sesuai dengan laporan", 400);
            if (kolaborasi.status !== KOLABORASI_STATUS.PENDING) throw new AppError("Permintaan sudah diproses", 400);

            await this.kolaborasiRepo.updateStatus(kolaborasiId, KOLABORASI_STATUS.APPROVED);

            const notifData: NotificationData = {
                penerima_id: kolaborasi.ob_id,
                pengirim_id: primaryObId,
                tipe: NOTIFICATION_TYPE.GABUNG_DISETUJUI,
                judul: NOTIFICATION_TITLE.GABUNG_DISETUJUI,
                pesan: NOTIFICATION_MESSAGE.GABUNG_DISETUJUI,
                ref_id: laporanId,
                ref_tipe: "KOLABORASI",
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async tolak(kolaborasiId: string, laporanId: string, primaryObId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== primaryObId) throw new AppError("Hanya OB utama yang bisa menolak", 403);

            const kolaborasi = await this.kolaborasiRepo.findById(kolaborasiId);
            if (!kolaborasi) throw new AppError("Permintaan tidak ditemukan", 404);
            if (kolaborasi.laporan_id !== laporanId) throw new AppError("Permintaan tidak sesuai dengan laporan", 400);
            if (kolaborasi.status !== KOLABORASI_STATUS.PENDING) throw new AppError("Permintaan sudah diproses", 400);

            await this.kolaborasiRepo.updateStatus(kolaborasiId, KOLABORASI_STATUS.REJECTED);

            const notifData: NotificationData = {
                penerima_id: kolaborasi.ob_id,
                pengirim_id: primaryObId,
                tipe: NOTIFICATION_TYPE.GABUNG_DITOLAK,
                judul: NOTIFICATION_TITLE.GABUNG_DITOLAK,
                pesan: NOTIFICATION_MESSAGE.GABUNG_DITOLAK,
                ref_id: laporanId,
                ref_tipe: "KOLABORASI",
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async daftarRequest(laporanId: string, obId: string): Promise<DaftarGabungItem[]> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== obId) throw new AppError("Hanya OB utama yang bisa melihat permintaan", 403);

            const requests = await this.kolaborasiRepo.findPendingByLaporanId(laporanId);
            return requests.map((r) => ({
                id: r.id,
                ob: r.ob,
                status: r.status,
                created_at: r.created_at.toISOString(),
            }));
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async isKolaborator(laporanId: string, obId: string): Promise<boolean> {
        const kolaborasi = await this.kolaborasiRepo.findByLaporanAndOb(laporanId, obId);
        return !!kolaborasi && kolaborasi.status === KOLABORASI_STATUS.APPROVED;
    }

    async keluar(laporanId: string, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (!laporan.ob_id) throw new AppError("Laporan belum diambil OB manapun", 400);
            if (laporan.ob_id === obId) throw new AppError("OB utama tidak bisa keluar, gunakan batalkan laporan", 400);

            const kolaborasi = await this.kolaborasiRepo.findApprovedByLaporanAndOb(laporanId, obId);
            if (!kolaborasi) throw new AppError("Anda tidak tergabung dalam laporan ini", 404);

            await this.kolaborasiRepo.delete(kolaborasi.id);

            const notifData: NotificationData = {
                penerima_id: laporan.ob_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.KELUAR_KOLABORASI,
                judul: NOTIFICATION_TITLE.KELUAR_KOLABORASI,
                pesan: NOTIFICATION_MESSAGE.KELUAR_KOLABORASI,
                ref_id: laporanId,
                ref_tipe: "KOLABORASI",
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async keluarkan(kolaborasiId: string, laporanId: string, primaryObId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== primaryObId) throw new AppError("Hanya OB utama yang bisa mengeluarkan anggota", 403);

            const kolaborasi = await this.kolaborasiRepo.findById(kolaborasiId);
            if (!kolaborasi) throw new AppError("Anggota tidak ditemukan", 404);
            if (kolaborasi.laporan_id !== laporanId) throw new AppError("Data tidak sesuai dengan laporan", 400);
            if (kolaborasi.status !== KOLABORASI_STATUS.APPROVED) throw new AppError("Anggota tidak dalam status aktif", 400);

            await this.kolaborasiRepo.delete(kolaborasiId);

            const notifData: NotificationData = {
                penerima_id: kolaborasi.ob_id,
                pengirim_id: primaryObId,
                tipe: NOTIFICATION_TYPE.DIKELUARKAN_KOLABORASI,
                judul: NOTIFICATION_TITLE.DIKELUARKAN_KOLABORASI,
                pesan: NOTIFICATION_MESSAGE.DIKELUARKAN_KOLABORASI,
                ref_id: laporanId,
                ref_tipe: "KOLABORASI",
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
