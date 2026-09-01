import { PrismaClient } from "./generated/prisma/client.js";
import { AdminRepository } from "./repositories/admin_repository.js";
import { AppSettingRepository } from "./repositories/appSetting_repository.js";
import { AuthRepository } from "./repositories/auth_repository.js";
import { ChecklistHarianRepository } from "./repositories/checklistHarian_repository.js";
import { JadwalChecklistRepository } from "./repositories/jadwalChecklist_repository.js";
import { SkillRepository } from "./repositories/skill_repository.js";
import { AchievementRepository } from "./repositories/achievement_repository.js";
import { KategoriRepository } from "./repositories/kategori_repository.js";
import { LantaiRepository } from "./repositories/lantai_repository.js";
import { LaporanRepository } from "./repositories/laporan_repository.js";
import { LokasiRepository } from "./repositories/lokasi_repository.js";
import { ObRepository } from "./repositories/ob_repository.js";
import { RuanganRepository } from "./repositories/ruangan_repository.js";
import { TugasRepository } from "./repositories/tugas_repository.js";
import { UsersRepository } from "./repositories/users_repository.js";
import { UserSessionRepository } from "./repositories/userSession_repository.js";
import { AdminService } from "./services/admin_service.js";
import { AppSettingService } from "./services/appSetting_service.js";
import { AuthService } from "./services/auth_service.js";
import { ChecklistHarianService } from "./services/checklistHarian_service.js";
import { JadwalChecklistService } from "./services/jadwalChecklist_service.js";
import { ConstantsService } from "./services/constants_service.js";
import { SkillService } from "./services/skill_service.js";
import { AchievementService } from "./services/achievement_service.js";
import { KaryawanService } from "./services/karyawan_service.js";
import { KategoriService } from "./services/kategori_service.js";
import { LantaiService } from "./services/lantai_service.js";
import { LaporanService } from "./services/laporan_service.js";
import { LokasiService } from "./services/lokasi_service.js";
import { ObService } from "./services/ob_service.js";
import { RuanganService } from "./services/ruangan_service.js";
import { TugasService } from "./services/tugas_service.js";
import { UsersService } from "./services/users_service.js";
import { ProfileService } from "./services/profile_service.js";
import { StorageServiceFactory } from "./services/storage_service.factory.js";
import { UserSessionService } from "./services/userSession_service.js";
import { AdminController } from "./controllers/admin_controller.js";
import { SettingController } from "./controllers/setting_controller.js";
import { AuthController } from "./controllers/auth_controller.js";
import { ChecklistHarianController } from "./controllers/checklistHarian_controller.js";
import { JadwalChecklistController } from "./controllers/jadwalChecklist_controller.js";
import { ConstantsController } from "./controllers/constants_controller.js";
import { SkillController } from "./controllers/skill_controller.js";
import { AchievementController } from "./controllers/achievement_controller.js";
import { KaryawanController } from "./controllers/karyawan_controller.js";
import { KategoriController } from "./controllers/kategori_controller.js";
import { LantaiController } from "./controllers/lantai_controller.js";
import { LokasiController } from "./controllers/lokasi_controller.js";
import { ObController } from "./controllers/ob_controller.js";
import { RuanganController } from "./controllers/ruangan_controller.js";
import { TugasController } from "./controllers/tugas_controller.js";
import { UsersController } from "./controllers/users_controller.js";
import { NotificationRepository } from "./repositories/notification_repository.js";
import { NotificationService } from "./services/notification_service.js";
import { NotificationController } from "./controllers/notification_controller.js";
import { KolaborasiRepository } from "./repositories/kolaborasi_repository.js";
import { KolaborasiService } from "./services/kolaborasi_service.js";
import { KolaborasiController } from "./controllers/kolaborasi_controller.js";
import redisClient from "./database/redis.js";
import type { IRedisClient } from "./database/redis.interface.js";
import { EmailServiceFactory } from "./services/email_service.factory.js";

// PRISMA
const prisma = new PrismaClient();

