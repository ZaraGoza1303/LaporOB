import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { 
    usersController, 
    adminController, 
    skillController, 
    achievementController,
    karyawanController,
    tugasController,
    jadwalChecklistController
} from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrRouter = Router();

hrRouter.use(verifyJWTToken);
hrRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

// Data SDM (Read-only)
hrRouter.get("/users/ob", (req, res) => usersController.getAllOb(req, res));
hrRouter.get("/users/karyawan", (req, res) => usersController.getAllKaryawan(req, res));
hrRouter.get("/users/:user_id", (req, res) => usersController.getByID(req, res));

// Statistik & Monitoring Performa
hrRouter.get("/performance/dashboard", (req, res) => adminController.getObPerformanceDashboard(req, res));
hrRouter.get("/performance/ranking", (req, res) => adminController.getObRanking(req, res));
hrRouter.get("/performance/ob/:user_id", (req, res) => usersController.getObPerformanceStats(req, res));
hrRouter.get("/performance/karyawan/:user_id", (req, res) => usersController.getKarywanPerformanceStats(req, res));

// Skill & Achievement OB
hrRouter.get("/ob/:ob_id/skills", (req, res) => skillController.getObSkills(req, res));
hrRouter.get("/ob/:ob_id/achievements", (req, res) => achievementController.getObAchievements(req, res));

// Laporan (HR dapat membuat laporan & memantau status laporan)
hrRouter.post("/laporan", (req, res) => karyawanController.createReport(req, res));
hrRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
hrRouter.get("/laporan/history", (req, res) => adminController.getAllHistoryLaporan(req, res));
hrRouter.get("/laporan/stats", (req, res) => adminController.getStatsLaporan(req, res));
hrRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));

// Master Tugas (HR dapat membuat, melihat, & mengelola tugas)
hrRouter.get("/tugas", (req, res) => tugasController.getAll(req, res));
hrRouter.get("/tugas/stats", (req, res) => adminController.getStatsTugas(req, res));
hrRouter.get("/tugas/:tugas_id", (req, res) => tugasController.getByID(req, res));
hrRouter.post("/tugas", (req, res) => tugasController.create(req, res));
hrRouter.patch("/tugas/:tugas_id", (req, res) => tugasController.update(req, res));
hrRouter.delete("/tugas/:tugas_id", (req, res) => tugasController.delete(req, res));

// Jadwal Checklist (HR dapat mengatur jadwal checklist harian OB)
hrRouter.get("/jadwal-checklist", (req, res) => jadwalChecklistController.getAll(req, res));
hrRouter.get("/jadwal-checklist/:jadwal_checklist_id", (req, res) => jadwalChecklistController.getByID(req, res));
hrRouter.post("/jadwal-checklist", (req, res) => jadwalChecklistController.create(req, res));
hrRouter.patch("/jadwal-checklist/:jadwal_checklist_id", (req, res) => jadwalChecklistController.update(req, res));
hrRouter.delete("/jadwal-checklist/:jadwal_checklist_id", (req, res) => jadwalChecklistController.delete(req, res));

export default hrRouter;
