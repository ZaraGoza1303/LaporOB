import { PrismaClient } from "./generated/prisma/client.js";
import { AdminRepository } from "./repositories/admin_repository.js";
import { AuthRepository } from "./repositories/auth_repository.js";
import { ChecklistHarianRepository } from "./repositories/checklistHarian_repository.js";
import { KategoriRepository } from "./repositories/kategori_repository.js";
import { LantaiRepository } from "./repositories/lantai_repository.js";
import { LaporanRepository } from "./repositories/laporan_repository.js";
import { LokasiRepository } from "./repositories/lokasi_repository.js";
import { ObRepository } from "./repositories/ob_repository.js";
import { RuanganRepository } from "./repositories/ruangan_repository.js";
import { TugasRepository } from "./repositories/tugas_repository.js";
import { UsersRepository } from "./repositories/users_repository.js";
import { AdminService } from "./services/admin_service.js";
import { AuthService } from "./services/auth_service.js";
import { ChecklistHarianService } from "./services/checklistHarian_service.js";
import { KaryawanService } from "./services/karyawan_service.js";
import { KategoriService } from "./services/kategori_service.js";
import { LantaiService } from "./services/lantai_service.js";
import { LaporanService } from "./services/laporan_service.js";
import { LokasiService } from "./services/lokasi_service.js";
import { ObService } from "./services/ob_service.js";
import { RuanganService } from "./services/ruangan_service.js";
import { TugasService } from "./services/tugas_service.js";
import { UsersService } from "./services/users_service.js";
import { StorageServiceFactory } from "./services/storage_service.factory.js";
import { AdminController } from "./controllers/admin_controller.js";
import { AuthController } from "./controllers/auth_controller.js";
import { ChecklistHarianController } from "./controllers/checklistHarian_controller.js";
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

// PRISMA
const prisma = new PrismaClient();

//  REPOSITORIES 
const adminRepository = new AdminRepository(prisma);
const authRepository = new AuthRepository(prisma);
const checklistHarianRepository = new ChecklistHarianRepository(prisma);
const kategoriRepository = new KategoriRepository(prisma);
const lantaiRepository = new LantaiRepository(prisma);
const laporanRepository = new LaporanRepository(prisma);
const lokasiRepository = new LokasiRepository(prisma);
const obRepository = new ObRepository(prisma);
const ruanganRepository = new RuanganRepository(prisma);
const tugasRepository = new TugasRepository(prisma);
const usersRepository = new UsersRepository(prisma);
const notificationRepository = new NotificationRepository(prisma);

//  STORAGE 
const storageService = StorageServiceFactory.getProvider();

//  SERVICES 
const kategoriService = new KategoriService(kategoriRepository);
const lantaiService = new LantaiService(lantaiRepository);
const laporanService = new LaporanService(laporanRepository);
const lokasiService = new LokasiService(lokasiRepository);
const ruanganService = new RuanganService(ruanganRepository);
const tugasService = new TugasService(tugasRepository);
const usersService = new UsersService(usersRepository);
const notificationService = new NotificationService(notificationRepository);
const checklistHarianService = new ChecklistHarianService(checklistHarianRepository, usersService, notificationService);
const authService = new AuthService(authRepository, usersRepository);
const obService = new ObService(obRepository, laporanRepository, notificationService);
const adminService = new AdminService(adminRepository, obRepository, laporanService);
const karyawanService = new KaryawanService(usersService, laporanService, kategoriService, notificationService);

//  CONTROLLERS 
export const adminController = new AdminController(adminService);
export const authController = new AuthController(authService);
export const checklistHarianController = new ChecklistHarianController(checklistHarianService);
export const karyawanController = new KaryawanController(karyawanService, storageService);
export const kategoriController = new KategoriController(kategoriService);
export const lantaiController = new LantaiController(lantaiService);
export const lokasiController = new LokasiController(lokasiService);
export const obController = new ObController(obService, storageService);
export const ruanganController = new RuanganController(ruanganService);
export const tugasController = new TugasController(tugasService);
export const usersController = new UsersController(
    usersService,
    karyawanService,
    obService,
    laporanService,
    storageService
);
export const notificationController = new NotificationController(notificationService);