//  REPOSITORIES 
const adminRepository = new AdminRepository(prisma);
const appSettingRepository = new AppSettingRepository(prisma);
const authRepository = new AuthRepository(prisma);
const checklistHarianRepository = new ChecklistHarianRepository(prisma);
const jadwalChecklistRepository = new JadwalChecklistRepository(prisma);
const skillRepository = new SkillRepository(prisma);
const achievementRepository = new AchievementRepository(prisma);
const kategoriRepository = new KategoriRepository(prisma);
const lantaiRepository = new LantaiRepository(prisma);
const laporanRepository = new LaporanRepository(prisma);
const lokasiRepository = new LokasiRepository(prisma);
const obRepository = new ObRepository(prisma);
const ruanganRepository = new RuanganRepository(prisma);
const tugasRepository = new TugasRepository(prisma);
const usersRepository = new UsersRepository(prisma);
const notificationRepository = new NotificationRepository(prisma);
const kolaborasiRepository = new KolaborasiRepository(prisma);
const userSessionRepository = new UserSessionRepository(prisma);

//  STORAGE 
const storageService = StorageServiceFactory.getProvider();

// EMAIL
const emailService = EmailServiceFactory.getProvider();

//  SERVICES 
const appSettingService = new AppSettingService(appSettingRepository, redisClient as unknown as IRedisClient);
const kategoriService = new KategoriService(kategoriRepository, redisClient as unknown as IRedisClient);
const lantaiService = new LantaiService(lantaiRepository, redisClient as unknown as IRedisClient);
const usersService = new UsersService(usersRepository, redisClient as unknown as IRedisClient, emailService, appSettingService);
const notificationService = new NotificationService(notificationRepository);
const lokasiService = new LokasiService(lokasiRepository, redisClient as unknown as IRedisClient);
const ruanganService = new RuanganService(ruanganRepository, redisClient as unknown as IRedisClient);
export const achievementService = new AchievementService(achievementRepository, notificationService);
export const skillService = new SkillService(skillRepository, notificationService);
export const tugasService = new TugasService(tugasRepository, redisClient as unknown as IRedisClient, skillService, achievementService);
const laporanService = new LaporanService(laporanRepository, notificationService, usersService, skillService, achievementService);
export const checklistHarianService = new ChecklistHarianService(checklistHarianRepository, skillService, achievementService);
export const jadwalChecklistService = new JadwalChecklistService(jadwalChecklistRepository, checklistHarianService, notificationService, usersService);
export const constantsService = new ConstantsService();
const sessionService = new UserSessionService(userSessionRepository, redisClient as unknown as IRedisClient);
const authService = new AuthService(authRepository, usersService, sessionService, emailService, appSettingService);
const obService = new ObService(obRepository, laporanService, usersService);
const kolaborasiService = new KolaborasiService(kolaborasiRepository, laporanService, notificationService);
const adminService = new AdminService(adminRepository, laporanService, usersService, redisClient as unknown as IRedisClient);
const karyawanService = new KaryawanService(usersService, laporanService, kategoriService, notificationService);
const profileService = new ProfileService(usersService, karyawanService, obService, laporanService, adminService, tugasService);

//  CONTROLLERS 
export const adminController = new AdminController(adminService, checklistHarianService, tugasService, skillService);
export const authController = new AuthController(authService);
export const checklistHarianController = new ChecklistHarianController(checklistHarianService);
export const jadwalChecklistController = new JadwalChecklistController(jadwalChecklistService);
export const constantsController = new ConstantsController(constantsService);
export const skillController = new SkillController(skillService);
export const achievementController = new AchievementController(achievementService);
export const karyawanController = new KaryawanController(karyawanService, storageService);
export const kategoriController = new KategoriController(kategoriService);
export const lantaiController = new LantaiController(lantaiService);
export const lokasiController = new LokasiController(lokasiService);
export const obController = new ObController(obService, tugasService, laporanService, checklistHarianService, storageService);
export const ruanganController = new RuanganController(ruanganService);
export const tugasController = new TugasController(tugasService);
export const usersController = new UsersController(
    usersService,
    profileService,
    obService,
    karyawanService,
    laporanService,
    storageService
);
export const notificationController = new NotificationController(notificationService);
export const kolaborasiController = new KolaborasiController(kolaborasiService);
export const settingController = new SettingController(appSettingService);

export const container = {
    sessionService,
    authService,
    authController,
    adminController,
    checklistHarianController,
    jadwalChecklistController,
    karyawanController,
    kategoriController,
    lantaiController,
    lokasiController,
    obController,
    ruanganController,
    tugasController,
    usersController,
    notificationController,
    kolaborasiController,
    settingController,
};
