import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const adminRouter = Router();
adminRouter.use(verifyJWTToken);
adminRouter.use(requireRole(USER_ROLE.ADMIN));

//tugas-combination
adminRouter.get("/tugas-combination", (req, res) => adminController.getListPekerjaan(req, res));

//stats
adminRouter.get("/dashboard", (req, res) => adminController.getDashboardData(req, res));
adminRouter.get("/user-stats", (req, res) => adminController.getUserStats(req, res));
adminRouter.get("/tugas/stats", (req, res) => adminController.getStatsTugas(req, res));
adminRouter.get("/laporan/stats", (req, res) => adminController.getStatsLaporan(req, res));
adminRouter.get("/tugas/approval-list", (req, res) => adminController.getApprovalListTugas(req, res));
adminRouter.patch("/tugas/:tugas_id/approve", (req, res) => adminController.approveTugas(req, res));
adminRouter.get("/checklist-harian/approval-list", (req, res) => adminController.getApprovalListChecklist(req, res));
adminRouter.patch("/checklist-harian/:checklist_harian_id/approve", (req, res) => adminController.approveChecklist(req, res));
adminRouter.get("/ob/:ob_id/skills", (req, res) => adminController.getObAcquiredSkills(req, res));
adminRouter.get("/ob/ranking", (req, res) => adminController.getObRanking(req, res));
adminRouter.get("/ob/performance-dashboard", (req, res) => adminController.getObPerformanceDashboard(req, res));

//penugasan ob
adminRouter.post("/user/assign-locations", (req, res) => adminController.assignObToLocations(req, res));
adminRouter.get("/user/assignments", (req, res) => adminController.getPenugasanByPeriode(req, res));

//laporan
adminRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
adminRouter.get("/laporan/history", (req, res) => adminController.getAllHistoryLaporan(req, res));
adminRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));
adminRouter.patch("/laporan/:laporan_id", (req, res) => adminController.patchLaporan(req, res));
adminRouter.post("/laporan/:laporan_id/approve", (req, res) => adminController.approveLaporan(req, res));
adminRouter.post("/laporan/:laporan_id/reject", (req, res) => adminController.rejectLaporan(req, res));
adminRouter.delete("/laporan/:laporan_id", (req, res) => adminController.deleteLaporan(req, res));

export default adminRouter;
