import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { karyawanController, adminController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrLaporanRouter = Router();
hrLaporanRouter.use(verifyJWTToken);
hrLaporanRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

hrLaporanRouter.post("/laporan", (req, res) => karyawanController.createReport(req, res));
hrLaporanRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
hrLaporanRouter.get("/laporan/history", (req, res) => adminController.getAllHistoryLaporan(req, res));
hrLaporanRouter.get("/laporan/stats", (req, res) => adminController.getStatsLaporan(req, res));
hrLaporanRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));

export default hrLaporanRouter;
